#!/usr/bin/env bash

# Change to the parent directory of the directory containing this script.
cd "$(cd "$(dirname "$0")" && pwd)/.."

# Ref: <https://stackoverflow.com/a/30969768/151048>.
if [[ -f .env ]]; then
  echo "Found a .env file, loading environment variables from that file."
  set -o allexport
  source .env
fi

source ./scripts/util/is_wsl.sh
if [ $IS_WSL ]; then
  _JAVA_OPTIONS="-Djava.net.preferIPv4Stack=true $_JAVA_OPTIONS"
fi

root_path=$(cat /var/bt_setupPath.conf)
setup_path=$root_path/server

#java路径变量
java_path="${setup_path}/java/jdk-17.0.8/bin/java"


(cd dist && exec $java_path -Dfile.encoding=UTF-8 -jar server-*.jar)
