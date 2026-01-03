import React, { useState } from "react";
import "./Navbar.css";

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const isAdmin = user?.role === "admin";

  const go = (page) => {
    setOpen(null);
    onNavigate(page);
  };

  const logout = () => {
    if (!window.confirm("Logout karna hai?")) return;
    sessionStorage.removeItem("user");
    window.location.reload();
  };

  const can = (perm) => isAdmin || user?.[perm] === true;

  return (
    <nav className="vip-navbar">
      {/* LOGO */}
      <div className="nav-logo" onClick={() => go("dashboard")}>
        ✈ Makki Madni Travel
      </div>

      {/* MENUS */}
      <div className="nav-links">

        {[
          {
            key: "sales",
            title: "Sales",
            items: [
              can("packages") && ["packages", "📦 Packages"],
              can("ticketing") && ["ticketing", "🎫 Ticketing"],
              can("transport") && ["transport", "🚐 Transport"],
              can("visa") && ["visa", "🛂 Visa"],
              can("hotels") && ["hotels", "🏨 Hotels"],
            ],
          },
          {
            key: "ledger",
            title: "Ledger",
            items: [
              can("customer_ledger") && ["customerLedger", "📒 Customer Ledger"],
              can("purchase_ledger") && ["purchaseLedger", "📦 Purchase Ledger"],
              can("bank_ledger") && ["bankLedger", "🏦 Bank Ledger"],
              can("expense_ledger") && ["expenseLedger", "💸 Expense Ledger"],
              can("balance_sheet") && ["balanceSheet", "📊 Balance Sheet"],
            ],
          },
          {
            key: "reports",
            title: "Reports",
            items: [
              can("all_reports") && ["allreports", "📈 All Reports"],
              can("profit_report") && ["profitReport", "💰 Profit Report"],
              can("system_storage") && ["systemStorage", "💾 System Storage"],
            ],
          },
          {
            key: "master",
            title: "Master",
            items: [
              can("create_user") && ["createUser", "👤 Create User"],
              can("restore") && ["restore", "♻ Restore"],
            ],
          },
        ].map((m) => (
          <div key={m.key} className="nav-item">
            <span
              className="nav-title"
              onClick={() => setOpen(open === m.key ? null : m.key)}
            >
              {m.title} ▾
            </span>

            {open === m.key && (
              <div className="menu-box">
                {m.items.filter(Boolean).map(([page, label]) => (
                  <a key={page} onClick={() => go(page)}>
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* USER */}
      <div className="nav-user">
        <span className="user-name">👤 {user?.name || "User"}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
