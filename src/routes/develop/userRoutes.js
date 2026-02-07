const express = require('express');
const router = express.Router();
const user = require('../../controllers/develop/user/indexController');

router.post('/create', user.createUser);

module.exports = router;
