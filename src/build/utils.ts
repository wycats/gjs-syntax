export function exhaustive(
  _value: `Type Assertion: Exhaustive match failed`,
  variable: string
): never {
  throw new Error(
    `Unexpected: Exhaustive match failed for ${variable} (This should be handled statically by the type system. Do you have any type errors?)`
  );
}
