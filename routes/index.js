var models = require('../models');
var request = require('request');
var reporter = require('../lib/reporter.js');

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

    res.send('ok');
    console.log('received new report for '+req.body.repository);
    request.get({
        uri: 'https://api.github.com/repos/'+req.body.repository,
        headers: {
            'User-Agent': 'continua11y',
            'Authorization': 'token '+process.env.GITHUB_TOKEN
        }
    }, function (err, res, body){
        body = JSON.parse(body);
        console.log(body);
        console.log(req.body);
        console.log(req.body.data);
        if (req.body.data) {
            console.log('got data');
            reporter.start(body, req.body);
        } else {
            console.log('no data');
        }
    });
};