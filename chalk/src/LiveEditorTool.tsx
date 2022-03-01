import { useCallback, useState } from "react";
import ChalkEditor, { ChalkEditorProps, ChalkResult } from "./ChalkEditor";
import styles from './LiveEditorTool.css';
import ScrollShadow from "./ScrollShadow";

export interface LiveEditorToolProps extends Omit<ChalkEditorProps, 'showValues' | 'showErrors'> {}

export default function LiveEditorTool({input, code, setCode, reportResult}: LiveEditorToolProps) {
  const [result, setResult] = useState<ChalkResult>();
  const [showValues, setShowValues] = useState(true);
  const [showErrors, setShowErrors] = useState(true);

  const reportAndSaveResult = useCallback((result) => {
    setResult(result);
    reportResult && reportResult(result);
  }, [])

  return (
    <div className="LiveEditorTool">
      <style type="text/css">{styles}</style>

      <div>
        <h2>Input</h2>
        <pre>{JSON.stringify(input, null, 2)}</pre>
      </div>

      <div style={{minHeight: 200, display: 'flex', flexDirection: 'column'}}>
        <h2>Code</h2>
        <ScrollShadow style={{overflow: "scroll"}}>
          <ChalkEditor
            code={code} setCode={setCode}
            input={input}
            reportResult={setResult}
            showValues={showValues}
            showErrors={showErrors}
          />
        </ScrollShadow>
      </div>

      <div>
        <h2>Output</h2>
        {result && ('error' in result ?
          <pre style={{color: 'red'}}>{result.error.toString()}</pre> :
          <pre>{JSON.stringify(result.value, null, 2)}</pre>
        )}
      </div>

      <div style={{flexGrow: 1, visibility: 'hidden'}}/>

      <div style={{opacity: 0.5}}>
        <div>
          <input name="inline" type="checkbox" checked={showValues} onChange={(ev) => setShowValues(ev.target.checked)}/>
          <label htmlFor="inline">Show values</label>
        </div>
        <div>
          <input name="inline" type="checkbox" checked={showErrors} onChange={(ev) => setShowErrors(ev.target.checked)}/>
          <label htmlFor="inline">Show errors</label>
        </div>
      </div>
    </div>
  );
}