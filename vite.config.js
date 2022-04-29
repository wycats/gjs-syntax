// @ts-check

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  resolve: {
    alias: [
      {
        find: /^highlight\.js$/,
        replacement: resolve(root, "./node_modules/highlight.js/lib/core.js"),
      },
      {
        find: /^highlight\.js\/lib\/languages\/(.*)\.js/,
        replacement: resolve(
          root,
          "./node_modules/highlight.js/lib/languages/$1.js"
        ),
      },
    ],
  },
  build: {
    lib: {
      entry: resolve(root, "src/gbs/register.ts"),
      formats: ["es"],
      name: "gbs",
    },
    rollupOptions: {
      // external: Object.keys(pkg.dependencies),
      output: {
        name: "gbs",
      },
    },
  },
};

export default config;
