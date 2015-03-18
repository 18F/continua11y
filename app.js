var express = require("express");
var https = require("https");
var bodyParser = require("body-parser");
var yaml = require("js-yaml");
var checker = require("./lib/check.js")

var app = express();

var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.use(enableCORS);

// TODO: connect to database

app.get("/", function (req, res){
    res.send("Hello");
    // TODO: view completed and in-progress jobs
});

app.post("/check", bodyParser.json(), function (req, res){

    if (req["headers"]["user-agent"].match(/GitHub-Hookshot\/.+/)) {

        res.send("ok");
        console.log("starting!");

        var in_urls = [];
        var repo = req.body.repository.full_name;
        var ref = req.body.after;

        console.log("looking for pa11y.yaml");
        https.get("https://raw.githubusercontent.com/"+repo+"/"+ref+"/pa11y.yaml", function (res){

            if (res.statusCode == 200) {
                console.log("found a pa11y.yaml file!")
                res.on("data", function (d){
                    d = yaml.safeLoad(d);
                    in_urls = d.urls;
                    checker(in_urls, d);
                });
            } else {
                if (req.body.repository.homepage !== null) {
                    console.log("no pa11y.yaml found; using repo homepage")
                    in_urls.push(req.body.repository.homepage);
                    checker(in_urls, null);
                } else {
                    console.log("no sites to check!")
                }
            }
        });
    } else {
        res.send("hey! you're not github");
    }
});

var server = app.listen(process.env.PORT || 3000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});