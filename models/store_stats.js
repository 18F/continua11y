'use strict';

const async     = require('async');
const parse     = require('url-parse');
const request   = require('request');

const ReportSum        = require('./report_sum');
const ParseAttributes  = require('./parse_attributes');
const models           = require('./persistence');

module.exports = function storeStats(serviceData, done) {
  done = done || function () {};

  let sums = new ReportSum(serviceData.travis.data).calculate();

  let databaseSaves = Object.keys(serviceData.travis.data).map((url) => {
    return function saveThisUrl(next) {
      let parsedUrl = parse(url, true);
      let count     = serviceData.travis.data[url].count;
      module.exports.saveUrl(serviceData, count, parsedUrl, next);
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

module.exports.saveUrl = function saveUrl(serviceData, count, url, next) {
  let attributes = new ParseAttributes(serviceData, count, url).forUrl();

  models.Url
    .create(attributes)
    .then(function() { next(); });
};

module.exports.saveCommit = function saveCommit(serviceData, count, done) {
  let parser = new ParseAttributes(serviceData, count);

  models.Commit
    .update(parser.forCommit(), {where: {commit: parser.commitIdentifier()}})
    .then(() => { done() });
};

module.exports.saveRepo = function saveRepo(serviceData, count, done) {
  let attributes = new ParseAttributes(serviceData, count).forRepo();

  models.Repo
    .upsert(attributes)
    .then(() => { done(); });
};

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



