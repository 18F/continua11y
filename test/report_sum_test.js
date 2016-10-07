'use strict';

const assert    = require('assert');
const ReportSum = require('../lib/report_sum');

describe('ReportSum', () => {
  let data;

  describe('when there is only one key in the data', () => {
    beforeEach(() => {
      data = {
        'website.com': {
          count: { total: 50, error: 5, warning: 10, notice: 35 }
        }
      }
    });

    it('returns the original count', () => {
      assert.deepEqual(new ReportSum(data).calculate(), data['website.com'].count);
    });
  });

  describe('when there are multiple keys', () => {
     beforeEach(() => {
      data = {
        'website.com': {
          count: { total: 50, error: 5, warning: 10, notice: 35 }
        },
        '18f.gsa.gov': {
          count: { total: 51, error: 0, warning: 33, notice: 18 }
        }
      }
    });

    it('sums the counts', () => {
      let summed = { total: 101, error: 5, warning: 43, notice: 53 }
      assert.deepEqual(new ReportSum(data).calculate(), summed);
    });
  });
});
