const express = require('express');
const router = express.Router();
const planController = require('../../controllers/planning/planController');
const role = require('../../middleware/role')
const auth = require('../../middleware/auth')

router.get('/page', auth.isAuthenticated, role.checkRole(['ppic','admin', 'develop']), planController.page);
module.exports = router;