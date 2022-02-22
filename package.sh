#!/bin/bash

rm -rf package
mkdir package
cp -r use-case-1 use-case-2 package
cp index-package.html package/index.html
sed -i '' 's/showTool: true/showTool: false/g' package/use-case-*/*.html
zip -r -X package.zip package
rm -rf package