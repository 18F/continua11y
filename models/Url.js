module.exports = function(sequelize, DataTypes) {
    var Url = sequelize.define('Url', {
        path: {
            type: DataTypes.STRING,
            unique: 'urlIndex'
        },
        repo: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Repos',
                key: 'repo'
            },
            unique: 'urlIndex'
        },
        commit: {
            type: DataTypes.STRING,
            references: {
                model: 'Commits',
                key: 'commit'
            },
            unique: 'urlIndex'
        },
        total: {
            type: DataTypes.INTEGER
        },
        error: {
            type: DataTypes.INTEGER
        },
        warning: {
            type: DataTypes.INTEGER
        },
        notice: {
            type: DataTypes.INTEGER
        }
    }, {
        classMethods: {
            associate: function(models) {
                Url.belongsTo(models.Commit);
                Url.belongsTo(models.Repo);
            }
        }
    });

    return Url;
};