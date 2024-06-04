const fs = require('fs');
const path = require('path');

const DIRECTORY = './';  // プロジェクトのルートディレクトリを指定

function replaceFiltersInFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // queue.filters.ffmpeg.filters を queue.filters.ffmpeg.filters に置き換え
  const regex = /queue\.filters\.ffmpeg\.filters\.ffmpeg\.filters/g;
  fileContent = fileContent.replace(regex, 'queue.filters.ffmpeg.filters');

  fs.writeFileSync(filePath, fileContent, 'utf8');
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && file.endsWith('.js')) {
      replaceFiltersInFile(fullPath);
    }
  });
}

processDirectory(DIRECTORY);

console.log('Replacement complete.');
