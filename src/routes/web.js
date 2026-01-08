const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');
const Auth = require('../controllers/authController');

router.get('/', HomeController.homePage);
router.get('/login', Auth.index);
router.get('/data', HomeController.dataTabel);

module.exports = router;