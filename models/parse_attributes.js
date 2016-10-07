'use strict';

class ParseAttributes {
  constructor(serviceData, counts, url) {
    this.data = serviceData;
    this.url = url;
    this.counts = counts;
  }

  forUrl() {
    return Object.assign({}, this.counts, {
      path:     this.url.pathname,
      commit:   this.data.travis.commit,
      repo:     this.data.github.id
    });
  }

  forCommit() {
    return Object.assign({}, this.counts, {
      latest: true
    });
  }

  commitIdentifier() {
    return this.data.travis.commit;
  }

  forRepo() {
    return Object.assign({}, this.counts, {
      repo:           this.data.github.id,
      repoName:       this.data.travis.repository,
      defaultBranch:  this.data.github.default_branch,
    });
  }
}

module.exports = ParseAttributes;
