import * as fs from 'fs';
import * as path from 'path';

// for each directory in ../../games, copy the icon.png file to ../public/game-icons/<dirname>.png
const gamesDir = path.join(import.meta.dirname, '../../games');
const publicDir = path.join(import.meta.dirname, '../public/game-icons');

const icons = fs.readdirSync(gamesDir).filter((file) => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory();
});

// create the public/game-icons directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// copy the icon.png file to the public/game-icons directory
icons.forEach((icon) => {
  const src = path.join(gamesDir, icon, 'icon.png');
  const dest = path.join(publicDir, `${icon}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.log(`No icon found for ${icon} (${src})`);
  }
});
