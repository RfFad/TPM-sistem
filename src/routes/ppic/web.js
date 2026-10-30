const router = require('express').Router();
const authMiddleware = require('../../middleware/auth');
const role = require('../../middleware/role')

router.get('/',authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), (req, res) => res.render('ppic/dashboard',  { title: 'Dashboard OEE', active: 'dashboard' }), );
router.get('/rekap', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), (req, res) => res.render('ppic/rekap',  { title: 'Rekap & Perbandingan', active: 'rekap' }), );
router.get('/data', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), (req, res) => res.render('ppic/data',  { title: 'Data Produksi', active: 'data' }), );
router.get('/import', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), (req, res) => res.render('ppic/import',  { title: 'Import Excel', active: 'import' }), );


module.exports = router;