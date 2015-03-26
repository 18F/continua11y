# continua11y

A continuous integration service using [pa11y](https://github.com/nature/pa11y), a web accessibility tool. Upon receiving a webhook from GitHub, it crawls specified websites and runs `pa11y` on all pages. It then stores the results of scans in a Postgres database and produces a badge with the result that can be used as an image on any website.

## Installation

    npm install
    node app.js # or foreman start

## Usage

Set up a [webhook](https://developer.github.com/webhooks/creating/) from GitHub to `example.com/check`. The app will check for a `pa11y.yaml` file in the root of the project to figure out which URLs to crawl. If it doesn't find that, it'll grab the repo's homepage, if specified.

The only required element of the `pa11y.yaml` file is a `urls` array with each of the sites to scrape. You can also change the default values for the crawler and pa11y:

    urls:
    - example.com
    - otherexample.org

    crawler:
      interval: 5000
      maxConcurrency: 3
      depth: 2

    pa11y:
      standard: "WCAG2A"
      timeout: 60000
      width: 1280
      height: 800
