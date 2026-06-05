const IPOResult = require('../models/IPOResult');
const IPO = require('../models/IPO');
const SavedAccount = require('../models/SavedAccount');
const { checkIPOResult } = require('../services/meroshareMockService');
const logger = require('../utils/logger');

/**
 * @desc    Bulk Check IPO allotment results for multiple Demat accounts
 * @route   POST /api/results/bulk-check
 * @access  Private
 */
const bulkCheckResults = async (req, res, next) => {
  try {
    const { boids, ipoName } = req.body;

    if (!boids || !boids.length || !ipoName) {
      return res.status(400).json({
        success: false,
        message: 'List of BOIDs and IPO Name are required.',
      });
    }

    // Find the IPO
    const ipo = await IPO.findOne({
      $or: [
        { companyName: { $regex: ipoName, $options: 'i' } },
        { symbol: { $regex: ipoName, $options: 'i' } }
      ]
    });

    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO issue not found.' });
    }

    // Find matching accounts of the logged-in user
    const accounts = await SavedAccount.find({
      user: req.user.id,
      boid: { $in: boids },
    });

    const results = [];

    for (const account of accounts) {
      // 1. Check if we already have a generated result in the database
      let dbResult = await IPOResult.findOne({
        user: req.user.id,
        account: account._id,
        ipo: ipo._id,
      });

      if (dbResult) {
        results.push({
          accountId: account._id,
          nickname: account.nickname,
          fullName: account.fullName,
          boid: account.boid,
          appliedQty: dbResult.appliedQuantity || 10,
          allottedQty: dbResult.allottedQuantity,
          status: dbResult.status,
          remarks: dbResult.meroshareResultData?.remarks || (dbResult.status === 'allotted' ? 'Congratulations! Allotted.' : 'Not allotted.'),
        });
      } else {
        // 2. Fallback: query from MeroShare Mock Service
        const mockRes = await checkIPOResult(account.boid, ipo.companyName);
        
        // Save the generated result so it's persistent
        dbResult = await IPOResult.create({
          user: req.user.id,
          account: account._id,
          ipo: ipo._id,
          appliedQuantity: 10, // Mock default
          allottedQuantity: mockRes.allottedQuantity,
          status: mockRes.status,
          refundStatus: mockRes.status === 'not_allotted' ? 'refunded' : 'pending',
          refundAmount: mockRes.status === 'not_allotted' ? 10 * ipo.sharePrice : 0,
          resultDate: ipo.resultDate || new Date(),
          meroshareResultData: mockRes.meroshareResultData,
        });

        results.push({
          accountId: account._id,
          nickname: account.nickname,
          fullName: account.fullName,
          boid: account.boid,
          appliedQty: 10,
          allottedQty: mockRes.allottedQuantity,
          status: mockRes.status,
          remarks: mockRes.meroshareResultData.remarks,
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error(`Error in bulk check results: ${error.message}`);
    next(error);
  }
};

module.exports = {
  bulkCheckResults,
};
