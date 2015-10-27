var models = require('../models');
var async = require('async');

exports.get = function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+'/'+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
        try {
            var defaultBranch = repo.defaultBranch;
                models.Commit.findAll({
                where: {
                    repo: repo.repo
                },
                order: [['updatedAt', 'DESC']]
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
                            repo: req.params.account + '/' + req.params.repo, 
                            branches: branches, 
                            default_branch: defaultBranch});
                        callback(null);
                    }
                ]);
            });
        } catch (e) {
            // entering incorrect owner/repo urls (or urls that looks like that)
            // won't get caught by the middleware, so this catches them
            res.render('404');
        }
    });
};