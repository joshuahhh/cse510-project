import './App.css';

import CodeMirror from './CodeMirror';

import {keymap, highlightSpecialChars, drawSelection, dropCursor, WidgetType, EditorView, Decoration} from "@codemirror/view"
import {EditorState} from "@codemirror/state"
import {history, historyKeymap} from "@codemirror/history"
import {foldKeymap} from "@codemirror/fold"
import {indentOnInput} from "@codemirror/language"
import {defaultKeymap, indentWithTab} from "@codemirror/commands"
import {bracketMatching} from "@codemirror/matchbrackets"
import {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets"
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search"
import {autocompletion, completionKeymap} from "@codemirror/autocomplete"
import {commentKeymap} from "@codemirror/comment"
import {rectangularSelection} from "@codemirror/rectangular-selection"
import {defaultHighlightStyle} from "@codemirror/highlight"
import {lintKeymap} from "@codemirror/lint"
import {lineNumbers, highlightActiveLineGutter} from "@codemirror/gutter"
import {javascript} from "@codemirror/lang-javascript"
import { gutterRight, lineNumbersRight, GutterMarker } from './gutterRight';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Callbacks, instrumentCode } from './instrumentation';
import { compileExpression } from './util';

import { RangeSet } from "@codemirror/rangeset";

import { parseExpressionAt } from 'acorn';



class ValueWidget extends WidgetType {
  constructor(readonly text: string) { super() }

  eq(other: ValueWidget) { return other.text === this.text }

  toDOM() {
    let wrap = document.createElement("span")
    if (false) {
      wrap.className = "cm-value-widget"
      wrap.innerText = ` → ${this.text}`;
    } else {
      wrap.className = "cm-value-widget-box"
      wrap.innerText = `${this.text}`;
    }
    return wrap
  }

  ignoreEvent() { return true }
}

function valueWidgets(valueTexts: {offset: number, text: string}[]) {
  const decorations = valueTexts.map(({offset, text}) =>
    Decoration.widget({
      widget: new ValueWidget(text),
      side: 1
    }).range(offset)
  );
  return EditorView.decorations.of(RangeSet.of(decorations));
}

const valueWidgetsTheme = EditorView.baseTheme({
  ".cm-value-widget": {
    opacity: 0.5,
  },
  ".cm-value-widget-box": {
    opacity: 0.5,
    fontFamily: 'sans-serif',
    fontSize: '80%',
    border: '1px solid gray',
    marginLeft: '5px',
    paddingLeft: '5px',
    paddingRight: '5px',
  },
});




class ErrorWidget extends WidgetType {
  constructor(readonly text: string) { super() }

  eq(other: ValueWidget) { return other.text === this.text }

  toDOM() {
    let wrap = document.createElement("div")
    wrap.className = "cm-error-widget"
    wrap.innerText = `${this.text}`;
    return wrap
  }

  ignoreEvent() { return true }
}

function errorWidgets(valueTexts: {offset: number, text: string}[]) {
  const decorations = valueTexts.map(({offset, text}) =>
    Decoration.widget({
      widget: new ErrorWidget(text),
      block: true,
      side: 1,
    }).range(offset)
  );
  return EditorView.decorations.of(RangeSet.of(decorations));
}

const errorWidgetsTheme = EditorView.baseTheme({
  ".cm-error-widget": {
    backgroundColor: 'rgba(255,0,0,0.3)',
    paddingLeft: '5px',
  }
});

function fadeMarks(ranges: {start: number, end: number}[]) {
  const decorations = ranges.map(({start, end}) =>
    Decoration.mark({
      class: "cm-fade-mark"
    }).range(start, end)
  );
  return EditorView.decorations.of(RangeSet.of(decorations));
}

const fadeMarksTheme = EditorView.baseTheme({
  ".cm-fade-mark": {
    opacity: 0.5
  }
});



// eslint-disable-next-line new-parens
class TextMarker extends GutterMarker {
  constructor(readonly text: string) { super(); }

  toDOM() { return document.createTextNode(this.text) }
}

function specificGutterTextsRight(texts: {line: number, text: string}[]) {
  return gutterRight({
    lineMarker(view, line) {
      const lineNum = view.state.doc.lineAt(line.from).number;
      const textsForLine = texts.filter(({line}) => line === lineNum).map(({text}) => text);
      return textsForLine.length === 0 ? null : new TextMarker(textsForLine.join(", "));
    }
  })
}

export const extensions = [
  lineNumbers(),
  // lineNumbersRight({formatNumber: (lineNo) => lineNo.toString().repeat(lineNo)}),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  // foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  // highlightActiveLine(),
  highlightSelectionMatches(),

  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...commentKeymap,
    ...completionKeymap,
    ...lintKeymap,
    indentWithTab,
  ]),

  javascript(),

]

const initialCode = `function (x) {
  if (x < 0) {
    return -x;
  } else {
    return x;
  }
}`



/*
ok what instrumentation do I actually wanna do for this?
* parse errors (doesn't need instrumentation)
* runtime errors (doesn't need instrumentation)
* console.log (doesn't need instrumentation)
*/

interface Logs {
  values: {offset: number, text: string}[],
  margins: {line: number, text: string}[],
  errors: {offset: number, text: string}[],
  fades: {start: number, end: number}[],
}

function newLogs(error?: {offset: number, text: string}): Logs {
  return {
    values: [], margins: [], errors: error ? [error] : [], fades: []
  };
}

const jsonFromLocalStorage = localStorage.getItem("editor-code");

