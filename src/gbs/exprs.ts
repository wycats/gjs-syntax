import type { Mode } from "highlight.js";
import { opt, pat } from "../build/regex-builder.js";
import scope, { type Scope } from "../build/scopes.js";
import { regex } from "../build/syntax.js";
import { IDENT } from "./shared.js";

const PIPE = regex`${"|"}`;

/**
 * Expressions, defined up front so it can be used recursively as expressions are added to it.
 */
const EXPR: Mode[] = [];
const EXPR_PATH: Mode[] = [];
const BLOCK_PATH: Mode[] = [];

function expr(...modes: Mode[]) {
  for (const mode of modes) {
    EXPR.push(mode);
    EXPR_PATH.push(mode);
    BLOCK_PATH.push(mode);
  }
}

export const WS: Mode = {
  match: /\s+/,
  scope: "whitespace",
};

expr(WS);

const STRING: Mode = {
  match: /"(?:[^"]|\\")*"|'(?:[^']|\\')*'/,
  scope: scope.string,
};

expr(STRING);

const NUMBER: Mode = { match: /\-?[0-9]+(?:\.[0-9]+)?/, scope: scope.number };

expr(NUMBER);

const BOOLEAN: Mode = {
  match: /true|false/,
  scope: scope.keyword,
};

expr(BOOLEAN);

const MEMBER: Mode = {
  begin: [regex`${"."}`, IDENT],
  beginScope: {
    1: String(scope.punctuation),
    2: String(scope.property),
  },
};

EXPR_PATH.push(MEMBER);
BLOCK_PATH.push(MEMBER);

const PATH: Mode = {
  match: regex`(?!as\s+${PIPE})@?${IDENT}`,
  beginScope: scope.variable.reference,
  scope: "gbs-path",

  contains: [MEMBER],
};

expr(PATH);

export const BLOCK_PARAMS: Mode = {
  match: [
    regex`${"as"}`,
    /\s+/,
    PIPE,
    /\s*/,
    regex`(?:${IDENT}\s+)*${IDENT}`,
    /\s*/,
    PIPE,
  ],
  beginScope: {
    1: String(scope.keyword),
    3: String(scope.punctuation),
    5: String(scope.variable.binding),
    7: String(scope.punctuation),
  },
};

BLOCK_PATH.push(BLOCK_PARAMS);

function invoke(nameScope: Scope, contains: Mode[]): Mode {
  return {
    begin: [regex`@?${IDENT}`],
    beginScope: {
      1: String(nameScope),
      2: scope.property,
    },
    contains,
  };
}

const INVOKE_INLINE = invoke(scope.function.invocation, EXPR_PATH);
const INVOKE_BLOCK = invoke(scope.block.custom, BLOCK_PATH);

const SEXP: Mode = {
  begin: /\(/,
  beginScope: scope.punctuation,
  end: /\)/,
  endScope: scope.punctuation,

  contains: [INVOKE_INLINE],
};

expr(SEXP);

const INVOKE_CONTENT: Mode = {
  // endsWithParent: true,
  end: regex`${"}}"}`,
  endScope: scope.template.embed,
  endsParent: true,
  variants: [
    {
      begin: regex`@?${IDENT}(?:\.${IDENT})*\s`,
      returnBegin: true,
      contains: [INVOKE_INLINE],
    },
    {
      contains: EXPR_PATH,
    },
  ],
};

export const INLINE: Mode[] = [];
export const BLOCK: Mode[] = [];

const CONTENT: Mode = {
  begin: regex`${"{{"}(?![#/:]|else[\s}])`,
  beginScope: scope.template.embed,
  contains: [INVOKE_CONTENT],
  scope: scope.inline.custom,
};

INLINE.push(CONTENT);

const ELSE: Mode = {
  begin: [pat("{{"), pat("else", [opt, [/\s+/, "if", /\s+/]])],
  beginScope: {
    1: scope.block.tag,
    2: scope.block.custom,
  },
  end: regex`${"}}"}`,
  endScope: scope.block.tag,
  // scope: scope.inline.emphasis,
  contains: [INVOKE_INLINE],
};

BLOCK.push(ELSE);

const BLOCK_END: Mode = {
  match: [regex`${"{{/"}`, regex`[^}]*`, regex`${"}}"}`],
  beginScope: {
    1: scope.punctuation,
    2: scope.block.custom,
    3: scope.punctuation,
  },
  // scope: scope.inline.emphasis,
};

BLOCK.push(BLOCK_END);

const BLOCK_START: Mode = {
  begin: regex`${"{{#"}`,
  beginScope: scope.block.tag,
  end: regex`${"}}"}`,
  endScope: scope.block.tag,
  contains: [INVOKE_BLOCK],
  // scope: scope.inline.emphasis,
  // endsParent: true,
};

BLOCK.push(BLOCK_START);

const CURLY_NAMED_BLOCK: Mode = {
  begin: regex`${"{{:"}`,
  beginScope: scope.block.tag,
  end: regex`${"}}"}`,
  endScope: scope.block.tag,
  contains: [INVOKE_BLOCK],
  // scope: scope.inline.emphasis,
  // endsParent: true,
};

BLOCK.push(CURLY_NAMED_BLOCK);
