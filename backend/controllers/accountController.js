const SavedAccount = require('../models/SavedAccount');
const { encrypt, decrypt } = require('../utils/encryption');
const { validateAccount } = require('../services/meroshareMockService');
const logger = require('../utils/logger');

/**
 * @desc    Get all saved accounts for logged in user
 * @route   GET /api/accounts
 * @access  Private
 */
const getAccounts = async (req, res, next) => {
  try {
    const accounts = await SavedAccount.find({ user: req.user.id });

    // Decrypt passwords if needed in frontend, or just strip them before returning
    // We will exclude passwords from retrieval, or return it encrypted. Let's exclude it.
    const sanitizedAccounts = accounts.map(acc => {
      const obj = acc.toObject();
      delete obj.password; // Do not return encrypted password to frontend
      return obj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedAccounts.length,
      accounts: sanitizedAccounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new MeroShare account
 * @route   POST /api/accounts
 * @access  Private
 */
const addAccount = async (req, res, next) => {
  try {
    const {
      nickname,
      fullName,
      boid,
      loginId,
      password,
      bankName,
      crnNumber,
      dematNumber,
      mobileNumber,
      email,
      accountType,
      tags
    } = req.body;

    // Check if account already exists for this user
    const existing = await SavedAccount.findOne({ user: req.user.id, boid });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this BOID is already saved.' });
    }

    // Validate details with MeroShare Mock Service
    try {
      await validateAccount(boid, loginId, password, bankName, crnNumber);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Encrypt password
    const encryptedPassword = encrypt(password);

    const account = await SavedAccount.create({
      user: req.user.id,
      nickname,
      fullName,
      boid,
      loginId,
      password: encryptedPassword,
      bankName,
      crnNumber,
      dematNumber: dematNumber || boid,
      mobileNumber,
      email,
      accountType,
      tags: tags || [],
    });

    const accountObj = account.toObject();
    delete accountObj.password;

    logger.info(`Account added: BOID ${boid} for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account verified and saved successfully',
      account: accountObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a saved account
 * @route   PUT /api/accounts/:id
 * @access  Private
 */
const updateAccount = async (req, res, next) => {
  try {
    const {
      nickname,
      fullName,
      loginId,
      password,
      bankName,
      crnNumber,
      mobileNumber,
      email,
      accountType,
      tags
    } = req.body;

    let account = await SavedAccount.findOne({ _id: req.params.id, user: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // If new password is provided, validate and encrypt
    if (password) {
      try {
        await validateAccount(account.boid, loginId || account.loginId, password, bankName || account.bankName, crnNumber || account.crnNumber);
        account.password = encrypt(password);
      } catch (err) {
        return res.status(400).json({ success: false, message: `Validation failed: ${err.message}` });
      }
    }

    if (nickname) account.nickname = nickname;
    if (fullName) account.fullName = fullName;
    if (loginId) account.loginId = loginId;
    if (bankName) account.bankName = bankName;
    if (crnNumber) account.crnNumber = crnNumber;
    if (mobileNumber !== undefined) account.mobileNumber = mobileNumber;
    if (email !== undefined) account.email = email;
    if (accountType) account.accountType = accountType;
    if (tags) account.tags = tags;

    await account.save();

    const accountObj = account.toObject();
    delete accountObj.password;

    logger.info(`Account updated: ID ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      account: accountObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved account
 * @route   DELETE /api/accounts/:id
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const account = await SavedAccount.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    logger.info(`Account deleted: ID ${req.params.id} for user ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
};
