# continua11y

[https://travis-ci.org/stvnrlly/continua11y.svg?branch=master](https://travis-ci.org/stvnrlly/continua11y)

A continuous integration service using [pa11y](https://github.com/nature/pa11y), a web accessibility tool. It provides a script for generating accessibility statistics for all pages on a site, which is designed to run within a testing environment like Travis CI (though it can run anywhere). It then stores the results of scans in a Postgres database and produces a badge with the result that can be used as an image on any website.

## Usage

Run `continua11y.sh` as part of your [Travis CI](https://travis-ci.org/) suite of tests. 

1.  Copy [the script](https://continua11y.herokuapp.com/continua11y.sh) to your repo and add `after_script: ./path/to/continua11y.sh` to your `.travis.yml` file.

2.  Set a few [environmental variables](http://docs.travis-ci.com/user/environment-variables/#Global-Variables):

    - RUN_SCRIPT: The command for serving your site. Make sure that the server detaches so that the script continues to run
    - KILL_SCRIPT: The command to stop serving. This might be optional.
    - USE_SITEMAP: If your site has a `sitemap.xml` file, set to `true` to use that instead of the spider.
    - PORT: The port on `localhost` where your served site is found.
    - CONTINUA11Y: The location where `continua11y` is running. The main site is `continua11y.herokuapp.com`, but you can change this for testing purposes or whatever.

## Installation

    npm install
    node app.js # or foreman start

You may run into trouble installing `gh-badges`. Check [that project](https://github.com/badges/shields/blob/master/INSTALL.md#requirements) for more in-depth information.
