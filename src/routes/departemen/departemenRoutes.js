const express = require('express');
const router = express.Router();
const departemenController = require('../../controllers/departemen/departemenController');
const role = require('../../middleware/role')
const auth = require('../../middleware/auth')
router.get('/page', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.departemen);
router.get('/qc', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.qc);
router.get('/produksi', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.produksi);
router.get('/mold', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.mold);
router.get('/ppic', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.ppic);
router.get('/mtn', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.mtn);
router.get('/dept/:id_dept', auth.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), departemenController.getByDepartemen);

//router.get('/data', HomeController.dataTabel);

module.exports = router;