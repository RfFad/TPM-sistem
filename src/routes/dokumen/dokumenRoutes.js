const express = require('express');
const router = express.Router();
const dokumenController = require('../../controllers/dokumen/dokumenController');
const docController = require('../../controllers/dokumen/docController');
router.get('/data', docController.getAll);
//router.get('/dokumen/:id', dokumenController.getById);
//router.post('/save', dokumenController.create);
//router.post('/update/:id', dokumenController.update);
router.delete('/delete/:id', docController.delete);
router.get('/', dokumenController.page)
router.put('/update', dokumenController.update)
router.get('/page', docController.page)

module.exports = router;
 