var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var pg = require("pg");
var badge = require('gh-badges');
var async = require("async");
var Reporter = require("./lib/reporter.js");
var models = require("./models");

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.use(enableCORS);

app.get("/", function (req, res){
    models.Repo.findAll({
        order: [["updatedAt", "DESC"]],
        limit: 20
    }).then(function (repos) {
        console.log(repos);
        res.render("index", {repos: repos});
    });
});

app.get("/instructions", function (req, res){
    res.render('instructions');
});

app.get("/api/:account/:repo", function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+"/"+req.params.repo,
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
});

app.get("/:account/:repo/:commit", function (req, res){
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
                repo: req.params.account + "/" + req.params.repo,
                commit: req.params.commit,
                branch: commit.branch
            });
        });
    });
});

app.get("/:account/:repo.svg", function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+"/"+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
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
                badge({ text: [ "accessible", "unknown" ], colorscheme: "lightgrey" },
                    function(svg, err) {
                        res.set('Content-Type', 'image/svg+xml');
                        res.send(svg);
                });
            } else {
                var count = commit.error;
                if (count >= 50) {
                    summary = count+" errors";
                    color = "red";
                } else if (50 > count && count > 0) {
                    summary = count+" errors";
                    color = "yellow";
                } else {
                    summary = count+" errors";
                    color = "brightgreen";
                }
                badge({ text: [ "accessibility", summary ], colorscheme: color },
                    function(svg, err) {
                        res.set('Content-Type', 'image/svg+xml');
                        res.send(svg);
                });
            }
        });
    });
});

app.get("/:account/:repo", function (req, res){
    models.Repo.findOne({
        where: {
            repoName: req.params.account+"/"+req.params.repo,
        },
        order: [['updatedAt', 'DESC']]
    }).then(function (repo) {
        var defaultBranch = repo.defaultBranch;
        models.Commit.findAll({
            where: {
                repo: repo.repo
            }
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
                        repo: req.params.account + "/" + req.params.repo, 
                        branches: branches, 
                        default_branch: defaultBranch});
                    callback(null);
                }
            ]);
        });
    });
});

app.post("/incoming", bodyParser.json({limit: '50mb'}), function (req, res){

    res.send("ok");
    console.log("received new report for "+req.body.repository);
    request.get({
        uri: "https://api.github.com/repos/"+req.body.repository,
        headers: {
            "User-Agent": "continua11y",
            "Authorization": "token "+process.env.GITHUB_TOKEN
        }
    }, function (err, res, body){
        body = JSON.parse(body);
        Reporter.start(body, req.body);
    });
});

app.use(function (req, res) {
    res.status(400);
    res.render('404.jade');
});

app.use(function (req, res) {
    res.status(500);
    res.render('500.jade');
});

models.sequelize.sync({
    // force: true
}).then(function () {
    var server = app.listen(process.env.PORT || 3000, function() {

        var host = server.address().address;
        var port = server.address().port;

        console.log('Listening at http://%s:%s', host, port);
    });
});