#! /usr/bin/env bash

npm install -g pa11y-crawl
nohup npm start >/dev/null 2>&1 &
cat nohup.out
pa11y-crawl --ci http://localhost:3000
