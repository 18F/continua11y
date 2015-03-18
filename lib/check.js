var Crawler = require("simplecrawler");
var pa11y = require("pa11y");
var portscanner = require("portscanner");

var checker = function (in_urls) {

    var out_urls = [];
    var accessibility = {};

    console.log("found "+in_urls.length+" sites to crawl: "+in_urls);

    function crawl(i) {
        if (i){
            console.log("crawling "+i);

            var crawlee = new Crawler(i);

            // TODO: allow setting these values in pa11y.yaml
            crawlee.interval = 500;
            crawlee.maxConcurrency = 2;
            crawlee.maxDepth = 0;
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
                        standard: "WCAG2AAA",
                        timeout: 60000,
                        port: port
                    }, function (err, results){
                        // TODO: add to a database
                        console.log(results.count);
                        portscanner.findAPortNotInUse('13200', '13300', '127.0.0.1', function (error, port){
                            return access(out_urls.shift(), port);
                        })                        
                    });
                }
            }
            access(out_urls.shift(), 13200);
        }
    }
    crawl(in_urls.shift());
};

module.exports = checker;