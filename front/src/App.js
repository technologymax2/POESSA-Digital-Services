// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmployeeDashboard from "./employee/EmployeeDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import CustomerDashboard from "./customer/CustomerDashboard";

// አዳዲስ የተስተካከሉ የ Verify እና Liveness ገጾች
import Verify from "./customer/Verify";
import Liveness from "./customer/Liveness";

import PensionerRegistration from "./employee/PensionerRegistration";
import IdCardGenerationAndSearch from "./employee/IdCardGenerationAndSearch";
import ScanVerify from "./employee/ScanVerify";
import CheckStatus from "./customer/CheckStatus";
import Report from "./employee/Report";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Dashboards */}
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />

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

          {/* Main Verification & Liveness Flow */}
          <Route path="/verify" element={<Verify />} />
          <Route path="/liveness" element={<Liveness />} />

          {/* Status Check & Reports */}
          <Route
            path="/check-status"
            element={<CheckStatus />}
          />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
