/**
 * ipoSyncController.js
 * Admin/Protected routes to sync live IPO data from CDSC and public sources.
 */

const IPO = require('../models/IPO');
const { fetchRealIPOs } = require('../services/ipoFetchService');
const logger = require('../utils/logger');

/**
 * @desc    Sync real IPO data from CDSC / public sources into the database
 * @route   POST /api/ipos/sync
 * @access  Private (Admin or any authenticated user)
 */
const syncIPOs = async (req, res, next) => {
  try {
    logger.info(`[ipoSyncController] IPO sync triggered by user: ${req.user?.email}`);

    const liveIPOs = await fetchRealIPOs();

    if (!liveIPOs || liveIPOs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No IPO data returned from sources.',
        synced: 0,
        updated: 0,
        skipped: 0,
      });
    }

    let synced = 0, updated = 0, skipped = 0;

    for (const ipoData of liveIPOs) {
      try {
        // Upsert based on companyCode + ipoType (unique key)
        const filter = {
          companyCode : ipoData.companyCode,
          ipoType     : ipoData.ipoType,
          openingDate : ipoData.openingDate,
        };

        const existing = await IPO.findOne(filter);

        if (existing) {
          // Update status and sync timestamp only; preserve applicationsCount
          await IPO.findByIdAndUpdate(existing._id, {
            status        : ipoData.status,
            closingDate   : ipoData.closingDate,
            resultDate    : ipoData.resultDate,
            lastSyncedAt  : new Date(),
            dataSource    : ipoData.dataSource,
          });
          updated++;
        } else {
          await IPO.create({
            ...ipoData,
            isActive          : true,
            applicationsCount : 0,
          });
          synced++;
        }
      } catch (innerErr) {
        logger.error(`[ipoSyncController] Failed to upsert IPO "${ipoData.companyName}": ${innerErr.message}`);
        skipped++;
      }
    }

    logger.info(`[ipoSyncController] Sync complete — new: ${synced}, updated: ${updated}, skipped: ${skipped}`);

    return res.status(200).json({
      success : true,
      message : `IPO sync complete. ${synced} new, ${updated} updated, ${skipped} skipped.`,
      synced,
      updated,
      skipped,
      total   : liveIPOs.length,
    });
  } catch (error) {
    logger.error(`[ipoSyncController] Sync failed: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * @desc    Get the source status (which data sources are alive)
 * @route   GET /api/ipos/sync/status
 * @access  Private
 */
const getSyncStatus = async (req, res, next) => {
  try {
    const total    = await IPO.countDocuments({ isActive: true });
    const open     = await IPO.countDocuments({ isActive: true, status: 'open' });
    const upcoming = await IPO.countDocuments({ isActive: true, status: 'upcoming' });
    const closed   = await IPO.countDocuments({ isActive: true, status: { $in: ['closed', 'result_published', 'allotment_done'] } });

    // Find the most recently synced IPO
    const lastSynced = await IPO.findOne({ isActive: true }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt dataSource');

    return res.status(200).json({
      success: true,
      database: { total, open, upcoming, closed },
      lastSync: lastSynced
        ? { at: lastSynced.lastSyncedAt, source: lastSynced.dataSource }
        : null,
      sources: [
        { name: 'CDSC MeroShare API', url: 'https://backend.cdsc.com.np/api/meroShare', type: 'live' },
        { name: 'Curated Nepal IPO Data', url: 'internal', type: 'fallback' },
      ],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncIPOs, getSyncStatus };
