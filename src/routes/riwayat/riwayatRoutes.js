const express = require('express');
const router = express.Router();
const riwayatController = require('../../controllers/riwayat/riwayatcontroller');
const role = require('../../middleware/role')
const auth = require('../../middleware/auth')
router.get('/', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), riwayatController.dataTabel);
//router.get('/data', HomeController.dataTabel);

module.exports = router;