#!/bin/sh

set -e

export LANG=en_US.UTF-8
export NODE_PATH=/usr/local/lib/node_modules

DATE=`date +%Y-%m-%d_%H:%M:%S`

cd $(dirname "$0")/..
mkdir -p log
mkdir -p tmp

# redirect output to log and save pid
{
./bin/keeprunning.sh /usr/local/bin/node ./bin/www
#echo $! > tmp/pid
} >> log/$DATE.txt 2>&1
