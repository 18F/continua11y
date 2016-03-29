#! /usr/bin/env bash

npm install -g pa11y-crawl
npm start >/dev/null 2>&1 &
pa11y-crawl --ci http://localhost:300
