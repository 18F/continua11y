var express = require('express');
var bodyParser = require('body-parser');

// database stuff
var seed = require('./lib/seed.js');
var models = require('./models');

// router middleware stuff
var routes = require('./routes');
var apiroute = require('./routes/api.js');
var commitroute = require('./routes/commit.js');
var badgeroute = require('./routes/badge.js');
var reporoute = require('./routes/repo.js');

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

app.get('/', routes.index);
app.get('/instructions', routes.instructions);

// api
app.get('/api/:account/:repo', apiroute.get);

// individual pages
app.get('/:account/:repo/:commit', commitroute.get);
app.get('/:account/:repo.svg', badgeroute.make);
app.get('/:account/:repo', reporoute.get);

// incoming from Travis
app.post('/incoming', bodyParser.json({limit: '50mb'}), routes.incoming);

app.use(function (req, res) {
    res.status(404);
    res.render('404.jade');
});

app.use(function (req, res) {
    res.status(500);
    res.render('500.jade');
});

console.log(process.env.PORT);

models.sequelize.sync({
    force: process.env.FRESHDB || false
}).then(function () {
    if (process.env.FRESHDB === 'TRUE') {
        console.log('creating a fresh database');
        seed();
    }
    var server = app.listen(process.env.PORT || 3000, function() {

        var host = server.address().address;
        var port = server.address().port;

        console.log('Listening at http://%s:%s', host, port);
    });
});
