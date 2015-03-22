var Crawler = require("simplecrawler");
var pa11y = require("pa11y");
var portscanner = require("portscanner");
var pg = require("pg");

var checker = function (in_urls, options, repo) {

    // TODO: flatter structure

    var conString = process.env.DATABASE_URL || "postgres://localhost/postgres";

    var out_urls = [];
    var accessibility = {"overall": {"total": 0, "errors": 0, "warnings": 0, "notices": 0}};
    var interval = 500;
    var maxConcurrency = 2;
    var depth = 0;
    var standard = "WCAG2AAA";
    var timeout = 30000;
    var width = 1280;
    var height = 800;

    if (options.crawler) {
        if (options.crawler.interval) {
            interval = options.crawler.interval;
        }
        if (options.crawler.maxConcurrency) {
            maxConcurrency = options.crawler.maxConcurrency;
        }
        if (options.crawler.depth) {
            depth = options.crawler.depth;
        }
    }
    if (options.pa11y) {
        if (options.pa11y.standard) {
            standard = options.pa11y.standard;
        }
        if (options.pa11y.timeout) {
            timeout = options.pa11y.timeout;
        }
        if (options.pa11y.width) {
            width = options.pa11y.width;
        }
        if (options.pa11y.height) {
            height = options.pa11y.height;
        }
    }

    console.log("found "+in_urls.length+" sites to crawl: "+in_urls);

    for (i=0;i<in_urls.length;i++){
        accessibility[in_urls[i]] = {
            "total": 0,
            "errors": 0,
            "warnings": 0,
            "notices": 0
        };
    }

    function crawl(i) {
        if (i){
            console.log("crawling "+i);

            var crawlee = new Crawler(i);

            // TODO: allow setting these values in pa11y.yaml
            crawlee.interval = interval;
            crawlee.maxConcurrency = maxConcurrency;
            crawlee.maxDepth = depth;
            crawlee.downloadUnsupported = false;
            crawlee.discoverRegex = [
                /(\shref\s?=\s?|url\()([^\"\'\s>\)]+)/ig,
                /(?!.*\.(ico|css|ttf|js|xml|svg|jpg|png)\")(\shref\s?=\s?|url\()['"]([^"']+)/ig,
                /http(s)?\:\/\/[^?\s><\'\"]+/ig,
                /url\([^\)]+/ig,
                /^javascript\:[a-z0-9\$\_\.]+\(['"][^'"\s]+/ig
            ];

            crawlee.on("fetchcomplete", function (queueItem, responseBuffer, response) {
                if (response.headers['content-type'].match(/text\/html/)) {
                    out_urls.push(queueItem.url);
                    console.log("found new url: "+queueItem.url);
                } else {
                    console.log("non-html: "+queueItem.url);
                }
            });

            crawlee.on("complete", function (){
                console.log("finished crawling "+i);
                return crawl(in_urls.shift());
            });

            crawlee.start();
        } else {
            console.log("sending "+out_urls.length+" pages to pa11y");
            function access (i, port){
                if (i){
                    console.log("analyzing "+i);
                    pa11y.sniff({
                        url: i,
                        standard: standard,
                        timeout: timeout,
                        height: height,
                        width: width,
                        port: port
                    }, function (err, results){
                        var k = i.match(/\/\/(www\.)?(.*?)\//);
                        accessibility[k[2]]["total"] += results.count.total;
                        accessibility[k[2]]["errors"] += results.count.error;
                        accessibility[k[2]]["warnings"] += results.count.warning;
                        accessibility[k[2]]["notices"] += results.count.notice;
                        accessibility["overall"]["total"] += results.count.total;
                        accessibility["overall"]["errors"] += results.count.error;
                        accessibility["overall"]["warnings"] += results.count.warning;
                        accessibility["overall"]["notices"] += results.count.notice;

                        portscanner.findAPortNotInUse('13200', '13300', '127.0.0.1', function (error, port){
                            return access(out_urls.shift(), port);
                        });                 
                    });
                } else {
                    Object.keys(accessibility).forEach(function (key){
                        console.log(accessibility[key].total);
                        var client = pg.connect(conString, function (err, client, done){
                            client.query("DELETE FROM results WHERE repo = '"+repo+"';", function (error, result){
                                if (error){
                                    console.log("ERROR: "+error);
                                } else {
                                    if (result.rows.length === 0){
                                        client.query("INSERT INTO results VALUES ('"+repo+"', '"+key+"', '"+accessibility[key].total+"', '"+accessibility[key].errors+"', '"+accessibility[key].warnings+"', '"+accessibility[key].notices+"');", function (err, res){
                                            if (err){
                                                console.log("#1: "+err);
                                            }
                                        });
                                    } else {
                                        client.query("UPDATE results SET total = "+accessibility[key].total+", errors = "+accessibility[key].errors+", warnings = "+accessibility[key].warnings+", notices = "+accessibility[key].notices+" WHERE url = '"+key+"';", function (err, res){
                                            if (err){
                                                console.log("#2: "+err);
                                            }
                                        });
                                    }
                                }
                            });
                        });
                    });
                }
            }
            portscanner.findAPortNotInUse('13200', '13300', '127.0.0.1', function (error, port){
                access(out_urls.shift(), port);
            }) ;
        }
    }
    crawl(in_urls.shift());
};

module.exports = checker;