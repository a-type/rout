# Scripts

Useful scripts for processing and building, etc.

```
scripts uno ./dist [-w]
```

Processes output JS files using UnoCSS transforms and marks them for inclusion in other Uno builds.

This enables:

- Other projects including these source files in UnoCSS extraction automatically (adds `// @unocss-include` to the file)
- Lets you use transform rules (i.e. variant groups) within your code. Transforms the source using those rules for you in-place.
