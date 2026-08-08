const db = require('../../config/database');

exports.summary = (req,res)=>{

const sql=`
SELECT
p.id_plan,
p.tgl,
p.no_mc,
pr.nama_produk,
pr.no_part,
p.target_day,

COALESCE(s.actual_qty,0) actual,

(p.target_day-COALESCE(s.actual_qty,0)) minus_qty,

ROUND(
(COALESCE(s.actual_qty,0)/p.target_day)*100,2
) achievement,

COALESCE(s.status,'Pending') status,

COALESCE(s.keterangan,'') keterangan

FROM planning p

LEFT JOIN produk pr
ON pr.id_produk=p.id_produk

LEFT JOIN summary_planning s
ON s.id_plan=p.id_plan

ORDER BY p.no_mc
`;

db.query(sql,(err,result)=>{

res.render("summary/index",{
summary:result
});

});

}