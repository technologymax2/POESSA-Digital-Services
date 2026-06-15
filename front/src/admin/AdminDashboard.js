import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./AdminDashboard.css";

const API_URL = "https://poessa-digital-services-1.onrender.com";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentLang, setCurrentLang] = useState("am");

  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "employee",
    profilePicture: ""
  });

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, getAuthConfig());
      setUsers(res.data.users || []);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async () => {
    if (!newUser.username || !newUser.fullName || !newUser.password) {
      alert("እባክዎ Username፣ ሙሉ ስም እና Password ያስገቡ");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/create-user`, newUser, getAuthConfig());
      setNewUser({ username: "", fullName: "", password: "", role: "employee", profilePicture: "" });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "ምዝገባ አልተሳካም");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id, blocked) => {
    try {
      await axios.put(`${API_URL}/api/admin/${blocked ? "unblock" : "block"}/${id}`, {}, getAuthConfig());
      fetchUsers();
    } catch {
      alert("Operation failed");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("ይህንን ተጠቃሚ ለመሰረዝ እርግጠኛ ነዎት?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/delete/${id}`, getAuthConfig());
      fetchUsers();
    } catch {
      alert("Delete failed");
    }
  };

  const resetPassword = async (id) => {
    const password = prompt("አዲስ የይለፍ ቃል ያስገቡ");
    if (!password) return;
    try {
      await axios.put(`${API_URL}/api/admin/reset-password/${id}`, { newPassword: password }, getAuthConfig());
      alert("Password Updated");
    } catch {
      alert("Failed");
    }
  };

  const admins = useMemo(() => users.filter((u) => u.role === "admin"), [users]);
  const employees = useMemo(() => users.filter((u) => u.role === "employee"), [users]);

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} currentLang={currentLang} toggleLanguage={() => setCurrentLang(prev => prev === "am" ? "en" : "am")} />
      
      <main className="dashboard-main">
        <Header title="POESSA Admin Dashboard" />

        <div className="stats-grid">
          <div className="stat-card"><h2>{users.length}</h2><p>ጠቅላላ ተጠቃሚዎች</p></div>
          <div className="stat-card"><h2>{admins.length}</h2><p>አድሚኖች</p></div>
          <div className="stat-card"><h2>{employees.length}</h2><p>ሰራተኞች</p></div>
          <div className="stat-card"><h2>{users.filter(u => !u.isBlocked).length}</h2><p>ንቁ ተጠቃሚዎች</p></div>
        </div>

        <section className="user-form-card">
          <h3>አዲስ ተጠቃሚ መዝግብ</h3>
          <div className="form-grid">
            <input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
            <input type="text" placeholder="ሙሉ ስም (Full Name)" value={newUser.fullName} onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} />
            <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
            <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
              <option value="employee">ሰራተኛ (Employee)</option>
              <option value="admin">አድሚን (Admin)</option>
            </select>
            <input type="text" placeholder="Profile Picture URL" value={newUser.profilePicture} onChange={(e) => setNewUser({...newUser, profilePicture: e.target.value})} />
            <button onClick={createUser}>{loading ? "በመመዝገብ ላይ..." : "ተጠቃሚ ፍጠር"}</button>
          </div>
        </section>

        <h3 className="section-title">አድሚኖች</h3>
        <UserTable users={admins} toggleBlock={toggleBlock} deleteUser={deleteUser} resetPassword={resetPassword} />

        <h3 className="section-title">ሰራተኞች</h3>
        <UserTable users={employees} toggleBlock={toggleBlock} deleteUser={deleteUser} resetPassword={resetPassword} />
        <Footer />
      </main>
    </div>
  );
};

const UserTable = ({ users, toggleBlock, deleteUser, resetPassword }) => (
  <div className="table-wrapper">
    <table className="admin-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>ሙሉ ስም</th>
          <th>ሁኔታ</th>
          <th>ድርጊት</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user._id}>
            <td>{user.username}</td>
            <td>{user.fullName || "N/A"}</td>
            <td>{user.isBlocked ? "ታግዷል" : "ንቁ"}</td>
            <td>
              <button className="danger-btn" onClick={() => toggleBlock(user._id, user.isBlocked)}>{user.isBlocked ? "አንቃ" : "አግድ"}</button>
              <button className="warning-btn" onClick={() => resetPassword(user._id)}>የይለፍ ቃል ቀይር</button>
              <button className="dark-btn" onClick={() => deleteUser(user._id)}>ሰርዝ</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;
