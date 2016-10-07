'use strict';

var models = require('../models/persistence');

exports.get = function (req, res){
    var reqCommit = req.params.commit.replace('.html','');
    models.Commit.findOne({
        where: {
            commit: reqCommit
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (commit) {
        models.Url.findAll({
            where: {
                repo: commit.repo,
                commit: reqCommit
            }
        }).then(function (urls){
            res.render('commit', {
                results: urls,
                repo: commit.repoName,
                commit: reqCommit,
                branch: commit.branch
            });
        });
    });
};
