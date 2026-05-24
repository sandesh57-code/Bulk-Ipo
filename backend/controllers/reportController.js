const IPOApplication = require('../models/IPOApplication');
const IPO = require('../models/IPO');
const SavedAccount = require('../models/SavedAccount');
const { applyIPO } = require('../services/meroshareMockService');
const { decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * @desc    Get IPO application reports
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = async (req, res, next) => {
  try {
    const { status, ipoId, accountId, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }
    if (ipoId) {
      query.ipo = ipoId;
    }
    if (accountId) {
      query.account = accountId;
    }

    const skipIndex = (page - 1) * limit;
    const total = await IPOApplication.countDocuments(query);
    const applications = await IPOApplication.find(query)
      .populate('ipo', 'companyName symbol sharePrice sector status')
      .populate('account', 'nickname fullName boid bankName')
      .sort({ appliedAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: applications.length,
      totalPages: Math.ceil(total / limit),
      total,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retry a failed or errored application
 * @route   POST /api/reports/:id/retry
 * @access  Private
 */
const retryApplication = async (req, res, next) => {
  try {
    const app = await IPOApplication.findOne({ _id: req.params.id, user: req.user.id })
      .populate('ipo')
      .populate('account');

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application report not found' });
    }

    if (!['failed', 'error', 'pending'].includes(app.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Only applications in failed, error, or pending status can be retried. Current status: ${app.status}` 
      });
    }

    // Decrypt credentials
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(app.account.password);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Failed to decrypt account password' });
    }

    app.status = 'pending';
    app.errorMessage = undefined;
    app.retryCount += 1;
    app.lastRetryAt = new Date();
    await app.save();

    logger.info(`Retrying application: ID ${app._id}, account ${app.account.nickname}, try #${app.retryCount}`);

    const accountDetails = {
      boid: app.account.boid,
      nickname: app.account.nickname,
      crnNumber: app.account.crnNumber,
    };

    const ipoDetails = {
      companyName: app.ipo.companyName,
      companyCode: app.ipo.companyCode,
      sharePrice: app.ipo.sharePrice,
    };

    // Trigger mock apply again
    const applyRes = await applyIPO(accountDetails, ipoDetails, app.appliedQuantity);

    app.status = applyRes.status;
    app.applicationNumber = applyRes.applicationNumber || app.applicationNumber;
    app.errorMessage = applyRes.errorMessage;
    app.blockedAmount = applyRes.blockedAmount;
    app.bankResponse = applyRes.bankResponse;
    app.meroshareResponse = applyRes.meroshareResponse || app.meroshareResponse;

    await app.save();

    // Update Account Stats if successful
    if (applyRes.status === 'amount_blocked' || applyRes.status === 'unverified') {
      const savedAcc = await SavedAccount.findById(app.account._id);
      if (savedAcc) {
        savedAcc.totalAmountBlocked += applyRes.blockedAmount;
        await savedAcc.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Retry process completed. Application status: ${app.status}`,
      application: app,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  retryApplication,
};
