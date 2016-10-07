'use strict';

const ParseAttributes  = require('../parse_attributes');
const models           = require('./index');

module.exports.createUrlRecord = function createUrlRecord(serviceData, count, url, next) {
  let attributes = new ParseAttributes(serviceData, count, url).forUrl();

  models.Url
    .create(attributes)
    .then(function() { next(); });
};

module.exports.updateCommitRecord = function updateCommitRecord(serviceData, count, done) {
  let parser = new ParseAttributes(serviceData, count);

  models.Commit
    .update(parser.forCommit(), {where: {commit: parser.commitIdentifier()}})
    .then(() => { done() });
};

module.exports.upsertRepoRecord = function upsertRepoRecord(serviceData, count, done) {
  let attributes = new ParseAttributes(serviceData, count).forRepo();

  models.Repo
    .upsert(attributes)
    .then(() => { done(); });
};
