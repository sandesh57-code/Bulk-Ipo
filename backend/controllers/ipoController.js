const IPO = require('../models/IPO');
const SavedAccount = require('../models/SavedAccount');
const IPOApplication = require('../models/IPOApplication');
const Notification = require('../models/Notification');
const { decrypt } = require('../utils/encryption');
const { applyIPO } = require('../services/meroshareMockService');
const logger = require('../utils/logger');

/**
 * @desc    Get IPO listings
 * @route   GET /api/ipos
 * @access  Private
 */
const getIPOs = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (status) {
      query.status = status;
    }
    if (type) {
      query.ipoType = type;
    }
    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }

    const skipIndex = (page - 1) * limit;
    const total = await IPO.countDocuments(query);
    const ipos = await IPO.find(query)
      .sort({ openingDate: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: ipos.length,
      totalPages: Math.ceil(total / limit),
      total,
      ipos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single IPO
 * @route   GET /api/ipos/:id
 * @access  Private
 */
const getIPO = async (req, res, next) => {
  try {
    const ipo = await IPO.findById(req.params.id);
    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO not found' });
    }
    res.status(200).json({ success: true, ipo });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Apply for an IPO across multiple saved accounts
 * @route   POST /api/ipos/bulk-apply
 * @access  Private
 */
const bulkApplyIPO = async (req, res, next) => {
  try {
    const { ipoId, accountIds, quantity } = req.body;

    if (!ipoId || !accountIds || !accountIds.length || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'IPO ID, list of account IDs, and quantity are required.' 
      });
    }

    const ipo = await IPO.findById(ipoId);
    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO not found' });
    }

    if (ipo.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This IPO is currently not open for applications.' });
    }

    const accounts = await SavedAccount.find({ _id: { $in: accountIds }, user: req.user.id });
    if (!accounts.length) {
      return res.status(400).json({ success: false, message: 'No valid saved accounts found.' });
    }

    const batchId = `BATCH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const results = [];

    // Loop through each account and apply
    for (const account of accounts) {
      // Check if already applied
      const alreadyApplied = await IPOApplication.findOne({
        user: req.user.id,
        account: account._id,
        ipo: ipo._id,
        status: { $in: ['applied', 'verified', 'amount_blocked', 'pending'] },
      });

      if (alreadyApplied) {
        results.push({
          accountId: account._id,
          nickname: account.nickname,
          status: 'skipped',
          message: 'Already applied using this account.',
        });
        continue;
      }

      // Decrypt password
      let decryptedPassword;
      try {
        decryptedPassword = decrypt(account.password);
      } catch (err) {
        logger.error(`Decryption failed for account ${account.nickname}`);
        results.push({
          accountId: account._id,
          nickname: account.nickname,
          status: 'failed',
          message: 'Failed to decrypt MeroShare credentials.',
        });
        continue;
      }

      // Prepare details for mock service
      const accountDetails = {
        boid: account.boid,
        nickname: account.nickname,
        crnNumber: account.crnNumber,
      };

      const ipoDetails = {
        companyName: ipo.companyName,
        companyCode: ipo.companyCode,
        sharePrice: ipo.sharePrice,
      };

      try {
        // Call Mock MeroShare Apply Service
        const applyRes = await applyIPO(accountDetails, ipoDetails, quantity);

        // Save application in database
        const application = await IPOApplication.create({
          user: req.user.id,
          account: account._id,
          ipo: ipo._id,
          appliedQuantity: applyRes.appliedQuantity,
          appliedAmount: applyRes.appliedAmount,
          applicationNumber: applyRes.applicationNumber,
          status: applyRes.status,
          bankResponse: applyRes.bankResponse,
          errorMessage: applyRes.errorMessage,
          blockedAmount: applyRes.blockedAmount,
          batchId,
          meroshareResponse: applyRes.meroshareResponse,
        });

        // Update Account Stats
        if (applyRes.status === 'amount_blocked' || applyRes.status === 'unverified') {
          account.totalApplied += 1;
          account.totalAmountBlocked += applyRes.blockedAmount;
          await account.save();
        }

        // Push Notification
        await Notification.create({
          user: req.user.id,
          title: `IPO Application ${applyRes.status === 'failed' ? 'Failed' : 'Submitted'}`,
          message: applyRes.status === 'failed' 
            ? `Failed to apply for ${ipo.companyName} on account ${account.nickname}: ${applyRes.errorMessage}`
            : `Successfully applied for ${quantity} units of ${ipo.companyName} on account ${account.nickname}.`,
          type: applyRes.status === 'failed' ? 'application_failure' : 'application_success',
          priority: applyRes.status === 'failed' ? 'high' : 'medium',
          link: '/reports',
          metadata: { applicationId: application._id, ipoId: ipo._id, accountId: account._id },
        });

        results.push({
          accountId: account._id,
          nickname: account.nickname,
          status: applyRes.status,
          applicationNumber: applyRes.applicationNumber,
          errorMessage: applyRes.errorMessage,
        });

      } catch (err) {
        logger.error(`Error applying IPO for account ${account.nickname}: ${err.message}`);
        results.push({
          accountId: account._id,
          nickname: account.nickname,
          status: 'failed',
          message: err.message || 'Unknown network error.',
        });
      }
    }

    // Update IPO application count
    const successfulCount = results.filter(r => ['applied', 'amount_blocked', 'unverified'].includes(r.status)).length;
    ipo.applicationsCount += successfulCount;
    await ipo.save();

    res.status(200).json({
      success: true,
      batchId,
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIPOs,
  getIPO,
  bulkApplyIPO,
};
