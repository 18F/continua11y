'use strict';

var assert    = require('assert');
var seed      = require('../scripts/lib/seeder');
var models    = require('../models');

describe('Seeding', function() {
    beforeEach(function (done) {
        models.sequelize.sync({
            force: true
        }).then(function () {
            seed();
            setTimeout(function () {
                done();
            }, 1500);
        });
    });

    it('seeding created 2 repos in test database', function (done) {
        models.Repo.findAll().then(function (repos) {
            assert.equal(repos.length, 2);
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    it('seeding created 4 commits in test database', function (done) {
        models.Commit.findAll().then(function (commits) {
            assert.equal(commits.length, 4);
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    it('created 12 urls in test database', function (done) {
        models.Url.findAll().then(function (urls) {
            assert.equal(urls.length, 12);
            done();
        }).catch(function (err) {
            done(err);
        });
    });
});
