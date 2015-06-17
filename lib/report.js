var pg = require("pg");
var async = require('async');

// not sure if this needs to be duplicated here

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
            client.query("CREATE TABLE IF NOT EXISTS repo_"+githubData.id+"(repo_id int, branch text, commit text, total int, error int, warning int, notice int, timestamp TIMESTAMP NOT NULL);", function (err, result){
                done();
            });

            // create table for commit with results of each url
            client.query("CREATE TABLE IF NOT EXISTS commit_"+githubData.id+"_"+travisData.commit+"(repo_id int, commit text, url text, total int, error int, warning int, notice int);", function (err, result){
                done();
            });

            async.forEachOfSeries(travisData.data, function (data, url, callback){
                overall.total += data.count.total;
                overall.error += data.count.error;
                overall.warning += data.count.warning;
                overall.notice += data.count.notice;
                client.query("INSERT INTO commit_"+githubData.id+"_"+travisData.commit+" VALUES('"+githubData.id+"', '"+travisData.commit+"', '"+url+"', '"+data.count.total+"', '"+data.count.error+"', '"+data.count.warning+"', '"+data.count.notice+"');", function (err, result){
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
                    client.query("INSERT INTO results VALUES('"+travisData.repository+"', '"+githubData.id+"', '"+githubData.default_branch+"', '"+travisData.branch+"', '"+overall.total+"', '"+overall.error+"', '"+overall.warning+"', '"+overall.notice+"', now());", function (err, result){
                        done();
                        if (err) {
                            console.log(err);
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

                    // add total result for ALL urls in repo
                    client.query("INSERT INTO repo_"+githubData.id+" VALUES('"+githubData.id+"', '"+travisData.branch+"', '"+travisData.commit+"', '"+overall.total+"', '"+overall.error+"', '"+overall.warning+"', '"+overall.notice+"', now());", function (err, result){
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