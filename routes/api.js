'use strict';

var models = require('../models');

exports.get = function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+'/'+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
        if (repo) {
            models.Commit.findAll({
                where: {
                    repo: repo.repo
                }
            }).then(function (commits) {
                res.send({
                    status: 'success',
                    results: commits
                });
            });
        } else {
            res.send({
                status: 'error',
                error: 'no such repo'
            });
        }
    });
};
