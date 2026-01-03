import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Trash2,
  ArrowLeft,
  Pencil,
  Users
} from "lucide-react";

export default function CreateUser({ onNavigate }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPass, setShowPass] = useState(false);

  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [showRowPass, setShowRowPass] = useState({});

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/list`
    );
    const data = await res.json();
    if (data.success) setUsers(data.rows);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= CREATE ================= */
  const save = async () => {
    if (!name || !username || !password)
      return alert("All fields required");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role })
      }
    );

    const d = await res.json();
    if (!d.success) return alert(d.error);

    alert("🎉 User Created Successfully");
    setName("");
    setUsername("");
    setPassword("");
    setRole("user");
    loadUsers();
  };

  /* ================= UPDATE ================= */
  const updateUser = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser)
      }
    );

    const d = await res.json();
    if (!d.success) return alert(d.error);

    alert("✅ User Updated");
    setEditUser(null);
    loadUsers();
  };

  /* ================= DELETE ================= */
  const deleteUser = async (u) => {
    const pass = prompt("Enter delete password");
    if (pass !== "786") return alert("❌ Wrong Password");

    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/delete/${u.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );

    alert("🗑 User Deleted");
    loadUsers();
  };

  return (
    <div className="user-wrap">
      <div className="container py-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4 text-white">
          <h3 className="fw-bold">
            <Users size={22} className="me-2" />
            User Management
          </h3>
          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* CREATE USER */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <h5 className="fw-bold text-white mb-3">➕ Create New User</h5>

            <div className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <div className="input-group">
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <span
                    className="input-group-text pointer"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </span>
                </div>
              </div>

              <div className="col-md-2">
                <select
                  className="form-control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="col-md-1 d-grid">
                <button className="btn btn-success" onClick={save}>
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* USER LIST */}
        <div className="card glass-card">
          <div className="card-body">
            <h5 className="fw-bold text-white mb-3">👥 Users List</h5>

            <div className="table-responsive">
              <table className="table table-borderless align-middle text-white">
                <thead>
                  <tr className="text-white-50">
                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th width="120">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-bold">{u.name}</td>
                      <td>{u.username}</td>
                      <td>
                        {showRowPass[u.id] ? u.password : "••••••••"}
                        <span
                          className="ms-2 pointer"
                          onClick={() =>
                            setShowRowPass({
                              ...showRowPass,
                              [u.id]: !showRowPass[u.id]
                            })
                          }
                        >
                          {showRowPass[u.id]
                            ? <EyeOff size={14} />
                            : <Eye size={14} />}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === "admin"
                              ? "bg-purple"
                              : "bg-info"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => setEditUser({ ...u, password: "" })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(u)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* EDIT USER */}
        {editUser && (
          <div className="card glass-card mt-4">
            <div className="card-body">
              <h5 className="fw-bold text-white mb-3">✏ Edit User</h5>

              <input
                className="form-control mb-2"
                value={editUser.name}
                onChange={e =>
                  setEditUser({ ...editUser, name: e.target.value })
                }
              />

              <input
                className="form-control mb-2"
                value={editUser.username}
                onChange={e =>
                  setEditUser({ ...editUser, username: e.target.value })
                }
              />

              <input
                type="password"
                className="form-control mb-2"
                placeholder="New Password"
                value={editUser.password}
                onChange={e =>
                  setEditUser({ ...editUser, password: e.target.value })
                }
              />

              <select
                className="form-control mb-3"
                value={editUser.role}
                onChange={e =>
                  setEditUser({ ...editUser, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <button className="btn btn-success me-2" onClick={updateUser}>
                <Save size={16} /> Save
              </button>
              <button
                className="btn btn-light"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>

      {/* STYLES */}
      <style>{`
        .user-wrap {
          min-height: 100vh;
          background: linear-gradient(135deg, #141e30, #243b55);
        }

        .glass-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .bg-purple {
          background: linear-gradient(135deg, #7f00ff, #e100ff);
        }

        .pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
