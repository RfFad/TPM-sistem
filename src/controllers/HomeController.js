module.exports =  {
    homePage :async (req, res) => {
        const canManage = ['admin', 'develop'].includes(req.user.role);
        res.render('index', { tittle: 'Home Page', message: 'Project TPM Sistem', active: 'dashboard',user: req.user,
    canManage})
    },
    dataTabel :  async (req, res) => { 
        res.render('data/index', { tittle: 'Data Tabel', message: 'Project TPM Sistem'})
    }
}