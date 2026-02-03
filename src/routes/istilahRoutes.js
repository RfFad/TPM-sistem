const express = require('express');
const router = express.Router();
const IstilahController = require('../controllers/istilahController');

router.get('/istilah', IstilahController.getAll);
router.get('/istilah/:id', IstilahController.getById);
router.post('/save', IstilahController.create);
router.post('/update/:id', IstilahController.update);
router.delete('/delete/:id', IstilahController.delete);
router.get('/', IstilahController.page)

module.exports = router;
