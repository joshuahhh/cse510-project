import React from 'react';
import ReactDOM from 'react-dom';
import './view/style.css';
import DemoEmbedComponent from './view/DemoEmbedComponent';
import DemoEmbedLib from './view/DemoEmbedLib';

ReactDOM.render(
  <React.StrictMode>
    {/* <DemoEmbedLib /> */}
    <DemoEmbedComponent/>
  </React.StrictMode>,
  document.getElementById('root')
);
