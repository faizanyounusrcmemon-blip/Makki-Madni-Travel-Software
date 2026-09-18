import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  Save,
  UserPlus,
  Trash2,
  ArrowLeft,
  Pencil,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
  X,
  RefreshCw,
} from "lucide-react";

export default function CreateUser({ onNavigate }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isActive, setIsActive] = useState(true);

  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);

  const [showPass, setShowPass] = useState(false);
  const [showRowPass, setShowRowPass] = useState({});
  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOAD USERS
  ========================================================= */
  const loadUsers = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/list`
      );

      const data = await res.json();

      if (data.success) {
        setUsers(data.rows || []);
      }
    } catch (err) {
      console.error("Load users error:", err);
    }
  };

  useEffect(() => {
    loadUsers();

    const interval = setInterval(loadUsers, 5000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */
  const isUserActive = (u) =>
    u.is_active === true || u.is_active === "true";

  const isUserOnline = (u) =>
    u.is_online === true ||
    u.is_online === "true" ||
    u.is_online === 1;

  const formatDateTime = (value) => {
    if (!value) return "Never";

    try {
      return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Never";
    }
  };

  /* =========================================================
     STATISTICS
  ========================================================= */
  const totalUsers = users.length;

  const totalAdmins = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const totalActive = useMemo(
    () => users.filter((u) => isUserActive(u)).length,
    [users]
  );

  const totalOnline = useMemo(
    () => users.filter((u) => isUserOnline(u)).length,
    [users]
  );

  /* =========================================================
     PASSWORD POPUP
  ========================================================= */
  const askPassword = async (title = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "390px",
      padding: "0",
      background: "#fff",
      customClass: {
        popup: "mmt-user-popup",
        confirmButton: "mmt-confirm-btn",
        cancelButton: "mmt-cancel-btn",
      },

      html: `
        <div style="
          padding:24px;
          text-align:left;
          font-family:Inter,Arial,sans-serif;
        ">

          <div style="
            display:flex;
            align-items:center;
            gap:12px;
            margin-bottom:18px;
          ">

            <div style="
              width:48px;
              height:48px;
              border-radius:15px;
              background:linear-gradient(135deg,#1e3a8a,#4f46e5);
              display:flex;
              align-items:center;
              justify-content:center;
              color:#fff;
              box-shadow:0 8px 22px rgba(37,99,235,.22);
            ">
              🔐
            </div>

            <div>
              <div style="
                font-size:17px;
                font-weight:800;
                color:#0f172a;
              ">
                ${title}
              </div>

              <div style="
                font-size:11px;
                color:#475569;
                margin-top:3px;
                font-weight:600;
              ">
                Security verification required
              </div>
            </div>

          </div>

          <div style="
            background:#f1f5f9;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:11px 12px;
            margin-bottom:14px;
            color:#334155;
            font-size:12px;
            font-weight:600;
            line-height:1.5;
          ">
            🛡️ Please enter your authorized security password to continue.
          </div>

          <div style="position:relative;">

            <input
              id="swal-pass"
              type="password"
              class="swal2-input"
              style="
                width:100%;
                height:43px;
                box-sizing:border-box;
                margin:0;
                padding:0 46px 0 13px;
                border-radius:10px;
                border:1px solid #94a3b8;
                font-size:13px;
                color:#0f172a;
                font-weight:600;
                box-shadow:none;
              "
              placeholder="Enter security password"
            />

            <span
              id="toggle-pass"
              style="
                position:absolute;
                right:13px;
                top:50%;
                transform:translateY(-50%);
                cursor:pointer;
                z-index:10;
                color:#475569;
              "
            >
              👁
            </span>

          </div>

        </div>
      `,

      showCancelButton: true,
      confirmButtonText: "🔓 Continue",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      focusConfirm: false,

      preConfirm: () => {
        const input = document.getElementById("swal-pass");

        const val = input?.value.trim();

        if (!val) {
          Swal.showValidationMessage("Password is required");
          return false;
        }

        return val;
      },

      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");

        if (input && toggle) {
          let show = false;

          toggle.addEventListener("click", () => {
            show = !show;

            input.type = show ? "text" : "password";

            toggle.textContent = show ? "🙈" : "👁";
          });

          input.focus();
        }
      },
    });

    return value;
  };

  /* =========================================================
     SAVE / UPDATE USER
  ========================================================= */
  const save = async () => {
    if (!name.trim() || !username.trim()) {
      return Swal.fire({
        width: "360px",
        icon: "warning",
        title: "Required Information",
        text: "Please enter Full Name and Username.",
        confirmButtonColor: "#2563eb",
        customClass: {
          popup: "rounded-4 shadow-lg border-0",
        },
      });
    }

    if (!editId && !password.trim()) {
      return Swal.fire({
        width: "360px",
        icon: "warning",
        title: "Password Required",
        text: "Please enter a password for the new user.",
        confirmButtonColor: "#2563eb",
        customClass: {
          popup: "rounded-4 shadow-lg border-0",
        },
      });
    }

    setLoading(true);

    const url = editId
      ? `/api/users/update`
      : `/api/users/create`;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${url}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editId,
            name: name.trim(),
            username: username.trim(),
            password,
            role,
            is_active: isActive,
          }),
        }
      );

      const d = await res.json();

      if (!d.success) {
        setLoading(false);

        return Swal.fire({
          width: "370px",
          icon: "error",
          title: "Unable to Save",
          text: d.error || "Something went wrong.",
          confirmButtonColor: "#dc2626",
          customClass: {
            popup: "rounded-4 shadow-lg border-0",
          },
        });
      }

      await Swal.fire({
        width: "380px",
        icon: "success",
        title: editId
          ? "User Updated Successfully"
          : "User Created Successfully",
        html: `
          <div style="
            font-size:13px;
            color:#334155;
            font-weight:600;
          ">
            ${editId
              ? "User account details have been updated."
              : "New user account has been created successfully."}
          </div>
        `,
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
        customClass: {
          popup: "rounded-4 shadow-lg border-0",
        },
      });

      clearForm();
      await loadUsers();
    } catch (err) {
      Swal.fire({
        width: "370px",
        icon: "error",
        title: "Connection Error",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLEAR FORM
  ========================================================= */
  const clearForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setRole("user");
    setIsActive(true);
    setEditId(null);
    setShowPass(false);
  };

  /* =========================================================
     DELETE USER
  ========================================================= */
  const deleteUser = async (u) => {
    const confirmDelete = await Swal.fire({
      width: "390px",
      padding: "0",
      icon: "warning",
      title: "Delete User?",
      html: `
        <div style="
          font-size:13px;
          color:#334155;
          line-height:1.6;
          font-weight:600;
        ">
          You are about to delete
          <strong style="color:#0f172a;">
            ${u.name || u.username}
          </strong>
          <br/>
          This action requires security verification.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🗑️ Delete User",
      cancelButtonText: "Keep User",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-4 shadow-lg border-0",
      },
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("Delete Authorization");

    if (!pass) return;

    Swal.fire({
      width: "300px",
      padding: "25px",
      title: "Deleting User...",
      html: `
        <div style="
          font-size:12px;
          color:#475569;
          font-weight:600;
        ">
          Please wait...
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/delete/${u.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: pass,
          }),
        }
      );

      const d = await res.json();

      Swal.close();

      if (!d.success) {
        return Swal.fire({
          width: "360px",
          icon: "error",
          title: "Delete Failed",
          text: d.error || "Invalid security password.",
          confirmButtonColor: "#dc2626",
        });
      }

      await Swal.fire({
        width: "360px",
        icon: "success",
        title: "User Deleted",
        text: "The user account has been deleted successfully.",
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
      });

      if (editId === u.id) {
        clearForm();
      }

      loadUsers();
    } catch {
      Swal.close();

      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Delete Failed",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /* =========================================================
     EDIT USER
  ========================================================= */
  const editUser = async (u) => {
    const pass = await askPassword("Edit Authorization");

    if (!pass) return;

    Swal.fire({
      width: "300px",
      padding: "25px",
      title: "Verifying...",
      html: `
        <div style="
          font-size:12px;
          color:#475569;
          font-weight:600;
        ">
          Checking authorization...
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/verify-edit-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: pass,
          }),
        }
      );

      const d = await res.json();

      Swal.close();

      if (!d.success) {
        return Swal.fire({
          width: "360px",
          icon: "error",
          title: "Access Denied",
          text: d.error || "Invalid security password.",
          confirmButtonColor: "#dc2626",
        });
      }

      setName(u.name || "");
      setUsername(u.username || "");
      setPassword(u.password || "");
      setRole(u.role || "user");
      setIsActive(isUserActive(u));
      setEditId(u.id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch {
      Swal.close();

      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Verification Failed",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="mmt-users-page">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="mmt-container">

        <div className="mmt-header">

          <div className="mmt-header-glow glow-one"></div>
          <div className="mmt-header-glow glow-two"></div>

          <div className="mmt-header-content">

            <div className="mmt-brand">

              <div className="mmt-brand-icon">
                <Users size={28} />
              </div>

              <div>
                <div className="mmt-overline">
                  MAKKI MADNI TRAVEL & TOURS
                </div>

                <h2>
                  User Management
                </h2>

                <p>
                  Create, manage and monitor system user accounts
                </p>
              </div>

            </div>

            <button
              type="button"
              className="mmt-back-btn"
              onClick={() => onNavigate("dashboard")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

          </div>
        </div>

        {/* =====================================================
            STAT CARDS
        ===================================================== */}
        <div className="mmt-stats">

          <div className="mmt-stat-card blue">
            <div className="mmt-stat-icon">
              <Users size={24} />
            </div>

            <div>
              <span>Total Users</span>
              <strong>{totalUsers}</strong>
              <small>Registered accounts</small>
            </div>
          </div>

          <div className="mmt-stat-card purple">
            <div className="mmt-stat-icon">
              <ShieldCheck size={24} />
            </div>

            <div>
              <span>Administrators</span>
              <strong>{totalAdmins}</strong>
              <small>Admin accounts</small>
            </div>
          </div>

          <div className="mmt-stat-card green">
            <div className="mmt-stat-icon">
              <UserCheck size={24} />
            </div>

            <div>
              <span>Active Users</span>
              <strong>{totalActive}</strong>
              <small>Enabled accounts</small>
            </div>
          </div>

          <div className="mmt-stat-card cyan">
            <div className="mmt-stat-icon">
              <Wifi size={24} />
            </div>

            <div>
              <span>Online Now</span>
              <strong>{totalOnline}</strong>
              <small>Currently online</small>
            </div>
          </div>

        </div>

        {/* =====================================================
            CREATE / EDIT CARD
        ===================================================== */}
        <div className="mmt-form-card">

          <div className="mmt-section-head">

            <div className="mmt-section-title">

              <div className="mmt-section-icon">
                {editId ? (
                  <Pencil size={20} />
                ) : (
                  <UserPlus size={20} />
                )}
              </div>

              <div>
                <h4>
                  {editId
                    ? "Edit User Account"
                    : "Create New User"}
                </h4>

                <p>
                  {editId
                    ? "Update account information and access status"
                    : "Add a new user to your travel management system"}
                </p>
              </div>

            </div>

            {editId && (
              <div className="editing-badge">
                <Pencil size={13} />
                Editing User #{editId}
              </div>
            )}

          </div>

          <div className="mmt-form-body">

            <div className="row g-3">

              {/* NAME */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>FULL NAME</label>

                <div className="mmt-input-wrap">
                  <span>👤</span>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />
                </div>
              </div>

              {/* USERNAME */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>USERNAME</label>

                <div className="mmt-input-wrap">
                  <span>🔑</span>

                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>PASSWORD</label>

                <div className="mmt-input-wrap">
                  <span>🔐</span>

                  <input
                    type={
                      showPass
                        ? "text"
                        : "password"
                    }
                    placeholder={
                      editId
                        ? "User password"
                        : "Create password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="mmt-eye"
                    onClick={() =>
                      setShowPass(!showPass)
                    }
                  >
                    {showPass ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* ROLE */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>USER ROLE</label>

                <div className="mmt-select-wrap">
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value)
                    }
                  >
                    <option value="user">
                      👤 Standard User
                    </option>

                    <option value="admin">
                      🛡️ Administrator
                    </option>
                  </select>
                </div>
              </div>

              {/* STATUS */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>ACCOUNT STATUS</label>

                <div className="status-selector">

                  <button
                    type="button"
                    className={
                      isActive
                        ? "status-option active"
                        : "status-option"
                    }
                    onClick={() =>
                      setIsActive(true)
                    }
                  >
                    <UserCheck size={18} />
                    <div>
                      <strong>Active</strong>
                      <small>Login allowed</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={
                      !isActive
                        ? "status-option inactive"
                        : "status-option"
                    }
                    onClick={() =>
                      setIsActive(false)
                    }
                  >
                    <UserX size={18} />
                    <div>
                      <strong>Inactive</strong>
                      <small>Login blocked</small>
                    </div>
                  </button>

                </div>
              </div>

              {/* SAVE */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>
                  {editId
                    ? "UPDATE ACCOUNT"
                    : "CREATE ACCOUNT"}
                </label>

                <button
                  type="button"
                  disabled={loading}
                  onClick={save}
                  className={
                    editId
                      ? "mmt-save-btn edit"
                      : "mmt-save-btn"
                  }
                >
                  {loading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="spin"
                      />
                      Saving...
                    </>
                  ) : editId ? (
                    <>
                      <Save size={17} />
                      Update User
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create User
                    </>
                  )}
                </button>
              </div>

              {/* CANCEL */}
              {editId && (
                <div className="col-12 col-md-6 col-xl-4">
                  <label>CANCEL EDIT</label>

                  <button
                    type="button"
                    className="mmt-cancel-edit"
                    onClick={clearForm}
                  >
                    <X size={17} />
                    Cancel & Clear Form
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* =====================================================
            USERS LIST
        ===================================================== */}
        <div className="mmt-list-card">

          <div className="mmt-list-header">

            <div className="mmt-section-title">

              <div className="mmt-section-icon list">
                <Users size={20} />
              </div>

              <div>
                <h4>
                  Registered Users
                </h4>

                <p>
                  Monitor user accounts, activity and access
                </p>
              </div>

            </div>

            <div className="mmt-live-count">
              <span></span>
              {totalOnline} Online
            </div>

          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}
          <div className="table-responsive mmt-table-wrap">

            <table className="mmt-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th>Activity</th>
                  <th>Last Login</th>
                  <th>Last Logout</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="empty-users"
                    >
                      <Users size={38} />
                      <strong>No Users Found</strong>
                      <span>
                        There are currently no user accounts.
                      </span>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {

                    const active = isUserActive(u);
                    const online = isUserOnline(u);

                    return (
                      <tr
                        key={u.id}
                        className={
                          editId === u.id
                            ? "editing-row"
                            : ""
                        }
                      >

                        {/* USER */}
                        <td>
                          <div className="user-cell">

                            <div
                              className={
                                u.role === "admin"
                                  ? "avatar admin"
                                  : "avatar"
                              }
                            >
                              {u.role === "admin"
                                ? "🛡️"
                                : "👤"}
                            </div>

                            <div>
                              <strong>
                                {u.name ||
                                  "Unnamed User"}
                              </strong>

                              <small>
                                ID #{u.id}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* USERNAME */}
                        <td>
                          <span className="username-text">
                            @{u.username}
                          </span>
                        </td>

                        {/* PASSWORD */}
                        <td>
                          <div className="password-cell">

                            <span>
                              {showRowPass[u.id]
                                ? u.password
                                : "••••••••"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setShowRowPass({
                                  ...showRowPass,
                                  [u.id]:
                                    !showRowPass[u.id],
                                })
                              }
                            >
                              {showRowPass[u.id] ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>

                          </div>
                        </td>

                        {/* ROLE */}
                        <td>
                          <span
                            className={
                              u.role === "admin"
                                ? "role-badge admin"
                                : "role-badge user"
                            }
                          >
                            {u.role === "admin" ? (
                              <ShieldCheck size={13} />
                            ) : (
                              <Users size={13} />
                            )}

                            {u.role === "admin"
                              ? "Administrator"
                              : "User"}
                          </span>
                        </td>

                        {/* ACCOUNT STATUS */}
                        <td>
                          <span
                            className={
                              active
                                ? "account-badge active"
                                : "account-badge inactive"
                            }
                          >
                            {active ? (
                              <UserCheck size={13} />
                            ) : (
                              <UserX size={13} />
                            )}

                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ONLINE */}
                        <td>
                          <span
                            className={
                              online
                                ? "online-badge"
                                : "offline-badge"
                            }
                          >
                            <span className="status-dot"></span>

                            {online ? (
                              <>
                                <Wifi size={12} />
                                Online
                              </>
                            ) : (
                              <>
                                <WifiOff size={12} />
                                Offline
                              </>
                            )}
                          </span>
                        </td>

                        {/* LOGIN */}
                        <td>
                          <span className="date-text">
                            {formatDateTime(
                              u.last_login
                            )}
                          </span>
                        </td>

                        {/* LOGOUT */}
                        <td>
                          <span className="date-text">
                            {formatDateTime(
                              u.last_logout
                            )}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="action-buttons">

                            <button
                              type="button"
                              className="edit-btn"
                              title="Edit User"
                              onClick={() =>
                                editUser(u)
                              }
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              title="Delete User"
                              onClick={() =>
                                deleteUser(u)
                              }
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>
          </div>



          {/* FOOTER */}
          <div className="mmt-list-footer">
            <span>
              <Users size={14} />
              {totalUsers} registered accounts
            </span>

            <span>
              <Wifi size={14} />
              {totalOnline} currently online
            </span>

            <span>
              <ShieldCheck size={14} />
              {totalAdmins} administrators
            </span>
          </div>

        </div>

        {/* FOOT NOTE */}
        <div className="mmt-security-note">
          <ShieldCheck size={16} />

          <span>
            User editing and deletion are protected by
            administrator security verification.
          </span>
        </div>

      </div>

      {/* =====================================================
          ENHANCED DARK & HIGH CONTRAST STYLES
      ===================================================== */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        .mmt-users-page {
          min-height: 100vh;
          padding: 24px 16px 40px;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(37,99,235,.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 20%,
              rgba(124,58,237,.12),
              transparent 25%
            ),
            linear-gradient(
              135deg,
              #f1f5f9 0%,
              #e2e8f0 48%,
              #f1f5f9 100%
            );
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          color: #0f172a;
        }

        .mmt-container {
          max-width: 1500px;
          margin: 0 auto;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .mmt-header {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background:
            linear-gradient(
              135deg,
              #090d16 0%,
              #1e293b 45%,
              #1e1b4b 100%
            );
          box-shadow:
            0 20px 45px rgba(15,23,42,.25);
          margin-bottom: 20px;
        }

        .mmt-header-content {
          position: relative;
          z-index: 3;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .mmt-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mmt-brand-icon {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.25),
              rgba(255,255,255,.10)
            );
          border: 1px solid rgba(255,255,255,.30);
          box-shadow: 0 10px 25px rgba(0,0,0,.3);
          backdrop-filter: blur(12px);
        }

        .mmt-overline {
          color: #93c5fd;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .mmt-brand h2 {
          margin: 0;
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -.5px;
        }

        .mmt-brand p {
          margin: 4px 0 0;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 500;
        }

        .mmt-back-btn {
          border: 1px solid rgba(255,255,255,.30);
          background: rgba(255,255,255,.15);
          color: #ffffff;
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(10px);
          transition: .2s ease;
          cursor: pointer;
        }

        .mmt-back-btn:hover {
          background: rgba(255,255,255,.25);
          transform: translateY(-1px);
        }

        /* =====================================================
           STATS
        ===================================================== */

        .mmt-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .mmt-stat-card {
          min-height: 105px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 6px 20px rgba(15,23,42,.06);
          position: relative;
          overflow: hidden;
        }

        .mmt-stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mmt-stat-card.blue .mmt-stat-icon {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .mmt-stat-card.purple .mmt-stat-icon {
          background: #ede9fe;
          color: #6d28d9;
        }

        .mmt-stat-card.green .mmt-stat-icon {
          background: #d1fae5;
          color: #047857;
        }

        .mmt-stat-card.cyan .mmt-stat-icon {
          background: #cffafe;
          color: #0e7490;
        }

        .mmt-stat-card span {
          display: block;
          color: #475569;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .mmt-stat-card strong {
          display: block;
          margin-top: 2px;
          color: #0f172a;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 900;
        }

        .mmt-stat-card small {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        /* =====================================================
           FORM CARD & INPUTS (DARK & READABLE)
        ===================================================== */

        .mmt-form-card,
        .mmt-list-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(15,23,42,.08);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .mmt-section-head,
        .mmt-list-header {
          padding: 18px 22px;
          border-bottom: 1px solid #cbd5e1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .mmt-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mmt-section-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dbeafe;
          color: #1d4ed8;
        }

        .mmt-section-icon.list {
          background: #ede9fe;
          color: #6d28d9;
        }

        .mmt-section-title h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .mmt-section-title p {
          margin: 3px 0 0;
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }

        .editing-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          background: #fff7ed;
          border: 1px solid #fdba74;
          color: #c2410c;
          font-size: 11px;
          font-weight: 800;
        }

        .mmt-form-body {
          padding: 22px;
        }

        .mmt-form-body label {
          display: block;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .7px;
          color: #334155;
        }

        .mmt-input-wrap {
          height: 45px;
          border: 1px solid #94a3b8;
          background: #ffffff;
          border-radius: 11px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 10px;
          transition: .18s ease;
        }

        .mmt-input-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.15);
        }

        .mmt-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
        }

        .mmt-input-wrap input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .mmt-eye {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 8px;
          background: #cbd5e1;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mmt-select-wrap select {
          width: 100%;
          height: 45px;
          border: 1px solid #94a3b8;
          border-radius: 11px;
          padding: 0 12px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
          outline: 0;
        }

        .mmt-select-wrap select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.15);
        }

        /* STATUS SELECTOR */
        .status-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          height: 45px;
        }

        .status-option {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          text-align: left;
          color: #475569;
          transition: .18s ease;
          cursor: pointer;
        }

        .status-option strong {
          display: block;
          font-size: 11px;
          font-weight: 800;
        }

        .status-option small {
          display: block;
          font-size: 9px;
          color: #64748b;
          font-weight: 600;
        }

        .status-option.active {
          background: #ecfdf5;
          border-color: #34d399;
          color: #047857;
        }

        .status-option.inactive {
          background: #fef2f2;
          border-color: #f87171;
          color: #b91c1c;
        }

        /* BUTTONS */
        .mmt-save-btn,
        .mmt-cancel-edit {
          width: 100%;
          height: 45px;
          border: 0;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          transition: .2s ease;
          cursor: pointer;
        }

        .mmt-save-btn {
          color: #ffffff;
          background: linear-gradient(135deg, #1d4ed8, #4338ca);
          box-shadow: 0 8px 18px rgba(29,78,216,.25);
        }

        .mmt-save-btn.edit {
          background: linear-gradient(135deg, #b45309, #c2410c);
        }

        .mmt-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .mmt-cancel-edit {
          background: #e2e8f0;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }

        /* =====================================================
           TABLE (HIGH CONTRAST & DARK TEXT)
        ===================================================== */

        .mmt-live-count {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 20px;
          background: #d1fae5;
          border: 1px solid #6ee7b7;
          color: #065f46;
          font-size: 11px;
          font-weight: 800;
        }

        .mmt-live-count span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .mmt-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .mmt-table thead th {
          padding: 14px 16px;
          background: #f1f5f9;
          border-bottom: 2px solid #cbd5e1;
          color: #1e293b;
          font-size: 11px;
          letter-spacing: .8px;
          font-weight: 800;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .mmt-table tbody td {
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #0f172a;
          font-size: 12px;
          font-weight: 600;
          vertical-align: middle;
        }

        .mmt-table tbody tr:hover {
          background: #f8fafc;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #dbeafe;
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 1px solid #93c5fd;
        }

        .avatar.admin {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .user-cell strong {
          display: block;
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
        }

        .user-cell small {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
        }

        .username-text {
          color: #1e293b;
          font-weight: 800;
          font-size: 12px;
        }

        .password-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-weight: 800;
        }

        .password-cell button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 8px;
          background: #cbd5e1;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .role-badge,
        .account-badge,
        .online-badge,
        .offline-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          padding: 6px 12px;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 800;
        }

        .role-badge.admin {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .role-badge.user {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }

        .account-badge.active {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .account-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .online-badge {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .offline-badge {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #059669;
        }

        .date-text {
          color: #334155;
          font-size: 11px;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edit-btn,
        .delete-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .18s ease;
        }

        .edit-btn {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fdba74;
        }

        .delete-btn {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fca5a5;
        }

        .mmt-list-footer {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 20px;
          border-top: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
        }

        .mmt-security-note {
          margin-top: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .spin {
          animation: mmtSpin 1s linear infinite;
        }

        @keyframes mmtSpin {
          to { transform: rotate(360deg); }
        }

        @media(max-width: 1100px) {
          .mmt-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }

        @media(max-width: 768px) {
          .mmt-users-page { padding: 12px 10px 30px; }
          .mmt-header-content { padding: 20px; flex-direction: column; align-items: flex-start; }
          .mmt-back-btn { width: 100%; justify-content: center; }
          .mmt-stats { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
          .mmt-table-wrap { display: none; }

        }

      `}</style>
    </div>
  );
}