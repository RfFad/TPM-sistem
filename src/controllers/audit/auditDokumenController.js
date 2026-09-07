const db = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// ======================================================
// UPLOAD DIRECTORY
// ======================================================

const uploadDir = path.join(
    __dirname,
    '../../../public/uploads'
);


if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


// ======================================================
// MULTER STORAGE
// ======================================================
// Nama file tetap nama asli.
// Jika duplikat:
// file.pdf
// file (1).pdf
// file (2).pdf
// ======================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            uploadDir
        );

    },


    filename: function (req, file, cb) {

        const ext =
            path.extname(
                file.originalname
            );


        const baseName =
            path.basename(
                file.originalname,
                ext
            );


        let fileName =
            file.originalname;


        let counter = 1;


        while (
            fs.existsSync(
                path.join(
                    uploadDir,
                    fileName
                )
            )
        ) {

            fileName =
                `${baseName} (${counter})${ext}`;

            counter++;

        }


        cb(
            null,
            fileName
        );

    }

});


// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = function (
    req,
    file,
    cb
) {

    const allowedExtensions = [

        '.pdf',

        '.doc',
        '.docx',

        '.xls',
        '.xlsx',

        '.ppt',
        '.pptx',

        '.jpg',
        '.jpeg',

        '.png'

    ];


    const ext =
        path.extname(
            file.originalname
        ).toLowerCase();


    if (
        allowedExtensions.includes(ext)
    ) {

        cb(
            null,
            true
        );

    } else {

        cb(
            new Error(
                'Format file tidak diperbolehkan'
            ),
            false
        );

    }

};


// ======================================================
// MULTER
// ======================================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        fileSize:
            20 * 1024 * 1024

    }

});


exports.upload = upload;


// ======================================================
// MASTER KATEGORI + DEPARTEMEN
// ======================================================

exports.master = (req, res) => {

    const sqlKategori = `

        SELECT
            id_kategori,
            nama_kategori

        FROM kategori_doc

        ORDER BY
            nama_kategori ASC

    `;


    const sqlDepartemen = `

        SELECT
            id_dept,
            nama_dept

        FROM departemen

        ORDER BY
            nama_dept ASC

    `;


    db.query(
        sqlKategori,
        function (
            err,
            kategori
        ) {

            if (err) {

                console.error(
                    'MASTER KATEGORI:',
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal mengambil kategori'

                });

            }


            db.query(
                sqlDepartemen,
                function (
                    err,
                    departemen
                ) {

                    if (err) {

                        console.error(
                            'MASTER DEPARTEMEN:',
                            err
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                'Gagal mengambil departemen'

                        });

                    }


                    return res.json({

                        success: true,

                        kategori:
                            kategori || [],

                        departemen:
                            departemen || []

                    });

                }
            );

        }
    );

};


// ======================================================
// LIST DOKUMEN BERDASARKAN AUDIT
// ======================================================

exports.page = (req, res) => {

    const {
        id_audit
    } = req.params;


    if (!id_audit) {

        return res.status(400).json({

            success: false,

            message:
                'ID audit tidak ditemukan'

        });

    }


    const sql = `

        SELECT

            ad.id_doc_aud,

            ad.id_audit,

            ad.id_kategori,

            kd.nama_kategori,

            ad.id_dept,

            dept.nama_dept,

            ad.no_doc_aud,

            ad.nama_doc_aud,

            ad.file

        FROM audit_dokumen ad

        LEFT JOIN kategori_doc kd
            ON ad.id_kategori =
               kd.id_kategori

        LEFT JOIN departemen dept
            ON ad.id_dept =
               dept.id_dept

        WHERE ad.id_audit = ?

        ORDER BY
            ad.id_doc_aud DESC

    `;


    db.query(
        sql,
        [id_audit],
        function (
            err,
            result
        ) {

            if (err) {

                console.error(
                    'GET AUDIT DOKUMEN:',
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal mengambil dokumen audit',

                    error:
                        err.message

                });

            }


            return res.json({

                success: true,

                data:
                    result || []

            });

        }
    );

};


// ======================================================
// DETAIL DOKUMEN
// ======================================================

