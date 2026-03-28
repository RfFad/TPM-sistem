const express = require('express');
const router = express.Router();
const auth = require('../../controllers/authController');
const authMiddleware = require('../../middleware/auth');

router.post('/login', auth.login);

router.get('/logout', auth.logout);

router.get('/page', auth.page);
router.get('/dokumen/page', authMiddleware.isAuthenticated, (req, res) => {
  res.render('develop/dokumen/page', {
    active: 'dokumen',
    canManage: req.user.role === 'admin'
  });
});
module.exports = router;
