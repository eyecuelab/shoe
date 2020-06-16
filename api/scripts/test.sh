#!/bin/bash

Patterns=("./test/+(api|admin_api)/*.spec.js")

if [ "$1" != "" ]
then
  Patterns=("./test/$1")
fi

for pattern in ${Patterns[*]}; do
  NODE_ENV=test PORT=8081 ./node_modules/.bin/mocha \
  --trace-warnings \
  --timeout=20000 \
  --exit \
  --require \
  @babel/register \
  $pattern
done
