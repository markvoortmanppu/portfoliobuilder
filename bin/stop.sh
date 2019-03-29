#!/bin/sh

set -e

cd $(dirname "$0")/..
PID=`cat tmp/pid`
rm -f tmp/pid
kill $PID
