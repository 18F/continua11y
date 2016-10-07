'use strict';

const async     = require('async');
const parse     = require('url-parse');
const request   = require('request');

const ReportSum = require('./report_sum');
const models    = require('./persistence');

module.exports = function storeStats(serviceData, done) {
  done = done || function () {};

  let sums = new ReportSum(serviceData.travis.data).calculate();

  let databaseSaves = Object.keys(serviceData.travis.data).map((url) => {
    return function saveThisUrl(next) {
      let parsedUrl = parse(url, true);
      let stats = serviceData.travis.data[url];
      module.exports.saveUrl(serviceData, stats, parsedUrl, next);
    }
  });

  databaseSaves.push((next) => {
    module.exports.saveCommit(serviceData, sums, next);
  });

  databaseSaves.push((next) => {
    if (serviceData.travis.pull_request === 'false') {
      module.exports.saveRepo(serviceData, sums, next);
    }
  });

  databaseSaves.push((next) => {
    module.exports.tellGitHub(serviceData, sums, next);
  });

  async.parallel(databaseSaves, done);
}

module.exports.saveUrl = function saveUrl(serviceData, data, url, next) {
  models.Url
    .create({
      path:     url.pathname,
      commit:   serviceData.travis.commit,
      repo:     serviceData.github.id,
      total:    data.count.total,
      error:    data.count.error,
      warning:  data.count.warning,
      notice:   data.count.notice
    })
    .then(function() { next(); });
};

module.exports.saveCommit = function saveCommit(serviceData, overall, done) {
  models.Commit
    .update({
        total: overall.total,
        error: overall.error,
        warning: overall.warning,
        notice: overall.notice,
        latest: true
      },{
        where: {
          commit: serviceData.travis.commit
        }
      })
    .then(() => { done() });
};

module.exports.saveRepo = function saveRepo(serviceData, overall, done) {
  models.Repo.upsert({
    repo: serviceData.github.id,
    repoName: serviceData.travis.repository,
    defaultBranch: serviceData.github.default_branch,
    total: overall.total,
    error: overall.error,
    warning: overall.warning,
    notice: overall.notice
  })
  .then(() => { done(); });
};

module.exports.tellGitHub = function tellGitHub(serviceData, overall, done) {
  var context = '';
  var message = '';
  var state = '';
  if (serviceData.travis.pull_request === 'false'){
    context = "continuous-integration/continua11y/push";
  } else {
    context = "continuous-integration/continua11y/pull";
  }
  var firstCommit = serviceData.travis.commit.slice(0,6);
  // var lastCommit = serviceData.travis.commit.slice(15,21);
  models.Commit.findOne({
    where: {
      repo: serviceData.github.id,
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
      uri: 'https://api.github.com/repos/'+serviceData.travis.repository+'/statuses/'+serviceData.travis.commit,
      headers: {
        'User-Agent': 'continua11y',
        'Authorization': 'token '+process.env.GITHUB_TOKEN
      },
      json: true,
      body: {
        'state': state,
        'target_url': 'https://continua11y.18f.gov/'+serviceData.travis.repository+'/'+serviceData.travis.commit,
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



