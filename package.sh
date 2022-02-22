#!/bin/bash

rm -rf package
mkdir package
cp -r use-case-1 use-case-2 index.html package
sed -i '' 's/showTool: true/showTool: false/g' package/use-case-*/*.html
zip -r -X package.zip package
rm -rf package