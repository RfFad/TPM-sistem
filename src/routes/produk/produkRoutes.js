const express = require('express');
const router = express.Router();
const produkController = require('../../controllers/produk/produkController');
const role = require('../../middleware/role')
const auth = require('../../middleware/auth')

router.get('/page', auth.isAuthenticated, role.checkRole(['ppic','admin', 'develop']), produkController.page);

router.get('/data', auth.isAuthenticated, role.checkRole(['ppic','admin', 'develop']), produkController.show);

router.post('/save', produkController.save);

router.get('/get/:id', produkController.get);

router.put('/update', produkController.update);

router.delete('/delete/:id', produkController.delete);

module.exports = router;