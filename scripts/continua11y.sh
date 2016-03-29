#! /usr/bin/env bash

red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
blue=`tput setaf 4`
reset=`tput sgr0`

type jq >/dev/null 2>&1 || {
  echo "${red}x${reset} pa11y-crawl relies on jq to edit JSON files"
  echo "Please install jq: https://stedolan.github.io/jq/download/"
}

usage(){
  echo "Usage: pa11y-crawl [options] <URL>"
  echo ""
  echo "Options:"
  echo "  -h, --help            show this help message and exit"
  echo "  -v, --version         show program version and exit"
  echo "  -o, --output          set output file for report (default: ./results.json)"
  echo "  -q, --quiet           quiet mode"
  echo "  -s, --standard        set accessibility standard "
  echo "                          (Section508, WCAG2A, WCAG2AA (default), WCAG2AAA)"
  echo "  -i, --ci              continuous integration mode; incorporates repo metadata"
  echo "                          and sends a report to continua11y"
  echo "  -c, --continua11y     set continua11y URL (default: continua11y.18f.gov)"
  echo "  -m, --sitemap         use the site's sitemap.xml to find pages, rather than wget spider"
  echo "  -t, --temp-dir        set location for storing temporary files (default: ./temp)"
  echo "  -d, --directory       use an existing local directory instead of wget"
}

version(){
  VERSION=$(cat package.json | jq '.version' | tr -d '"')
  echo $VERSION
}

# set default values
CONTINUA11Y_URL="https://continua11y.18f.gov/incoming"
OUTPUT=$(pwd)/results.json
TEMP_DIR=$(pwd)/pa11y-crawl
STANDARD="WCAG2AA"

# Convert known long options to short options
for arg in "$@"; do
  shift
  case "$arg" in
    --help)
      set -- "$@" "-h"
      ;;
    --version)
      set -- "$@" "-v"
      ;;
    --quiet)
      set -- "$@" "-q"
      ;;
    --output)
      set -- "$@" "-o"
      ;;
    --standard)
      set -- "$@" "-s"
      ;;
    --ci)
      set -- "$@" "-i"
      ;;
    --continua11y)
      set -- "$@" "-c"
      ;;
    --sitemap)
      set -- "$@" "-m"
      ;;
    --temporary)
      set -- "$@" "-t"
      ;;
    --directory)
      set -- "$@" "-d"
      ;;
    *)
      set -- "$@" "$arg"
      ;;
  esac
done

# Reset to beginning of arguments
OPTIND=1

# Process option flags
while getopts "hvmqo:s:it:c:d:" opt; do
  case $opt in
    h )
      usage
      exit 0
      ;;
    v )
      version
      exit 0
      ;;
    q )
      exec 1>/dev/null 2>/dev/null
      ;;
    o )
      OUTPUT="$OPTARG"
      ;;
    s )
      STANDARD="$OPTARG"
      ;;
    i )
      CI=true
      ;;
    c )
      CONTINUA11Y_URL="$OPTARG"
      ;;
    m )
      USE_SITEMAP=true
      ;;
    t )
      TEMP_DIR="$OPTARG"
      ;;
    d )
      TARGET_DIR="$OPTARG"
      ;;
    * )
      usage
      exit 1
      ;;
  esac
done
shift $((OPTIND -1))

TARGET=$1

