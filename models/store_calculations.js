'use strict';

const async     = require('async');
const parse     = require('url-parse');
const request   = require('request');

const ReportSum = require('./report_sum');
const models    = require('./persistence');

module.exports = function storeStats(githubData, travisData, done) {
  console.log('githubData', githubData);
  console.log('travisData', travisData);

  done = done || function () {};

  let sums = new ReportSum(travisData.data).calculate();

  let databaseSaves = Object.keys(travisData.data).map((url) => {

    return function saveThisUrl(next) {
      let parsedUrl = parse(url, true);
      let data = travisData.data[url];
      module.exports.saveUrl(githubData, travisData, data, parsedUrl, next);
    }
  });

  databaseSaves.push((next) => {
    module.exports.saveCommit(githubData, travisData, sums, next);
  });

  databaseSaves.push((next) => {
    if (travisData.pull_request === 'false') {
      module.exports.saveRepo(githubData, travisData, sums, next);
    }
  });

  databaseSaves.push((next) => {
    module.exports.tellGitHub(githubData, travisData, sums, next);
  });

  async.parallel(databaseSaves, done);
}

module.exports.saveUrl = function saveUrl(githubData, travisData, data, url, next) {
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
};

module.exports.saveCommit = function saveCommit(githubData, travisData, overall, done) {
  models.Commit
    .update({
        total: overall.total,
        error: overall.error,
        warning: overall.warning,
        notice: overall.notice,
        latest: true
      },{
        where: {
          commit: travisData.commit
        }
      })
    .then(() => { done() });
};

module.exports.saveRepo = function saveRepo(githubData, travisData, overall, done) {
  models.Repo.upsert({
    repo: githubData.id,
    repoName: travisData.repository,
    defaultBranch: githubData.default_branch,
    total: overall.total,
    error: overall.error,
    warning: overall.warning,
    notice: overall.notice
  })
  .then(() => { done(); });
};

module.exports.tellGitHub = function tellGitHub(githubData, travisData, overall, done) {
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
        done(err);
      } else {
        done();
      }
    });
  });
};



