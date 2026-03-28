const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM user WHERE username = ?',
    [username],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'DB Error' });
      }

      if (results.length === 0) {
        return res.redirect('/auth/page?error=User tidak ditemukan');
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

    if (!match) {
   return res.redirect('/auth/page?error=Password salah');;
}

      const token = jwt.sign(
        {
          id_user: user.id_user,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      );

      // 🍪 SIMPAN TOKEN KE COOKIE
      res.cookie(process.env.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Number(process.env.COOKIE_EXPIRE)
      });
      res.redirect('/')
         }
  );
};

exports.page = (req, res) => {
   const error = req.query.error || null;
 res.render('auth/login', { tittle: 'Login', message: 'Project TPM Sistem', error: error})
};

exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false // true kalau https
    });
    res.redirect('/auth/page');
};
