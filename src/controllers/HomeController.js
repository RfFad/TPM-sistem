module.exports =  {
    homePage :async (req, res) => {
        res.render('index', { title: 'Home Page', message: 'Project TPM Sistem'})
    },
    dataTabel :  async (req, res) => { 
        res.render('data/index', { title: 'Data Tabel', message: 'Project TPM Sistem'})
    }
}