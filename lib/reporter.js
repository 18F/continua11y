'use strict';

var async = require('async');
var parse = require('url-parse');
var request = require('request');
var models = require('../models');
var ReportSum = require('./report_sum');

var Reporter = {

  start: function (githubData, travisData) {
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
          Reporter.calculate(githubData, travisData);
        });
      });
    });
  },

  calculate: function (githubData, travisData, done) {
    let sums = new ReportSum(travisData.data).calculate();

    let urlSavers = Object.keys(travisData.data).map((url) => {
      return function saveUrl(next) {
        let parsedUrl = parse(url, true);
        let data = travisData.data[url];
        Reporter.saveURL(githubData, travisData, data, parsedUrl, next);
      }
    });

    function onSave(err){
      if (err) {
        console.log('Error in iterating over URLs');
      }
      Reporter.saveCommit(githubData, travisData, sums);
      if (travisData.pull_request === 'false') {
        // only update the main repo stats if it's not a pull request
        // (since it only becomes "official" on the branch when merged)
        Reporter.saveRepo(githubData, travisData, sums);
      }
      Reporter.tellGitHub(githubData, travisData, sums);
    }

    async.parallel(urlSavers, onSave);
  },

  saveURL: function (githubData, travisData, data, url, next) {
    // record stats for each URL in the commit
    models.Url
      .create({
        path: url.pathname,
        commit: travisData.commit,
        repo: githubData.id,
        total: data.count.total,
        error: data.count.error,
        warning: data.count.warning,
        notice: data.count.notice
      })
      .then(function() { next(); });
  },

  saveCommit: function (githubData, travisData, overall) {
    // records overall stats for this commit
    models.Commit.update({
      total: overall.total,
      error: overall.error,
      warning: overall.warning,
      notice: overall.notice,
      latest: true
    },{
      where: {
        commit: travisData.commit
      }
    });
  },

  saveRepo: function (githubData, travisData, overall) {
    // check if repo is tracked
    models.Repo.upsert({
      repo: githubData.id,
      repoName: travisData.repository,
      defaultBranch: githubData.default_branch,
      total: overall.total,
      error: overall.error,
      warning: overall.warning,
      notice: overall.notice
    });
  },

  tellGitHub: function (githubData, travisData, overall) {
    var context = '';
    var message = '';
    var state = '';
    if (travisData.pull_request === 'false'){
      context = "continuous-integration/continua11y/push";
    } else {
      context = "continuous-integration/continua11y/pull";
    }
    var firstCommit = travisData.commit.slice(0,6);
    // var lastCommit = travisData.commit.slice(15,21);
    models.Commit.findOne({
      where: {
        repo: githubData.id,
        shortCommit: firstCommit
      }
    }).then(function (commit) {
      var change = commit.error - overall.error;
      if (change >= 0){
        message = change+' fewer accessibility errors';
        state = 'success';
      } else {
        change = Math.abs(change);
        message = change+' more accessibility errors';
        state = 'failure';
      }
      request.post({
        uri: 'https://api.github.com/repos/'+travisData.repository+'/statuses/'+travisData.commit,
        headers: {
          'User-Agent': 'continua11y',
          'Authorization': 'token '+process.env.GITHUB_TOKEN
        },
        json: true,
        body: {
          'state': state,
          'target_url': 'https://continua11y.18f.gov/'+travisData.repository+'/'+travisData.commit,
          'description': message,
          'context': context
        }
      }, function (err, res, body){
        if (err){
          console.log(err);
        } else {
          // console.log("success: got "+res.statusCode);
        }
      });
    });
  }
};

module.exports = Reporter;
