const fs = require('fs');
const path = require('path');

const COLORS_MAP = {
  "RED": "Colors.Red",
  "GREEN": "Colors.Green",
  "BLUE": "Colors.Blue",
  "YELLOW": "Colors.Yellow",
  "PURPLE": "Colors.Purple",
  "GOLD": "Colors.Gold",
  "ORANGE": "Colors.Orange",
  "WHITE": "Colors.White",
  "BLACK": "Colors.Black",
  "GREY": "Colors.Grey",
  "AQUA": "Colors.Aqua",
  "DARK_BLUE": "Colors.DarkBlue",
  "DARK_GREEN": "Colors.DarkGreen",
  "DARK_AQUA": "Colors.DarkAqua",
  "DARK_RED": "Colors.DarkRed",
  "DARK_PURPLE": "Colors.DarkPurple",
  "DARK_ORANGE": "Colors.DarkOrange",
  "DARK_GREY": "Colors.DarkGrey",
  "DARKER_GREY": "Colors.DarkerGrey",
  "LIGHT_GREY": "Colors.LightGrey",
  "NAVY": "Colors.Navy",
  "DARK_NAVY": "Colors.DarkNavy",
  "BLURPLE": "Colors.Blurple",
  "GREYPLE": "Colors.Greypel",
  "DARK_BUT_NOT_BLACK": "Colors.DarkButNotBlack",
  "NOT_QUITE_BLACK": "Colors.NotQuiteBlack",
  "RANDOM": "Colors.Random"
};

const DIRECTORY = './';  // プロジェクトのルートディレクトリを指定

function replaceColorsInFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  for (const [colorName, colorValue] of Object.entries(COLORS_MAP)) {
    const regex = new RegExp(`\\.setColor\\(["'\`]${colorName}["'\`]\\)`, 'g');
    fileContent = fileContent.replace(regex, `.setColor(${colorValue})`);
  }

  // 必要なインポートを追加
  if (fileContent.includes('.setColor(Colors.')) {
    if (!fileContent.includes("const { Colors } = require('discord.js');")) {
      fileContent = fileContent.replace(
        /const {[^}]*EmbedBuilder[^}]*} = require\('discord.js'\);/,
        match => `${match}\nconst { Colors } = require('discord.js');`
      );
    }
  }

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
      replaceColorsInFile(fullPath);
    }
  });
}

processDirectory(DIRECTORY);

console.log('Color replacement complete.');
