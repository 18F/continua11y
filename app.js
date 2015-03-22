var express = require("express");
var https = require("https");
var bodyParser = require("body-parser");
var yaml = require("js-yaml");
var pg = require("pg");
var badge = require('gh-badges');
var checker = require("./lib/check.js");

var app = express();
app.set('view engine', 'jade');
app.set('views', './views');

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

var conString = process.env.DATABASE_URL || "postgres://localhost/postgres";
var client = pg.connect(conString, function (err, client, done){
    if (err) {
        console.log(err);
    } else {
        client.query("CREATE TABLE IF NOT EXISTS results(repo text, url text, total int, errors int, warnings int, notices int);");
    }
    done();
});

app.get("/", function (req, res){
    res.render('index');
});

app.get("/:account/:repo.svg", function (req, res){
    var client = pg.connect(conString, function (err, client, done){
        if (err) {
            console.log(err);
        } else {
            client.query("SELECT * FROM results WHERE repo = '"+req.params.account + "/" + req.params.repo+"'", function (err, result){
                var summary;
                var color;
                if (result.rows.length === 0){
                    badge({ text: [ "accessible", "unknown" ], colorscheme: "lightgrey" },
                        function(svg, err) {
                            res.set('Content-Type', 'image/svg+xml');
                            res.send(svg);
                    });
                } else {
                    if (result.rows[0].errors > 20){
                        summary = "no";
                        color = "red";
                    } else if (20 > result.rows[0].errors > 0){
                        summary = "mostly";
                        color = "yellow";
                    } else {
                        summary = "yes";
                        color = "brightgreen";
                    }
                    badge({ text: [ "accessible", summary ], colorscheme: color },
                        function(svg, err) {
                            res.set('Content-Type', 'image/svg+xml');
                            res.send(svg);
                    });
                }
                done()
            });
        }
    });
});

app.get("/:account/:repo", function (req, res){
    // TODO: view completed and in-progress jobs
    var client = pg.connect(conString, function (err, client, done){
        if (err) {
            console.log(err);
        } else {
            client.query("SELECT * FROM results WHERE repo = '"+req.params.account + "/" + req.params.repo+"'", function (err, result){
                if (result.rows.length === 0){
                    // TODO: Setup instructions if new

                    res.send("I don't know that repo");
                } else {
                    res.render('report', {results: result.rows, repo: req.params.account + "/" + req.params.repo, thisUrl: req.protocol + '://' + req.get('host') + req.originalUrl});
                }
                done();
            });
        }
    });
});

app.post("/check", bodyParser.json(), function (req, res){

    // TODO: implement job queue

    if (req["headers"]["user-agent"].match(/GitHub-Hookshot\/.+/)) {

        res.send("ok");
        console.log("starting!");

        var in_urls = [];
        var repo = req.body.repository.full_name;
        var ref = req.body.after;

        console.log("looking for pa11y.yaml");
        https.get("https://raw.githubusercontent.com/"+repo+"/"+ref+"/pa11y.yaml", function (res){

            if (res.statusCode === 200) {
                console.log("found a pa11y.yaml file!");
                res.on("data", function (d){
                    d = yaml.safeLoad(d);
                    in_urls = d.urls;
                    checker(in_urls, d, repo);
                });
            } else {
                if (req.body.repository.homepage !== null) {
                    console.log("no pa11y.yaml found; using repo homepage");
                    in_urls.push(req.body.repository.homepage);
                    checker(in_urls, null, repo);
                } else {
                    console.log("no sites to check!");
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