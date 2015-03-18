var Crawler = require("simplecrawler");
var pa11y = require("pa11y");
var portscanner = require("portscanner");

var checker = function (in_urls, options) {

    var out_urls = [];
    var accessibility = {};
    var interval = 500;
    var maxConcurrency = 2;
    var depth = 0;
    var standard = "WCAG2AAA";
    var timeout = 30000;
    var width = 1280;
    var height = 800

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
                console.log("finished crawling "+i)
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
                        console.log(results.count);
                        portscanner.findAPortNotInUse('13200', '13300', '127.0.0.1', function (error, port){
                            return access(out_urls.shift(), port);
                        });                 
                    });
                } else {
                    console.log("done!");
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