const express = require('express');
const router = express.Router();
const auth = require('../../controllers/authController');

router.post('/login', auth.login);

router.get('/logout', auth.logout);

router.get('/page', auth.page);
module.exports = router;
