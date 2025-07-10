import path from "node:path";

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

const buildPrettierCommand = (filenames) =>
  `prettier --write ${filenames.join(" ")}`;

export default {
  "*.{js,jsx,ts,tsx,mjs}": [buildEslintCommand, buildPrettierCommand],
  "*.{.json,css,scss,md}": [buildPrettierCommand],
};
