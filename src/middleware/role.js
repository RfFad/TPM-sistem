exports.checkRole = (roles = []) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {

      return res.send(`
        <script>
          alert('Akses ditolak!');
          window.history.back();
        </script>
      `);

    }

    next();

  };

};