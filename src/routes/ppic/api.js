const router = require('express').Router();
const dashboard = require('../../controllers/ppic/dashboardController');
const rekap = require('../../controllers/ppic/rekapController');
const data = require('../../controllers/ppic/dataController');
const imp = require('../../controllers/ppic/importController');
const authMiddleware = require('../../middleware/auth');
const role = require('../../middleware/role')

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/filter-options', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(dashboard.options));
router.get('/dashboard', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(dashboard.summary));
router.get('/rekap', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(rekap.rekap));

router.get('/data', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(data.list));
router.get('/data/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(data.detail));
router.delete('/data/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(data.remove));

router.post('/import/preview', imp.upload, authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(imp.preview));
router.post('/import/commit', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(imp.commit));
router.get('/import/history', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(imp.history));
router.delete('/import/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'ppic']), ah(imp.removeBatch));

module.exports = router;
