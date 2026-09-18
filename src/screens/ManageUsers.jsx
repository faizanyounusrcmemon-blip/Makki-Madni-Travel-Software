import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function ManageUsers({ onNavigate }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ================= STATES ================= */
  const [openUser, setOpenUser] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  /* ================= PERMISSION MATRIX ================= */
  const permissionCategories = [
    {
      title: "Sales & Bookings",
      icon: "🛍️",
      color: "#2563eb",
      light: "#eff6ff",
      items: [
        "packages",
        "ticketing",
        "transport",
        "ziyarat",
        "visa",
        "hotels",
        "card",
        "groups",
      ],
    },
    {
      title: "Purchase Management",
      icon: "📥",
      color: "#0891b2",
      light: "#ecfeff",
      items: ["purchase_entry", "purchase_list", "pending_purchase"],
    },
    {
      title: "Financial Ledgers",
      icon: "📗",
      color: "#059669",
      light: "#ecfdf5",
      items: [
        "registered_customer_ledger",
        "customer_ledger",
        "supplier_ledger",
        "bank_ledger",
        "expense_ledger",
        "balance_sheet",
        "cash_ledger",
      ],
    },
    {
      title: "Booking Vouchers",
      icon: "🎫",
      color: "#d97706",
      light: "#fffbeb",
      items: [
        "hotel_voucher",
        "hotel_voucher3in1",
        "transport_voucher",
        "customiz_transport_voucher",
        "customiz_hotel_voucher",
      ],
    },
    {
      title: "Reports & Analytics",
      icon: "📈",
      color: "#7c3aed",
      light: "#f5f3ff",
      items: [
        "all_reports",
        "all_reports_today",
        "profit_report",
        "monthly_profit_dashboard",
        "sale_adjustment_report",
        "supplier_adjustment_only",
        "supplier_purchase_detail_report",
        "customer_sale_detail_report",
        "item_loss_zero_report",
        "sale_change_check_report",
        "gifting_report_view",
        "agent_comm_report_view",
        "upcoming_payment_due_report",
        "upcoming_travel_report",
      ],
    },
    {
      title: "Master Administration",
      icon: "🔐",
      color: "#dc2626",
      light: "#fef2f2",
      items: [
        "create_user",
        "bank_profiles",
        "manage_users",
        "supplier",
        "customers_list",
        "deleted_reports",
        "restore",
        "system_storage",
        "password_settings",
      ],
    },
    {
      title: "Database Archive",
      icon: "📁",
      color: "#475569",
      light: "#f8fafc",
      items: ["archive_manager", "archive_list"],
    },
  ];

  const totalPermissions = permissionCategories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/list`
      );

      const d = await res.json();

      if (d.success) {
        setUsers(d.rows || []);
      } else {
        Swal.fire({
          icon: "error",
          title: "Unable to Load Users",
          text: d.error || "Could not retrieve user details.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not retrieve user details from server.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= TOGGLE SINGLE PERMISSION ================= */
  const toggle = (userId, perm) => {
    if (!isAdmin) return;

    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, [perm]: !u[perm] } : u
      )
    );
  };

  /* ================= TOGGLE CATEGORY ================= */
  const toggleCategory = (userId, categoryItems, enableAll) => {
    if (!isAdmin) return;

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id !== userId) return u;

        const updated = { ...u };

        categoryItems.forEach((perm) => {
          updated[perm] = enableAll;
        });

        return updated;
      })
    );
  };

  /* ================= USER PERMISSION COUNT ================= */
  const getUserPermissionCount = (user) => {
    return permissionCategories.reduce((count, cat) => {
      return (
        count +
        cat.items.reduce((catCount, perm) => {
          return catCount + (user[perm] ? 1 : 0);
        }, 0)
      );
    }, 0);
  };

  /* ================= SAVE ALL ================= */
  const saveAll = async () => {
    if (!isAdmin || saving) return;

    const { value: enteredPassword } = await Swal.fire({
      width: "390px",
      padding: "0",
      background: "#ffffff",
      customClass: {
        popup: "rounded-4 shadow-lg border-0",
        confirmButton: "rounded-3",
        cancelButton: "rounded-3",
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
            margin-bottom:16px;
          ">
            <div style="
              width:46px;
              height:46px;
              border-radius:14px;
              background:linear-gradient(135deg,#2563eb,#7c3aed);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:22px;
              box-shadow:0 8px 20px rgba(37,99,235,.22);
            ">
              🔐
            </div>

            <div>
              <div style="
                font-size:17px;
                font-weight:800;
                color:#0f172a;
                line-height:1.2;
              ">
                Save Permissions
              </div>

              <div style="
                font-size:11px;
                color:#64748b;
                margin-top:3px;
              ">
                Administrator authorization required
              </div>
            </div>
          </div>

          <div style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:11px 12px;
            margin-bottom:14px;
            font-size:12px;
            color:#475569;
            line-height:1.5;
          ">
            🛡️ Your changes will be applied to all user permission settings.
          </div>

          <div style="
            position:relative;
          ">
            <input
              id="swal-pass-perm"
              type="password"
              class="swal2-input"
              style="
                width:100%;
                box-sizing:border-box;
                height:42px;
                margin:0;
                padding:0 45px 0 13px;
                border-radius:10px;
                border:1px solid #cbd5e1;
                font-size:13px;
                box-shadow:none;
              "
              placeholder="Enter administrator password"
            />

            <span
              id="toggle-swal-pass-perm"
              style="
                position:absolute;
                right:13px;
                top:50%;
                transform:translateY(-50%);
                cursor:pointer;
                font-size:16px;
                user-select:none;
                color:#64748b;
              "
            >
              👁
            </span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🔒 Authorize & Save",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#94a3b8",
      focusConfirm: false,

      didOpen: () => {
        const input = document.getElementById("swal-pass-perm");
        const toggleBtn = document.getElementById("toggle-swal-pass-perm");

        if (input && toggleBtn) {
          let show = false;

          toggleBtn.addEventListener("click", () => {
            show = !show;
            input.type = show ? "text" : "password";
            toggleBtn.textContent = show ? "🙈" : "👁";
          });

          input.focus();
        }
      },

      preConfirm: () => {
        const val = document
          .getElementById("swal-pass-perm")
          ?.value.trim();

        if (!val) {
          Swal.showValidationMessage("Administrator password is required.");
          return false;
        }

        return val;
      },
    });

    if (!enteredPassword) return;

    setSaving(true);

    Swal.fire({
      width: "300px",
      padding: "25px",
      title: "Saving Permissions",
      html: `
        <div style="
          font-size:12px;
          color:#64748b;
          margin-top:-4px;
        ">
          Please wait while the changes are being applied...
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            users,
            password: enteredPassword,
          }),
        }
      );

      const data = await res.json();

      Swal.close();

      if (res.ok && data.success) {
        Swal.fire({
          icon: "success",
          width: "350px",
          title: "Permissions Saved",
          html: `
            <div style="
              font-size:12px;
              color:#64748b;
              line-height:1.6;
            ">
              All user permissions have been updated successfully.
            </div>
          `,
          confirmButtonText: "Done",
          confirmButtonColor: "#059669",
          customClass: {
            popup: "rounded-4 shadow-lg border-0",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          width: "360px",
          title: "Save Failed",
          text:
            data.error ||
            data.message ||
            "Failed to update permissions.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch {
      Swal.close();

      Swal.fire({
        icon: "error",
        width: "360px",
        title: "Network Error",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= FILTER USERS ================= */
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        !term ||
        (u.username || "").toLowerCase().includes(term) ||
        String(u.id).includes(term);

      const matchesRole = roleFilter
        ? u.role === roleFilter
        : true;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  /* ================= STATS ================= */
  const totalAdmins = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const totalStandardUsers = useMemo(
    () => users.filter((u) => u.role !== "admin").length,
    [users]
  );

  const totalEnabledPermissions = useMemo(() => {
    return users.reduce(
      (total, user) => total + getUserPermissionCount(user),
      0
    );
  }, [users]);

  const permissionPercentage =
    users.length > 0 && totalPermissions > 0
      ? Math.round(
          (totalEnabledPermissions /
            (users.length * totalPermissions)) *
            100
        )
      : 0;

  return (
    <div
      className="w-100"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#f8fafc 0%,#eef2ff 45%,#f8fafc 100%)",
        fontFamily: "'Inter',Arial,sans-serif",
        padding: "18px",
      }}
    >
      {/* ================= TOP HEADER ================= */}
      <div
        className="shadow-lg mb-4"
        style={{
          borderRadius: "22px",
          overflow: "hidden",
          background:
            "linear-gradient(135deg,#0f172a 0%,#1e3a8a 48%,#4f46e5 100%)",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.06)",
            right: "-70px",
            top: "-100px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.05)",
            right: "180px",
            bottom: "-100px",
          }}
        />

        <div
          className="p-3 p-lg-4"
          style={{
            position: "relative",
            zIndex: 2,
          }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            {/* Title */}
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,.14)",
                  border: "1px solid rgba(255,255,255,.22)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "27px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,.15)",
                }}
              >
                👥
              </div>

              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "1.6px",
                    fontWeight: "700",
                    color: "rgba(255,255,255,.65)",
                    textTransform: "uppercase",
                  }}
                >
                  System Administration
                </div>

                <h3
                  className="mb-1 fw-bold"
                  style={{
                    color: "#fff",
                    fontSize: "25px",
                    letterSpacing: "-.4px",
                  }}
                >
                  Manage Users
                </h3>

                <div
                  style={{
                    color: "rgba(255,255,255,.72)",
                    fontSize: "12px",
                  }}
                >
                  User accounts & access permission control
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {isAdmin && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAll}
                  className="btn border-0 fw-bold px-4 py-2"
                  style={{
                    background:
                      "linear-gradient(135deg,#facc15,#f59e0b)",
                    color: "#422006",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow:
                      "0 8px 20px rgba(245,158,11,.25)",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "⏳ Saving..." : "💾 Save Permissions"}
                </button>
              )}

              <button
                type="button"
                className="btn fw-semibold px-3 py-2"
                onClick={() => onNavigate("dashboard")}
                style={{
                  color: "#fff",
                  background: "rgba(255,255,255,.10)",
                  border:
                    "1px solid rgba(255,255,255,.25)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  backdropFilter: "blur(8px)",
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="row g-3 mb-4">
        {/* Total Users */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="h-100 shadow-sm"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "17px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: ".8px",
                  }}
                >
                  TOTAL USERS
                </div>

                <div
                  className="fw-bold mt-1"
                  style={{
                    fontSize: "23px",
                    color: "#0f172a",
                  }}
                >
                  {users.length}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  Active accounts
                </div>
              </div>

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                👥
              </div>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="h-100 shadow-sm"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "17px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: ".8px",
                  }}
                >
                  ADMINISTRATORS
                </div>

                <div
                  className="fw-bold mt-1"
                  style={{
                    fontSize: "23px",
                    color: "#dc2626",
                  }}
                >
                  {totalAdmins}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  Full access users
                </div>
              </div>

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🛡️
              </div>
            </div>
          </div>
        </div>

        {/* Standard */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="h-100 shadow-sm"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "17px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: ".8px",
                  }}
                >
                  STANDARD USERS
                </div>

                <div
                  className="fw-bold mt-1"
                  style={{
                    fontSize: "23px",
                    color: "#059669",
                  }}
                >
                  {totalStandardUsers}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  Controlled access
                </div>
              </div>

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                👤
              </div>
            </div>
          </div>
        </div>

        {/* Permission Usage */}
        <div className="col-12 col-md-6 col-xl-3">
          <div
            className="h-100 shadow-sm"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "17px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: ".8px",
                  }}
                >
                  PERMISSION USAGE
                </div>

                <div
                  className="fw-bold mt-1"
                  style={{
                    fontSize: "23px",
                    color: "#7c3aed",
                  }}
                >
                  {permissionPercentage}%
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  {totalEnabledPermissions} enabled
                </div>
              </div>

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  background: "#f5f3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🔑
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH / FILTER ================= */}
      <div
        className="shadow-sm mb-4"
        style={{
          background: "#fff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          padding: "15px",
        }}
      >
        <div className="row g-2 align-items-center">
          <div className="col-12 col-lg-8">
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "15px",
                  color: "#64748b",
                }}
              >
                🔍
              </span>

              <input
                type="text"
                className="form-control shadow-none"
                placeholder="Search username or User ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  height: "42px",
                  borderRadius: "11px",
                  paddingLeft: "39px",
                  fontSize: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              />
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <select
              className="form-select shadow-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                height: "42px",
                borderRadius: "11px",
                fontSize: "12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <option value="">👥 All Roles</option>
              <option value="admin">🛡️ Administrators</option>
              <option value="user">👤 Standard Users</option>
            </select>
          </div>
        </div>

        <div
          className="d-flex justify-content-between align-items-center mt-3"
          style={{
            fontSize: "11px",
            color: "#64748b",
          }}
        >
          <span>
            Showing{" "}
            <strong style={{ color: "#0f172a" }}>
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "#0f172a" }}>
              {users.length}
            </strong>{" "}
            users
          </span>

          {(search || roleFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("");
              }}
              className="btn btn-sm p-0 border-0"
              style={{
                fontSize: "11px",
                color: "#2563eb",
                fontWeight: "700",
              }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ================= READ ONLY WARNING ================= */}
      {!isAdmin && (
        <div
          className="mb-4"
          style={{
            borderRadius: "15px",
            padding: "13px 15px",
            background:
              "linear-gradient(135deg,#fff7ed,#fffbeb)",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          🔒 <strong>Read-only mode:</strong> Only system administrators can
          update user permissions.
        </div>
      )}

      {/* ================= USERS ================= */}
      <div className="d-flex flex-column gap-3">
        {filteredUsers.map((u) => {
          const opened = openUser === u.id;
          const enabledCount = getUserPermissionCount(u);
          const permissionPercent =
            totalPermissions > 0
              ? Math.round(
                  (enabledCount / totalPermissions) * 100
                )
              : 0;

          return (
            <div
              key={u.id}
              className="shadow-sm"
              style={{
                background: "#fff",
                borderRadius: "19px",
                border: opened
                  ? "1px solid #c7d2fe"
                  : "1px solid #e2e8f0",
                overflow: "hidden",
                transition: "all .2s ease",
              }}
            >
              {/* USER HEADER */}
              <div
                onClick={() =>
                  setOpenUser(opened ? null : u.id)
                }
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  background: u.role === "admin"
                    ? "linear-gradient(135deg,#991b1b,#dc2626)"
                    : "linear-gradient(135deg,#1e3a8a,#2563eb)",
                  color: "#fff",
                  userSelect: "none",
                }}
              >
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,.15)",
                        border:
                          "1px solid rgba(255,255,255,.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                      }}
                    >
                      {u.role === "admin" ? "🛡️" : "👤"}
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "15px",
                        }}
                      >
                        {u.username || "Unknown User"}
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "10px",
                          color: "rgba(255,255,255,.72)",
                        }}
                      >
                        User ID #{u.id} • {enabledCount}/
                        {totalPermissions} permissions enabled
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Permission progress */}
                    <div
                      className="d-none d-md-block"
                      style={{
                        width: "90px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "9px",
                          marginBottom: "4px",
                          color: "rgba(255,255,255,.75)",
                        }}
                      >
                        <span>ACCESS</span>
                        <span>{permissionPercent}%</span>
                      </div>

                      <div
                        style={{
                          height: "5px",
                          borderRadius: "10px",
                          background:
                            "rgba(255,255,255,.18)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${permissionPercent}%`,
                            height: "100%",
                            borderRadius: "10px",
                            background: "#fff",
                          }}
                        />
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "6px 11px",
                        borderRadius: "20px",
                        background: "rgba(255,255,255,.13)",
                        border:
                          "1px solid rgba(255,255,255,.18)",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: ".5px",
                      }}
                    >
                      {(u.role || "USER").toUpperCase()}
                    </span>

                    <span
                      style={{
                        width: "29px",
                        height: "29px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        transition: "transform .2s ease",
                        transform: opened
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              {/* PERMISSIONS */}
              {opened && (
                <div
                  style={{
                    padding: "15px",
                    background:
                      "linear-gradient(180deg,#f8fafc,#f1f5f9)",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div className="row g-3">
                    {permissionCategories.map((cat, idx) => {
                      const enabledInCategory =
                        cat.items.filter(
                          (p) => !!u[p]
                        ).length;

                      const allCatChecked =
                        enabledInCategory ===
                        cat.items.length;

                      const categoryPercent =
                        cat.items.length > 0
                          ? Math.round(
                              (enabledInCategory /
                                cat.items.length) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={idx}
                          className="col-12 col-xl-6"
                        >
                          <div
                            style={{
                              background: "#fff",
                              borderRadius: "16px",
                              border:
                                "1px solid #e2e8f0",
                              overflow: "hidden",
                              height: "100%",
                              boxShadow:
                                "0 3px 12px rgba(15,23,42,.04)",
                            }}
                          >
                            {/* CATEGORY HEADER */}
                            <div
                              style={{
                                padding:
                                  "11px 13px",
                                background:
                                  cat.light,
                                borderBottom:
                                  "1px solid #e2e8f0",
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center gap-2">
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    style={{
                                      width: "34px",
                                      height: "34px",
                                      borderRadius:
                                        "10px",
                                      background:
                                        "#fff",
                                      display: "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      fontSize: "17px",
                                      boxShadow:
                                        "0 2px 6px rgba(0,0,0,.06)",
                                    }}
                                  >
                                    {cat.icon}
                                  </div>

                                  <div>
                                    <div
                                      style={{
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "800",
                                        color:
                                          cat.color,
                                      }}
                                    >
                                      {cat.title}
                                    </div>

                                    <div
                                      style={{
                                        fontSize:
                                          "9px",
                                        color:
                                          "#64748b",
                                        marginTop:
                                          "2px",
                                      }}
                                    >
                                      {
                                        enabledInCategory
                                      }{" "}
                                      of{" "}
                                      {
                                        cat.items
                                          .length
                                      }{" "}
                                      enabled
                                    </div>
                                  </div>
                                </div>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      toggleCategory(
                                        u.id,
                                        cat.items,
                                        !allCatChecked
                                      );
                                    }}
                                    className="btn btn-sm"
                                    style={{
                                      borderRadius:
                                        "9px",
                                      border:
                                        `1px solid ${cat.color}30`,
                                      background:
                                        "#fff",
                                      color:
                                        cat.color,
                                      fontSize:
                                        "9px",
                                      fontWeight:
                                        "800",
                                      padding:
                                        "6px 9px",
                                    }}
                                  >
                                    {allCatChecked
                                      ? "Disable All"
                                      : "Enable All"}
                                  </button>
                                )}
                              </div>

                              {/* CATEGORY PROGRESS */}
                              <div
                                style={{
                                  height: "4px",
                                  background:
                                    `${cat.color}18`,
                                  borderRadius:
                                    "10px",
                                  marginTop: "9px",
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${categoryPercent}%`,
                                    height: "100%",
                                    background:
                                      cat.color,
                                    borderRadius:
                                      "10px",
                                    transition:
                                      "width .2s ease",
                                  }}
                                />
                              </div>
                            </div>

                            {/* PERMISSION ITEMS */}
                            <div style={{ padding: "9px" }}>
                              <div className="row g-2">
                                {cat.items.map((p) => {
                                  const isChecked = !!u[p];

                                  return (
                                    <div
                                      key={p}
                                      className="col-12 col-md-6"
                                    >
                                      <div
                                        onClick={() =>
                                          isAdmin &&
                                          toggle(
                                            u.id,
                                            p
                                          )
                                        }
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          justifyContent:
                                            "space-between",
                                          gap: "8px",
                                          padding:
                                            "9px 10px",
                                          borderRadius:
                                            "10px",
                                          background:
                                            isChecked
                                              ? cat.light
                                              : "#f8fafc",
                                          border:
                                            isChecked
                                              ? `1px solid ${cat.color}35`
                                              : "1px solid #edf2f7",
                                          cursor:
                                            isAdmin
                                              ? "pointer"
                                              : "default",
                                          transition:
                                            "all .15s ease",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize:
                                              "10px",
                                            fontWeight:
                                              isChecked
                                                ? "700"
                                                : "500",
                                            color:
                                              isChecked
                                                ? cat.color
                                                : "#64748b",
                                            textTransform:
                                              "capitalize",
                                            lineHeight:
                                              "1.35",
                                          }}
                                        >
                                          {p.replace(
                                            /_/g,
                                            " "
                                          )}
                                        </span>

                                        <input
                                          type="checkbox"
                                          checked={
                                            isChecked
                                          }
                                          disabled={
                                            !isAdmin
                                          }
                                          onChange={() =>
                                            toggle(
                                              u.id,
                                              p
                                            )
                                          }
                                          style={{
                                            width:
                                              "16px",
                                            height:
                                              "16px",
                                            accentColor:
                                              cat.color,
                                            cursor:
                                              isAdmin
                                                ? "pointer"
                                                : "not-allowed",
                                            flexShrink:
                                              0,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ================= EMPTY ================= */}
        {filteredUsers.length === 0 && (
          <div
            className="shadow-sm text-center"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "55px 20px",
            }}
          >
            <div
              style={{
                width: "62px",
                height: "62px",
                margin: "0 auto 14px",
                borderRadius: "18px",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "27px",
              }}
            >
              🔎
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              No Users Found
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                marginTop: "5px",
              }}
            >
              Try changing your search or role filter.
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM INFO ================= */}
      <div
        className="mt-4"
        style={{
          padding: "12px 15px",
          borderRadius: "14px",
          background: "rgba(255,255,255,.72)",
          border: "1px solid rgba(226,232,240,.9)",
          fontSize: "10px",
          color: "#64748b",
          textAlign: "center",
        }}
      >
        🔐 Permission changes are protected by administrator authorization
        &nbsp;•&nbsp; {permissionCategories.length} permission categories
        &nbsp;•&nbsp; {totalPermissions} available permissions
      </div>
    </div>
  );
}