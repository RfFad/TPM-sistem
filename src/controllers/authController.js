exports.index = (req,  res) => {
    res.render('auth/login', { title: 'Home Page', message: 'Project TPM Sistem'
     });
}