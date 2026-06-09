// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VideoCallAccess from './customer/VideoCallAccess';
import AgentVideoPage from './employee/AgentVideoPage' ;    
import './App.css';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/video-call" element={<VideoCallAccess />} />
          <Route path="/agent-call-center" element={<AgentVideoPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;