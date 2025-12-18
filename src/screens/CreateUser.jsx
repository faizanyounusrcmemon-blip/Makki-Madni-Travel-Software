import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Save, UserPlus } from "lucide-react";

export default function CreateUser() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPass, setShowPass] = useState(false);

  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [showRowPass, setShowRowPass] = useState({});

  /* ===============================
     LOAD USERS
  =============================== */
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

  /* ===============================
     CREATE USER
  =============================== */
  const save = async () => {
    if (!name || !username || !password)
      return alert("All fields required");

    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role })
      }
    );

    alert("User Created");
    setName("");
    setUsername("");
    setPassword("");
    setRole("user");
    loadUsers();
  };

  /* ===============================
     UPDATE PASSWORD
  =============================== */
  const updatePassword = async () => {
    if (!editPassword) return alert("Password required");

    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/update-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUser.username,
          password: editPassword
        })
      }
    );

    alert("Password Updated");
    setEditUser(null);
    setEditPassword("");
    loadUsers();
  };

  return (
    <div className="container p-3">
      {/* ================= CREATE USER ================= */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">👤 Create User</h4>

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

      {/* ================= USER LIST ================= */}
      <div className="card shadow">
        <div className="card-body">
          <h4 className="mb-3">👥 Users List</h4>

          <table className="table table-bordered table-sm">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th width="120">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No users
                  </td>
                </tr>
              )}

              {users.map(u => (
                <tr key={u.username}>
                  <td>{u.name}</td>
                  <td>{u.username}</td>

                  <td>
                    {showRowPass[u.username]
                      ? u.password
                      : "••••••••"}
                    <span
                      style={{ cursor: "pointer", marginLeft: 8 }}
                      onClick={() =>
                        setShowRowPass({
                          ...showRowPass,
                          [u.username]: !showRowPass[u.username]
                        })
                      }
                    >
                      {showRowPass[u.username]
                        ? <EyeOff size={14} />
                        : <Eye size={14} />}
                    </span>
                  </td>

                  <td>
                    <span className={
                      u.role === "admin"
                        ? "badge bg-danger"
                        : "badge bg-secondary"
                    }>
                      {u.role}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => setEditUser(u)}
                    >
                      Change Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CHANGE PASSWORD ================= */}
      {editUser && (
        <div className="card shadow mt-3">
          <div className="card-body">
            <h5>
              🔐 Change Password — <b>{editUser.username}</b>
            </h5>

            <input
              type="password"
              className="form-control mb-2"
              placeholder="New Password"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
            />

            <button
              className="btn btn-primary me-2"
              onClick={updatePassword}
            >
              <Save size={16} /> Save
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditUser(null);
                setEditPassword("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
