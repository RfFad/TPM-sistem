module.exports = {
    page : async (req, res) => {
        res.render('dokumen/index', {tittle: 'Dokumen'})
    }
}