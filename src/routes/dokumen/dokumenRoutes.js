const express = require('express');
const router = express.Router();
const docController = require('../../controllers/dokumen/docController');
const authMiddleware = require('../../middleware/auth');

const role = require('../../middleware/role')

router.get('/data', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), docController.getAll);
router.post('/save', docController.uploadFile, authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), docController.create);
router.put('/update/:id', docController.uploadFile, authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), docController.update);
router.delete('/delete/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), docController.delete);
router.get('/page',  authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), docController.page)
router.get('/edit/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), docController.getById)
router.get('/detail/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin', 'user']), docController.detail);

module.exports = router;
 