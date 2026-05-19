import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ManageUsers({ onNavigate }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const permissions = [
    // SALES
    "packages", "ticketing", "transport", "ziyarat", "visa", "hotels", "card",

    // PURCHASE
    "purchase_entry", "purchase_list", "pending_purchase",

    // LEDGER
    "customer_ledger", "supplier_ledger", "bank_ledger", "expense_ledger", "balance_sheet", "cash_ledger",

    // VOUCHERS
    "hotel_voucher", "transport_voucher",

    // REPORTS
    "all_reports", "profit_report", "monthly_profit_dashboard", "sale_adjustment_report", "supplier_adjustment_only", "supplier_purchase_detail_report", "item_loss_zero_report", "sale_change_check_report",

    // MASTER
    "create_user", "manage_users", "supplier", "deleted_reports", "restore", "system_storage"
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

/* ================= PASSWORD POPUP ================= */
const askPassword = async (title = "Enter Password") => {

  const { value } = await Swal.fire({
    width: "300px",

    html: `
      <div style="text-align:left;font-size:13px">
        <b>${title}</b>

        <div style="position:relative;margin-top:10px">

          <input
            id="swal-pass"
            type="password"
            class="swal2-input"
            style="height:34px;font-size:13px;padding-right:40px"
            placeholder="Enter password"
          />

          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            user-select:none;
            font-size:16px;
          ">👁</span>

        </div>
      </div>
    `,

    showCancelButton: true,
    confirmButtonText: "Save",
    focusConfirm: false,

    preConfirm: () => {

      const input = document.getElementById("swal-pass");
      const val = input.value.trim();

      // EMPTY
      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }

      // WRONG PASSWORD
      if (val !== "786") {

        const popup = Swal.getPopup();

        // 😎 SHAKE EFFECT
        if (popup) {

          popup.classList.add("shake");

          setTimeout(() => {
            popup.classList.remove("shake");
          }, 400);
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

      // 👁 SHOW / HIDE PASSWORD
      toggle.onclick = () => {

        show = !show;

        input.type = show ? "text" : "password";
        toggle.textContent = show ? "🙈" : "👁";
      };

      // AUTO FOCUS
      setTimeout(() => input.focus(), 100);

      // ENTER KEY SUPPORT
      const handleEnter = (e) => {

        if (e.key === "Enter") {

          e.preventDefault();

          document
            .querySelector(".swal2-confirm")
            ?.click();
        }
      };

      document.addEventListener("keydown", handleEnter);

      // CLEANUP
      Swal.getPopup()?.addEventListener("remove", () => {
        document.removeEventListener("keydown", handleEnter);
      });
    }
  });

  return value;
};


/* ================= SAVE ================= */
const saveAll = async () => {

  if (!isAdmin) {

    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Admin only"
    });
  }

  // 🔐 PASSWORD
  const pass = await askPassword("Enter Save Password");

  if (!pass) return;

  Swal.fire({
    width: "260px",
    title: "Saving Permissions...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {

    setSaving(true);

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users })
      }
    );

    const d = await r.json();

    Swal.close();

    if (d.success) {

      Swal.fire({
        width: "300px",
        icon: "success",
        text: "✅ Permissions Saved Successfully"
      });

      loadUsers();

    } else {

      Swal.fire({
        width: "300px",
        icon: "error",
        text: d.error || "Save failed"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });

  } finally {

    setSaving(false);
  }
};

  return (
    <div className="container-fluid py-3 bg-dark text-white">
      <button
        className="btn btn-warning fw-bold mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Exit
      </button>

      <h2 className="fw-bold text-warning mb-3">
        ⚙ Manage Users (Navbar Permissions)
      </h2>

      {!isAdmin && (
        <div className="alert alert-danger">
          ⛔ Only admin can change permissions
        </div>
      )}

      <div className="table-responsive">
        <table
          className="table table-dark table-bordered table-sm"
          style={{ minWidth: "1800px" }}
        >
          <thead style={{ position: "sticky", top: 0 }}>
            <tr>
              <th>User</th>
              <th>Role</th>
              {permissions.map(p => (
                <th key={p} className="text-center">
                  {p.replace(/_/g, " ").toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>
                <td className="fw-bold text-success">{u.username}</td>
                <td>{u.role}</td>

                {permissions.map(p => (
                  <td key={p} className="text-center">
                    <input
                      type="checkbox"
                      checked={!!u[p]}
                      disabled={!isAdmin}
                      onChange={() => toggle(i, p)}
                      style={{ width: 18, height: 18 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <button
          className="btn btn-success fw-bold mt-3 px-4"
          disabled={saving}
          onClick={saveAll}
        >
          {saving ? "Saving..." : "💾 Save Permissions"}
        </button>
      )}
    </div>
  );
}





