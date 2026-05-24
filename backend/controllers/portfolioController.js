const Portfolio = require('../models/Portfolio');
const SavedAccount = require('../models/SavedAccount');
const { getPortfolioHoldings } = require('../services/meroshareMockService');
const logger = require('../utils/logger');

/**
 * @desc    Get portfolio holdings (consolidated or account-specific)
 * @route   GET /api/portfolio
 * @access  Private
 */
const getPortfolio = async (req, res, next) => {
  try {
    const { accountId, sync } = req.query;
    const userId = req.user.id;

    // Check if we need to sync first
    if (sync === 'true') {
      await syncPortfolioData(userId, accountId);
    }

    let portfolios = [];
    if (accountId) {
      // Get single account portfolio
      const port = await Portfolio.findOne({ user: userId, account: accountId }).populate('account', 'nickname fullName boid');
      if (port) portfolios = [port];
    } else {
      // Get all accounts portfolios
      portfolios = await Portfolio.find({ user: userId }).populate('account', 'nickname fullName boid');
    }

    if (!portfolios.length) {
      return res.status(200).json({
        success: true,
        summary: {
          totalInvestment: 0,
          currentValue: 0,
          totalProfitLoss: 0,
          totalProfitLossPercent: 0,
          totalHoldings: 0,
        },
        portfolios: [],
      });
    }

    // Calculate Consolidated Summary
    let totalInvestment = 0;
    let currentValue = 0;
    const consolidatedHoldingsMap = {};

    portfolios.forEach(p => {
      totalInvestment += p.totalInvestment;
      currentValue += p.currentValue;

      p.holdings.forEach(h => {
        if (consolidatedHoldingsMap[h.symbol]) {
          const existing = consolidatedHoldingsMap[h.symbol];
          const newQty = existing.quantity + h.quantity;
          const newCost = existing.totalCost + h.totalCost;
          const newVal = existing.currentValue + h.currentValue;
          
          existing.quantity = newQty;
          existing.totalCost = newCost;
          existing.currentValue = newVal;
          existing.wacc = newQty > 0 ? (newCost / newQty) : 0;
          existing.profitLoss = newVal - newCost;
          existing.profitLossPercent = newCost > 0 ? (existing.profitLoss / newCost) * 100 : 0;
        } else {
          consolidatedHoldingsMap[h.symbol] = {
            companyName: h.companyName,
            symbol: h.symbol,
            isin: h.isin,
            sector: h.sector,
            quantity: h.quantity,
            wacc: h.wacc,
            totalCost: h.totalCost,
            currentValue: h.currentValue,
            profitLoss: h.profitLoss,
            profitLossPercent: h.profitLossPercent,
          };
        }
      });
    });

    const totalProfitLoss = currentValue - totalInvestment;
    const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalInvestment,
        currentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        totalHoldings: Object.keys(consolidatedHoldingsMap).length,
      },
      consolidatedHoldings: Object.values(consolidatedHoldingsMap),
      portfolios,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to sync portfolio data from Mock MeroShare
 */
const syncPortfolioData = async (userId, accountId) => {
  const accountQuery = { user: userId };
  if (accountId) {
    accountQuery._id = accountId;
  }

  const accounts = await SavedAccount.find(accountQuery);
  
  for (const account of accounts) {
    try {
      // Fetch mock holdings
      const holdingsData = await getPortfolioHoldings(account.boid);

      // Find or create portfolio document
      let port = await Portfolio.findOne({ user: userId, account: account._id });

      if (!port) {
        port = new Portfolio({
          user: userId,
          account: account._id,
        });
      }

      port.holdings = holdingsData.holdings;
      port.totalInvestment = holdingsData.totalInvestment;
      port.currentValue = holdingsData.currentValue;
      port.totalProfitLoss = holdingsData.totalProfitLoss;
      port.totalProfitLossPercent = holdingsData.totalProfitLossPercent;
      port.totalHoldings = holdingsData.totalHoldings;
      port.lastUpdated = new Date();

      await port.save();
      logger.info(`Portfolio synced for account ${account.nickname}`);
    } catch (err) {
      logger.error(`Error syncing portfolio for account ${account.nickname}: ${err.message}`);
    }
  }
};

module.exports = {
  getPortfolio,
};
