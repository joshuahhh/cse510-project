import { useState } from 'react';

import liveEditorTool from './lib';

function TestLiveEditorTool() {
  const [input, setInput] = useState<string>("hi bud");
  const [result, setResult] = useState<any>();

  return (
    <div className="TestLiveEditorTool">
      <div>input: <input value={input} onChange={(ev) => setInput(ev.target.value)}/></div>
      <button onClick={() => setResult(liveEditorTool({input: input, showTool: true}))}>compute</button>
      <pre>result = {JSON.stringify(result)}</pre>
    </div>
  );
}

export default TestLiveEditorTool;

