import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
// import NoteEditor from './pages/NoteEditor';
// import GraphExplorer from './pages/GraphExplorer';
// import NoteDetail from './pages/NoteDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard as home page */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Other routes - uncomment as you build them */}
        {/* <Route path="/note/:id" element={<NoteDetail />} /> */}
        {/* <Route path="/editor" element={<NoteEditor />} /> */}
        {/* <Route path="/editor/:id" element={<NoteEditor />} /> */}
        {/* <Route path="/graph" element={<GraphExplorer />} /> */}
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;