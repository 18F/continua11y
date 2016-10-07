'use strict';

var Sequelize = require('sequelize');
var db        = {};

if (process.env.NODE_ENV === 'TEST') {
    var conString = 'postgres://localhost/continua11y_test';
} else {
    var conString = process.env.DATABASE_URL || 'postgres://localhost/continua11y';
}

var sequelize = new Sequelize(conString, {
    logging: false,
});
var models = ['Repo', 'Commit', 'Url'];
models.forEach(function(file) {
    var model = sequelize.import(__dirname + '/' + file);
    db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
