# continua11y

[![Accessibility](https://continua11y.18f.gov/18F/continua11y.svg?branch=release)](https://continua11y.18f.gov/18F/continua11y)
[![Build Status](https://travis-ci.org/18F/continua11y.svg?branch=release)](https://travis-ci.org/18F/continua11y)
[![Code Climate](https://codeclimate.com/github/18F/continua11y/badges/gpa.svg)](https://codeclimate.com/github/18F/continua11y)
[![Test Coverage](https://codeclimate.com/github/18F/continua11y/badges/coverage.svg)](https://codeclimate.com/github/18F/continua11y/coverage)

A continuous integration service using [pa11y](https://github.com/nature/pa11y), a web accessibility tool. It provides a script for generating accessibility statistics for all pages on a site, which is designed to run within a testing environment like Travis CI (though it can run anywhere). It then stores the results of scans in a Postgres database and produces a badge with the result that can be used as an image on any website.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for additional information.

### Branch flow

- Main branch: `release`
- Development branch: `develop`

## Usage

Run `continua11y.sh` as part of your [Travis CI](https://travis-ci.org/) suite of tests.

1.  Copy [the script](https://continua11y.18f.gov/continua11y.sh) to your repo and add `after_script: ./path/to/continua11y.sh` to your `.travis.yml` file.

2.  Set a few [environmental variables](http://docs.travis-ci.com/user/environment-variables/#Global-Variables):

    - RUN_SCRIPT: The command for serving your site. Necessary if the server shuts down after the tests run in `script`. Make sure that the server detaches so that the script continues to run.
    - KILL_SCRIPT: The command to stop serving. This is optional, and more useful for local development.
    - USE_SITEMAP: If your site has a `sitemap.xml` file, set to `true` to use that instead of the spider.
    - PORT: The port on `localhost` where your served site is found.
    - STANDARD: The accessibility standard used for testing. Defaults to `WCAG2AAA`, but can also be `Section508`, `WCAG2A`, or `WCAG2AA`.
    - CONTINUA11Y: The location where `continua11y` is running. The main site is `continua11y.18f.gov`, but you can change this for testing purposes or whatever.

## Installation

continua11y requires the `cairo` package to run the `canvas` module. See instructions at [https://github.com/Automattic/node-canvas/wiki](https://github.com/Automattic/node-canvas/wiki) for details of how to install on your system.

    npm install
    node app.js # or foreman start

You may run into trouble installing the `gh-badges` package. Check [that project](https://github.com/badges/shields/blob/master/INSTALL.md#requirements) for more in-depth information.

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
