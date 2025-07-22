import * as fs from 'fs';
import * as path from 'path';

// for each directory in ../../games, copy the icon.png file to ../public/game-icons/<dirname>.png
const gamesDir = path.join(import.meta.dirname, '../../games');
const publicDir = path.join(import.meta.dirname, '../public/game-data');
const federatedDir = path.join(import.meta.dirname, '../public/game-modules');

const gameDirs = fs.readdirSync(gamesDir).filter((file) => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory();
});

// create the public/game-icons directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// copy the icon.png file to the public/game-icons directory
gameDirs.forEach((gameDir) => {
  if (!fs.existsSync(path.join(publicDir, gameDir))) {
    fs.mkdirSync(path.join(publicDir, gameDir), { recursive: true });
  }
  if (!fs.existsSync(path.join(federatedDir, gameDir))) {
    fs.mkdirSync(path.join(federatedDir, gameDir), { recursive: true });
  }
  copyFile(gameDir, 'icon.png');
  copyFile(gameDir, 'rules.md');
  copyDir(gameDir, 'assets');
  copyDir(gameDir, 'dist', path.join(federatedDir, gameDir));
});

function copyFile(gameDir, fileName) {
  const src = path.join(gamesDir, gameDir, fileName);
  const dest = path.join(publicDir, `${gameDir}/${fileName}`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`No ${fileName} found for ${gameDir} (${src})`);
  }
}

function copyDir(
  gameDir,
  dirName,
  dest = path.join(publicDir, gameDir, dirName),
) {
  const src = path.join(gamesDir, gameDir, dirName);

  if (!fs.existsSync(src)) {
    console.warn(`No ${dirName} found for ${gameDir} (${src})`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(gameDir, path.join(dirName, file));
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