exports.detail = (req, res) => {

    const {
        id_doc_aud
    } = req.params;


    const sql = `

        SELECT

            ad.id_doc_aud,

            ad.id_audit,

            ad.id_kategori,

            kd.nama_kategori,

            ad.id_dept,

            dept.nama_dept,

            ad.no_doc_aud,

            ad.nama_doc_aud,

            ad.file

        FROM audit_dokumen ad

        LEFT JOIN kategori_doc kd
            ON ad.id_kategori =
               kd.id_kategori

        LEFT JOIN departemen dept
            ON ad.id_dept =
               dept.id_dept

        WHERE ad.id_doc_aud = ?

        LIMIT 1

    `;


    db.query(
        sql,
        [id_doc_aud],
        function (
            err,
            result
        ) {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal mengambil detail dokumen',

                    error:
                        err.message

                });

            }


            if (
                result.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Dokumen tidak ditemukan'

                });

            }


            return res.json({

                success: true,

                data:
                    result[0]

            });

        }
    );

};


// ======================================================
// DOWNLOAD FILE
// ======================================================

exports.download = (req, res) => {

    const {
        id_doc_aud
    } = req.params;


    const sql = `

        SELECT
            file,
            nama_doc_aud

        FROM audit_dokumen

        WHERE id_doc_aud = ?

        LIMIT 1

    `;


    db.query(
        sql,
        [id_doc_aud],
        function (
            err,
            result
        ) {

            if (err) {

                console.error(err);

                return res.status(500).send(
                    'Database error'
                );

            }


            if (
                result.length === 0
            ) {

                return res.status(404).send(
                    'Dokumen tidak ditemukan'
                );

            }


            const fileName =
                result[0].file;


            if (!fileName) {

                return res.status(404).send(
                    'File tidak tersedia'
                );

            }


            const filePath =
                path.join(
                    uploadDir,
                    fileName
                );


            if (
                !fs.existsSync(filePath)
            ) {

                return res.status(404).send(
                    'File tidak ditemukan di server'
                );

            }


            res.download(
                filePath,
                fileName
            );

        }
    );

};


// ======================================================
// CREATE
// ======================================================

exports.create = (req, res) => {

    const {

        id_audit,

        id_kategori,

        id_dept,

        no_doc_aud,

        nama_doc_aud

    } = req.body;


    if (

        !id_audit ||
        !id_kategori ||
        !id_dept ||
        !no_doc_aud ||
        !nama_doc_aud

    ) {

        if (req.file) {

            const filePath =
                path.join(
                    uploadDir,
                    req.file.filename
                );

            if (
                fs.existsSync(filePath)
            ) {

                fs.unlinkSync(filePath);

            }

        }


        return res.status(400).json({

            success: false,

            message:
                'Data dokumen audit belum lengkap'

        });

    }


    if (!req.file) {

        return res.status(400).json({

            success: false,

            message:
                'File dokumen wajib dipilih'

        });

    }


    const sql = `

        INSERT INTO audit_dokumen
        (
            id_audit,
            id_kategori,
            id_dept,
            no_doc_aud,
            nama_doc_aud,
            file
        )

        VALUES (?, ?, ?, ?, ?, ?)

    `;


    db.query(
        sql,

        [

            id_audit,
            id_kategori,
            id_dept,
            no_doc_aud,
            nama_doc_aud,
            req.file.filename

        ],

        function (
            err,
            result
        ) {

            if (err) {

                console.error(
                    'CREATE DOKUMEN:',
                    err
                );


                const filePath =
                    path.join(
                        uploadDir,
                        req.file.filename
                    );


                if (
                    fs.existsSync(filePath)
                ) {

                    fs.unlinkSync(
                        filePath
                    );

                }


                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal menyimpan dokumen audit',

                    error:
                        err.message

                });

            }


            return res.status(201).json({

                success: true,

                message:
                    'Dokumen audit berhasil ditambahkan',

                id_doc_aud:
                    result.insertId

            });

        }
    );

};


// ======================================================
// UPDATE
// ======================================================

