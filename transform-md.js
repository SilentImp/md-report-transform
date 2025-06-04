'use strict';
const fs = require('fs').promises;
const { readFileSync, existsSync } = require('fs');
const path = require('path');

const breakToParts = file => file.split('##');
const checkIfHasFailedTests = (part) => {
  const matches = part.match(/❌/g);
  const count = matches ? matches.length : 0;
  return count > 1;
}

const skipFirstAndWrapInDetails = (file) => file.map((part, partIndex, allParts) => {
  if (partIndex === 0) return part;
  const hasFailedTests = checkIfHasFailedTests(part);
  const lines = part.split('\n');
  lines[0] = `<details${hasFailedTests ? ' open' : ''}><summary>${lines[0].trim()}</summary>`;
  const terminator = allParts.length - 1 === partIndex ? '</details></details>' : '</details>';
  lines.push(terminator);
  return lines.join('\n');
});

const transformFirst = (filesList) => (file, fileIndex) => file.map((part, partIndex, allParts) => {
  if (partIndex !== 0) return part;
  const filename = filesList[fileIndex];
  const projectName = findPackageJson(path.dirname(filename));
  const hasFailedTests = allParts.slice(1).find(part => checkIfHasFailedTests(part)) !== undefined;
  const lines = part.split('\n');
  lines[0] = `<details${hasFailedTests ? ' open' : ''}><summary>${projectName}</summary>`;
  return lines.join('\n');
});

const collectParts = (file) => file.join('\n\n');

const findPackageJson = (startPath, level = 3) => {
  const packageJsonPath = path.join(startPath, 'package.json');

  if (existsSync(packageJsonPath)) {
    const content = readFileSync(packageJsonPath, 'utf8');
    const { name } = JSON.parse(content);
    return name;
  }

  if (level === 0) return null;

  const parentPath = path.dirname(startPath);
    
  return findPackageJson(parentPath, level - 1);
};

module.exports = async (filenames) => {
  const files = await Promise.all(filenames.map(filename => fs.readFile(filename, 'utf8')));
  const transformed = files.map(breakToParts).map(transformFirst(filenames)).map(skipFirstAndWrapInDetails).map(collectParts).join('\n\n');
  return transformed;
};
