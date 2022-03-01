import './App.css';

import CodeMirror from './CodeMirror';

import {keymap, highlightSpecialChars, drawSelection, dropCursor, WidgetType, EditorView, Decoration } from "@codemirror/view"
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Callbacks, instrumentCode } from './instrumentation';
import { compileExpression } from './util';

import { Range, RangeSet } from "@codemirror/rangeset";

import { parseExpressionAt } from 'acorn';




class HTMLWidget extends WidgetType {
  constructor(readonly html: string) { super() }

  eq(other: HTMLWidget) { return other.html === this.html }

  toDOM() {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.html.trim();

    return tempDiv.firstElementChild as HTMLElement;
  }
}

function valueWidget(text: string, offset: number) {
  return  Decoration.widget({
    widget: new HTMLWidget(`<span class="chalk-value">${text}</span>`),
    side: 1
  }).range(offset)
}

function logDecoration(text: string, offset: number) {
  return Decoration.widget({
    widget: new HTMLWidget(`<div class="chalk-log">${text}</div>`),
    side: 1,
    block: true,
  }).range(offset);
}

function errorDecoration(text: string, offset: number) {
  return Decoration.widget({
    widget: new HTMLWidget(`<div class="chalk-error">${text}</div>`),
    side: 1,
    block: true,
  }).range(offset);
}

function fadeDecoration(start: number, end: number) {
  return Decoration.mark({
    class: "chalk-fade"
  }).range(start, end)
}

const allTheme = EditorView.baseTheme({
  ".chalk-error": {
    backgroundColor: 'rgba(255,0,0,0.3)',
    paddingLeft: '5px',
    fontFamily: 'sans-serif',
    fontSize: '80%',
  },
  ".chalk-log": {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingLeft: '5px',
    fontFamily: 'sans-serif',
    fontSize: '80%',
  },
  ".chalk-value": {
    opacity: 0.7,
    background: 'gray',
    color: 'white',
    fontFamily: 'sans-serif',
    fontSize: '80%',
    borderRadius: '5px',
    marginLeft: '5px',
    paddingLeft: '5px',
    paddingRight: '5px',
  },
  ".chalk-fade": {
    opacity: 0.35
  },
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
  margins: {line: number, text: string}[],
  decorations: Range<Decoration>[],
}

function newLogs(): Logs {
  return {
    margins: [], decorations: []
  };
}

const jsonFromLocalStorage = localStorage.getItem("editor-code");

type ChalkResult = {value: any} | {error: any};

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

  const saveCode = useCallback((code: string) => {
    localStorage.setItem("editor-code", code);
    setCode(code);
  }, [])

  const cmText = useMemo(() => {
    return EditorState.create({doc: code}).doc;
  }, [code])

  const logsRef = useRef<Logs>(newLogs());
  const [logs, setLogs] = useState<Logs>(newLogs());
  const [result, setResult] = useState<ChalkResult>();

  const [showInline, setShowInline] = useState(true);
  const [showMargins, setShowMargins] = useState(true);

  const env: Callbacks = useMemo(() => {
    return {
      __log_IfStatement_test: ({line, end, value, consequentStart, consequentEnd, alternateStart, alternateEnd}) => {
        logsRef.current.margins.push({line, text: `condition is ${JSON.stringify(value)}`});
        if (showInline) {
          logsRef.current.decorations.push(valueWidget(`${value}`, end));
        }
        if (!value) {
          logsRef.current.decorations.push(fadeDecoration(consequentStart, consequentEnd));
        } else {
          if (alternateStart && alternateEnd) {
            logsRef.current.decorations.push(fadeDecoration(alternateStart, alternateEnd));
          }
        }
        return value;
      },
      __log_VariableDeclarator_init: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        if (showInline) {
          logsRef.current.decorations.push(valueWidget(`${value}`, end));
        }
        return value;
      },
      __log_AssignmentExpression_right: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        if (showInline) {
          logsRef.current.decorations.push(valueWidget(`${value}`, end));
        }
        return value;
      },
      __log_ReturnStatement_argument: ({line, end, value}) => {
        logsRef.current.margins.push({line, text: `= ${JSON.stringify(value)}`});
        if (showInline) {
          logsRef.current.decorations.push(valueWidget(`${value}`, end));
        }
        return value;
      },
      console: {
        log: (...vals: any[]) => {
          const text = vals.map((v) => JSON.stringify(v)).join(", ");
          const lineNum = lineNumberFromError(getErrorObject());
          logsRef.current.decorations.push(logDecoration(text, cmText.line(lineNum!).to));
          console.log("log", vals, getErrorObject().stack);
        }
      }
    }
  }, [cmText, showInline]);

  useEffect(() => {
    function done(result: ChalkResult) {
      setResult(result);
      setLogs(logsRef.current);
    }

    logsRef.current = newLogs();

    let generated: string;
    try {
      generated = instrumentCode(code)
    } catch (e) {
      logsRef.current.decorations.push(errorDecoration((e as any).message, cmText.lineAt((e as any).raisedAt).to));
      return done({error: e});
    }

    let compiled;
    try {
      compiled = compileExpression(generated);
    } catch (e) {
      return done({error: e})
    }

    let f = compiled(env);

    try {
      const value = (f as any)(input);
      return done({value})
    } catch (e) {
      if (!(e instanceof Error)) {
        return done({error: e})
      }

      const lineNum = lineNumberFromError(e);
      if (lineNum === null) {
        return done({error: e})
      }

      logsRef.current.decorations.push(errorDecoration(e.message, cmText.line(lineNum).to));
      setLogs(logsRef.current);

      return done({error: e})
    }
  }, [cmText, code, env])

  return (
    <div className="App">
      <pre>input = {JSON.stringify(input, null, 2)}</pre>
      <CodeMirror
        text={code} onChange={saveCode}
        extensions={[
          extensions,
          allTheme,
          showMargins ? specificGutterTextsRight(logs.margins) : [],
          EditorView.decorations.of(RangeSet.of(logs.decorations, true)),
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
      <div>
        {result && ('error' in result ?
          <pre style={{color: 'red'}}>{result.error.toString()}</pre> :
          <pre>output = {JSON.stringify(result.value, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default App;

