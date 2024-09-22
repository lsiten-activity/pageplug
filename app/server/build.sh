#!/bin/bash
# Remove previous dist directory
rm -rf dist/

# Build the code. $@ accepts all the parameters from the input command line and uses it in the maven build command
mvn clean package "$@"

if [ $? -eq 0 ]
then
  echo "mvn Successfull"
else
  echo "mvn Failed"
  exit 1
fi

# Create the dist directory
mkdir -p dist/plugins

# Copy the server jar
cp ./appsmith-server/target/server-1.0-SNAPSHOT.jar dist/

# Copy all the plugins
# 查找所有 .jar 文件并排除 original-*.jar 文件
find ./appsmith-plugins/*/target/ -name "*.jar" ! -name "original-*.jar" | \
while read file; do
    cp "$file" dist/plugins/
done
