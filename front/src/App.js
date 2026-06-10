// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VideoCallAccess from './customer/VideoCallAccess';
import AgentVideoPage from './employee/AgentVideoPage' ; 
import EmployeeDashboard from './employee/EmployeeDashboard';  
import AdminDashboard from "./admin/AdminDashboard";
import CustomerDashboard from "./customer/CustomerDashboard";
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
           <Route path="/EmployeeDashboard" element={<EmployeeDashboard />} />
           <Route path="/AdminDashboard" element={<AdminDashboard />} />
           <Route path="/CustomerDashboard" element={<CustomerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;