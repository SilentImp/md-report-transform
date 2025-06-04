'use strict';
const fs = require('fs').promises;
const path = require('path');

module.exports = async (filename, dir, folders, level, isVerbose = false) => {
    const results = [];
    
    if (isVerbose) {
        console.log('Search parameters:');
        console.log(`- Filename: ${filename}`);
        console.log(`- Root directory: ${dir}`);
        console.log(`- Target folders: ${folders.join(', ')}`);
        console.log(`- Search depth: ${level}`);
    }

    async function searchInDirectory(currentDir, currentLevel) {
        if (currentLevel > level) {
            if (isVerbose) console.log(`Reached maximum depth ${level} at ${currentDir}`);
            return;
        }

        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relativePath = path.relative(dir, fullPath);

                if (isVerbose) console.log(`Checking ${relativePath}`);

                if (entry.isDirectory()) {
                  await searchInDirectory(fullPath, currentLevel + 1);
                }

                if (entry.isFile() && entry.name === filename) {
                  if (isVerbose) console.log(`Found matching file: ${relativePath}`);
                  results.push(fullPath);
                }
            }
        } catch (error) {
            if (isVerbose) console.error(`Error searching in ${currentDir}:`, error.message);
        }
    }

    const searchPromise = [];
    for (const folder of folders) {
      searchPromise.push(searchInDirectory(path.join(dir, folder), 0));
    }
    await Promise.all(searchPromise);

    return results;
};