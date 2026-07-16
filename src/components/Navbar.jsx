import React, { useState } from "react";
import "./Navbar.css";
import Swal from "sweetalert2";

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const isAdmin = user?.role === "admin";

  const can = (perm) => isAdmin || user?.[perm] === true;

  const go = (page) => {
    setOpen(null);
    onNavigate(page);
  };

  const logout = async () => {
    const confirmLogout = await Swal.fire({
      width: "280px",
      title: "Logout?",
      html: "⚠️ Do you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal-btn-delete",
        cancelButton: "swal-btn-cancel"
      }
    });

    if (!confirmLogout.isConfirmed) return;

    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) return;

    Swal.fire({
      width: "260px",
      title: "Logging out...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id })
        }
      );

      const data = await res.json();
      Swal.close();

      if (data.success) {
        sessionStorage.removeItem("user");
        Swal.fire("Logged out!", "", "success");

        setTimeout(() => {
          onNavigate("login");
        }, 800);
      } else {
        Swal.fire("Error", data.error || "Logout failed", "error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Server error", "error");
    }
  };

  return (
    <nav className="vip-navbar">
      <div className="nav-logo" onClick={() => go("dashboard")}>
        ✈ Makki Madni Travel
      </div>

      <div className="nav-links">
        {/* ==============================
            SALES DROPDOWN
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "sales" ? null : "sales")}>
            Sales ▾
          </span>
          {open === "sales" && (
            <div className="menu-box">
              {can("packages") && <a onClick={() => go("packages")}>📦 Packages</a>}
              {can("ticketing") && <a onClick={() => go("ticketing")}>🎫 Ticketing</a>}
              {can("transport") && <a onClick={() => go("transport")}>🚐 Transport</a>}
              {can("ziyarat") && <a onClick={() => go("ziyarat")}>🕌 Ziyarat</a>}
              {can("visa") && <a onClick={() => go("visa")}>🛂 Visa</a>}
              {can("hotels") && <a onClick={() => go("hotels")}>🏨 Hotels</a>}
              {can("groups") && <a onClick={() => go("groups")}>👨‍👩‍👧‍👦 Groups Package</a>}
              {can("card") && <a onClick={() => go("card")}>💳 Vaccination Card</a>}
            </div>
          )}
        </div>

        {/* ==============================
            PURCHASE DROPDOWN
        =============================== */}
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

        {/* ==============================
            LEDGER DROPDOWN
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "ledger" ? null : "ledger")}>
            Ledger ▾
          </span>
          {open === "ledger" && (
            <div className="menu-box">
              {can("customer_ledger") && <a onClick={() => go("customerLedger")}>📒 Customer Ledger</a>}
              {can("registered_customer_ledger") && <a onClick={() => go("registeredCustomerLedger")}>📒 Registered Customer Ledger</a>}
              {can("supplier_ledger") && <a onClick={() => go("supplierLedger")}>📦 Supplier Ledger</a>}
              {can("bank_ledger") && <a onClick={() => go("bankLedger")}>🏦 Bank Ledger</a>}
              {can("cash_ledger") && <a onClick={() => go("cashLedger")}>💵 Cash Ledger</a>}
              {can("expense_ledger") && <a onClick={() => go("expenseLedger")}>💸 Expense Ledger</a>}
              {can("balance_sheet") && <a onClick={() => go("balanceSheet")}>📊 Balance Sheet</a>}
            </div>
          )}
        </div>

        {/* ==============================
            VOUCHERS DROPDOWN
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "voucher" ? null : "voucher")}>
            Vouchers ▾
          </span>
          {open === "voucher" && (
            <div className="menu-box">
              {can("hotel_voucher") && <a onClick={() => go("hotelVoucher")}>🏨 Hotel Voucher</a>}
              {can("hotel_voucher3in1") && <a onClick={() => go("hotelVoucher3in1")}>🏨 3.Hotel IN 1 PAGE</a>}
              {can("transport_voucher") && <a onClick={() => go("transportVoucher")}>🚐 Transport Voucher</a>}
            </div>
          )}
        </div>

        {/* ==============================
            REPORTS DROPDOWN
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "reports" ? null : "reports")}>
            Reports ▾
          </span>
          {open === "reports" && (
            <div className="menu-box">
              {can("all_reports") && <a onClick={() => go("allreports")}>📈 All Reports</a>}
              {can("all_reports_today") && <a onClick={() => go("allreportstoday")}>📈 All Reports Today</a>}
              {can("profit_report") && <a onClick={() => go("profitReport")}>💰 Profit Report</a>}
              {can("monthly_profit_dashboard") && <a onClick={() => go("monthlyProfitDashboard")}>💰 Monthly Profit</a>}
              {can("sale_adjustment_report") && <a onClick={() => go("saleAdjustmentReport")}>📉 Sale Adjustment Report</a>}
              {can("supplier_adjustment_only") && <a onClick={() => go("supplierAdjustmentOnly")}>📉 Supplier Adjustment Only</a>}
              {can("supplier_purchase_detail_report") && <a onClick={() => go("supplierPurchaseDetailReport")}>📦 Supplier Purchase Detail Report</a>}
              {can("item_loss_zero_report") && <a onClick={() => go("itemLossZeroReport")}>📊 Item Loss & Zero Profit Report</a>}
              {can("sale_change_check_report") && <a onClick={() => go("saleChangeCheckReport")}>📊 Sale vs Purchase Sale Check Report</a>}
            </div>
          )}
        </div>

        {/* ==============================
            MASTER DROPDOWN (Yahan wapis add kar diya hai)
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "master" ? null : "master")}>
            Master ▾
          </span>
          {open === "master" && (
            <div className="menu-box">
              {can("create_user") && <a onClick={() => go("createUser")}>👤 Create User</a>}
              {can("manage_users") && <a onClick={() => go("manageUsers")}>🛠 Manage Users</a>}
              {can("supplier") && <a onClick={() => go("supplier")}>🏷 Supplier Profile</a>}
              {can("customers_list") && <a onClick={() => go("customersList")}>🏷 Customer Profile</a>}
              {can("deleted_reports") && <a onClick={() => go("deletedReports")}>🗑 Deleted Reports</a>}
              {can("system_storage") && <a onClick={() => go("systemStorage")}>💾 System Storage</a>}
              {can("password_settings") && <a onClick={() => go("passwordSettings")}>🛠 Password Settings</a>}
              {can("restore") && <a onClick={() => go("restore")}>♻ Restore</a>}
            </div>
          )}
        </div>

        {/* ==============================
            ARCHIVE DROPDOWN
        =============================== */}
        <div className="nav-item">
          <span className="nav-title" onClick={() => setOpen(open === "archive" ? null : "archive")}>
            Archive ▾
          </span>
          {open === "archive" && (
            <div className="menu-box">
              {can("archive_manager") && <a onClick={() => go("archiveManager")}>📦 Archive Manager</a>}
              {can("archive_list") && <a onClick={() => go("archiveList")}>📑 Archive List Report</a>}
            </div>
          )}
        </div>
      </div>

      {/* ==============================
          USER STICKER & LOGOUT
      =============================== */}
      <div className="nav-user">
        <div className="online-indicator-nav">
          <span className="online-dot"></span>
          Online
        </div>
        <span className="user-name">👤 {user?.name || "User"}</span>
        <button className="logout-btn" onClick={logout}>
          🏃🚪 Logout
        </button>
      </div>
    </nav>
  );
}