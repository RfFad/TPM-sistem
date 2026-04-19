const express = require('express');
const router = express.Router();
const user = require('../../controllers/develop/user/indexController')
const authMiddleware = require('../../middleware/auth');
const role = require('../../middleware/role')

router.get('/page', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']),  user.page);
router.get('/data', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), user.getAll);
router.get('/detail/:id', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin']), user.getById);
router.post('/save', authMiddleware.isAuthenticated, role.checkRole(['develop']), user.createUser);
router.put('/update/:id', authMiddleware.isAuthenticated, role.checkRole(['develop']), user.updateUser);
router.delete('/delete/:id', authMiddleware.isAuthenticated, role.checkRole(['develop']), user.deleteUser);
module.exports = router;