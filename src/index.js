import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 稍後會建立這個檔案
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);