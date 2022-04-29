/*
Language: HTML, XML
Website: https://www.w3.org/XML/
Category: common, web
Audit: 2020
*/

import hljs, { type LanguageDetail, type Mode } from "highlight.js";
import { next, not, oneof, opt, pat, star } from "../build/regex-builder.js";
import scope from "../build/scopes.js";
import { regex as re } from "../build/syntax.js";
import { BLOCK, BLOCK_PARAMS, INLINE } from "./exprs.js";
import { IDENT } from "./shared.js";

// const regex = hljs.regex;

const ATTR_NAME = /[A-Za-z0-9._:-]+/;
const ARG_NAME = re`@${IDENT}`;
const XML_ENTITIES = {
  scope: "symbol",
  begin: /&[a-zA-Z]+;|&#[0-9]+;|&#x[a-fA-F0-9]+;/,
};

const PLAIN_TAG_START = /[a-z]/;
const PLAIN_TAG_CONTINUE = /[a-zA-Z0-9_.-]/;
const COMPONENT_CONTINUE = /[a-zA-Z0-9_.-.]/;

// A plain tag name is a name that starts with a letter and continues with letters, numbers, dashes, dots, or colons.
const PLAIN_TAG_NAME = pat(
  PLAIN_TAG_START,
  [next, /[^\.]*[\s>]/],
  [[opt, [[star, PLAIN_TAG_CONTINUE], ":"]]],
  [star, PLAIN_TAG_CONTINUE]
);

// A component tag name starts with A-Z, `:` or `@`, *or* it starts with a lowercase letter and contains a `.` before the first whitespace or `>`.
const COMPONENT_TAG_NAME = pat([
  oneof,
  [
    [/[A-Z:@]/, [star, COMPONENT_CONTINUE]],
    [
      PLAIN_TAG_START,
      [star, COMPONENT_CONTINUE],
      ".",
      [star, COMPONENT_CONTINUE],
    ],
  ],
]);

const XML_META_KEYWORDS = {
  begin: /\s/,
  contains: [
    {
      scope: "meta-keyword",
      begin: /#?[a-zA-Z_][a-zA-Z1-9_-]+/,
      illegal: /\n/,
    },
  ],
};
const XML_META_PAR_KEYWORDS = hljs.inherit(XML_META_KEYWORDS, {
  begin: /\(/,
  end: /\)/,
});
const APOS_META_STRING_MODE = hljs.inherit(hljs.APOS_STRING_MODE, {
  scope: "meta-string",
});
const QUOTE_META_STRING_MODE = hljs.inherit(hljs.QUOTE_STRING_MODE, {
  scope: "meta-string",
});

