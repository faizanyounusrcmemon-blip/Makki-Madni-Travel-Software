import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ManageUsers({ onNavigate }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ================= STATES ================= */
  const [openUser, setOpenUser] = useState(null);

  const permissions = [
    // SALES
    "packages", "ticketing", "transport", "ziyarat", "visa", "hotels", "card","groups",

    // PURCHASE
    "purchase_entry", "purchase_list", "pending_purchase",

    // LEDGER
    "customer_ledger", "supplier_ledger", "bank_ledger", "expense_ledger", "balance_sheet", "cash_ledger",

    // VOUCHERS
    "hotel_voucher", "hotel_voucher3in1", "transport_voucher",

    // REPORTS
    "all_reports", "all_reports_today", "profit_report", "monthly_profit_dashboard", "sale_adjustment_report", "supplier_adjustment_only", "supplier_purchase_detail_report", "item_loss_zero_report", "sale_change_check_report",

    // MASTER
    "create_user", "manage_users", "supplier", "deleted_reports", "restore", "system_storage", "password_settings",
   // ARCHIVE
    "archive_manager", "archive_list"

  ];

  /* LOAD USERS */
  const loadUsers = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/list`
    );
    const d = await res.json();
    if (d.success) setUsers(d.rows);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* TOGGLE */
  const toggle = (ui, perm) => {
    if (!isAdmin) return;
    const copy = [...users];
    copy[ui][perm] = !copy[ui][perm];
    setUsers(copy);
  };



/* ================= SAVE ALL PERMISSIONS ================= */
const saveAll = async () => {
  if (!isAdmin) return;

  const enteredPassword = await (async () => {
    const { value } = await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.5">
          <div style="margin-bottom:8px"><b style="color:#10b981">🛡️ SAVE SYSTEM PERMISSIONS</b></div>
          <div style="font-size:12px;margin-bottom:8px">This will overwrite configuration matrix rules for all users.</div>
          <div style="position:relative;margin-top:8px">
            <input id="swal-pass-perm" type="password" class="swal2-input" style="height:34px;font-size:13px;width:100%;box-sizing:border-box;margin:0;padding:0 35px 0 10px;" placeholder="Enter Security Password"/>
            <span id="toggle-swal-pass-perm" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:14px;z-index:999;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Authorize Save",
      focusConfirm: false,
      didOpen: () => {
        // Hide/Show fix for Save Permissions Swal Popup
        const input = document.getElementById("swal-pass-perm");
        const toggle = document.getElementById("toggle-swal-pass-perm");
        if (input && toggle) {
          let show = false;
          toggle.addEventListener("click", () => {
            show = !show;
            input.type = show ? "text" : "password";
            toggle.textContent = show ? "🙈" : "👁";
          });
        }
      },
      preConfirm: () => {
        const val = document.getElementById("swal-pass-perm").value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      }
    });
    return value;
  })();

  if (!enteredPassword) return;

  setSaving(true);
  Swal.fire({ title: "Saving changes...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users, password: enteredPassword }),
    });

    const data = await res.json();
    Swal.close();

    if (data.success) {
      Swal.fire("Success", "All user permissions updated successfully!", "success");
    } else {
      Swal.fire({
        title: "Error",
        text: data.error || "Failed to update permissions",
        icon: "error",
        didOpen: () => {
          const popup = document.querySelector(".swal2-popup");
          if (popup) {
            popup.classList.add("shake");
            setTimeout(() => popup.classList.remove("shake"), 500);
          }
        }
      });
    }
  } catch {
    Swal.close();
    Swal.fire("Error", "Network connection failed", "error");
  } finally {
    setSaving(false);
  }
};

return (
  <div
    className="container-fluid py-3"
    style={{
      background: "#eef2f7",
      minHeight: "100vh",
      maxWidth: "650px",
    }}
  >
    {/* ================= HEADER ================= */}
    <div
      className="rounded-4 shadow-lg overflow-hidden mb-3 position-relative"
      style={{
        background:
          "linear-gradient(135deg,#0f172a 0%, #1e293b 45%, #334155 100%)",
      }}
    >
      {/* GLOW */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />

      <div className="p-3 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          
          {/* TITLE */}
          <div>
            <div
              className="fw-bold text-white"
              style={{
                fontSize: "24px",
                lineHeight: 1.2,
              }}
            >
              ⚙ Manage Users
            </div>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: "12px",
                marginTop: "3px",
              }}
            >
              User access & permission control
            </div>
          </div>

          {/* EXIT */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="btn btn-light border-0 fw-bold px-3"
            style={{
              borderRadius: "12px",
              fontSize: "12px",
            }}
          >
            ⬅ Exit
          </button>
        </div>
      </div>
    </div>

    {/* ================= WARNING ================= */}
    {!isAdmin && (
      <div
        className="alert border-0 rounded-4 shadow-sm"
        style={{
          background: "#fff1f2",
          color: "#dc2626",
          fontWeight: "600",
          fontSize: "13px",
        }}
      >
        ⛔ Only admin can change permissions
      </div>
    )}

{/* ================= USERS ================= */}
<div className="d-flex flex-column gap-3">
  {users.map((u, i) => {

    const opened = openUser === u.id;

    return (
      <div
        key={u.id}
        className="card border-0 shadow-sm rounded-4 overflow-hidden"
        style={{
          background: "#fff",
        }}
      >
        {/* ================= USER TOP ================= */}
        <div
          onClick={() =>
            setOpenUser(opened ? null : u.id)
          }
          className="p-3"
          style={{
            background:
              u.role === "admin"
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "linear-gradient(135deg,#3b82f6,#2563eb)",
            color: "#fff",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            
            {/* LEFT */}
            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: "17px",
                  letterSpacing: "0.3px",
                }}
              >
                👤 {u.username}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.9,
                }}
              >
                ID: {u.id}
              </div>
            </div>

            {/* RIGHT */}
            <div className="d-flex align-items-center gap-2">

              {/* ROLE */}
              <div
                className="px-3 py-1 fw-bold"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  fontSize: "11px",
                  backdropFilter: "blur(8px)",
                }}
              >
                {u.role.toUpperCase()}
              </div>

              {/* ARROW */}
              <div
                style={{
                  fontSize: "20px",
                  transition: "0.2s",
                  transform: opened
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ⌄
              </div>
            </div>
          </div>
        </div>

        {/* ================= PERMISSIONS ================= */}
        {opened && (
          <div
            className="p-3 border-top"
            style={{
              background: "#f8fafc",
            }}
          >
            <div className="row g-2">

              {permissions.map((p) => (
                <div
                  key={p}
                  className="col-6"
                >
                  <div
                    className="d-flex justify-content-between align-items-center px-2 py-2 rounded-3"
                    style={{
                      background: !!u[p]
                        ? "linear-gradient(135deg,#ecfeff,#dbeafe)"
                        : "#fff",
                      border: !!u[p]
                        ? "1px solid #93c5fd"
                        : "1px solid #e5e7eb",
                      minHeight: "55px",
                    }}
                  >
                    {/* NAME */}
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#334155",
                        lineHeight: 1.2,
                        width: "75%",
                        textTransform: "capitalize",
                      }}
                    >
                      {p.replace(/_/g, " ")}
                    </div>

                    {/* CHECKBOX */}
                    <input
                      type="checkbox"
                      checked={!!u[p]}
                      disabled={!isAdmin}
                      onChange={() => toggle(i, p)}
                      style={{
                        width: "17px",
                        height: "17px",
                        cursor: isAdmin
                          ? "pointer"
                          : "not-allowed",
                        accentColor:
                          u.role === "admin"
                            ? "#dc2626"
                            : "#2563eb",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })}
</div>



    {/* ================= FOOTER ================= */}
    <div className="mt-4">
      {/* TOTAL */}
      <div
        className="mb-3 px-3 py-3 rounded-4 shadow-sm d-flex justify-content-between align-items-center"
        style={{
          background: "#fff",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            Total Users
          </div>

          <div
            className="fw-bold"
            style={{
              fontSize: "22px",
              color: "#111827",
            }}
          >
            👥 {users.length}
          </div>
        </div>

        <div
          className="fw-bold px-3 py-2"
          style={{
            background:
              "linear-gradient(135deg,#8b5cf6,#6366f1)",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "12px",
          }}
        >
          Permission Panel
        </div>
      </div>

      {/* SAVE BUTTON */}
      {isAdmin && (
        <button
          disabled={saving}
          onClick={saveAll}
          className="btn w-100 border-0 fw-bold py-3"
          style={{
            background:
              saving
                ? "#94a3b8"
                : "linear-gradient(135deg,#10b981,#059669)",
            color: "#fff",
            borderRadius: "18px",
            fontSize: "15px",
            letterSpacing: "0.3px",
            boxShadow:
              "0 10px 25px rgba(16,185,129,0.25)",
          }}
        >
          {saving
            ? "⏳ Saving Permissions..."
            : "💾 Save Permissions"}
        </button>
      )}
    </div>
  </div>
);

}