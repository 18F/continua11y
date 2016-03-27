module.exports = function(sequelize, DataTypes) {
    var Repo = sequelize.define("Repo", {
        repo: {
            type: DataTypes.INTEGER,
            unique: true
        },
        repoName: {
            type: DataTypes.STRING
        },
        defaultBranch: {
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
                Repo.hasMany(models.Commit);
                Repo.hasMany(models.Url);
            }
        }
    });

    return Repo;
};
