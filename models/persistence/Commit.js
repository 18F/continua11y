'use strict';

module.exports = function(sequelize, DataTypes) {
    var Commit = sequelize.define('Commit', {
        branch: {
            type: DataTypes.STRING
        },
        latest: {
            type: DataTypes.BOOLEAN
        },
        pullRequest: {
            type: DataTypes.BOOLEAN
        },
        commit: {
            type: DataTypes.STRING,
            unique: true
        },
        shortCommit: {
            type: DataTypes.STRING
        },
        commitMessage: {
            type: DataTypes.STRING
        },
        repo: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Repos',
                key: 'repo'
            }
        },
        repoName: {
            type: DataTypes.STRING
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
                Commit.belongsTo(models.Repo);
                Commit.hasMany(models.Url);
            }
        }
    });

    return Commit;
};
