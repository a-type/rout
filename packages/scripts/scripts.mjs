import { build } from '@unocss/cli';
import copyfiles from 'copyfiles';
import minimist from 'minimist';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import unoConfig from './uno.extract.config.mjs';

const argv = minimist(process.argv.slice(2));

const {
  _: [command, relPath],
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
  uno: {
    // appends `// @unocss-include` to the top of the file
    // and processes transforms in-place.

    run: async () => {
      // read every js file in <cwd>/<path> and write it back with
      // // @unocss-include
      // at the top of the file

      const cwd = process.cwd();
      const distPath = path.resolve(cwd, relPath);
      await fs.mkdir(distPath, { recursive: true });
      // await recursivelyAddUnoPrefixes(path.resolve(cwd, relPath));
      await fs.writeFile(
        path.resolve(distPath, 'uno.css.d.ts'),
        `declare const content: string;
        export default content;
        `,
      );
      console.log(`Running unocss...`, watch ? '(watch mode)' : '');
      await build({
        patterns: [`${distPath}/**/*.js`],
        outFile: `${distPath}/uno.css`,
        writeTransformed: true,
        minify: true,
        watch,
        preflights: false,
        config: unoConfig,
      });
      if (!watch) {
        console.log(`Done!`);
      }
    },
  },
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

async function recursivelyAddUnoPrefixes(root) {
  const files = await fs.readdir(root, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      await recursivelyAddUnoPrefixes(path.join(root, file.name));
    } else if (file.isFile() && file.name.endsWith('.js')) {
      await addUnoPrefix(path.join(root, file.name));
    }
  }
}

async function addUnoPrefix(filepath) {
  const file = await fs.readFile(filepath, 'utf-8');
  if (file.startsWith('// @unocss-include')) {
    return;
  }
  await fs.writeFile(filepath, `// @unocss-include\n${file}`, 'utf-8');
  console.log('Added @unocss-include to', filepath);
}
