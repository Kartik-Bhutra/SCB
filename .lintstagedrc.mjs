import path from "node:path";

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --write ${filenames.join(" ")}`;

const lintStagedConfig = {
  "*.{js,jsx,ts,tsx,mjs}": [buildEslintCommand, buildPrettierCommand],
  "*.{json,css,scss,md}": [buildPrettierCommand],
};

export default lintStagedConfig;
