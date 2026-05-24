const logger = require('../utils/logger');

// Simulated database of IPO results for various companies
const MOCK_COMPANIES = [
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', price: 780 },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks', price: 280 },
  { symbol: 'CHCL', name: 'Chilime Hydropower Company Limited', sector: 'Hydro Power', price: 540 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower Limited', sector: 'Hydro Power', price: 310 },
  { symbol: 'HIDCL', name: 'Hydroelectricity Investment and Development Company Limited', sector: 'Investment', price: 195 },
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Telecom', price: 920 },
  { symbol: 'HDL', name: 'Himalayan Distillery Limited', sector: 'Manufacturing', price: 2150 },
  { symbol: 'SHL', name: 'Soaltee Hotel Limited', sector: 'Hotels', price: 420 },
  { symbol: 'CIT', name: 'Citizen Investment Trust', sector: 'Investment', price: 2200 },
];

/**
 * Validate Demat Account and MeroShare login details
 */
const validateAccount = async (boid, loginId, password, bankName, crnNumber) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!boid || boid.length !== 16) {
    throw new Error('Invalid BOID. Must be a 16-digit number.');
  }
  if (!loginId || !password) {
    throw new Error('Login ID and Password are required.');
  }
  if (!crnNumber || crnNumber.length < 4) {
    throw new Error('Invalid CRN Number.');
  }

  // Simulating random failure for testing (e.g. if nickname is 'Error User' or boid starts with 999)
  if (boid.startsWith('999')) {
    throw new Error('MeroShare Authentication Failed: Invalid credentials or account blocked.');
  }
  if (crnNumber === '9999') {
    throw new Error('Bank Verification Failed: CRN is invalid or mismatch with Demat account.');
  }

  // Generate a mock demat number (often same as BOID or linked)
  return {
    success: true,
    fullName: `Investor_${boid.substring(12)}`,
    dematNumber: boid,
    bankName: bankName || 'Mock Bank Limited',
    crnNumber: crnNumber,
  };
};

/**
 * Apply for an IPO on MeroShare
 */
const applyIPO = async (accountDetails, ipoDetails, quantity) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  const { boid, nickname, crnNumber } = accountDetails;
  const { companyName, sharePrice } = ipoDetails;

  // Validation rules
  if (crnNumber === '0000' || nickname.toLowerCase().includes('fail')) {
    return {
      status: 'failed',
      errorMessage: 'CRN validation failed at bank side.',
      appliedQuantity: quantity,
      appliedAmount: quantity * sharePrice,
    };
  }

  if (quantity < 10 || quantity % 10 !== 0) {
    return {
      status: 'failed',
      errorMessage: 'Quantity must be in multiples of 10.',
      appliedQuantity: quantity,
      appliedAmount: quantity * sharePrice,
    };
  }

  // Generate mock application number (e.g., MS-10293847)
  const appNumber = `MS-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Randomize a small error rate (e.g., 2% system error)
  if (Math.random() < 0.02) {
    return {
      status: 'error',
      errorMessage: 'MeroShare response timed out. Please try again.',
      appliedQuantity: quantity,
      appliedAmount: quantity * sharePrice,
    };
  }

  // Random bank authorization delay (sometimes unverified)
  const status = Math.random() < 0.05 ? 'unverified' : 'amount_blocked';

  return {
    status,
    applicationNumber: appNumber,
    appliedQuantity: quantity,
    appliedAmount: quantity * sharePrice,
    blockedAmount: status === 'amount_blocked' ? quantity * sharePrice : 0,
    bankResponse: status === 'amount_blocked' ? 'Amount blocked successfully.' : 'Pending bank approval.',
    meroshareResponse: {
      appliedDate: new Date(),
      boid,
      companyCode: ipoDetails.companyCode,
      appliedUnit: quantity,
    }
  };
};

/**
 * Check IPO result for a specific account BOID
 */
const checkIPOResult = async (boid, ipoName) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Determine allotment based on BOID hash to keep it deterministic but realistic
  const hash = boid.split('').reduce((acc, char) => acc + parseInt(char, 10), 0);
  
  // E.g. 15% allotment probability
  const isAllotted = (hash % 6) === 0; 
  
  if (isAllotted) {
    return {
      status: 'allotted',
      allottedQuantity: 10,
      refundAmount: 0,
      meroshareResultData: {
        allottedUnit: 10,
        remarks: 'Congratulations! Allotted 10 units.',
      }
    };
  } else {
    return {
      status: 'not_allotted',
      allottedQuantity: 0,
      refundAmount: 0, // will be calculated in controller
      meroshareResultData: {
        allottedUnit: 0,
        remarks: 'Thank you for applying. Not allotted.',
      }
    };
  }
};

/**
 * Fetch Portfolio holdings for a BOID
 */
const getPortfolioHoldings = async (boid) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Determinstically choose holdings based on the last few digits of BOID
  const lastDigit = parseInt(boid.slice(-1)) || 0;
  const numHoldings = (lastDigit % 4) + 2; // 2 to 5 holdings
  
  const holdings = [];
  
  for (let i = 0; i < numHoldings; i++) {
    const company = MOCK_COMPANIES[(lastDigit + i) % MOCK_COMPANIES.length];
    
    // Weighted Average Cost of Capital (buying price)
    const wacc = Math.floor(company.price * (0.7 + Math.random() * 0.4)); // buying price is ±30% of current
    const quantity = ((lastDigit + i) * 10) + 10; // e.g. 10, 20, 30, ... units
    const totalCost = quantity * wacc;
    
    // Simulate current market price fluctuate slightly
    const currentPrice = Math.floor(company.price * (0.95 + Math.random() * 0.1));
    const currentValue = quantity * currentPrice;
    
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = (profitLoss / totalCost) * 100;

    holdings.push({
      companyName: company.name,
      symbol: company.symbol,
      isin: `NP${company.symbol}00000${lastDigit}`,
      quantity,
      previousClosingPrice: Math.floor(currentPrice * 0.98),
      lastTransactionPrice: currentPrice,
      wacc,
      totalCost,
      currentValue,
      profitLoss,
      profitLossPercent,
      sector: company.sector,
    });
  }

  const totalInvestment = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalProfitLoss = currentValue - totalInvestment;
  const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  return {
    holdings,
    totalInvestment,
    currentValue,
    totalProfitLoss,
    totalProfitLossPercent,
    totalHoldings: holdings.length,
  };
};

module.exports = {
  validateAccount,
  applyIPO,
  checkIPOResult,
  getPortfolioHoldings,
};
