const fs = require('fs');
const path = require('path');

const DIRECTORY = './';  // プロジェクトのルートディレクトリを指定

function replacePlayingCheckInFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // !queue.node.isPlaying() を !queue.node.isPlaying() に置き換え
  const regex = /!queue\.playing/g;
  fileContent = fileContent.replace(regex, '!queue.node.isPlaying()');

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
      replacePlayingCheckInFile(fullPath);
    }
  });
}

processDirectory(DIRECTORY);

console.log('Replacement complete.');
