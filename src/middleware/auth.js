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
        return res.redirect('/auth/page?error=Silakan login terlebih dahulu');
    }

    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){

        if(err){

            // 🔥 HAPUS COOKIE SAAT ERROR
            res.clearCookie(process.env.COOKIE_NAME);

            if(err.name === 'TokenExpiredError'){
                return res.redirect('/auth/page?error=Session telah habis, silakan login kembali');
            }

            return res.redirect('/auth/page?error=Token tidak valid');
        }

        db.query(
            'SELECT * FROM user WHERE id_user = ?',
            [decoded.id_user],
            function(err, result){

                if(err || result.length === 0){

                    // 🔥 HAPUS COOKIE JIKA USER TIDAK ADA
                    res.clearCookie(process.env.COOKIE_NAME);

                    return res.redirect('/auth/page?error=User tidak ditemukan');
                }

                req.user = result[0];
                res.locals.user = result[0];

                next();
            }
        );

    });
};