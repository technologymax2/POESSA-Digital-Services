// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import VideoCallAccess from "./customer/VideoCallAccess";
import AgentVideoPage from "./employee/AgentVideoPage";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import CustomerDashboard from "./customer/CustomerDashboard";

import LivenessTest from "./customer/LivenessTest";
import VerificationWizard from "./customer/VerificationWizard";

import PensionerRegistration from "./employee/PensionerRegistration";
import IdCardGenerationAndSearch from "./employee/IdCardGenerationAndSearch";
import ScanVerify from "./employee/ScanVerify";
import CheckStatus from "./employee/CheckStatus"; // Imported correctly here
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

          {/* Home */}
          <Route path="/" element={<Dashboard />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Dashboards */}
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />

          {/* Video Call */}
          <Route path="/video-call" element={<VideoCallAccess />} />
          <Route path="/agent-call-center" element={<AgentVideoPage />} />

          {/* Pension Registration */}
          <Route
            path="/pensioner-registration"
            element={<PensionerRegistration />}
          />

          {/* ID Card */}
          <Route
            path="/idcard-generation-search"
            element={<IdCardGenerationAndSearch />}
          />

          {/* Scan Verify */}
          <Route
            path="/verify/:faydaNum"
            element={<ScanVerify />}
          />

          {/* Full Life Verification Process */}
          <Route
            path="/verification"
            element={<VerificationWizard />}
          />

          {/* Direct Liveness Test (Optional) */}
          <Route
            path="/liveness"
            element={<LivenessTest />}
          />

          {/* Status Check (Fixed syntax and spelling) */}
          <Route
            path="/check-status"
            element={<CheckStatus />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
