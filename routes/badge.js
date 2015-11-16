var badge = require('gh-badges');
var models = require('../models');

exports.make = function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+'/'+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
        try {
            models.Commit.findOne({
                where: {
                    repo: repo.repo,
                    latest: true,
                    branch: req.query.branch || repo.defaultBranch
                }
            }).then(function (commit) {
                var summary;
                var color;
                if (commit === null){
                    badge({ text: [ 'accessible', 'unknown' ], colorscheme: 'lightgrey', template: 'flat' },
                        function(svg, err) {
                            res.set('Content-Type', 'image/svg+xml;charset=utf-8');
                            res.send(svg);
                    });
                } else {
                    var count = commit.error;
                    if (count >= 50) {
                        summary = count+' errors';
                        color = 'red';
                    } else if (50 > count && count > 0) {
                        summary = count+' errors';
                        color = 'yellow';
                    } else {
                        summary = count+' errors';
                        color = 'brightgreen';
                    }
                    badge({ text: [ 'accessibility', summary ], colorscheme: color, template: 'flat' },
                        function(svg, err) {
                            res.set('Content-Type', 'image/svg+xml;charset=utf-8');
                            res.send(svg);
                    });
                }
            });
        } catch (e) {
            // entering incorrect owner/repo urls (or urls that looks like that)
            // won't get caught by the middleware, so this catches them
            res.status('404');
            res.render('404');
        }
    });
};