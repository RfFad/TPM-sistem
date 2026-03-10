const express = require('express');
const router = express.Router();
const dokumenController = require('../../controllers/dokumen/dokumenController');
const docController = require('../../controllers/dokumen/docController');
const authMiddleware = require('../../middleware/auth');



router.get('/data', docController.getAll);
router.post('/save', docController.uploadFile, docController.create);
router.put('/update/:id', docController.uploadFile, docController.update);
router.delete('/delete/:id', docController.delete);
router.get('/', dokumenController.page)
router.get('/page',  authMiddleware.isAuthenticated, docController.page)
router.get('/edit/:id', docController.getById)
router.get('/detail/:id', docController.detail);

module.exports = router;
 