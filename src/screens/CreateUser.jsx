
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
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

  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);

  const [showPass, setShowPass] = useState(false);
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
    loadUsers(); // پہلے load
    const interval = setInterval(loadUsers, 5000); // ہر 5 سیکنڈ بعد اپ ڈیٹ
    return () => clearInterval(interval);
  }, []);



/* ================= PASSWORD POPUP ================= */
const askPassword = async (title = "Enter Password") => {
  const { value } = await Swal.fire({
    width: "300px",
    html: `
      <div style="text-align:left;font-size:13px">
        <b>${title}</b>
        <div style="position:relative;margin-top:10px">
          <input id="swal-pass" type="password" class="swal2-input"
            style="height:34px;font-size:13px" placeholder="Enter password"/>
          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
          ">👁</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "OK",
    focusConfirm: false,

    preConfirm: () => {
      const input = document.getElementById("swal-pass");
      const val = input.value.trim();

      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }

      if (val !== "786") {
        const popup = document.querySelector(".swal2-popup");
        if (popup) {
          popup.classList.add("shake");
          setTimeout(() => popup.classList.remove("shake"), 400);
        }

        Swal.showValidationMessage("Wrong Password 😎");
        return false;
      }

      return val;
    },

    didOpen: () => {
      const input = document.getElementById("swal-pass");
      const toggle = document.getElementById("toggle-pass");

      let show = false;

      toggle.addEventListener("click", () => {
        show = !show;
        input.type = show ? "text" : "password";
        toggle.textContent = show ? "🙈" : "👁";
      });
    }
  });

  return value;
};


/* ================= SAVE / UPDATE ================= */
const save = async () => {

  if (!name || !username) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: "All fields required"
    });
  }

  const url = editId ? `/api/users/update` : `/api/users/create`;

  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}${url}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        name,
        username,
        password,
        role
      })
    }
  );

  const d = await res.json();

  if (!d.success) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: d.error
    });
  }

  Swal.fire({
    width: "300px",
    icon: "success",
    text: editId ? "User Updated Successfully" : "User Created Successfully"
  });

  setName("");
  setUsername("");
  setPassword("");
  setRole("user");
  setEditId(null);

  loadUsers();
};


/* ================= DELETE ================= */
const deleteUser = async (u) => {

  const confirmDelete = await Swal.fire({
    width: "300px",
    icon: "warning",
    text: "Are you sure you want to delete this user?",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel"
  });

  if (!confirmDelete.isConfirmed) return;

  const pass = await askPassword("Enter Delete Password");
  if (!pass) return;

  Swal.fire({
    width: "260px",
    title: "Deleting...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/delete/${u.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );

    Swal.close();

    Swal.fire({
      width: "280px",
      icon: "success",
      text: "User Deleted"
    });

    loadUsers();

  } catch {
    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Delete failed"
    });
  }
};


/* ================= EDIT ================= */
const editUser = async (u) => {

  const pass = await askPassword("Enter Edit Password");
  if (!pass) return;

  setName(u.name);
  setUsername(u.username);
  setPassword(u.password);
  setRole(u.role);

  setEditId(u.id);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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

        {/* CREATE / EDIT USER */}

        <div className="card glass-card mb-4">

          <div className="card-body">

            <h5 className="fw-bold text-white mb-3">

              {editId ? "✏ Edit User" : "➕ Create New User"}

            </h5>

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

                <button
                  className={`btn ${editId ? "btn-warning" : "btn-success"}`}
                  onClick={save}
                >
                  {editId ? <Save size={16} /> : <UserPlus size={16} />}
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

                  <tr>

                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Last Logout</th>
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

                      {/* STATUS */}

<td>
  <span className={`status-dot ${u.is_online ? "online" : "offline"}`}></span>
  {u.is_online ? "Online" : "Offline"}
</td>

<td>
  {u.last_login
    ? new Date(new Date(u.last_login).getTime() + (0 * 60 * 60 * 1000))
        .toLocaleString()
    : "Never"}
</td>

<td>
  {u.last_logout
    ? new Date(new Date(u.last_logout).getTime() + (0 * 60 * 60 * 1000))
        .toLocaleString()
    : "Never"}
</td>


                      {/* ACTION */}

                      <td>

                        <button
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => editUser(u)}
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

        .status-dot{
          height:10px;
          width:10px;
          border-radius:50%;
          display:inline-block;
          margin-right:6px;
        }

        .online{
          background:#00ff7f;
          box-shadow:0 0 6px #00ff7f;
        }

        .offline{
          background:#aaa;
        }

      `}</style>

    </div>
  );
}