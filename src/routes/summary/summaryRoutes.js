const express = require('express');

const router = express.Router();
const role = require('../../middleware/role')
const auth = require('../../middleware/auth')


const summaryController =
    require('../../controllers/summary/summaryController');


// Ambil summary berdasarkan planning
router.get(
    '/summary-planning/plan/:id',
    summaryController.getByPlan
);


// Simpan
router.post(
    '/summary-planning/save',
    summaryController.save
);


// Update
router.put(
    '/summary-planning/update',
    summaryController.update
);


// Hapus
router.delete(
    '/summary-planning/delete/:id',
    summaryController.delete
);

router.get(
    '/summary-planning/data/:tgl',
    summaryController.getAllSummary
);

router.get(
    '/page/:tgl', auth.isAuthenticated, role.checkRole(['ppic', 'develop']),  summaryController.page
)
module.exports = router;