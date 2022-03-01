import './App.css';

import { useCallback, useState } from 'react';

import ChalkEditor, { ChalkResult } from './ChalkEditor';

const initialCode = `function (x) {
  if (x < 0) {
    return -x;
  } else {
    return x;
  }
}`


const jsonFromLocalStorage = localStorage.getItem("editor-code");

const input = {
  "heroX": 3,
  "heroY": 2,
  "enemyX": 4,
  "enemyY": 4
};

function App() {
  const [code, setCode] = useState(jsonFromLocalStorage || initialCode);
  const [result, setResult] = useState<ChalkResult>();
  const [showValues, setShowValues] = useState(false);

  const saveCode = useCallback((code: string) => {
    localStorage.setItem("editor-code", code);
    setCode(code);
  }, [])

  return (
    <div className="App">
      <pre>input = {JSON.stringify(input, null, 2)}</pre>
      <ChalkEditor
        code={code} setCode={saveCode}
        input={input}
        reportResult={setResult}
        showValues={showValues}
      />
      <div>
        <input name="inline" type="checkbox" checked={showValues} onChange={(ev) => setShowValues(ev.target.checked)}/>
        <label htmlFor="inline">Show values</label>
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

