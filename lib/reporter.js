'use strict';

var async = require('async');
var parse = require('url-parse');
var request = require('request');
var models = require('../models');
var ReportSum = require('./report_sum');
var store_calculations = require('./store_calculations');

var Reporter = {

  start: function (githubData, travisData, done) {
    done = done || function() {};
    // temporary fix for numbered pull requests
    // TODO: handle this in continua11y script instead
    var pullRequest;
    if (travisData.pull_request === 'false') {
      pullRequest = false;
    } else {
      pullRequest = true;
    }
    // initialize the commit in the database
    models.Repo.upsert({
      repo: githubData.id,
      repoName: travisData.repository,
      defaultBranch: githubData.default_branch
    }).then(function () {
      models.Commit.upsert({
        branch: travisData.branch,
        pullRequest: pullRequest,
        commit: travisData.commit,
        shortCommit: travisData.commit.slice(0,6),
        commitMessage: travisData.commit_message,
        repo: githubData.id,
        repoName: travisData.repository
      }).then(function () {
        models.Commit.update({
          latest: false
        },{
          where: {
            repo: githubData.id,
            branch: travisData.branch,
          }
        }).then(function () {
          store_calculations(githubData, travisData);
        });
      });
    });
  }
};

module.exports = Reporter;
