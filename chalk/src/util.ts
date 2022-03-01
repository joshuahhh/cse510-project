export function compileExpression(exprCode: string): (env: object) => unknown {
  // eslint-disable-next-line no-new-func
  return new Function('__env__', `with (__env__) { return (${exprCode}); }`) as any
}
