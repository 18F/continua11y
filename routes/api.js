var models = require('../models');

exports.get = function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+'/'+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
        models.Commit.findAll({
            where: {
                repo: repo.repo
            }
        }).then(function (commits) {
            res.send({results: commits});
        });
    });
};