// seeds the database with some sample data

var models = require("../models");

var seed = function () {
    models.Repo.create({
        repo: 1234567,
        repoName: "test/one",
        defaultBranch: "release",
        total: 200,
        error: 25,
        warning: 50,
        notice: 125
    }).then(function (repo) {
        models.Commit.create({
            branch: "release",
            pullRequest: false,
            latest: false,
            commit: "n839vt90289138uv01861834u509345",
            shortCommit: "n839vt9",
            commitMessage: "just testing some commits",
            repo: repo.repo,
            repoName: repo.repoName,
            total: repo.total,
            error: repo.error,
            warning: repo.warning,
            notice: repo.notice
        }).then(function (commit) {
            models.Url.create({
                path: "/index.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 100,
                error: 20,
                warning: 30,
                notice: 50
            });
            models.Url.create({
                path: "/about.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 62,
                error: 2,
                warning: 10,
                notice: 50
            });
            models.Url.create({
                path: "/contact.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 38,
                error: 3,
                warning: 10,
                notice: 25
            });
        });
        models.Commit.create({
            branch: "release",
            pullRequest: false,
            latest: true,
            commit: "028tyhg3oqeh4otih3qoihqiehqo43h",
            shortCommit: "028tyhg",
            commitMessage: "a newer commit",
            repo: repo.repo,
            repoName: repo.repoName,
            total: 150,
            error: 40,
            warning: 50,
            notice: 60
        }).then(function (commit) {
            models.Url.create({
                path: "/index.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 80,
                error: 10,
                warning: 20,
                notice: 50
            });
            models.Url.create({
                path: "/about.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 20,
                error: 5,
                warning: 6,
                notice: 9
            });
            models.Url.create({
                path: "/contact.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 50,
                error: 25,
                warning: 24,
                notice: 1
            });
        });
        models.Commit.create({
            branch: "feature",
            pullRequest: true,
            latest: true,
            commit: "943gqireavg3qireab3i4quhreh32r4",
            shortCommit: "943gqir",
            commitMessage: "a commit in a pull request",
            repo: repo.repo,
            repoName: repo.repoName,
            total: repo.total,
            error: repo.error,
            warning: repo.warning,
            notice: repo.notice
        }).then(function (commit) {
            models.Url.create({
                path: "/index.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 100,
                error: 20,
                warning: 30,
                notice: 50
            });
            models.Url.create({
                path: "/about.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 62,
                error: 2,
                warning: 10,
                notice: 50
            });
            models.Url.create({
                path: "/contact.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 38,
                error: 3,
                warning: 10,
                notice: 25
            });
        });
    });
    models.Repo.create({
        repo: 7654321,
        repoName: "test/two",
        defaultBranch: "develop",
        total: 100,
        error: 0,
        warning: 10,
        notice: 90
    }).then(function (repo) {
        models.Commit.create({
            branch: "develop",
            pullRequest: false,
            latest: true,
            commit: "79283i4rgh983h4owaadfalh8394894",
            shortCommit: "79283i4",
            commitMessage: "seed data for the database",
            repo: repo.repo,
            repoName: repo.repoName,
            total: repo.total,
            error: repo.error,
            warning: repo.warning,
            notice: repo.notice
        }).then(function (commit) {
            models.Url.create({
                path: "/index.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 50,
                error: 0,
                warning: 2,
                notice: 48
            });
            models.Url.create({
                path: "/about.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 20,
                error: 0,
                warning: 5,
                notice: 15
            });
            models.Url.create({
                path: "/contact.html",
                commit: commit.commit,
                repo: repo.repo,
                total: 30,
                error: 0,
                warning: 3,
                notice: 27
            });
        });
    });
};

module.exports = seed;
