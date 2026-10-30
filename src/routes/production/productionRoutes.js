const express = require('express');

const router = express.Router();

const controller =
    require('../../controllers/production/productionController');

const auth =
    require('../../middleware/auth');


// ======================================================
// DASHBOARD
// ======================================================

router.get(
    '/page',
    auth.isAuthenticated,
    controller.dashboard
);


// ======================================================
// DATA DASHBOARD
// ======================================================

router.get(
    '/data',
    auth.isAuthenticated,
    controller.data
);


module.exports = router;