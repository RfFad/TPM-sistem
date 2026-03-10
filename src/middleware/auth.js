const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.verifyToken = (req, res, next) => {
  const token = req.cookies[process.env.COOKIE_NAME];

  if (!token) {
    return res.redirect('/auth/page');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.redirect('/auth/page');
    }

    // decoded berisi id_user & role
    req.user = decoded;

    // optional → supaya bisa dipakai di view (EJS)
    res.locals.user = decoded;

    next();
  });
};


exports.isAuthenticated = function(req, res, next){

    const token = req.cookies[process.env.COOKIE_NAME];

    if(!token){
        return res.redirect('/auth/page');
    }

    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){

        if(err){
            return res.redirect('/auth/page');
        }

        // ambil data user dari database
        db.query(
            'SELECT * FROM user WHERE id_user = ?',
            [decoded.id_user],
            function(err, result){

                if(err || result.length === 0){
                    return res.redirect('/auth/page');
                }

                // kirim ke semua view
                res.locals.user = result[0];
                next();
            }
        );

    });
};