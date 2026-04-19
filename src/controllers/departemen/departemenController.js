exports.qc = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/qc', {
    tittle: "departemen QC",
    active: "qc",
    user: req.user,
    canManage
  })
}
exports.produksi = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/produksi', {
    tittle: "departemen produksi",
    active: "produksi",
    user: req.user,
    canManage
  })
}
exports.mold = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/mold', {
    tittle: "departemen mold",
    active: "mold",
    user: req.user,
    canManage
  })
}
exports.mtn = (req, res) => {
const canManage = ['admin', 'develop'].includes(req.user.role);
  res.render('departemen/mtn', {
    tittle: "departemen mtn",
    active: "mtn",
    user: req.user,
    canManage
  })
}