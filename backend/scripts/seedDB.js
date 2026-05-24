require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt } = require('../utils/encryption');
const User = require('../models/User');
const SavedAccount = require('../models/SavedAccount');
const IPO = require('../models/IPO');
const IPOApplication = require('../models/IPOApplication');
const IPOResult = require('../models/IPOResult');
const Portfolio = require('../models/Portfolio');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bulkipo';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for seeding');

    // Clear all existing data
    await User.deleteMany({});
    await SavedAccount.deleteMany({});
    await IPO.deleteMany({});
    await IPOApplication.deleteMany({});
    await IPOResult.deleteMany({});
    await Portfolio.deleteMany({});
    await Notification.deleteMany({});
    logger.info('Cleared existing database collections');

    // 1. Create Default Admin User
    const adminUser = await User.create({
      name: 'Supratim Sharma',
      email: 'admin@bulkipo.com',
      password: 'password123',
      phone: '9801234567',
      role: 'admin',
      isEmailVerified: true,
      theme: 'dark',
    });
    logger.info('Created Admin User: admin@bulkipo.com / password123');

    // 2. Create Saved Accounts for the Admin User
    const rawAccounts = [
      {
        nickname: 'My Primary Account',
        fullName: 'Supratim Sharma',
        boid: '1301010000111111',
        loginId: 'supratim11',
        passwordText: 'password11',
        bankName: 'Nabil Bank Limited',
        crnNumber: 'NABIL1111',
        accountType: 'self',
        totalApplied: 15,
        totalAllotted: 8,
        totalAmountBlocked: 8700,
      },
      {
        nickname: "Spouse's Account",
        fullName: 'Aarati Sharma',
        boid: '1301010000222222',
        loginId: 'aarati22',
        passwordText: 'password22',
        bankName: 'NIC Asia Bank Limited',
        crnNumber: 'NIC2222',
        accountType: 'family',
        totalApplied: 12,
        totalAllotted: 5,
        totalAmountBlocked: 8700,
      },
      {
        nickname: "Father's Account",
        fullName: 'Ram Prasad Sharma',
        boid: '1301010000333333',
        loginId: 'ram33',
        passwordText: 'password33',
        bankName: 'Global IME Bank Limited',
        crnNumber: 'GIB3333',
        accountType: 'family',
        totalApplied: 8,
        totalAllotted: 3,
        totalAmountBlocked: 0,
      },
    ];

    const savedAccounts = [];
    for (const raw of rawAccounts) {
      const encryptedPassword = encrypt(raw.passwordText);
      const sa = await SavedAccount.create({
        user: adminUser._id,
        nickname: raw.nickname,
        fullName: raw.fullName,
        boid: raw.boid,
        loginId: raw.loginId,
        password: encryptedPassword,
        bankName: raw.bankName,
        crnNumber: raw.crnNumber,
        accountType: raw.accountType,
        totalApplied: raw.totalApplied,
        totalAllotted: raw.totalAllotted,
        totalAmountBlocked: raw.totalAmountBlocked,
      });
      savedAccounts.push(sa);
    }
    logger.info(`Seeded ${savedAccounts.length} Saved MeroShare Accounts`);

    // 3. Create Sample IPOs
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

    const ipos = await IPO.insertMany(sampleIPOs);
    logger.info(`Seeded ${ipos.length} Sample IPOs`);

    const openIpo = ipos.find(i => i.status === 'open');
    const closedIpo = ipos.find(i => i.status === 'closed');
    const resultPublishedIpo = ipos.find(i => i.status === 'result_published');

    // 4. Create IPO Applications & Results
    // GCIL applications (closed, blocked amount)
    const gcilApp1 = await IPOApplication.create({
      user: adminUser._id,
      account: savedAccounts[0]._id,
      ipo: closedIpo._id,
      appliedQuantity: 20,
      appliedAmount: 8700,
      applicationNumber: 'MS-99881122',
      status: 'amount_blocked',
      blockedAmount: 8700,
      bankResponse: 'Amount blocked successfully.',
      appliedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    });

    const gcilApp2 = await IPOApplication.create({
      user: adminUser._id,
      account: savedAccounts[1]._id,
      ipo: closedIpo._id,
      appliedQuantity: 20,
      appliedAmount: 8700,
      applicationNumber: 'MS-99882233',
      status: 'amount_blocked',
      blockedAmount: 8700,
      bankResponse: 'Amount blocked successfully.',
      appliedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
    });

    // HRL applications & results (result published)
    const hrlApps = [];
    for (let i = 0; i < 3; i++) {
      const app = await IPOApplication.create({
        user: adminUser._id,
        account: savedAccounts[i]._id,
        ipo: resultPublishedIpo._id,
        appliedQuantity: 10,
        appliedAmount: 2060,
        applicationNumber: `MS-776600${i}0`,
        status: i === 1 ? 'unverified' : 'verified', // Aarati was not allotted/failed, Supratim & Ram verified
        appliedAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
        verifiedAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      });
      hrlApps.push(app);
    }

    // Results for HRL
    await IPOResult.create({
      user: adminUser._id,
      account: savedAccounts[0]._id,
      ipo: resultPublishedIpo._id,
      application: hrlApps[0]._id,
      appliedQuantity: 10,
      allottedQuantity: 10,
      status: 'allotted',
      refundStatus: 'pending',
      refundAmount: 0,
      resultDate: twoDaysAgo,
      meroshareResultData: { allottedUnit: 10, remarks: 'Congratulations! Allotted 10 units.' },
    });

    await IPOResult.create({
      user: adminUser._id,
      account: savedAccounts[1]._id,
      ipo: resultPublishedIpo._id,
      application: hrlApps[1]._id,
      appliedQuantity: 10,
      allottedQuantity: 0,
      status: 'not_allotted',
      refundStatus: 'refunded',
      refundAmount: 2060,
      resultDate: twoDaysAgo,
      meroshareResultData: { allottedUnit: 0, remarks: 'Thank you for applying. Not allotted.' },
    });

    await IPOResult.create({
      user: adminUser._id,
      account: savedAccounts[2]._id,
      ipo: resultPublishedIpo._id,
      application: hrlApps[2]._id,
      appliedQuantity: 10,
      allottedQuantity: 10,
      status: 'allotted',
      refundStatus: 'pending',
      refundAmount: 0,
      resultDate: twoDaysAgo,
      meroshareResultData: { allottedUnit: 10, remarks: 'Congratulations! Allotted 10 units.' },
    });

    logger.info('Seeded IPO Applications and Results');

    // 5. Create Portfolio Holdings
    await Portfolio.create({
      user: adminUser._id,
      account: savedAccounts[0]._id,
      holdings: [
        {
          companyName: 'Himalayan Reinsurance Limited',
          symbol: 'HRL',
          isin: 'NPHRL0000001',
          quantity: 10,
          previousClosingPrice: 560,
          lastTransactionPrice: 580,
          wacc: 206,
          totalCost: 2060,
          currentValue: 5800,
          profitLoss: 3740,
          profitLossPercent: 181.55,
          sector: 'Insurance',
        },
        {
          companyName: 'Nepal Telecom',
          symbol: 'NTC',
          isin: 'NPNTC0000002',
          quantity: 50,
          previousClosingPrice: 910,
          lastTransactionPrice: 920,
          wacc: 850,
          totalCost: 42500,
          currentValue: 46000,
          profitLoss: 3500,
          profitLossPercent: 8.23,
          sector: 'Telecom',
        },
        {
          companyName: 'NIC Asia Bank Limited',
          symbol: 'NICA',
          isin: 'NPNICA0000003',
          quantity: 30,
          previousClosingPrice: 770,
          lastTransactionPrice: 780,
          wacc: 720,
          totalCost: 21600,
          currentValue: 23400,
          profitLoss: 1800,
          profitLossPercent: 8.33,
          sector: 'Commercial Banks',
        },
      ],
      totalInvestment: 66160,
      currentValue: 75200,
      totalProfitLoss: 9040,
      totalProfitLossPercent: 13.66,
      totalHoldings: 3,
    });

    await Portfolio.create({
      user: adminUser._id,
      account: savedAccounts[1]._id,
      holdings: [
        {
          companyName: 'Global IME Bank Limited',
          symbol: 'GBIME',
          isin: 'NPGBIME000001',
          quantity: 100,
          previousClosingPrice: 275,
          lastTransactionPrice: 280,
          wacc: 240,
          totalCost: 24000,
          currentValue: 28000,
          profitLoss: 4000,
          profitLossPercent: 16.67,
          sector: 'Commercial Banks',
        },
        {
          companyName: 'Himalayan Distillery Limited',
          symbol: 'HDL',
          isin: 'NPHDL0000002',
          quantity: 10,
          previousClosingPrice: 2100,
          lastTransactionPrice: 2150,
          wacc: 1980,
          totalCost: 19800,
          currentValue: 21500,
          profitLoss: 1700,
          profitLossPercent: 8.59,
          sector: 'Manufacturing',
        },
      ],
      totalInvestment: 43800,
      currentValue: 49500,
      totalProfitLoss: 5700,
      totalProfitLossPercent: 13.01,
      totalHoldings: 2,
    });

    logger.info('Seeded Portfolios');

    // 6. Seed Notifications
    await Notification.create({
      user: adminUser._id,
      title: 'Welcome to BulkIPO! 🚀',
      message: 'Manage all MeroShare accounts, apply bulk IPOs, check results, and track portfolios automatically.',
      type: 'system',
      priority: 'high',
      isRead: false,
    });

    await Notification.create({
      user: adminUser._id,
      title: 'IPO Opened: Dish Media Network Limited',
      message: 'Ordinary share IPO is now open for application. Select your accounts and apply easily.',
      type: 'ipo_open',
      priority: 'high',
      link: '/bulk-apply',
      isRead: false,
    });

    await Notification.create({
      user: adminUser._id,
      title: 'Allotment Result: Himalayan Reinsurance Limited (HRL)',
      message: 'IPO results are out! You got allotted in 2 of your 3 accounts.',
      type: 'ipo_result',
      priority: 'high',
      link: '/results',
      isRead: true,
    });

    logger.info('Seeded Notifications');

    logger.info('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

seedData();
