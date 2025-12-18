import React, { useState } from "react";

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  const go = (page) => {
    setOpen(null);
    onNavigate(page);
  };

  const logout = () => {
    if (!window.confirm("Logout karna hai?")) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload(); // 🔑 safest
  };

  return (
    <nav className="vip-navbar">
      {/* LOGO */}
      <div
        className="nav-logo"
        onClick={() => go("dashboard")}
        style={{ cursor: "pointer" }}
      >
        ✈️ Makki Madni Travel
      </div>

      {/* MENU */}
      <div className="nav-links">

        {/* SALES */}
        <div className="nav-item">
          <span onClick={() => setOpen(open === "sales" ? null : "sales")}>
            Sales ▾
          </span>
          {open === "sales" && (
            <div className="vip-menu">
              <div onClick={() => go("packages")}>📦 Packages</div>
              <div onClick={() => go("ticketing")}>🎫 Ticketing</div>
              <div onClick={() => go("transport")}>🚐 Transport</div>
              <div onClick={() => go("visa")}>🛂 Visa</div>
              <div onClick={() => go("hotels")}>🏨 Hotels</div>
            </div>
          )}
        </div>

        {/* PURCHASE */}
        <div className="nav-item">
          <span onClick={() => setOpen(open === "purchase" ? null : "purchase")}>
            Purchase ▾
          </span>
          {open === "purchase" && (
            <div className="vip-menu">
              <div onClick={() => go("purchase")}>🧾 Purchase Entry</div>
              <div onClick={() => go("purchaseList")}>📑 Purchase List</div>
            </div>
          )}
        </div>

        {/* LEDGER */}
        <div className="nav-item">
          <span onClick={() => setOpen(open === "ledger" ? null : "ledger")}>
            Ledger ▾
          </span>
          {open === "ledger" && (
            <div className="vip-menu">
              <div onClick={() => go("customerLedger")}>📒 Customer Ledger</div>
              <div onClick={() => go("purchaseLedger")}>📦 Purchase Ledger</div>
              <div onClick={() => go("bankLedger")}>🏦 Bank Ledger</div>
              <div onClick={() => go("balanceSheet")}>📊 Balance Sheet</div>
            </div>
          )}
        </div>

        {/* REPORTS */}
        <div className="nav-item">
          <span onClick={() => setOpen(open === "reports" ? null : "reports")}>
            Reports ▾
          </span>
          {open === "reports" && (
            <div className="vip-menu">
              <div onClick={() => go("allreports")}>📈 All Reports</div>
              <div onClick={() => go("profitReport")}>💰 Profit Report</div>
              <div onClick={() => go("createUser")}>Create User</div>
            </div>
          )}
        </div>
      </div>

      {/* USER + LOGOUT */}
      <div className="nav-user">
        <span className="user-name">
          👤 {user?.name || "User"}
        </span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* STYLES */}
      <style>{`
        .vip-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          background: linear-gradient(135deg, #000428, #004e92);
          color: #fff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        .nav-logo {
          font-size: 20px;
          font-weight: bold;
          color: #ffd700;
        }

        .nav-links {
          display: flex;
          gap: 26px;
        }

        .nav-item {
          position: relative;
          cursor: pointer;
        }

        .vip-menu {
          position: absolute;
          top: 36px;
          left: 0;
          min-width: 220px;
          background: linear-gradient(145deg, #0f2027, #203a43, #2c5364);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 40px rgba(0,0,0,0.7);
        }

        .vip-menu div {
          padding: 12px 18px;
          cursor: pointer;
          border-left: 3px solid transparent;
        }

        .vip-menu div:hover {
          background: rgba(255,215,0,0.15);
          border-left: 3px solid #ffd700;
          color: #ffd700;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-name {
          font-size: 14px;
          opacity: 0.9;
        }

        .logout-btn {
          background: linear-gradient(135deg, #ff4b2b, #ff416c);
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: 0.3s;
        }

        .logout-btn:hover {
          transform: scale(1.05);
          opacity: 0.9;
        }
      `}</style>
    </nav>
  );
}
