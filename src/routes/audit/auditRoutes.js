const express = require('express');

const router = express.Router();

const auditController =
    require('../../controllers/audit/auditController');

const auth =
    require('../../middleware/auth');

const role =
    require('../../middleware/role');


router.get(
    '/',
    auth.isAuthenticated,
    auditController.index
);


router.get(
    '/customer/:id_customer',
    auth.isAuthenticated,
    auditController.getAuditByCustomer
);


router.get(
    '/customer/:id_customer/years',
    auth.isAuthenticated,
    auditController.getYears
);


router.get(
    '/customer/:id_customer/year/:tahun',
    auth.isAuthenticated,
    auditController.getAuditByYear
);


router.get(
    '/detail/:id_audit',
    auth.isAuthenticated,
    auditController.detail
);


router.post(
    '/create',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.create
);


router.put(
    '/update/:id_audit',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.update
);


router.delete(
    '/delete/:id_audit',
    auth.isAuthenticated,
    role.checkRole('admin', 'develop'),
    auditController.delete
);


module.exports = router;