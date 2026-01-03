import React, { useState } from "react";

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

  // admin = full access, user = permission based
  const can = (perm) => isAdmin || user?.[perm] === true;

  return (
    <nav className="vip-navbar">

      {/* LOGO */}
      <div className="nav-logo" onClick={() => go("dashboard")}>
        ✈️ Makki Madni Travel
      </div>

      {/* MENUS */}
      <div className="nav-links">

        {/* SALES */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "sales" ? null : "sales")}
          >
            Sales ▾
          </span>

          {open === "sales" && (
            <div className="vip-menu">
              {can("packages") && <div onClick={() => go("packages")}>📦 Packages</div>}
              {can("ticketing") && <div onClick={() => go("ticketing")}>🎫 Ticketing</div>}
              {can("transport") && <div onClick={() => go("transport")}>🚐 Transport</div>}
              {can("visa") && <div onClick={() => go("visa")}>🛂 Visa</div>}
              {can("hotels") && <div onClick={() => go("hotels")}>🏨 Hotels</div>}

              {!can("packages") &&
                !can("ticketing") &&
                !can("transport") &&
                !can("visa") &&
                !can("hotels") && (
                  <div className="no-access">No access</div>
                )}
            </div>
          )}
        </div>

        {/* PURCHASE */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "purchase" ? null : "purchase")}
          >
            Purchase ▾
          </span>

          {open === "purchase" && (
            <div className="vip-menu">
              {can("purchase_entry") && <div onClick={() => go("purchase")}>🧾 Purchase Entry</div>}
              {can("purchase_list") && <div onClick={() => go("purchaseList")}>📑 Purchase List</div>}

              {!can("purchase_entry") && !can("purchase_list") && (
                <div className="no-access">No access</div>
              )}
            </div>
          )}
        </div>

        {/* LEDGER */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "ledger" ? null : "ledger")}
          >
            Ledger ▾
          </span>

          {open === "ledger" && (
            <div className="vip-menu">
              {can("customer_ledger") && <div onClick={() => go("customerLedger")}>📒 Customer Ledger</div>}
              {can("purchase_ledger") && <div onClick={() => go("purchaseLedger")}>📦 Purchase Ledger</div>}
              {can("bank_ledger") && <div onClick={() => go("bankLedger")}>🏦 Bank Ledger</div>}
              {can("expense_ledger") && <div onClick={() => go("expenseLedger")}>💸 Expense Ledger</div>}
              {can("balance_sheet") && <div onClick={() => go("balanceSheet")}>📊 Balance Sheet</div>}

              {!can("customer_ledger") &&
                !can("purchase_ledger") &&
                !can("expense_ledger") &&
                !can("bank_ledger") &&
                !can("balance_sheet") && (
                  <div className="no-access">No access</div>
                )}
            </div>
          )}
        </div>

        {/* VOUCHERS */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "voucher" ? null : "voucher")}
          >
            Vouchers ▾
          </span>

          {open === "voucher" && (
            <div className="vip-menu">
              {can("hotel_voucher") && <div onClick={() => go("hotelVoucher")}>🏨 Hotel Voucher</div>}
              {can("transport_voucher") && <div onClick={() => go("transportVoucher")}>🚐 Transport Voucher</div>}

              {!can("hotel_voucher") && !can("transport_voucher") && (
                <div className="no-access">No access</div>
              )}
            </div>
          )}
        </div>

        {/* REPORTS */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "reports" ? null : "reports")}
          >
            Reports ▾
          </span>

          {open === "reports" && (
            <div className="vip-menu">
              {can("all_reports") && <div onClick={() => go("allreports")}>📈 All Reports</div>}
              {can("profit_report") && <div onClick={() => go("profitReport")}>💰 Profit Report</div>}
              {can("system_storage") && <div onClick={() => go("systemStorage")}>💾 System Storage</div>}

              {!can("all_reports") &&
                !can("profit_report") &&
                !can("system_storage") && (
                  <div className="no-access">No access</div>
                )}
            </div>
          )}
        </div>

        {/* MASTER */}
        <div className="nav-item">
          <span
            className="nav-title"
            onClick={() => setOpen(open === "master" ? null : "master")}
          >
            Master ▾
          </span>

          {open === "master" && (
            <div className="vip-menu">
              {can("create_user") && <div onClick={() => go("createUser")}>👤 Create User</div>}
              {can("manage_users") && <div onClick={() => go("manageUsers")}>🛠 Manage Users</div>}
              {can("deleted_reports") && <div onClick={() => go("deletedReports")}>🗑 Deleted Reports</div>}
              {can("restore") && <div onClick={() => go("restore")}>♻ Restore</div>}

              {!can("create_user") &&
                !can("manage_users") &&
                !can("deleted_reports") &&
                !can("restore") && (
                  <div className="no-access">No access</div>
                )}
            </div>
          )}
        </div>

      </div>

      {/* USER */}
      <div className="nav-user">
        <span className="user-name">👤 {user?.name || "User"}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* EXTRA SAFE STYLE */}
      <style>{`
        .nav-title {
          cursor: pointer;
          font-size: 15px;
        }
        .no-access {
          opacity: 0.5;
          cursor: not-allowed;
          padding: 12px 18px;
        }
      `}</style>

    </nav>
  );
}
