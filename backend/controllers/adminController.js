const User = require('../models/User');
const SavedAccount = require('../models/SavedAccount');
const IPO = require('../models/IPO');
const IPOApplication = require('../models/IPOApplication');
const IPOResult = require('../models/IPOResult');
const Notification = require('../models/Notification');
const { checkIPOResult } = require('../services/meroshareMockService');
const logger = require('../utils/logger');

/**
 * @desc    Seed sample IPOs for development
 * @route   POST /api/admin/seed-ipos
 * @access  Private/Admin
 */
const seedIPOs = async (req, res, next) => {
  try {
    // Clear existing IPOs first
    await IPO.deleteMany({});
    await IPOApplication.deleteMany({});
    await IPOResult.deleteMany({});

    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const inTenDays = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    const inThirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sampleIPOs = [
      {
        companyName: 'Dish Media Network Limited',
        companyCode: 'DISH',
        symbol: 'DISH',
        ipoType: 'IPO',
        shareType: 'Ordinary',
        openingDate: twoDaysAgo,
        closingDate: inFiveDays,
        issueManager: 'Global IME Capital Limited',
        sharePrice: 100,
        minQuantity: 10,
        maxQuantity: 1000,
        totalUnits: 1500000,
        totalAmount: 150000000,
        sector: 'Technology & Entertainment',
        description: 'Dish Media Network Limited is one of the fastest-growing digital TV and internet service providers in Nepal, operating under the brand DishHome.',
        prospectusUrl: 'https://dishhome.com.np/prospectus',
        logo: 'https://images.unsplash.com/photo-1546198632-9ef6368bef12?w=100&h=100&fit=crop',
        status: 'open',
        isMeroShareEnabled: true,
      },
      {
        companyName: 'Muktinath Bikas Bank Limited (Right Share)',
        companyCode: 'MNBBL',
        symbol: 'MNBBL',
        ipoType: 'RIGHT',
        shareType: 'Ordinary',
        openingDate: inFiveDays,
        closingDate: inTenDays,
        issueManager: 'NIBL Ace Capital Limited',
        sharePrice: 100,
        minQuantity: 10,
        maxQuantity: 500,
        totalUnits: 4500000,
        totalAmount: 450000000,
        sector: 'Development Banks',
        description: 'Muktinath Bikas Bank is issuing 1:0.3 ratio right shares to its existing shareholders to expand its capital base.',
        status: 'upcoming',
        isMeroShareEnabled: true,
      },
      {
        companyName: 'Nepal Reinsurance Company Limited (FPO)',
        companyCode: 'NRIC',
        symbol: 'NRIC',
        ipoType: 'FPO',
        shareType: 'Ordinary',
        openingDate: inTenDays,
        closingDate: inThirtyDays,
        issueManager: 'RBB Merchant Banking Limited',
        sharePrice: 350,
        minQuantity: 10,
        maxQuantity: 5000,
        totalUnits: 2000000,
        totalAmount: 700000000,
        sector: 'Insurance',
        description: 'Further Public Offering of Nepal Reinsurance Company Limited at a premium price of NPR 350 per share.',
        status: 'upcoming',
        isMeroShareEnabled: true,
      },
      {
        companyName: 'Ghorahi Cement Industries Limited',
        companyCode: 'GCIL',
        symbol: 'GCIL',
        ipoType: 'IPO',
        shareType: 'Ordinary',
        openingDate: tenDaysAgo,
        closingDate: twoDaysAgo,
        issueManager: 'Himalayan Capital Limited',
        sharePrice: 435,
        minQuantity: 10,
        maxQuantity: 10000,
        totalUnits: 3000000,
        totalAmount: 1305000000,
        sector: 'Manufacturing',
        description: 'Ghorahi Cement Industries is setting up additional clinker capacity in Dang district and raising capital through this public issue.',
        status: 'closed',
        isMeroShareEnabled: true,
      },
      {
        companyName: 'Himalayan Reinsurance Limited',
        companyCode: 'HRL',
        symbol: 'HRL',
        ipoType: 'IPO',
        shareType: 'Ordinary',
        openingDate: tenDaysAgo,
        closingDate: twoDaysAgo,
        issueManager: 'Nabil Investment Banking Limited',
        sharePrice: 206,
        minQuantity: 10,
        maxQuantity: 1000,
        totalUnits: 30000000,
        totalAmount: 6180000000,
        sector: 'Insurance',
        description: 'Himalayan Reinsurance Limited is Nepal\'s second reinsurance company operating under private sector leadership.',
        status: 'result_published',
        resultDate: twoDaysAgo,
        isMeroShareEnabled: true,
      }
    ];

    await IPO.insertMany(sampleIPOs);

    logger.info('Sample IPOs seeded successfully');
    res.status(201).json({ success: true, message: 'Sample IPO data seeded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalAccountsSaved = await SavedAccount.countDocuments({});
    const totalApplications = await IPOApplication.countDocuments({});
    
    // Sum up blocked amounts
    const apps = await IPOApplication.find({ status: { $in: ['applied', 'amount_blocked', 'verified'] } });
    const totalBlockedCapital = apps.reduce((sum, app) => sum + (app.blockedAmount || 0), 0);

    const stats = {
      totalUsers,
      totalAccountsSaved,
      totalApplications,
      totalBlockedCapital,
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user status (Active/Deactive)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User status updated: ${user.email} (Active: ${isActive})`);
    res.status(200).json({ success: true, message: 'User status updated successfully', user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create custom IPO
 * @route   POST /api/admin/ipos
 * @access  Private/Admin
 */
const createIPO = async (req, res, next) => {
  try {
    const ipo = await IPO.create(req.body);
    logger.info(`Custom IPO created: ${ipo.companyName}`);
    res.status(201).json({ success: true, ipo });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update IPO
 * @route   PUT /api/admin/ipos/:id
 * @access  Private/Admin
 */
const updateIPO = async (req, res, next) => {
  try {
    const ipo = await IPO.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO not found' });
    }
    logger.info(`IPO updated: ${ipo.companyName}`);
    res.status(200).json({ success: true, ipo });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete IPO
 * @route   DELETE /api/admin/ipos/:id
 * @access  Private/Admin
 */
const deleteIPO = async (req, res, next) => {
  try {
    const ipo = await IPO.findByIdAndDelete(req.params.id);
    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO not found' });
    }
    logger.info(`IPO deleted: ID ${req.params.id}`);
    res.status(200).json({ success: true, message: 'IPO deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish IPO Result and trigger allotments simulation for all applications
 * @route   POST /api/admin/ipos/:id/publish-result
 * @access  Private/Admin
 */
const publishIPOResult = async (req, res, next) => {
  try {
    const ipo = await IPO.findById(req.params.id);
    if (!ipo) {
      return res.status(404).json({ success: false, message: 'IPO not found' });
    }

    if (ipo.status === 'result_published') {
      return res.status(400).json({ success: false, message: 'Result already published' });
    }

    ipo.status = 'result_published';
    ipo.resultDate = new Date();
    await ipo.save();

    // Get all applications for this IPO
    const applications = await IPOApplication.find({ ipo: ipo._id }).populate('account');
    logger.info(`Simulating allotments for ${applications.length} applications for ${ipo.companyName}`);

    for (const app of applications) {
      // Simulate result query
      try {
        const resultRes = await checkIPOResult(app.account.boid, ipo.companyName);
        
        // Calculate refund amount
        let refundAmount = 0;
        if (resultRes.status === 'not_allotted') {
          refundAmount = app.appliedAmount;
        } else if (resultRes.status === 'allotted') {
          refundAmount = Math.max(0, app.appliedAmount - (resultRes.allottedQuantity * ipo.sharePrice));
        }

        // Save result
        await IPOResult.create({
          user: app.user,
          account: app.account._id,
          ipo: ipo._id,
          application: app._id,
          appliedQuantity: app.appliedQuantity,
          allottedQuantity: resultRes.allottedQuantity,
          status: resultRes.status,
          refundStatus: refundAmount > 0 ? 'refunded' : 'pending',
          refundAmount,
          resultDate: ipo.resultDate,
          meroshareResultData: resultRes.meroshareResultData,
        });

        // Update application status
        app.status = resultRes.status === 'allotted' ? 'verified' : 'unverified';
        await app.save();

        // Release blocked bank money and update allotment count
        const account = await SavedAccount.findById(app.account._id);
        if (account) {
          account.totalAmountBlocked = Math.max(0, account.totalAmountBlocked - app.blockedAmount);
          if (resultRes.status === 'allotted') {
            account.totalAllotted += resultRes.allottedQuantity;
          }
          await account.save();
        }

        // Send notification
        await Notification.create({
          user: app.user,
          title: `IPO Allotment Result: ${resultRes.status === 'allotted' ? 'ALLOTTED 🎉' : 'Not Allotted 😢'}`,
          message: resultRes.status === 'allotted'
            ? `Congratulations! Account ${app.account.nickname} was allotted ${resultRes.allottedQuantity} shares of ${ipo.companyName}.`
            : `Account ${app.account.nickname} was not allotted shares of ${ipo.companyName}. Refund of NPR ${refundAmount} is processing.`,
          type: 'ipo_result',
          priority: resultRes.status === 'allotted' ? 'high' : 'medium',
          link: '/results',
          metadata: { ipoId: ipo._id, accountId: app.account._id },
        });

      } catch (err) {
        logger.error(`Failed to check result for application ${app._id}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Results published and allotment simulation complete for ${applications.length} applications.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  seedIPOs,
  getSystemStats,
  getUsers,
  updateUserStatus,
  createIPO,
  updateIPO,
  deleteIPO,
  publishIPOResult,
};
