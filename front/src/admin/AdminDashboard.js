import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'employee' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // useCallback በመጠቀም fetchUsers ማስጠንቀቂያን እናስተካክላለን
  const fetchUsers = useCallback(async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://your-backend-url.onrender.com/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.users);
    } catch (err) {
        console.error("Access Denied:", err);
        if (err.response?.status === 401) navigate('/login');
    }
  }, [navigate]);

  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);

  const handleCreate = async () => {
    if (!newUser.username || !newUser.password) return alert("እባክዎ መረጃዎችን በትክክል ያስገቡ");
    try {
      setLoading(true);
      await axios.post('https://your-backend-url.onrender.com/api/admin/create-user', newUser);
      alert("ተጠቃሚው በተሳካ ሁኔታ ተፈጥሯል");
      setNewUser({ username: '', password: '', role: 'employee' });
      fetchUsers();
    } catch (err) {
      alert("ተጠቃሚ መፍጠር አልተቻለም");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (id, isBlocked) => {
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      await axios.put(`https://poessa-digital-services-1.onrender.com/api/admin/${endpoint}/${id}`);
      fetchUsers();
    } catch (err) {
      alert("ተግባሩን ማከናወን አልተቻለም");
    }
  };

  return (
    <div className="Admin-dashboard-page">
      <Sidebar />
      <div className="Admin-main-content">
        <Header title="POESSA | አስተዳደር ፓነል" />

        <section className="admin-actions">
          <h3>አዲስ ተጠቃሚ መመዝገቢያ</h3>
          <input 
            placeholder="Username" 
            value={newUser.username}
            onChange={e => setNewUser({...newUser, username: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={newUser.password}
            onChange={e => setNewUser({...newUser, password: e.target.value})} 
          />
          <select onChange={e => setNewUser({...newUser, role: e.target.value})} value={newUser.role}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreate} disabled={loading}>
            {loading ? "በማስመዝገብ ላይ..." : "ተጠቃሚ ያክሉ"}
          </button>
        </section>

        <table className="admin-user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.isBlocked ? "ታግዷል" : "ንቁ"}</td>
                <td>
                  <button 
                    className={u.isBlocked ? "btn-unblock" : "btn-block"}
                    onClick={() => toggleBlock(u._id, u.isBlocked)}
                  >
                    {u.isBlocked ? "ክፈት" : "አግድ"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;