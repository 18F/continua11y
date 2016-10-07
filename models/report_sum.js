'use strict';

class ReportSum {
  constructor(data) {
    this.data = data;
    this.total = 0;
    this.error = 0;
    this.warning = 0;
    this.notice = 0;
  }

  calculate() {
    Object.keys(this.data).forEach((reportKey) => {
      let report = this.data[reportKey];

      this.total    += report.count.total;
      this.error    += report.count.error;
      this.warning  += report.count.warning;
      this.notice   += report.count.notice;
    });

    return this.summary();
  }

  summary() {
    return {
      total: this.total,
      error: this.error,
      warning: this.warning,
      notice: this.notice
    }
  }
}

module.exports = ReportSum;
