module.exports =  {
    homePage :async (req, res) => {
        res.render('index', { tittle: 'Home Page', message: 'Project TPM Sistem'})
    },
    dataTabel :  async (req, res) => { 
        res.render('data/index', { tittle: 'Data Tabel', message: 'Project TPM Sistem'})
    }
}