import copyfiles from 'copyfiles';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const {
  _: [command, relPath = './dist'],
  w: watch,
} = argv;

if (!command) {
  console.error('No command provided');
  process.exit(1);
}
if (!relPath) {
  console.error('No path provided');
  process.exit(1);
}

const commands = {
  css: {
    // copies all CSS files from src/ to dist/ with the same
    // folder structure
    run: async () => {
      const cwd = process.cwd();
      const srcPath = 'src';
      const distPath = relPath;
      console.log(`Copying CSS files...`);
      await new Promise((res, rej) =>
        copyfiles(
          [srcPath + '/**/*.css', distPath],
          {
            up: 1,
          },
          (err) => {
            if (err) rej(err);
            else res();
          },
        ),
      );
      console.log(`Done!`);
    },
  },
  images: {
    // copies all png files from src/ to dist/ with the same
    // folder structure
    run: async () => {
      const cwd = process.cwd();
      const srcPath = 'src';
      const distPath = relPath;
      console.log(`Copying image files...`);
      await new Promise((res, rej) =>
        copyfiles(
          [srcPath + '/**/*.png', distPath],
          {
            up: 1,
          },
          (err) => {
            if (err) rej(err);
            else res();
          },
        ),
      );
      console.log(`Done!`);
    },
  },
};

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

(async () => {
  try {
    await commands[command].run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
