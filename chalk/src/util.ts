export function compileExpression(exprCode: string): (env: object) => unknown {
  // eslint-disable-next-line no-new-func
  return new Function('__env__', `with (__env__) { return (${exprCode}); }`) as any
}



// josh borrowed this code from elsewhere

export interface Range {
  start: number,
  end: number,
}
export interface Substitution {
  range: Range,
  subranges: Range[],
  replacement: string,
}

export const performSubstitutions = (s: string, substitutions: Substitution[]) => {
  // Substitutions are not allowed to partially overlap, however they are
  // allowed to entirely contain each other.

  // We want to order the substitutions so that we perform the innermost ones
  // first. We can do this by sorting by the length of the range we're
  // replacing. If we replace shorter ranges first, we're guaranteed to replace
  // inner ranges before any range that contains them.
  const length = (substitution: Substitution) => substitution.range.end - substitution.range.start;
  substitutions.sort((a, b) => length(a) - length(b));

  while (substitutions.length > 0) {
    const substitution = substitutions.shift()!;
    const {start, end} = substitution.range;

    const before = s.substring(0, start);
    const after = s.substring(end);

    // eslint-disable-next-line no-loop-func
    const substrings = substitution.subranges.map(range => s.substring(range.start, range.end));
    let replacement = substitution.replacement;
    substrings.forEach((substring, i) => {
      const regexp = new RegExp("\\$" + i, "g");
      replacement = replacement.replace(regexp, substring);
    });

    // Perform the replacement
    s = before + replacement + after;

    // Calculate the offset. This is the amount that any character indices after
    // the substitution need to be adjusted by so that they're still pointing at
    // the correct spot in the string.
    const offset = replacement.length - (end - start);

    // Make the offset adjustment on the remaining substitutions.
    const adjustRange = (range: Range) => {
      if (range.start > start) {
        range.start += offset;
      }
      if (range.end > start) {
        range.end += offset;
      }
    };
    substitutions.forEach(substitution => {
      adjustRange(substitution.range);
      substitution.subranges.forEach(adjustRange);
    });
  }

  return s;
};