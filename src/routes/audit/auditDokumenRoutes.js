const express = require('express');

const router = express.Router();

const controller =
    require('../../controllers/audit/auditDokumenController');

const auth =
    require('../../middleware/auth');

const role =
    require('../../middleware/role');


// MASTER
router.get(
    '/master',
    auth.isAuthenticated,
    controller.master
);


// DETAIL
router.get(
    '/detail/:id_doc_aud',
    auth.isAuthenticated,
    controller.detail
);


// DOWNLOAD
router.get(
    '/file/:id_doc_aud/download',
    auth.isAuthenticated,
    controller.download
);


// LIST DOKUMEN BERDASARKAN AUDIT
router.get(
    '/:id_audit',
    auth.isAuthenticated,
    controller.page
);


// CREATE
router.post(
    '/',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    controller.upload.single('file'),
    controller.create
);


// UPDATE
router.put(
    '/:id_doc_aud',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    controller.upload.single('file'),
    controller.update
);


// DELETE
router.delete(
    '/:id_doc_aud',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    controller.delete
);


module.exports = router;