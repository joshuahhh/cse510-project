import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestChalkEditor from './TestChalkEditor';
import TestLiveEditorTool from './TestLiveEditorTool';

ReactDOM.render(
  <React.StrictMode>
    {/* <TestChalkEditor /> */}
    <TestLiveEditorTool />
  </React.StrictMode>,
  document.getElementById('root')
);
