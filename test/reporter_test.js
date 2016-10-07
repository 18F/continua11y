'use strict';

var assert    = require('assert');
var seed      = require('../scripts/lib/seeder');
var reporter  = require('../models/reporter');
var models    = require('../models/persistence');

describe('Reporter tests', function () {
  before(function (done) {
      models.sequelize.sync({
          force: true
      }).then(function () {
          seed();
          setTimeout(function () {
              done();
          }, 1500);
      });
  });

    describe('Receive report from new repo', function () {
        before(function (done) {
            reporter.start({
                id: 22446688,
                default_branch: 'release',
            }, {
                pull_request: 'false',
                repository: 'test/one',
                branch: 'release',
                commit: '68huq45ty49hgwgghythwtyghi43ty8',
                commit_message: 'creating new test repository',
                data: {
                    'website.com': {
                        'count': {
                            total: 10,
                            error: 1,
                            warning: 3,
                            notice: 6
                        }
                    }
                }
            });
            // give reporter time to complete
            setTimeout(function () {
                done();
            }, 1000);
        });
        it('adds the repo to db if untracked', function (done) {
            models.Repo.findOne({
                where: {
                    repo: 22446688
                }
            }).then(function (repo) {
                assert.ok(repo);
                assert.equal(repo.repoName, 'test/one');
                assert.equal(repo.repo, 22446688);
                assert.equal(repo.total, 10);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the commit to the db', function (done) {
            models.Commit.findAll({
                where: {
                    repo: 22446688
                }
            }).then(function (commits) {
                assert.ok(commits);
                assert.equal(commits.length, 1);
                assert.equal(commits[0].commit, '68huq45ty49hgwgghythwtyghi43ty8');
                assert.equal(commits[0].commitMessage, 'creating new test repository');
                assert.equal(commits[0].total, 10);
                assert.equal(commits[0].repo, 22446688);
                assert.equal(commits[0].pullRequest, false);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the urls to the db', function (done) {
            models.Url.findAll({
                where: {
                    repo: 22446688
                }
            }).then(function (urls) {
                assert.ok(urls);
                assert.equal(urls.length, 1);
                assert.equal(urls[0].total, 10);
                assert.equal(urls[0].commit, '68huq45ty49hgwgghythwtyghi43ty8');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('Receive report from existing repo', function () {
        before(function (done) {
            reporter.start({
                id: 1234567,
                default_branch: 'release',
            }, {
                pull_request: 'false',
                repository: 'test/two',
                branch: 'release',
                commit: 'akjhgf09870agf970aa07g98af7g9ad',
                commit_message: 'creating new test repository',
                data: {
                    'website.com': {
                        count: {
                            total: 10,
                            error: 1,
                            warning: 3,
                            notice: 6
                        }
                    }
                }
            });
            // give reporter time to complete
            setTimeout(function () {
                done();
            }, 1000);
        });
        it('updates the repo in the db', function (done) {
            models.Repo.findOne({
                where: {
                    repo: 1234567
                }
            }).then(function (repo) {
                assert.ok(repo);
                assert.equal(repo.repoName, 'test/two');
                assert.equal(repo.repo, 1234567);
                assert.equal(repo.total, 10);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the commit to the db', function (done) {
            models.Commit.findAll({
                where: {
                    repo: 1234567
                }
            }).then(function (commits) {
                assert.ok(commits);
                assert.equal(commits.length, 4);
                assert.equal(commits[3].commit, 'akjhgf09870agf970aa07g98af7g9ad');
                assert.equal(commits[3].commitMessage, 'creating new test repository');
                assert.equal(commits[3].total, 10);
                assert.equal(commits[3].repo, 1234567);
                assert.equal(commits[3].pullRequest, false);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the urls to the db', function (done) {
            models.Url.findAll({
                where: {
                    repo: 1234567
                }
            }).then(function (urls) {
                assert.ok(urls);
                assert.equal(urls.length, 10);
                assert.equal(urls[9].total, 10);
                assert.equal(urls[9].commit, 'akjhgf09870agf970aa07g98af7g9ad');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('Receive report from pull request', function () {
        before(function (done) {
            reporter.start({
                id: 1234567,
                default_branch: 'release',
            }, {
                pull_request: 'true',
                repository: 'test/two',
                branch: 'release',
                commit: '9843qhrepe4389hqg9438ghqrq39gh4',
                commit_message: 'making a pull request',
                data: {
                    'website.com': {
                        count: {
                            total: 50,
                            error: 5,
                            warning: 10,
                            notice: 35
                        }
                    }
                }
            });
            // give reporter time to complete
            setTimeout(function () {
                done();
            }, 1000);
        });
        it('updates the repo in the db', function (done) {
            models.Repo.findOne({
                where: {
                    repo: 1234567
                }
            }).then(function (repo) {
                assert.ok(repo);
                assert.equal(repo.repoName, 'test/two');
                assert.equal(repo.repo, 1234567);
                // note that repo total is not updated
                assert.equal(repo.total, 10);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the commit to the db', function (done) {
            models.Commit.findAll({
                where: {
                    repo: 1234567
                }
            }).then(function (commits) {
                assert.ok(commits);
                assert.equal(commits.length, 5);
                assert.equal(commits[4].commit, '9843qhrepe4389hqg9438ghqrq39gh4');
                assert.equal(commits[4].commitMessage, 'making a pull request');
                assert.equal(commits[4].total, 50);
                assert.equal(commits[4].repo, 1234567);
                assert.equal(commits[4].pullRequest, true);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('adds the urls to the db', function (done) {
            models.Url.findAll({
                where: {
                    repo: 1234567
                }
            }).then(function (urls) {
                assert.ok(urls);
                assert.equal(urls.length, 11);
                assert.equal(urls[10].total, 50);
                assert.equal(urls[10].commit, '9843qhrepe4389hqg9438ghqrq39gh4');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
});
