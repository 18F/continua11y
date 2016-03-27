var models = require('../models');
var request = require('request');
var reporter = require('../lib/reporter.js');
var cfenv = require('cfenv');

var appEnv = cfenv.getAppEnv();

exports.index = function (req, res){
    models.Repo.findAll({
        order: [["updatedAt", "DESC"]],
        limit: 20
    }).then(function (repos) {
        res.render("index", {repos: repos});
    });
};

exports.instructions = function (req, res){
    res.render('instructions');
};

exports.incoming = function (req, res){
    var GITHUB_TOKEN = process.env.GITHUB_TOKEN || appEnv.getServiceCreds('continua11y-cups').GITHUB_TOKEN;

    res.send('ok');
    console.log('received new report for '+req.body.repository);
    request.get({
        uri: 'https://api.github.com/repos/'+req.body.repository,
        headers: {
            'User-Agent': 'continua11y',
            'Authorization': 'token '+GITHUB_TOKEN
        }
    }, function (err, res, body){
        body = JSON.parse(body);
        if (req.body.data) {
            reporter.start(body, req.body);
        }
    });
};
