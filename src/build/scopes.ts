const root = {
  keyword: "keyword",
  built_in: "built_in",
  type: "type", // data type (in a language with syntactically significant types) (string, int, array, etc.)
  literal: "literal", // special identifier for a built-in value (true, false, null, etc.)
  number: "number", // number, including units and modifiers, if any.
  operator: "operator", // operators: +, -, >>, |, ==
  punctuation: "punctuation", // aux. punctuation that should be subtly highlighted (parentheses, brackets, etc.)
  property: "property", // object property obj.prop1.prop2.value
  regexp: "regexp", // literal regular expression
  string: "quote", // literal string, character
  substr: "substr", // parsed section inside a literal string
  symbol: "symbol", // symbolic constant, interned string, goto label
  params: "params", // block of function arguments (parameters) at the place of declaration
  comment: "comment", // comments
  doctag: "doctag", // documentation markup within comments, e.g. @params
  prompt: "meta.prompt", // REPL or shell prompts or similar
} as const;

type Root = ValueOf<typeof root>;

const modifier = {
  group: "meta",
  keyword: "meta keyword",
  string: "meta string",
} as const;

type Modifier = ValueOf<typeof modifier>;

const char = {
  escape: "char.escape",
};

type Char = ValueOf<typeof char>;

const variable = {
  reference: "variable",
  binding: "variable",
  language: "variable.language", // variable with special meaning in a language, e.g.: this, window, super, self, etc.
  constant: "variable.constant", // variable that is a constant value, ie MAX_FILES
} as const;

type Variable = ValueOf<typeof variable>;

const Class = {
  name: "title.class",
  extends: "title.class.inherited",
} as const;

type Class = ValueOf<typeof Class>;

const Function = {
  name: "title.function",
  invocation: "title.function.invoke",
} as const;

type Function = ValueOf<typeof Function>;

const block = {
  heading: "section",
  tag: "tag",
  custom: "section template-tag",
  tagname: "name",
  attribute: "code",
  code: "code",
  quote: "quote",
} as const;

type Block = ValueOf<typeof block>;

const inline = {
  bullet: "bullet",
  code: "code",
  emphasis: "emphasis",
  strong: "strong",
  formula: "formula",
  link: "link",
  quote: "quote",
  custom: "tag",
} as const;

type Inline = ValueOf<typeof inline>;

const css = {
  tag: "selector-tag",
  id: "selector-id",
  class: "selector-class",
  attr: "selector-attr",
  pseudo: "selector-pseudo",
};

type Css = ValueOf<typeof css>;

const diff = {
  add: "addition",
  delete: "deletion",
} as const;

type Diff = ValueOf<typeof diff>;

const template = {
  body: "template",
  tag: "template-tag",
  block: "template",
  arg: "template-variable",
  embed: "template-variable", // characters that embed another language, such as {{ }}
} as const;

type Template = ValueOf<typeof template>;

const scopes = {
  ...root,
  modifier: {
    ...modifier,
  },
  char: {
    ...char,
  },
  variable: {
    ...variable,
  },
  class: {
    ...Class,
  },
  function: {
    ...Function,
  },
  inline: {
    ...inline,
  },
  block: {
    ...block,
  },
  css: {
    ...css,
  },
  diff: {
    ...diff,
  },
  template: {
    ...template,
  },
} as const;

export default scopes;

export class CustomScope {
  readonly #name: string;

  constructor(name: string) {
    this.#name = name;
  }

  toString() {
    return this.#name;
  }
}

export function custom(name: string) {
  return new CustomScope(name);
}

type ValueOf<T> = T[keyof T];

export type Scope =
  | Root
  | Modifier
  | Char
  | Variable
  | Class
  | Function
  | Inline
  | Block
  | Css
  | Diff
  | Template
  | CustomScope;
