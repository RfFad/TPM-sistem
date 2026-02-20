const express = require('express');
const router = express.Router();
const dokumenController = require('../../controllers/dokumen/dokumenController');

//router.get('/data', dokumenController.getAll);
//router.get('/dokumen/:id', dokumenController.getById);
//router.post('/save', dokumenController.create);
//router.post('/update/:id', dokumenController.update);
//router.delete('/delete/:id', dokumenController.delete);
router.get('/', dokumenController.page)
router.put('/update', dokumenController.update)

module.exports = router;
 