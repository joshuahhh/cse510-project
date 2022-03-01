import { useCallback, useState } from "react";
import ChalkEditor, { ChalkEditorProps, ChalkResult } from "./ChalkEditor";
import styles from './LiveEditorTool.css';

export interface LiveEditorToolProps extends ChalkEditorProps {}

export default function LiveEditorTool({input, code, setCode, reportResult}: LiveEditorToolProps) {
  const [result, setResult] = useState<ChalkResult>();
  const [showValues, setShowValues] = useState(true);

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

      <div>
        <h2>Code</h2>
        <ChalkEditor
          code={code} setCode={setCode}
          input={input}
          reportResult={setResult}
          showValues={showValues}
        />
      </div>

      <div>
        <h2>Output</h2>
        {result && ('error' in result ?
          <pre style={{color: 'red'}}>{result.error.toString()}</pre> :
          <pre>{JSON.stringify(result.value, null, 2)}</pre>
        )}
      </div>

      <div style={{flexGrow: 1, visibility: 'hidden'}}/>

      <div>
        <input name="inline" type="checkbox" checked={showValues} onChange={(ev) => setShowValues(ev.target.checked)}/>
        <label htmlFor="inline">Show values</label>
      </div>
    </div>
  );
}