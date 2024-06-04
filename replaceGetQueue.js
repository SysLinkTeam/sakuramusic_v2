const fs = require('fs');
const path = require('path');

const DIRECTORY = './';  // プロジェクトのルートディレクトリを指定

function replaceGetQueueInFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // interaction.client.player.nodes.get を interaction.client.player.nodes.get に置き換え
  const regex = /interaction\.client\.player\.getQueue/g;
  fileContent = fileContent.replace(regex, 'interaction.client.player.nodes.get');

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
      replaceGetQueueInFile(fullPath);
    }
  });
}

processDirectory(DIRECTORY);

console.log('Replacement complete.');
