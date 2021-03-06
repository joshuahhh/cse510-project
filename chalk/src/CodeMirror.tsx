import { EditorState, Extension, StateEffect } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { useEffect, useMemo, useRef, useState } from "react"

export interface CodeMirrorProps {
  extensions?: Extension[];

  text?: string;
  onChange?: (text: string) => void;

  autoFocus?: boolean;
}

export default function CodeMirror({extensions, text, onChange, autoFocus}: CodeMirrorProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>();
  const stateRef = useRef<EditorState>();
  const viewRef = useRef<EditorView>();

  const allExtensions = useMemo(() => {
    let allExtensions = (extensions || []).slice();
    allExtensions.push(EditorView.updateListener.of((vu: ViewUpdate) => {
      if (vu.docChanged) {
        const doc = vu.state.doc;
        const text = doc.toString();
        onChange && onChange(text);
      }
    }));
    return allExtensions
  }, [extensions, onChange]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({ effects: StateEffect.reconfigure.of(allExtensions) });
    }
  }, [allExtensions]);

  useEffect(() => {
    if (div && !stateRef.current) {
      stateRef.current = EditorState.create({
        doc: text,
        extensions: allExtensions,
      });
      viewRef.current = new EditorView({
        state: stateRef.current,
        parent: div,
      });

      if (autoFocus) {
        viewRef.current.focus();
      }
    }
  });

  useEffect(() => {
    const view = viewRef.current;
    if (!viewRef.current) { return; }
    const currentText = view ? view.state.doc.toString() : '';
    if (view && text !== currentText) {
      view.dispatch({
        changes: { from: 0, to: currentText.length, insert: text || '' },
      });
    }
  }, [text]);

  return <div ref={setDiv} className="cm-theme cm-theme-light"/>
}