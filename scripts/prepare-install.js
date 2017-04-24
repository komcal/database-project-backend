const path = require('path');
const fs = require('fs');
const pathPackage = path.resolve('package.json');
const package = require(path.resolve('package.json'))
const dependencies = Object.keys(package.dependencies)
const addingList = Object.keys(package.devDependencies).filter((name) => dependencies.indexOf(name) === -1);
addingList.map(name => {
  package.dependencies[name] = package.devDependencies[name];
});
fs.writeFileSync(pathPackage, JSON.stringify(package), 'utf8');