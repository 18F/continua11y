# pa11y-ci

A continuous integration service using [pa11y](https://github.com/nature/pa11y), a web accessibility tool. Upon receiving a webhook from GitHub, it crawls specified sites and runs `pa11y` on all pages.

## Installation

    npm install
    node app.js

## Usage

Set up a [webhook](https://developer.github.com/webhooks/creating/) from GitHub to `example.com/check`. The app will check for a `pa11y.yaml` file in the root of the project to figure out which URLs to crawl. If it doesn't find that, it'll grab the repo's homepage, if specified.

Currently, the only thing to put in the `pa11y.yaml` file is a `urls` array with each of the sites to scrape. More configuration options will be added.
