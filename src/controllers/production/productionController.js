const db = require('../../config/database');

exports.dashboard = (req, res) => {
    res.render('production/dashboard', {
        title: 'Production Dashboard',
        tittle: 'Production Dashboard',
        active: 'production',
        user: req.user
    });
};

exports.data = (req, res) => {
    res.json({
        success: true,
        data: {
            kpi: {
                plan: 0,
                actual: 0,
                achievement: 0,
                gap: 0,
                oee: 0,
                good: 0,
                ng: 0,
                downtime: 0
            },
            planning: [],
            oee: {
                availability: 0,
                performance: 0,
                quality: 0,
                oee: 0
            },
            productionRecord: [],
            achievementTrend: {
                labels: [],
                data: [],
                target: []
            },
            defectTrend: {
                labels: [],
                ng: [],
                defect: []
            },
            downtime: {
                labels: [],
                data: []
            }
        }
    });
};