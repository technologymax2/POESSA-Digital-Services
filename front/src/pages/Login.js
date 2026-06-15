import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      // 1. የደህንነት Token
      localStorage.setItem("token", data.token);

      // 2. ✅ ከBackend የመጡትን አዳዲስ መረጃዎች በሙሉ በLocalStorage እናስቀምጣለን
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("fullName", data.user.fullName); // አዲሱ fullName
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("profilePic", data.user.profilePicture || ""); // አዲሱ profilePicture

      // 3. Redirect by role
      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data.user.role === "employee") {
        navigate("/employee-dashboard");
      } else if (data.user.role === "pensioner") {
        navigate("/customer-dashboard");
      }

    } catch (error) {
      console.error(error);
      alert("Login Failed");
    }
  };

  return (
    <div className="login-container">
      <div className="signup-nav-btn-container">
        <button type="button" onClick={() => navigate("/")} className="back-to-dashboard-btn">
          <strong>← ወደ ዋና ማውጫ</strong>
        </button>
      </div>

      <div className="login-box">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>

          <div className="input-group">
            <label>Email or TIN Number</label>
            <input
              type="text"
              name="username"
              placeholder="example@email.com or 1234567890"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">
            Login
          </button>

          <div className="login-footer">
            <span>
              Don't have an account? <a href="/signup">Sign Up</a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
