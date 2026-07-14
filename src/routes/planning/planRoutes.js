const express = require('express');
const router = express.Router();

const planningController = require('../../controllers/planning/planController');

const role = require('../../middleware/role');
const auth = require('../../middleware/auth');

// Halaman Planning
router.get(
    '/page',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.page
);

// Data Planning
router.get(
    '/data',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.show
);

// Simpan Planning
router.post(
    '/save',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.save
);

// Detail Planning
router.get(
    '/get/:id',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.get
);

// Update Planning
router.put(
    '/update',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.update
);

// Hapus Planning
router.delete(
    '/delete/:id',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.delete
);

router.get(
    '/data-planning',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.planHariIni
);
router.get(
    '/tabel',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.tabel
);
router.get(
    '/dataplanday',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.dataplanDay
);
router.get(
    '/dataplan/:tgl',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.archiveDetail
);
router.get(
    '/archive',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.archiveBulan
);
router.get(
    '/archive/:tahun/:bulan',
    auth.isAuthenticated,
    role.checkRole(['ppic', 'develop']),
    planningController.archiveTanggal
);

module.exports = router;