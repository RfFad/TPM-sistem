const express = require('express');

const router = express.Router();

const auditController =
    require('../../controllers/audit/auditController');

const auth =
    require('../../middleware/auth');

const role =
    require('../../middleware/role');


// ======================================================
// HALAMAN AUDIT
// ======================================================

router.get(
    '/',
    auth.isAuthenticated,
    auditController.index
);


// ======================================================
// AUDIT BERDASARKAN CUSTOMER
// ======================================================

router.get(
    '/customer/:id_customer',
    auth.isAuthenticated,
    auditController.getAuditByCustomer
);


// ======================================================
// TAHUN AUDIT
// ======================================================

router.get(
    '/customer/:id_customer/years',
    auth.isAuthenticated,
    auditController.getYears
);


// ======================================================
// AUDIT BERDASARKAN CUSTOMER + TAHUN
// ======================================================

router.get(
    '/customer/:id_customer/year/:tahun',
    auth.isAuthenticated,
    auditController.getAuditByYear
);


// ======================================================
// DETAIL AUDIT
// ======================================================

router.get(
    '/detail/:id_audit',
    auth.isAuthenticated,
    auditController.detail
);


// ======================================================
// CREATE AUDIT
// ======================================================

router.post(
    '/create',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.create
);


// ======================================================
// UPDATE AUDIT
// ======================================================

router.put(
    '/update/:id_audit',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.update
);


// ======================================================
// DELETE AUDIT
// ======================================================

router.delete(
    '/delete/:id_audit',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.delete
);


module.exports = router;