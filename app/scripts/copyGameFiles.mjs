import * as fs from 'fs';
import * as path from 'path';

const gamesDir = path.join(import.meta.dirname, '../../games');
const gamesMetaOutput = path.join(import.meta.dirname, '../dist/game-data');
const federatedOutput = path.join(import.meta.dirname, '../dist/game-modules');

const gameDirs = fs.readdirSync(gamesDir).filter((file) => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory();
});

// create the public/game-icons directory if it doesn't exist
if (!fs.existsSync(gamesMetaOutput)) {
  fs.mkdirSync(gamesMetaOutput, { recursive: true });
}

// copy the icon.png file to the public/game-icons directory
gameDirs.forEach((gameDir) => {
  if (!fs.existsSync(path.join(gamesMetaOutput, gameDir))) {
    fs.mkdirSync(path.join(gamesMetaOutput, gameDir), { recursive: true });
  }
  // must convert to underscores for the federated modules stuff :(
  const gameFederatedId = gameDir.replace(/-/g, '_');
  if (!fs.existsSync(path.join(federatedOutput, gameFederatedId))) {
    fs.mkdirSync(path.join(federatedOutput, gameFederatedId), {
      recursive: true,
    });
  }
  copyGameFile(gameDir, 'icon.png');
  copyGameFile(gameDir, 'rules.md');
  copyGameDir(gameDir, 'assets');
  copyGameDir(
    gameDir,
    'renderer/dist',
    path.join(federatedOutput, gameFederatedId),
  );
});

function copyGameFile(gameDir, fileName) {
  const src = path.join(gamesDir, gameDir, fileName);
  const dest = path.join(gamesMetaOutput, `${gameDir}/${fileName}`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`No ${fileName} found for ${gameDir} (${src})`);
  }
}

function copyGameDir(
  gameDir,
  dirName,
  dest = path.join(gamesMetaOutput, gameDir, dirName),
) {
  const src = path.join(gamesDir, gameDir, dirName);

  if (!fs.existsSync(src)) {
    console.warn(`No ${dirName} found for ${gameDir} (${src})`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  copyDir(src, dest);
}

// recursively copies a directory
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
