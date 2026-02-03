const express = require('express');
const router = express.Router();
const revisiController = require('../../controllers/rekrut/revisiController');

router.get('/data', revisiController.getAll);
//router.get('/proses/:id', revisiController.getById);
//router.post('/save', revisiController.create);
//router.post('/update/:id', revisiController.update);
//router.delete('/delete/:id', revisiController.delete);
router.get('/', revisiController.page)

module.exports = router;
 