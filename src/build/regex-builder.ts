import { literal } from "./syntax.js";
import { exhaustive } from "./utils.js";

export class RegexBuilder {
  static build(...patterns: IntoRegexPart[]): RegExp {
    const builder = new RegexBuilder([]);

    for (const pattern of patterns) {
      builder.add(pattern);
    }

    return builder.#compile();
  }

  #pattern: RegexPart[];

  private constructor(pattern: RegexPart[]) {
    this.#pattern = pattern;
  }

  add(...patterns: IntoRegexPart[]): this {
    this.#pattern.push(pattern(...patterns));
    return this;
  }

  #compile(): RegExp {
    return new RegExp(this.#pattern.map(CompilePart).join(""));
  }
}

export const pat = RegexBuilder.build;

export type RegexPart =
  | {
      type: "literal";
      value: string;
    }
  | {
      type: "char";
      value: string;
      negative: boolean;
    }
  | {
      type: "regex";
      value: string;
    }
  | {
      type: "modified";
      value: RegexPart;
      modifier: Modifier;
    }
  | {
      type: "group";
      value: RegexPart[];
      modifier?: GroupModifier;
    }
  | {
      type: "repeat";
      value: RegexPart;
      times: Repetition;
    };

export type Repetition =
  | {
      type: "*";
    }
  | {
      type: "+";
    }
  | {
      type: "?";
    }
  | {
      type: "range";
      from: number;
      to: number;
    };

type LOOKAHEAD_NAME = "lookahead";
type NEGATIVE_LOOKAHEAD_NAME = "negative lookahead";
type ONEOF_NAME = "oneof";

type Modifier =
  | {
      type: LOOKAHEAD_NAME | NEGATIVE_LOOKAHEAD_NAME;
    }
  | Repetition;

interface GroupModifier {
  type: ONEOF_NAME;
}

export const next: Modifier = {
  type: "lookahead",
};

export const not = {
  next: { type: "negative lookahead" } as Modifier,
} as const;

export const oneof: GroupModifier = {
  type: "oneof",
} as const;

function isModifier(value: unknown): value is GroupModifier {
  if (!isObject(value)) {
    return false;
  }

  switch (value["type"]) {
    case "lookahead":
    case "negative lookahead":
    case "*":
    case "+":
    case "?":
      return true;
    default:
      return false;
  }
}

function isGroupModifier(value: unknown): value is GroupModifier {
  if (!isObject(value)) {
    return false;
  }

  switch (value["type"]) {
    case "oneof":
      return true;
    default:
      return false;
  }
}

export const opt: Repetition & Modifier = { type: "?" };
export const star: Repetition & Modifier = { type: "*" };
export const plus: Repetition & Modifier = { type: "+" };

type IntoRegexPart =
  | RegExp
  | string
  | RegexPart
  | IntoRegexPart[]
  | [GroupModifier, IntoRegexPart[]]
  | [Modifier, IntoRegexPart];

const CHAR_CLASS = /^\[(\^?)(?:[^]|\\])+\]$/;

function IntoRegexPart(from: IntoRegexPart): RegexPart {
  if (typeof from === "string") {
    return lit(from);
  } else if (Array.isArray(from)) {
    if (isIntoGroupModified(from)) {
      const [modifier, list] = from;
      return group(list.map(IntoRegexPart), modifier);
    } else if (isIntoModified(from)) {
      return {
        type: "modified",
        value: IntoRegexPart(from[1]),
        modifier: from[0],
      };
    } else {
      return group(from.map(IntoRegexPart));
    }
  } else if (from instanceof RegExp) {
    const source = from.source;

    const match = source.match(CHAR_CLASS);

    if (match) {
      if (match[1]) {
        return {
          type: "char",
          value: source.slice(2, -1),
          negative: true,
        };
      } else {
        return {
          type: "char",
          value: source.slice(1, -1),
          negative: false,
        };
      }
    } else {
      return regexp(source);
    }
  } else {
    return from;
  }
}

function isSingle<T>(list: T[]): list is [T] {
  return list.length === 1;
}

function isIntoModified(
  part: IntoRegexPart
): part is [Modifier, IntoRegexPart] {
  return Array.isArray(part) && part.length === 2 && isModifier(part[0]);
}

function isIntoGroupModified(
  part: IntoRegexPart
): part is [GroupModifier, IntoRegexPart[]] {
  return (
    Array.isArray(part) &&
    part.length === 2 &&
    isGroupModifier(part[0]) &&
    Array.isArray(part[1])
  );
}

function isObject(value: unknown): value is object & Record<any, any> {
  return typeof value === "object" && value !== null;
}

export function pattern(...patterns: IntoRegexPart[]): RegexPart {
  if (isSingle(patterns)) {
    const [pattern] = patterns;
    return IntoRegexPart(pattern);
  }

  return group(patterns.map(IntoRegexPart));
}

export function lit(string: string): RegexPart {
  return { type: "literal", value: string };
}

export function regexp(string: string): RegexPart {
  return { type: "regex", value: string };
}

export function group(parts: RegexPart[], modifier?: GroupModifier): RegexPart {
  return { type: "group", value: parts, modifier };
}

export function modified(
  patterns: IntoRegexPart[],
  modifier: Modifier
): RegexPart {
  const base = pattern(...patterns);
  return { type: "modified", value: base, modifier };
}

function CompilePart(part: RegexPart): string {
  switch (part.type) {
    case "literal":
      return literal(part.value).source;
    case "regex":
      return part.value;
    case "char": {
      const { value, negative } = part;

      if (negative) {
        return `[^${value}]`;
      } else {
        return `[${value}]`;
      }
    }
    case "modified":
      switch (part.modifier.type) {
        case "lookahead":
          return `(?=${CompilePart(part.value)})`;
        case "negative lookahead":
          return `(?!${CompilePart(part.value)})`;
        default:
          return CompileRepeated(part.value, part.modifier);
      }
    case "group": {
      if (part.modifier) {
        switch (part.modifier.type) {
          case "oneof":
            return `(?:${part.value.map(CompilePart).join("|")})`;
          default:
            exhaustive(part.modifier.type, "part.modifier.type");
        }
      } else {
        return `(?:${part.value.map(CompilePart).join("")})`;
      }
    }
    case "repeat": {
      switch (part.times.type) {
        case "*":
          return `${CompilePart(part.value)}*`;
        case "+":
          return `${CompilePart(part.value)}+`;
        case "?":
          return `${CompilePart(part.value)}?`;
        case "range":
          return `${CompilePart(part.value)}{${part.times.from},${
            part.times.to
          }}`;
      }
    }
    default:
      exhaustive(part, "part");
  }
}

function CompileRepeated(part: RegexPart, modifier: Repetition): string {
  const repetition = CompileRepetition(modifier);
  if (part.type === "char") {
    return `${CompilePart(part)}${repetition}`;
  } else {
    return `(?:${CompilePart(part)})${repetition}`;
  }
}

function CompileRepetition(repetition: Repetition): string {
  switch (repetition.type) {
    case "*":
    case "+":
    case "?":
      return repetition.type;
    case "range":
      return `{${repetition.from},${repetition.to}}`;
    default:
      exhaustive(repetition, "repetition");
  }
}
