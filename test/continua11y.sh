npm install -g pa11y
npm install -g pa11y-reporter-1.0-json
npm install -g json

# set up the JSON file for full results to send
echo '{"repository":"'$TRAVIS_REPO_SLUG'", "branch": "'$TRAVIS_BRANCH'","commit":"'$TRAVIS_COMMIT'","data":{}}' | json > results.json

function runtest () {
    echo $a
    pa11y -r 1.0-json $a > pa11y.json
    
    # single apostrophes ruin JSON parsing, so remove them
    sed "s/'//g" pa11y.json
    
    # store JSON as a variable
    REPORT="$(cat pa11y.json)"

    # add this pa11y report into results.json
    json -I -f results.json -e 'this.data["'$a'"]='"${REPORT}"''
}

# start Jekyll server
eval $RUN_SCRIPT

# grab sitemap and store URLs
if ! $USE_SITEMAP;
then
    echo "using wget spider to get URLs"
    wget -m http://localhost:${PORT} 2>&1 | grep '^--' | awk '{ print $3 }' | grep -v '\.\(css\|js\|png\|gif\|jpg\|JPG\|svg\|json\|xml\|txt\|sh\|eot\|eot?\|woff\|woff2\|ttf\)$' > sites.txt
else
    echo "using sitemap to get URLs"
    wget -q http://localhost:${PORT}/sitemap.xml --no-cache -O - | egrep -o "http://codefordc.org[^<]+" > sites.txt
fi

# iterate through URLs and run runtest on each
cat sites.txt | while read a; do runtest $a; done

# close down the server
eval $KILL_SCRIPT

# send the results on to continua11y
curl -X POST https://${CONTINUA11Y}/incoming -H "Content-Type: application/json" -d @results.json
cat results.json

# clean up
rm results.json pa11y.json sites.txt