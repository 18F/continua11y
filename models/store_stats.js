'use strict';

const async     = require('async');
const parse     = require('url-parse');
const request   = require('request');

const dbInterface = require('./persistence/interface');
const ReportSum        = require('./report_sum');
const models           = require('./persistence');

module.exports = function storeStats(serviceData, done) {
  done = done || function () {};

  let sums = new ReportSum(serviceData.travis.data).calculate();

  let databaseSaves = Object.keys(serviceData.travis.data).map((url) => {
    return function saveThisUrl(next) {
      let parsedUrl = parse(url, true);
      let count     = serviceData.travis.data[url].count;
      dbInterface.createUrlRecord(serviceData, count, parsedUrl, next);
    }
  });

  databaseSaves.push((next) => {
    dbInterface.updateCommitRecord(serviceData, sums, next);
  });

  databaseSaves.push((next) => {
    if (serviceData.travis.pull_request === 'false') {
      dbInterface.upsertRepoRecord(serviceData, sums, next);
    }
  });

  databaseSaves.push((next) => {
    module.exports.tellGitHub(serviceData, sums, next);
  });

  async.parallel(databaseSaves, done);
}

module.exports.tellGitHub = function tellGitHub(serviceData, count, done) {
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
    var change = commit.error - count.error;
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



