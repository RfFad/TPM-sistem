const express = require('express');
const router = express.Router();
const prosesController = require('../../controllers/rekrut/prosesController');

//router.get('/data', prosesController.getAll);
//router.get('/proses/:id', prosesController.getById);
//router.post('/save', prosesController.create);
//router.post('/update/:id', prosesController.update);
//router.delete('/delete/:id', prosesController.delete);
router.get('/', prosesController.page)

module.exports = router;
 