exports.update = (req, res) => {

    const {
        id_doc_aud
    } = req.params;


    const {

        id_kategori,

        id_dept,

        no_doc_aud,

        nama_doc_aud

    } = req.body;


    if (

        !id_kategori ||
        !id_dept ||
        !no_doc_aud ||
        !nama_doc_aud

    ) {

        if (req.file) {

            const newPath =
                path.join(
                    uploadDir,
                    req.file.filename
                );

            if (
                fs.existsSync(newPath)
            ) {

                fs.unlinkSync(newPath);

            }

        }


        return res.status(400).json({

            success: false,

            message:
                'Data dokumen belum lengkap'

        });

    }


    const sqlOld = `

        SELECT
            file,
            id_audit

        FROM audit_dokumen

        WHERE id_doc_aud = ?

        LIMIT 1

    `;


    db.query(
        sqlOld,
        [id_doc_aud],
        function (
            err,
            oldResult
        ) {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal mengambil dokumen'

                });

            }


            if (
                oldResult.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Dokumen tidak ditemukan'

                });

            }


            const oldFile =
                oldResult[0].file;


            let sql;

            let params;


            if (req.file) {

                sql = `

                    UPDATE audit_dokumen

                    SET

                        id_kategori = ?,

                        id_dept = ?,

                        no_doc_aud = ?,

                        nama_doc_aud = ?,

                        file = ?

                    WHERE id_doc_aud = ?

                `;


                params = [

                    id_kategori,

                    id_dept,

                    no_doc_aud,

                    nama_doc_aud,

                    req.file.filename,

                    id_doc_aud

                ];

            } else {

                sql = `

                    UPDATE audit_dokumen

                    SET

                        id_kategori = ?,

                        id_dept = ?,

                        no_doc_aud = ?,

                        nama_doc_aud = ?

                    WHERE id_doc_aud = ?

                `;


                params = [

                    id_kategori,

                    id_dept,

                    no_doc_aud,

                    nama_doc_aud,

                    id_doc_aud

                ];

            }


            db.query(
                sql,
                params,
                function (
                    err,
                    result
                ) {

                    if (err) {

                        console.error(err);


                        if (req.file) {

                            const filePath =
                                path.join(
                                    uploadDir,
                                    req.file.filename
                                );


                            if (
                                fs.existsSync(filePath)
                            ) {

                                fs.unlinkSync(
                                    filePath
                                );

                            }

                        }


                        return res.status(500).json({

                            success: false,

                            message:
                                'Gagal mengubah dokumen audit',

                            error:
                                err.message

                        });

                    }


                    if (
                        req.file &&
                        oldFile &&
                        oldFile !==
                            req.file.filename
                    ) {

                        const oldPath =
                            path.join(
                                uploadDir,
                                oldFile
                            );


                        if (
                            fs.existsSync(oldPath)
                        ) {

                            fs.unlinkSync(
                                oldPath
                            );

                        }

                    }


                    return res.json({

                        success: true,

                        message:
                            'Dokumen audit berhasil diperbarui'

                    });

                }
            );

        }
    );

};


// ======================================================
// DELETE
// ======================================================

exports.delete = (req, res) => {

    const {
        id_doc_aud
    } = req.params;


    const sqlGet = `

        SELECT
            file

        FROM audit_dokumen

        WHERE id_doc_aud = ?

        LIMIT 1

    `;


    db.query(
        sqlGet,
        [id_doc_aud],
        function (
            err,
            result
        ) {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    success: false,

                    message:
                        'Gagal mengambil dokumen'

                });

            }


            if (
                result.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Dokumen tidak ditemukan'

                });

            }


            const fileName =
                result[0].file;


            const sqlDelete = `

                DELETE FROM audit_dokumen

                WHERE id_doc_aud = ?

            `;


            db.query(
                sqlDelete,
                [id_doc_aud],
                function (
                    err,
                    deleteResult
                ) {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({

                            success: false,

                            message:
                                'Gagal menghapus dokumen',

                            error:
                                err.message

                        });

                    }


                    if (
                        fileName
                    ) {

                        const filePath =
                            path.join(
                                uploadDir,
                                fileName
                            );


                        if (
                            fs.existsSync(filePath)
                        ) {

                            fs.unlinkSync(
                                filePath
                            );

                        }

                    }


                    return res.json({

                        success: true,

                        message:
                            'Dokumen audit berhasil dihapus'

                    });

                }
            );

        }
    );

};