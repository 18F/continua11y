var Sequelize = require("sequelize");
var conString = process.env.DATABASE_URL || "postgres://localhost/postgres";
var db        = {};

var sequelize = new Sequelize(conString);
var models = ["Repo", "Commit", "Url"];
models.forEach(function(file) {
    var model = sequelize.import(__dirname + "/" + file);
    db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;