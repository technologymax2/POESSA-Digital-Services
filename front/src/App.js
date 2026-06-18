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
import LivenessTest from './customer/LivenessTest';
import PensionerRegistration from './employee/PensionerRegistration';
import IdCardGenerationAndSearch from './employee/IdCardGenerationAndSearch';
import ScanVerify from './employee/ScanVerify';
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
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/liveness" element={<LivenessTest />} />
          <Route path="/pensioner-registration" element ={<PensionerRegistration />} />
          <Route path="/idcard-generation-search" element={<IdCardGenerationAndSearch />} />
          
          {/* 🚨 ከባክኤንድ ጋር እንዳይጋጭ /api/pensioners የሚለው ጠፍቶ ወደ ንጹህ ፍሮንትኤንድ መንገድ ተቀይሯል */}
          <Route path="/verify/:faydaNum" element={<ScanVerify />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
