const express = require('express');
const router = express.Router();
const user = require('../../controllers/develop/user/indexController')
const authMiddleware = require('../../middleware/auth');
const role = require('../../middleware/role')

router.get('/page', authMiddleware.isAuthenticated, role.checkRole(['develop', 'admin', 'user']),  user.page);
router.get('/data', user.getAll);
router.get('/detail/:id', user.getById);
router.post('/save', user.createUser);
router.put('/update/:id', user.updateUser);
router.delete('/delete/:id', user.deleteUser);
module.exports = router;