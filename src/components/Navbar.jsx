import React, { useState } from "react";
import "./Navbar.css";

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const isAdmin = user?.role === "admin";

  const can = (perm) => isAdmin || user?.[perm] === true;

  const go = (page) => {
    setOpen(null);
    onNavigate(page);
  };

  const logout = () => {
    if (!window.confirm("Do you want to logout?")) return;
    sessionStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <nav className="vip-navbar">
      <div className="nav-logo" onClick={() => go("dashboard")}>
        ✈ Makki Madni Travel
      </div>

      <div className="nav-links">

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "sales" ? null : "sales")}>
            Sales ▾
          </span>
          {open === "sales" && (
            <div className="menu-box">
              {can("packages") && <a onClick={() => go("packages")}>📦 Packages</a>}
              {can("ticketing") && <a onClick={() => go("ticketing")}>🎫 Ticketing</a>}
              {can("transport") && <a onClick={() => go("transport")}>🚐 Transport</a>}
              {can("visa") && <a onClick={() => go("visa")}>🛂 Visa</a>}
              {can("hotels") && <a onClick={() => go("hotels")}>🏨 Hotels</a>}
            </div>
          )}
        </div>

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "purchase" ? null : "purchase")}>
            Purchase ▾
          </span>
          {open === "purchase" && (
            <div className="menu-box">
              {can("purchase_entry") && <a onClick={() => go("purchase")}>🧾 Purchase Entry</a>}
              {can("purchase_list") && <a onClick={() => go("purchaseList")}>📑 Purchase List</a>}
              {can("pending_purchase") && <a onClick={() => go("pendingPurchase")}>⚠️ Pending Purchase</a>}
            </div>
          )}
        </div>

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "ledger" ? null : "ledger")}>
            Ledger ▾
          </span>
          {open === "ledger" && (
            <div className="menu-box">
              {can("customer_ledger") && <a onClick={() => go("customerLedger")}>📒 Customer Ledger</a>}
              {can("purchase_ledger") && <a onClick={() => go("purchaseLedger")}>📦 Purchase Ledger</a>}
              {can("bank_ledger") && <a onClick={() => go("bankLedger")}>🏦 Bank Ledger</a>}
              {can("cash_ledger") && <a onClick={() => go("cashLedger")}>💵 Cash Ledger</a>}
              {can("expense_ledger") && <a onClick={() => go("expenseLedger")}>💸 Expense Ledger</a>}
              {can("balance_sheet") && <a onClick={() => go("balanceSheet")}>📊 Balance Sheet</a>}
            </div>
          )}
        </div>

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "voucher" ? null : "voucher")}>
            Vouchers ▾
          </span>
          {open === "voucher" && (
            <div className="menu-box">
              {can("hotel_voucher") && <a onClick={() => go("hotelVoucher")}>🏨 Hotel Voucher</a>}
              {can("transport_voucher") && <a onClick={() => go("transportVoucher")}>🚐 Transport Voucher</a>}
            </div>
          )}
        </div>

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "reports" ? null : "reports")}>
            Reports ▾
          </span>
          {open === "reports" && (
            <div className="menu-box">
              {can("all_reports") && <a onClick={() => go("allreports")}>📈 All Reports</a>}
              {can("profit_report") && <a onClick={() => go("profitReport")}>💰 Profit Report</a>}
              {can("sale_adjustment_report") && <a onClick={() => go("saleAdjustmentReport")}>📉 Sale Adjustment Report</a>}
              {can("Purchase_adjustment_report") && <a onClick={() => go("purchaseAdjustmentReport")}>📉 Purchase Adjustment Report</a>}
              {can("system_storage") && <a onClick={() => go("systemStorage")}>💾 System Storage</a>}
            </div>
          )}
        </div>

        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "master" ? null : "master")}>
            Master ▾
          </span>
          {open === "master" && (
            <div className="menu-box">
              {can("create_user") && <a onClick={() => go("createUser")}>👤 Create User</a>}
              {can("manage_users") && <a onClick={() => go("manageUsers")}>🛠 Manage Users</a>}
              {can("deleted_reports") && <a onClick={() => go("deletedReports")}>🗑 Deleted Reports</a>}
              {can("restore") && <a onClick={() => go("restore")}>♻ Restore</a>}
            </div>
          )}
        </div>

      </div>

      <div className="nav-user">
        <span className="user-name">👤 {user?.name || "User"}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
