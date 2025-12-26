import React, { useEffect, useState } from "react";

export default function ManageUsers({ onNavigate }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user"));
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const permissions = [
    // SALES
    "packages", "ticketing", "transport", "visa", "hotels",

    // PURCHASE
    "purchase_entry", "purchase_list",

    // LEDGER
    "customer_ledger", "purchase_ledger", "bank_ledger", "balance_sheet",

    // VOUCHERS
    "hotel_voucher", "transport_voucher",

    // REPORTS
    "all_reports", "profit_report",

    // MASTER
    "create_user", "manage_users", "deleted_reports", "restore"
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

  /* SAVE */
  const saveAll = async () => {
    if (!isAdmin) return alert("Admin only");

    setSaving(true);
    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/permissions/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users })
      }
    );
    setSaving(false);
    alert("✅ Permissions Saved");
    loadUsers();
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
