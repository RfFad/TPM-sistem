const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/HomeController');
const role = require('../middleware/role')
const auth = require('../middleware/auth')
router.get('/', auth.verifyToken, role.checkRole(['develop', 'admin', 'user']), HomeController.homePage);
router.get('/data', HomeController.dataTabel);

module.exports = router;