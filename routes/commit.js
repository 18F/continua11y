var models = require('../models');

exports.get = function (req, res){
    models.Commit.findOne({
        where: {
            commit: req.params.commit
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (commit) {
        models.Url.findAll({
            where: {
                repo: commit.repo,
                commit: req.params.commit
            }
        }).then(function (urls){
            res.render('commit', {
                results: urls, 
                repo: req.params.account + '/' + req.params.repo,
                commit: req.params.commit,
                branch: commit.branch
            });
        });
    });
};