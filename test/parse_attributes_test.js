'use strict';

const assert          = require('assert');
const parseUrl        = require('url-parse');
const ParseAttributes = require('../models/parse_attributes');

describe('ParseAttributes', function() {
  let data, counts, url, parser, attributes;

  beforeEach(() => {
    data = {
      github: { id: 1234567, default_branch: 'release' },
      travis: {
        pull_request: 'false',
        repository: 'test/two',
        branch: 'release',
        commit: '9843qhrepe4389hqg9438ghqrq39gh4',
        commit_message: 'making a pull request',
        data: {
          'website.com/bar': {
            count: { total: 50, error: 5, warning: 10, notice: 35 }
          },
          '18f.gsa.gov/foo': {
            conut: { total: 90, error: 10, warning: 5, notice: 40 }
          }
        }
      }
    };

    counts = { total: 140, error: 15, warning: 15, notice: 75 };

    url = parseUrl('website.com/bar');
  });

  describe('#parseUrl', () => {
    beforeEach(() => {
      counts = { total: 50, error: 5, warning: 10, notice: 35 };
      parser = new ParseAttributes(data, counts, url);
    });

    it('returns url data', function() {
      attributes = parser.forUrl();
      assert.deepEqual(attributes, {
        path: '/bar',
        commit: '9843qhrepe4389hqg9438ghqrq39gh4',
        repo: 1234567,
        total: 50,
        error: 5,
        warning: 10,
        notice: 35
      });
    });
  });

  describe('#forCommit', () => {
    beforeEach(() => {
      parser = new ParseAttributes(data, counts);
    });

    it('returns amended counts', () => {
      attributes = parser.forCommit();
      assert.deepEqual(attributes, {
        total: 140, error: 15, warning: 15, notice: 75,
        latest: true
      });
    });
  });

  describe('#forRepo', () => {
    beforeEach(() => {
      parser = new ParseAttributes(data, counts);
    });

    it('returns the right attributes', () => {
      attributes = parser.forRepo();
      assert.deepEqual(attributes, {
        total: 140, error: 15, warning: 15, notice: 75,
        repo:           1234567,
        repoName:       'test/two',
        defaultBranch:  'release'
      });
    });
  });
});
