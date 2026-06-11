import React, {
  useState,
  useEffect,
  useCallback
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "./AdminDashboard.css";

const API_URL =
  "https://poessa-digital-services-1.onrender.com";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [newUser, setNewUser] =
    useState({
      username: "",
      password: "",
      role: "employee"
    });

  const getAuthConfig = () => {
    const token =
      localStorage.getItem(
        "token"
      );

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchUsers =
    useCallback(async () => {
      try {
        const res =
          await axios.get(
            `${API_URL}/api/admin/users`,
            getAuthConfig()
          );

        setUsers(
          res.data.users || []
        );
      } catch (err) {
        console.error(
          "Fetch Users Error:",
          err
        );

        if (
          err.response?.status ===
          401
        ) {
          localStorage.removeItem(
            "token"
          );

          navigate("/login");
        }
      }
    }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate =
    async () => {
      if (
        !newUser.username.trim() ||
        !newUser.password.trim()
      ) {
        alert(
          "እባክዎ ሁሉንም መረጃ ያስገቡ"
        );
        return;
      }

      try {
        setLoading(true);

        await axios.post(
          `${API_URL}/api/admin/create-user`,
          newUser,
          getAuthConfig()
        );

        alert(
          "ተጠቃሚው በተሳካ ሁኔታ ተፈጥሯል"
        );

        setNewUser({
          username: "",
          password: "",
          role: "employee"
        });

        fetchUsers();
      } catch (err) {
        console.error(
          "Create User Error:",
          err
        );

        alert(
          err.response?.data
            ?.message ||
            "ተጠቃሚ መፍጠር አልተቻለም"
        );
      } finally {
        setLoading(false);
      }
    };

  const toggleBlock =
    async (
      userId,
      isBlocked
    ) => {
      try {
        const endpoint =
          isBlocked
            ? "unblock"
            : "block";

        await axios.put(
          `${API_URL}/api/admin/${endpoint}/${userId}`,
          {},
          getAuthConfig()
        );

        fetchUsers();
      } catch (err) {
        console.error(
          "Block Error:",
          err
        );

        alert(
          "ተግባሩን ማከናወን አልተቻለም"
        );
      }
    };

  const deleteUser =
    async (userId) => {
      const confirmDelete =
        window.confirm(
          "ይህን ተጠቃሚ መሰረዝ ይፈልጋሉ?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await axios.delete(
          `${API_URL}/api/admin/delete/${userId}`,
          getAuthConfig()
        );

        alert(
          "ተጠቃሚው ተሰርዟል"
        );

        fetchUsers();
      } catch (err) {
        console.error(
          "Delete Error:",
          err
        );

        alert(
          "መሰረዝ አልተቻለም"
        );
      }
    };

  return (
    <div className="Admin-dashboard-page">
      <Sidebar />

      <div className="Admin-main-content">
        <Header title="POESSA | አስተዳደር ፓነል" />

        <section className="admin-actions">
          <h3>
            አዲስ ተጠቃሚ
            መመዝገቢያ
          </h3>

          <input
            type="text"
            placeholder="Username"
            value={
              newUser.username
            }
            onChange={(e) =>
              setNewUser({
                ...newUser,
                username:
                  e.target.value
              })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={
              newUser.password
            }
            onChange={(e) =>
              setNewUser({
                ...newUser,
                password:
                  e.target.value
              })
            }
          />

          <select
            value={newUser.role}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                role:
                  e.target.value
              })
            }
          >
            <option value="employee">
              Employee
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="pensioner">
              Pensioner
            </option>
          </select>

          <button
            onClick={
              handleCreate
            }
            disabled={
              loading
            }
          >
            {loading
              ? "በማስመዝገብ ላይ..."
              : "ተጠቃሚ ያክሉ"}
          </button>
        </section>

        <section className="admin-users">
          <h3>
            የተጠቃሚዎች
            ዝርዝር
          </h3>

          <table className="admin-user-table">
            <thead>
              <tr>
                <th>
                  Username
                </th>
                <th>
                  Role
                </th>
                <th>
                  Status
                </th>
                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.length >
              0 ? (
                users.map(
                  (
                    user
                  ) => (
                    <tr
                      key={
                        user._id
                      }
                    >
                      <td>
                        {
                          user.username
                        }
                      </td>

                      <td>
                        {
                          user.role
                        }
                      </td>

                      <td>
                        {user.isBlocked
                          ? "ታግዷል"
                          : "ንቁ"}
                      </td>

                      <td>
                        <button
                          className={
                            user.isBlocked
                              ? "btn-unblock"
                              : "btn-block"
                          }
                          onClick={() =>
                            toggleBlock(
                              user._id,
                              user.isBlocked
                            )
                          }
                        >
                          {user.isBlocked
                            ? "ክፈት"
                            : "አግድ"}
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() =>
                            deleteUser(
                              user._id
                            )
                          }
                        >
                          ሰርዝ
                        </button>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign:
                        "center"
                    }}
                  >
                    ምንም
                    ተጠቃሚ
                    አልተገኘም
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;