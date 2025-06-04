#! /usr/bin/env node

const { program } = require('commander');
const packageJSON = require("./package.json");
const searchSubFolders = require('./search-sub-folders.js');
const transformMd = require('./transform-md.js');

program
  .name(packageJSON.name)
  .description(packageJSON.description)
  .version(packageJSON.version)
  .argument('[dir]', 'Root folder to search.', '.')
  .option('-n, --name [name]', 'Name of the file with markdown test report.', 'test-report.md')
  .option('-f, --folders [folders...]', 'Folder to search', ['.'])
  .option('-l, --level [level]', 'Search depth level', 3)
  .option('-v, --verbose', 'Output additiona information', false)
  .action(async (dir, { name, folders, level, verbose: isVerbose }) => {

    if (isVerbose) {
      console.log({
        dir,
        name,
        folders,
        level,
        verbose: isVerbose,
      })
    }
    
    try {
      const files = await searchSubFolders(name, dir, folders, level, isVerbose);
      const report = await transformMd(files);
      process.stdout.write(`# Test Report

${report}\n`);
    } catch (error) {
      program.error(error.stderr ? error.stderr.toString() : error.message);
    }
  });


program.parse();