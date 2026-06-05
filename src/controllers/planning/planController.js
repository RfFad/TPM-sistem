const db = require('../../config/database');
exports.page = (req, res) => {
    const canManage = ['admin', 'develop'].includes(req.user.role);
    res.render('planning/index', {
        tittle: "planning",
        active: "planning",
        canManage,
        user: req.user
     })
 }
