# continua11y

A continuous integration service using [pa11y](https://github.com/nature/pa11y), a web accessibility tool. Upon receiving a webhook from GitHub, it crawls specified websites and runs `pa11y` on all pages. It then stores the results of scans in a Postgres database and produces a badge with the result that can be used as an image on any website.

## Usage

Run `continua11y.sh` as part of your [Travis CI](https://travis-ci.org/) suite of tests. 

1.  Copy the script to your repo and add `after_script: ./path/to/continua11y.sh` to your `.travis.yml` file.

2.  Set a few [environmental variables](http://docs.travis-ci.com/user/environment-variables/#Global-Variables):

    - RUN_SCRIPT: The command for serving your site. Make sure that the server detaches so that the script continues to run
    - KILL_SCRIPT: The command to stop serving. This might be optional.
    - USE_SITEMAP: If your site has a `sitemap.xml` file, set to `true` to use that instead of the spider.
    - PORT: The port on `localhost` where your served site is found.

## Installation

    npm install
    node app.js # or foreman start

You may run into trouble installing `gh-badges`. Check [that project](https://github.com/badges/shields/blob/master/INSTALL.md#requirements) for more in-depth information.