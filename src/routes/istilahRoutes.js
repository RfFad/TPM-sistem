const express = require('express');
const router = express.Router();
const IstilahController = require('../controllers/istilahController');
const role = require('../middleware/role')
const auth = require('../middleware/auth')

router.get('/istilah', auth.verifyToken ,role.checkRole(['develop']), IstilahController.getAll, );
router.get('/istilah/:id', IstilahController.getById);
router.post('/save', IstilahController.create);
router.post('/update/:id', IstilahController.update);
router.delete('/delete/:id', IstilahController.delete);
router.get('/', IstilahController.page)

module.exports = router;
