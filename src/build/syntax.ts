// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
export function literal(pattern: string): RegExp {
  const literal = pattern.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(literal);
}

export function regex(
  strings: TemplateStringsArray,
  ...args: (string | RegExp)[]
): RegExp {
  const pattern = [];
  const literals = [...strings.raw];

  for (const arg of args) {
    pattern.push(literals.shift());

    if (typeof arg === "string") {
      pattern.push(literal(arg).source);
    } else {
      if (arg.flags !== "") {
        throw new Error(`Unsupported flags: ${arg.flags}`);
      }
      pattern.push(arg.source);
    }
  }

  if (literals.length > 0) {
    pattern.push(literals.join(""));
  }

  return new RegExp(pattern.join(""));
}
