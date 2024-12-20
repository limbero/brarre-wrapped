import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';

import App2023 from './App2023';
import App2024 from './App2024';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route exact path="/2023" element={<App2023 />} />
      <Route exact path="/2024" element={<App2024 />} />
      <Route
        path="*"
        element={<Navigate to="/2024" />}
      />
    </Routes>
  </HashRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
