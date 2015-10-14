#! /usr/bin/env bash

if [[ -z "$TRAVIS" ]];
then
    # local development options; run this script in an unrelated project 
    TRAVIS_PULL_REQUEST=false
    TRAVIS_BRANCH="test"
    TRAVIS_COMMIT="$(echo $RANDOM | md5)"
    # TRAVIS_REPO_SLUG must be a valid github repo
    TRAVIS_REPO_SLUG="stvnrlly/continua11y"
    # change to whichever script you need to start the web server (make sure to detach so that the script continues)
    RUN_SCRIPT="forever stop app.js && forever start --spinSleepTime 1000 --minUptime 3000 app.js"
    # shut down the web server so that you can run the script again without conflicts
    KILL_SCRIPT="forever stop app.js"
    # the port where the server will run
    PORT=3000
    # if your site generates a sitemap, set this to true to use it instead of spidering
    USE_SITEMAP=false
    # the location for the locally-running version of continua11y
    # for local development, set the protocol for cURL to http, as well
    CONTINUA11Y="localhost:3000"
else
    # we're on travis, so install the tools needed
    npm install -g pa11y
    npm install -g pa11y-reporter-1.0-json
    npm install -g html-inline
    # jq should already be installed on travis
fi

# set the default standard, if necessary
if [[ -z "$STANDARD" ]];
then
    STANDARD="WCAG2AAA"
fi

# get the most recent git commit message
TRAVIS_COMMIT_MSG="$(git log --format=%B --no-merges -n 1)"
TRAVIS_COMMIT_MSG="$(echo $TRAVIS_COMMIT_MSG | sed s/\"/\'/g)"

# set up the JSON file for full results to send
echo '{"repository":"'$TRAVIS_REPO_SLUG'", "branch": "'$TRAVIS_BRANCH'","commit":"'$TRAVIS_COMMIT'","commit_message":"'$TRAVIS_COMMIT_MSG'","pull_request":"'$TRAVIS_PULL_REQUEST'","commit_range":"'TRAVIS_COMMIT_RANGE'","standard":"'$STANDARD'","data":{}}' | jq '.' > results.json

function runtest () {
    URL="$(realpath --relative-base=. $file)"
    if [[ $(file -b --mime-type $file) == "text/html" ]]
    then
        echo "analyzing ${URL}"
        pa11y -r 1.0-json -s $STANDARD $URL > pa11y.json
        
        # single apostrophes mess up the json command below, so remove them
        sed -n "s/'//g" pa11y.json

        # compress external resources into the html and convert to json
        html-inline -i $file -o site.html
        himalaya site.html site.json

        # store JSON as a variable
        REPORT="$(cat pa11y.json)"

        # add this report into results.json
        # json -I -f ../results.json -e 'this.data["'$URL'"]='"$(cat site.json | jq --argjson pa11y "$(pa11y -r 1.0-json -s $STANDARD $URL)" '{data: $pa11y} + {html: .}')"''
        jq -n --slurpfile a pa11y.json --slurpfile b site.json --slurpfile c ../results.json '$c | .[] * {data: {"'"${URL}"'": ({pa11y: $a | .[]} + {html: $b | .[]})}}' > ../temp.json
        cp ../temp.json ../results.json
        rm pa11y.json site.html site.json
    else
        echo "${URL} is not an html document, skipping"
    fi
}

# start the server
eval $RUN_SCRIPT
sleep 3 # sometimes things take time

# make local copy of the site
mkdir temp
cd temp
if ! $USE_SITEMAP;
then
    echo "using wget to mirror site"
    wget --quiet --mirror --convert-links http://localhost:${PORT}
else
    echo "using sitemap to mirror relevant portion of site"
    wget --quiet http://localhost:${PORT}/sitemap.xml --no-cache -O - | egrep -o "http://localhost:${PORT}" > sites.txt
    cat sites.txt | while read a; do wget --convert-links --page-requisites $a; done
    rm sites.txt
fi

# close down the server, since everything needed is downloaded locally
if ! $TRAVIS;
then
    eval $KILL_SCRIPT
fi

# iterate through URLs and run runtest on each
for file in $(find .);
do
    runtest $file
done
cd ..

# send the results on to continua11y
echo "sending results to continua11y"
# cat results.json > incoming.json
curl -X POST http://${CONTINUA11Y}/incoming -H "Content-Type: application/json" -d @results.json

# clean up
echo "cleaning up"
rm -rf temp results.json