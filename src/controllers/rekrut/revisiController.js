const db = require('../../config/database');

/**
 * READ ALL
 */
exports.getAll = (req, res) => {
  const sql = 'SELECT * FROM revisi order by id ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

exports.page = (req, res) => {
    res.render('rekrut/revisi/index', {tittle: "Revisi"});
}