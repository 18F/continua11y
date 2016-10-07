'use strict';

var models = require('../models/persistence');
var async = require('async');

exports.get = function (req, res){
    var reqRepo = req.params.repo.replace('.html','');
    models.Repo.findOne({
        where: {
            repoName: {
              $iLike: req.params.account+'/'+reqRepo
            }
        },
        order: [['createdAt', 'DESC']]
    }).then(function (repo) {
        try {
            var defaultBranch = repo.defaultBranch;
                models.Commit.findAll({
                where: {
                    repo: repo.repo
                },
                order: [['createdAt', 'DESC']]
            }).then(function (commits) {
                var branches = [];
                async.series([
                    function (callback) {
                        for (var i=0; i<commits.length; i++) {
                            if (commits[i].latest === true) {
                                branches.push(commits[i].branch);
                            }
                        }
                        callback(null);
                    },
                    function (callback) {
                        res.render('repo', {
                            results: commits,
                            repo: repo.repoName,
                            branches: branches,
                            default_branch: defaultBranch});
                        callback(null);
                    }
                ]);
            });
        } catch (e) {
            // entering incorrect owner/repo urls (or urls that looks like that)
            // won't get caught by the middleware, so this catches them
            res.status('404');
            res.render('404');
        }
    });
};