# clean out temporary directory
mkdir -p $TEMP_DIR
rm -rf $TEMP_DIR/*

# get the most recent git commit message
COMMIT_MSG="$(git log --format=%B --no-merges -n 1 | sed s/\"/\'/g)"

# prepare data for JSON
if [[ "$CI" = true ]]; then
  if [[ "$TRAVIS" = true ]]; then
    echo "${green} >>> ${reset} detected travis-ci; grabbing information"
    REPO_SLUG=$TRAVIS_REPO_SLUG
    BRANCH=$TRAVIS_BRANCH
    COMMIT=$TRAVIS_COMMIT
    PULL_REQUEST=$TRAVIS_PULL_REQUEST
    COMMIT_RANGE=$TRAVIS_COMMIT_RANGE
  else
    echo "${green} >>> ${reset} running on unknown ci; building information"
    REPO_SLUG=$(git remote show $(git remote show) | grep Push | cut -d' ' -f6 | sed -e 's/\.git//' -e 's/git@.*\..*://' -e 's/https:\/\/.*\.[[:alpha:]]*\///')
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    COMMIT=$(git log --format=%H --no-merges -n 1)
    PULL_REQUEST=false # unsure how to check this in git
    COMMIT_RANGE="abcd123..jklm789"
  fi
  # set up the JSON file for full results to send
  echo '{"repository":"'$REPO_SLUG'", "branch": "'$BRANCH'","commit":"'$COMMIT'","commit_message":"'$COMMIT_MSG'","pull_request":"'$PULL_REQUEST'","commit_range":"'$COMMIT_RANGE'","standard":"'$STANDARD'","data":{}}' | jq '.' > $OUTPUT
else
  # for non-ci environment, a simpler JSON file will do just fine
  echo '{"data":{}}' | jq '.' > $OUTPUT
fi


if [[ $TARGET_DIR ]]; then
  # move to the target directory with the site files
  cd $TARGET_DIR
else
  cd $TEMP_DIR
  # make local copy of the site using wget
  if [[ "$USE_SITEMAP" = true ]]; then
      echo "${green} >>> ${reset} using sitemap to mirror relevant portion of site"
      wget --quiet $TARGET/sitemap.xml --no-cache -O - | egrep -o "${TARGET}" > sites.txt
      cat sites.txt | while read a; do wget --convert-links --page-requisites $a; done
      rm sites.txt
  else
      echo "${green} >>> ${reset} using wget to mirror site"
      wget --quiet --mirror --convert-links $TARGET
  fi
fi

echo "${green} <<< ${reset} found $(find . -type f | wc -l | sed 's/^ *//;s/ *$//') files in $(find . -mindepth 1 -type d | wc -l | sed 's/^ *//;s/ *$//') directories"

function relpath() {
    python -c 'import sys, os.path; print os.path.relpath(sys.argv[1], sys.argv[2])' "$1" "${2:-$PWD}";
}

# iterate through URLs and run runtest on each
function runtest () {
    URL="$(relpath $file .)"
    FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
    if [[ $(file -b --mime-type $file) == "text/html" ]]
    then
        echo "${blue} |--------------------------------------- ${reset}"
        echo "${blue} |-> ${reset} analyzing ${URL}"
        if [[ $TARGET_DIR ]]; then
          pa11y -r 1.0-json -s $STANDARD file:///$FILE > $TEMP_DIR/pa11y.json
        else
          pa11y -r 1.0-json -s $STANDARD $URL > $TEMP_DIR/pa11y.json
        fi

        # add this report into results.json
        # jq -n --slurpfile a $TEMP_DIR/pa11y.json --slurpfile b $OUTPUT '$b | .[] * {data: {"'"${URL}"'": ($a | .[]) }}' > $TEMP_DIR/temp.json
        jq -s '.[0] * {data: {"'"${URL}"'":.[1]}}' $OUTPUT $TEMP_DIR/pa11y.json > $TEMP_DIR/temp.json
        cp $TEMP_DIR/temp.json $OUTPUT
        ERROR="$(cat $TEMP_DIR/pa11y.json | jq .count.error)"
        WARNING="$(cat $TEMP_DIR/pa11y.json | jq .count.warning)"
        NOTICE="$(cat $TEMP_DIR/pa11y.json | jq .count.notice)"
        echo "${green} <<< ${reset} pa11y says: ${red}error:${reset} ${ERROR} | ${yellow}warning:${reset} ${WARNING} | ${green}notice:${reset} ${NOTICE}"
        rm $TEMP_DIR/pa11y.json
    else
        echo "${blue} ||  ${reset} ${URL} is not an html document, skipping"
    fi
}

echo "${green} >>> ${reset} beginning the analysis"
echo "${blue} |--------------------------------------- ${reset}"
for file in $(find .);
do
    runtest $file
done
cd ..

if [[ $CI ]]; then
    echo "${green} >>> ${reset} sending data to continua11y"
    curl -s -X POST $CONTINUA11Y_URL -H "Content-Type: application/json" -d @$OUTPUT
fi

# clean up
echo "${green} >>> ${reset} cleaning up"
rm -rf $TEMP_DIR
