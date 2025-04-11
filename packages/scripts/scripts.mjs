import { build } from '@unocss/cli';
import minimist from 'minimist';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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
      const distPath = path.relative(
        import.meta.dirname,
        path.resolve(cwd, relPath),
      );
      await recursivelyAddUnoPrefixes(distPath);
      console.log(`Running unocss...`);
      await build({
        cwd: import.meta.dirname,
        patterns: [`${distPath}/**/*.js`],
        outFile: `${distPath}/uno.css`,
        writeTransformed: true,
        minify: true,
        watch,
      });
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
    process.exit(0);
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
