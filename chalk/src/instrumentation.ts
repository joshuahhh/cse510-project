import { parseExpressionAt, Node as AcornNode, getLineInfo } from 'acorn';
import { performSubstitutions, Substitution } from './util';

import * as acornWalk from 'acorn-walk';

export interface ValueRange {
  line: number,
  start: number,
  end: number,
  value: any,
}

export interface Callbacks {
  __log_IfStatement_test(valueRange: ValueRange & {consequentStart: number, consequentEnd: number, alternateStart?: number, alternateEnd?: number}): any
  __log_VariableDeclarator_init(valueRange: ValueRange): any
  __log_AssignmentExpression_right(valueRange: ValueRange): any
  __log_ReturnStatement_argument(valueRange: ValueRange): any
}


export function instrumentCode(code: string): string {
  const parsed = parseExpressionAt(code, 0, { ecmaVersion: 11 });

  const substitutions: Substitution[] = [];

  acornWalk.simple(parsed, {
    IfStatement(node) {
      const test: AcornNode = (node as any).test;
      const consequent: AcornNode = (node as any).consequent;
      const alternate: AcornNode | null = (node as any).alternate;
      const line = getLineInfo(code, test.start).line;
      substitutions.push({
        range: {start: test.start, end: test.end},
        subranges: [
          {start: test.start, end: test.end},
        ],
        replacement:
          `__log_IfStatement_test({line: ${line}, start: ${test.start}, end: ${test.end}, ` +
          `consequentStart: ${consequent.start}, consequentEnd: ${consequent.end}, ` +
          `alternateStart: ${alternate ? alternate.start : undefined}, alternateEnd: ${alternate ? alternate.end : undefined}, ` +
          `value: $0})`
      });
    },
    VariableDeclarator(node) {
      const init: AcornNode | null = (node as any).init;
      if (!init) {
        return;
      }
      const line = getLineInfo(code, init.start).line;
      substitutions.push({
        range: {start: init.start, end: init.end},
        subranges: [
          {start: init.start, end: init.end},
        ],
        replacement: `__log_VariableDeclarator_init({line: ${line}, start: ${init.start}, end: ${init.end}, value: $0})`
      });
    },
    AssignmentExpression(node) {
      const right: AcornNode = (node as any).right;
      const line = getLineInfo(code, right.start).line;
      substitutions.push({
        range: {start: right.start, end: right.end},
        subranges: [
          {start: right.start, end: right.end},
        ],
        replacement: `__log_AssignmentExpression_right({line: ${line}, start: ${right.start}, end: ${right.end}, value: $0})`
      });
    },
    ReturnStatement(node) {
      const argument: AcornNode | null = (node as any).argument;
      if (!argument) {
        return;
      }
      const line = getLineInfo(code, argument.start).line;
      substitutions.push({
        range: {start: argument.start, end: argument.end},
        subranges: [
          {start: argument.start, end: argument.end},
        ],
        replacement: `__log_ReturnStatement_argument({line: ${line}, start: ${argument.start}, end: ${argument.end}, value: $0})`
      });
    }
  });

  return performSubstitutions(code, substitutions);
}

