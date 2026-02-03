const db = require('../../config/database');

exports.page = (req, res) => {
    res.render('rekrut/proses_recruitment/index', {tittle: "Daftar Istilah"});
}