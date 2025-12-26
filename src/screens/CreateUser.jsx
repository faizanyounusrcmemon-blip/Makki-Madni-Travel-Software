import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Trash2,
  ArrowLeft,
  Pencil
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

    if (!d.success) {
      alert(d.error || "User create failed");
      return;
    }

    alert("✅ User Created Successfully");

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

    if (!d.success) {
      alert(d.error || "Update failed");
      return;
    }

    alert("✅ User Updated");
    setEditUser(null);
    loadUsers();
  };

  /* ================= DELETE ================= */
  const deleteUser = async (u) => {
    const pass = prompt("Enter delete password");
    if (pass !== "786") return alert("❌ Wrong Password");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/delete/${u.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );

    const d = await res.json();
    if (!d.success) return alert(d.error || "Delete failed");

    alert("🗑 User Deleted");
    loadUsers();
  };

  return (
    <div className="container p-3">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">👤 User Management</h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* CREATE USER */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h5 className="mb-3">➕ Create User</h5>

          <input
            className="form-control mb-2"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <input
            className="form-control mb-2"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <div className="input-group mb-2">
            <input
              type={showPass ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span
              className="input-group-text"
              style={{ cursor: "pointer" }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </div>

          <select
            className="form-control mb-3"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button className="btn btn-success" onClick={save}>
            <UserPlus size={16} /> Create User
          </button>
        </div>
      </div>

      {/* USER LIST */}
      <div className="card shadow">
        <div className="card-body">
          <h5 className="mb-3">👥 Users List</h5>

          <table className="table table-bordered table-sm">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th width="160">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>

                  <td>
                    {showRowPass[u.id] ? u.password : "••••••••"}
                    <span
                      style={{ cursor: "pointer", marginLeft: 8 }}
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
                      className={
                        u.role === "admin"
                          ? "badge bg-danger"
                          : "badge bg-secondary"
                      }
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

              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER */}
      {editUser && (
        <div className="card shadow mt-3">
          <div className="card-body">
            <h5>✏ Edit User</h5>

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
              placeholder="New Password (optional)"
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

            <button className="btn btn-primary me-2" onClick={updateUser}>
              <Save size={16} /> Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
