import type { Language } from "highlight.js";

export function gts(): Language {
  return {
    name: "TypeScript with Glimmer Templates",
    aliases: ["gts"],
    subLanguage: "typescript",
    contains: [
      {
        begin: /^(\s*)(<template.*>)/gm,
        end: /^(\s*)(<\/template>)/gm,
        subLanguage: "gbs",
      },
    ],
  };
}

export function gjs(): Language {
  return {
    name: "JavaScript with Glimmer Templates",
    aliases: ["gts", "glimmer"],
    subLanguage: "typescript",
    contains: [
      {
        begin: /^(\s*)(<template.*>)/gm,
        end: /^(\s*)(?=<\/template>)/gm,
        subLanguage: "gbs",
      },
    ],
  };
}
