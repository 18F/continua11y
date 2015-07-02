var pg = require("pg");
var async = require('async');
var parse = require('url-parse');
var request = require("request");

function report(githubData, travisData) {

    console.log("processing repo "+travisData.repository);
    var overall = {"total": 0, "error": 0, "warning": 0, "notice": 0};
    var conString = process.env.DATABASE_URL || "postgres://localhost/postgres";

    pg.connect(conString, function (err, client, done){
        if (err) {
            console.log(err);
        } else {
            // TODO: check into setting keys for tables

            // make sure we have a table for the commits
            client.query("CREATE TABLE IF NOT EXISTS repo_"+githubData.id+"(repo_id int, branch text, commit text UNIQUE NOT NULL, short_commit text, message text, total int, error int, warning int, notice int, timestamp TIMESTAMP NOT NULL);", function (err, result){
                done();
            });

            // create table for commit with results of each url
            client.query("CREATE TABLE IF NOT EXISTS commit_"+githubData.id+"_"+travisData.commit+"(repo_id int, commit text, url text UNIQUE NOT NULL, total int, error int, warning int, notice int);", function (err, result){
                done();
            });

            async.forEachOfSeries(travisData.data, function (data, url, callback){
                overall.total += data.count.total;
                overall.error += data.count.error;
                overall.warning += data.count.warning;
                overall.notice += data.count.notice;
                url = parse(url, true)
                client.query("INSERT INTO commit_"+githubData.id+"_"+travisData.commit+" VALUES('"+githubData.id+"', '"+travisData.commit+"', '"+url.pathname+"', '"+data.count.total+"', '"+data.count.error+"', '"+data.count.warning+"', '"+data.count.notice+"');", function (err, result){
                    done();
                    if (err) {
                        console.log("Error adding URL to database");
                    }
                });
                callback(null);
            }, function (err){
                if (err) {
                    console.log("Error in iterating over URLs");
                } else {
                    // check if repo is tracked in master table and do an INSERT or UPDATE as appropriate
                    // TODO: change to UPSERT once postgres makes it available
                    // TODO: is this async necessary?
                    async.series([
                        function (callback){
                            client.query("INSERT INTO results VALUES('"+travisData.repository+"', '"+githubData.id+"', '"+githubData.default_branch+"', '"+travisData.branch+"', '"+overall.total+"', '"+overall.error+"', '"+overall.warning+"', '"+overall.notice+"', now());", function (err, result){
                                done();
                                if (err) {
                                    console.log("Error inserting into master table (probably a duplicate key, which is okay)");
                                }
                                
                                // add new row if this is a new repo
                                if (!result) {
                                    client.query("UPDATE results SET (repo_name, default_branch, branch, total, error, warning, notice, timestamp) = ('"+travisData.repository+"', '"+githubData.default_branch+"', '"+travisData.branch+"', '"+overall.total+"', '"+overall.error+"', '"+overall.warning+"', '"+overall.notice+"', now()) WHERE repo_id = '"+githubData.id+"';", function (err, result){
                                        done();
                                        if (err) {
                                            console.log("Error updating row in the master table");
                                        }
                                    });
                                }

                            });
                            callback(null);
                        },
                        function (callback){
                            // TODO: compare to previous status and tell GitHub
                            var firstCommit = travisData.commit.slice(0,6);
                            // var lastCommit = travisData.commit.slice(15,21);
                            client.query("SELECT error FROM repo_"+githubData.id+" WHERE short_commit = '"+firstCommit+"'", function (err, result){
                                if (err){
                                    console.log("Error finding previous commit");
                                }
                                var change = result.rows[0].error - overall.error;
                                if (change >= 0){
                                    // send success message
                                    request.post({
                                        uri: "https://api.github.com/repos/"+travisData.repository+"/statuses/"+travisData.commit,
                                        headers: {
                                            "User-Agent": "continua11y",
                                            "Authorization": "token "+process.env.GITHUB_TOKEN
                                        },
                                        json: true,
                                        body: {
                                            "state": "success",
                                            "target_url": "https://continua11y.herokuapp.com/"+travisData.repository+"/"+travisData.commit,
                                            "description": "decreased accessibility errors by "+change,
                                            "context": "continuous-integration/continua11y"
                                        }
                                    }, function (err, res, body){
                                        if (err){
                                            console.log(err);
                                        } else {
                                            console.log("success: got "+res.statusCode);
                                        }
                                    });
                                } else {
                                    // send failure message
                                    request.post({
                                        uri: "https://api.github.com/repos/"+travisData.repository+"/statuses/"+travisData.commit,
                                        headers: {
                                            "User-Agent": "continua11y",
                                            "Authorization": "token "+process.env.GITHUB_TOKEN
                                        },
                                        json: true,
                                        body: {
                                            "state": "failure",
                                            "target_url": "https://continua11y.herokuapp.com/"+travisData.repository+"/"+travisData.commit,
                                            "description": "increased accessibility errors by "+change,
                                            "context": "continuous-integration/continua11y"
                                        }
                                    }, function (err, res, body){
                                        if (err){
                                            console.log(err);
                                        } else {
                                            console.log("success: got "+res.statusCode);
                                        }
                                    });
                                    
                                }
                            });
                            callback(null);
                        }
                    ]);

                    // add total result for ALL urls in repo
                    client.query("INSERT INTO repo_"+githubData.id+" VALUES('"+githubData.id+"', '"+travisData.branch+"', '"+travisData.commit+"', '"+travisData.commit.slice(0,6)+"', '"+travisData.commit_message+"', '"+overall.total+"', '"+overall.error+"', '"+overall.warning+"', '"+overall.notice+"', now());", function (err, result){
                        done();
                        if (err) {
                            console.log("Error adding row to repo table");
                        }
                    });
                }
            });
        }
    });
}

module.exports = report;