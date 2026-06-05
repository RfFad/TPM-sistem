const express = require('express');
const router = express.Router();
const produkController = require('../../controllers/produk/produkController');
const authMiddleware = require('../../middleware/auth');

router.get('/page', produkController.page);

router.get('/data', produkController.show);

router.post('/save', produkController.save);

router.get('/get/:id', produkController.get);

router.post('/update', produkController.update);

router.delete('/delete/:id', produkController.delete);

module.exports = router;