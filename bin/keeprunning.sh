#!/bin/sh

while true
do
    echo "Starting '$@' ..."
    "$@"
    echo "Crash!!! Sleep 1 second ..."
    sleep 1
done