const ATTR_VALUE: Mode = {
  begin: re`${"="}\s*`,
  contains: [
    ...INLINE,
    {
      scope: "string",
      endsParent: true,
      variants: [
        {
          begin: /"/,
          end: /"/,
          contains: [XML_ENTITIES, ...INLINE],
        },
        {
          begin: /'/,
          end: /'/,
          contains: [XML_ENTITIES],
        },
        {
          begin: /[^\s"'=<>`]+/,
        },
      ],
    },
  ],
};

const ATTR: Mode = {
  begin: ATTR_NAME,
  scope: scope.block.attribute,
  contains: [ATTR_VALUE],
};

const ARG: Mode = {
  begin: ARG_NAME,
  scope: scope.template.arg,
  contains: [ATTR_VALUE],
};

const TAG_INTERNALS = {
  endsWithParent: true,
  illegal: /</,
  relevance: 0,
  contains: [
    {
      scope: "keyword",
      match: re`${"...attributes"}`,
    },
    BLOCK_PARAMS,
    ATTR,
    ARG,
    ...INLINE,
  ],
};

export default function gbs(): LanguageDetail & Mode {
  return {
    name: "GlimmerBars",
    aliases: ["hbs", "gbs", "handlebars", "htmlbars", "html"],
    // case_insensitive: true,
    contains: [
      ...INLINE,
      ...BLOCK,
      {
        scope: "meta",
        begin: /<![a-z]/,
        end: />/,
        relevance: 10,
        contains: [
          XML_META_KEYWORDS,
          QUOTE_META_STRING_MODE,
          APOS_META_STRING_MODE,
          XML_META_PAR_KEYWORDS,
          {
            begin: /\[/,
            end: /\]/,
            contains: [
              {
                scope: "meta",
                begin: pat("<!", /[a-z]/),
                end: pat(">"),
                contains: [
                  XML_META_KEYWORDS,
                  XML_META_PAR_KEYWORDS,
                  QUOTE_META_STRING_MODE,
                  APOS_META_STRING_MODE,
                ],
              },
            ],
          },
        ],
      },
      hljs.COMMENT(/<!--/, /-->/, {
        relevance: 10,
      }),
      {
        begin: pat("<![CDATA["),
        end: pat("]]>"),
      },
      XML_ENTITIES,
      {
        scope: "meta",
        begin: re`${"<?xml"}`,
        end: re`${"?>"}`,
      },

      htmlEmbed("style", ["css", "xml"]),
      htmlEmbed("script", ["javascript", "handlebars", "xml"]),
      {
        scope: "tag",
        // See the comment in the <style tag about the lookahead pattern
        begin: /<script(?=\s|>)/,
        end: />/,
        keywords: {
          name: "script",
        },
        contains: [TAG_INTERNALS],
        starts: {
          end: pat("</script>"),
          returnEnd: true,
          subLanguage: ["javascript", "handlebars", "xml"],
        },
      },
      // we need this for now for jSX
      {
        scope: "tag",
        begin: pat([oneof, ["<>", "</>"]]),
      },

      // open tag
      {
        scope: "tag",
        // <tag/>, <tag>, <tag ...>

        begin: pat(
          "<",
          [not.next, "/"],
          [next, [PLAIN_TAG_NAME, [oneof, ["/>", ">", /\s/]]]]
        ),
        end: pat([opt, "/"], ">"),
        contains: [
          {
            scope: scope.block.tagname,
            begin: PLAIN_TAG_NAME,
            relevance: 0,
            starts: TAG_INTERNALS,
          },
        ],
      },
      // open component
      {
        scope: scope.block.tag,
        // <tag/>, <tag>, <tag ...>

        begin: pat(
          "<",
          [not.next, "/"],
          [next, [COMPONENT_TAG_NAME, [oneof, ["/>", ">", /\s/]]]]
        ),

        // begin: re`${"<"}(?!${"/"})(?=${COMPONENT_TAG_NAME}(?:${"/>"}|${">"}|\s))`,
        // end: re`${"/"}?${">"}`,
        end: pat([opt, "/"], ">"),

        contains: [
          {
            scope: scope.variable.reference,
            begin: COMPONENT_TAG_NAME,
            relevance: 0,
            starts: TAG_INTERNALS,
          },
        ],
      },
      // close tag
      {
        begin: [pat("</"), PLAIN_TAG_NAME, pat(">")],
        beginScope: {
          2: scope.block.tagname,
        },
        scope: scope.block.tag,
      },
      // close component
      {
        scope: "tag",
        begin: [re`${"</"}`, COMPONENT_TAG_NAME, re`${">"}`],
        beginScope: {
          2: scope.variable.reference,
        },
      },
    ],
  };
}

function htmlEmbed(tag: string, lang: string[]): Mode {
  return {
    scope: scope.block.tag,
    begin: pat("<", tag, [next, [oneof, [/\s/, ">"]]]),
    end: pat(">"),
    keywords: {
      name: tag,
    },
    contains: [TAG_INTERNALS],
    starts: {
      end: pat("</", tag, ">"),
      returnEnd: true,
      subLanguage: lang,
    },
  };
}
