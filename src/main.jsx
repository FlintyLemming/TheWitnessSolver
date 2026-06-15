import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';

function Placeholder() {
  return <h1 style={{ color: 'var(--color-panel)' }}>solver booting…</h1>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Placeholder />
  </React.StrictMode>
);