const input = {
  "heroX": 3,
  "heroY": 2,
  "enemyX": 4,
  "enemyY": 4
};

function getErrorObject(): Error {
  try { throw Error('') } catch(err) { return err as Error; }
}

function lineNumberFromError(e: Error): number | null {
  const match: [string, string, string] | null = (e as any).stack.match(/<anonymous>:(\d*):(\d*)/);
  return match && (+match[1] - 2);  // TODO: idk what the 2 is for
}

function App() {
  const [code, setCode] = useState(jsonFromLocalStorage || initialCode);

  const cmText = useMemo(() => {
    return EditorState.create({doc: code}).doc;
  }, [code])

  const saveCode = useCallback((code: string) => {
    localStorage.setItem("editor-code", code);
    setCode(code);
  }, [])

  const logsRef = useRef<Logs>(newLogs());
  const [logs, setLogs] = useState<Logs>(newLogs());

  const generated = useMemo(() => {
    try {
      return instrumentCode(code)
    } catch (e) {
      if (!(e instanceof Error)) {
        return new Error("unknown");
      }

      const logs = newLogs({text: (e as any).message, offset: cmText.lineAt((e as any).raisedAt).to});
      console.log('hooo', logs)
      setLogs(logs);
      return e;
    }
  }, [cmText, code]);

  const parsed = useMemo(() => {
    try {
      return parseExpressionAt(code, 0, { ecmaVersion: 11});
    } catch (e) {
      return `error: ${(e as any).message}`;
    }
  }, [code])

  const compiled = useMemo(() => {
    if (generated instanceof Error) {
      return generated;
    }
    try {
      return compileExpression(generated);
    } catch (e) {
      setLogs(newLogs());
      return `compilation error: ${(e as Error).message}`
    }
  }, [generated])

  const env: Callbacks = useMemo(() => {
    return {
      __log_IfStatement_test: ({line, end, value, consequentStart, consequentEnd, alternateStart, alternateEnd}) => {
        logsRef.current.margins.push({line, text: `condition is ${JSON.stringify(value)}`});
        logsRef.current.values.push({offset: end, text: `${value}`});
        if (!value) {
          logsRef.current.fades.push({start: consequentStart, end: consequentEnd});
        } else {
          if (alternateStart && alternateEnd) {
            logsRef.current.fades.push({start: alternateStart, end: alternateEnd});
          }
        }
        return value;
      },
      __log_VariableDeclarator_init: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        logsRef.current.values.push({offset: end, text: `${value}`});
        return value;
      },
      __log_AssignmentExpression_right: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        logsRef.current.values.push({offset: end, text: `${value}`});
        return value;
      },
      __log_ReturnStatement_argument: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        logsRef.current.values.push({offset: end, text: `${value}`});
        return value;
      },
      console: {
        log: (...vals: any[]) => {
          const text = vals.map((v) => JSON.stringify(v)).join(", ");
          const lineNum = lineNumberFromError(getErrorObject());
          logsRef.current.errors.push({text, offset: cmText.line(lineNum!).to})
          console.log("log", vals, getErrorObject().stack);
        }
      }
    }
  }, [cmText]);

  const f = useMemo(() => {
    if (compiled instanceof Error) {
      return compiled;
    }
    if (typeof compiled === 'string') {
      return compiled;
    }
    return compiled(env);
  }, [compiled, env])

  const result = useMemo(() => {
    if (f instanceof Error) {
      return f;
    }
    try {
      logsRef.current = newLogs()
      const result = (f as any)(input);
      setLogs(logsRef.current);
      return result;
    } catch (e) {
      if (!(e instanceof Error)) {
        return `runtime error: ${e}`
      }

      const lineNum = lineNumberFromError(e);
      if (lineNum === null) {
        return `runtime error: ${e.message}`
      }

      setLogs(newLogs({text: e.message, offset: cmText.line(lineNum).to}));

      return `runtime error: ${e.message}`
    }
  }, [cmText, f])

  const [showInline, setShowInline] = useState(true);
  const [showMargins, setShowMargins] = useState(true);

  return (
    <div className="App">
      <pre>input = {JSON.stringify(input, null, 2)}</pre>
      <CodeMirror
        text={code} onChange={saveCode}
        extensions={[
          extensions, valueWidgetsTheme, errorWidgetsTheme, fadeMarksTheme,
          showMargins ? specificGutterTextsRight(logs.margins) : [],
          showInline ? valueWidgets(logs.values) : [],
          errorWidgets(logs.errors),
          fadeMarks(logs.fades),
        ]}
      />
      <div>
        <input name="inline" type="checkbox" checked={showInline} onChange={(ev) => setShowInline(ev.target.checked)}/>
        <label htmlFor="inline">Show values inline</label>
      </div>
      <div>
        <input name="margins" type="checkbox" checked={showMargins} onChange={(ev) => setShowMargins(ev.target.checked)}/>
        <label htmlFor="margins">Show values in margins</label>
      </div>
      {result instanceof Error ?
        <pre style={{color: 'red'}}>{result.message}</pre> :
        <pre>output = {JSON.stringify(result, null, 2)}</pre>
      }
      <hr/>
      <pre>{JSON.stringify(parsed, null, 2)}</pre>
      <hr/>
      {/* <pre>{JSON.stringify(replaced, null, 2)}</pre> */}
      {/* <hr/> */}
      <pre>{typeof generated === 'string' ? generated : JSON.stringify(generated)}</pre>
      <hr/>
      {JSON.stringify(result, null, 2)}
      <hr/>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}

export default App;

