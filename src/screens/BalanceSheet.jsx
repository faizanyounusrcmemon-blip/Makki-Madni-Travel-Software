import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const EPS = 1;
const cleanBalance = (v) => {
  const n = Number(v || 0);
  return Math.abs(n) <= EPS ? 0 : n;
};

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
      const d = await res.json();
      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch (e) {
      console.error(e);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center text-danger fw-bold">⏳ Loading Balance Sheet...</div>;
  if (!data) return null;

  // Filters & Cleaning
  const standardRows = (data.customers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const registeredRows = (data.registeredCustomers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const supplierRows = (data.suppliers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case "PENDING": return <span className="badge bg-danger">PENDING</span>;
      case "PARTIAL": return <span className="badge bg-warning text-dark">PARTIAL</span>;
      case "PAID": return <span className="badge bg-success">PAID</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="mb-4 p-4 rounded-3 shadow-sm text-white" style={{ background: "linear-gradient(90deg, #1e3a8a, #3b82f6)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", fontSize: 22 }}>📊</div>
            <div>
              <h4 className="mb-1 fw-bold">Balance Sheet Statement</h4>
              <small className="opacity-75">Isolated Standard Accounts, Registered Ledger Accounts & Supplier Summaries</small>
            </div>
          </div>
          <button className="btn btn-light btn-sm fw-semibold" onClick={() => onNavigate("dashboard")}>← Back</button>
        </div>
      </div>
      
      {/* SECTION 1: STANDARD CUSTOMERS */}
      <div className="card shadow-sm mb-4 border-start border-success border-3">
        <div className="card-header bg-white fw-bold text-success">📋 Standard Customer Receivable (Walk-In)</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Booking Ref</th>
                <th>Customer Name</th>
                <th className="text-end">Total Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {standardRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-2">No walk-in balance.</td></tr>}
              {standardRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name}</td>
                  <td className="text-end">{fmt(r.sale_total)}</td>
                  <td className="text-end">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-success"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: REGISTERED CUSTOMERS (NEW ISOLATED TABLE) */}
      <div className="card shadow-sm mb-4 border-start border-info border-3">
        <div className="card-header bg-white fw-bold text-info d-flex justify-content-between align-items-center">
          <span>🔑 Registered Ledger Customers Accounts</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer Code</th>
                <th>Account Name</th>
                <th className="text-end">Total Debits (Sales + OB)</th>
                <th className="text-end">Total Credits (Paid)</th>
                <th className="text-end">Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registeredRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-2">No registered customer accounts balance.</td></tr>}
              {registeredRows.map((r, i) => (
                <tr key={i} className="table-info-light">
                  <td>{i + 1}</td>
                  <td className="fw-bold text-dark">{r.customer_code}</td>
                  <td className="fw-semibold text-primary">{r.customer_name}</td>
                  <td className="text-end text-dark">{fmt(r.sale_total)}</td>
                  <td className="text-end text-dark">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: SUPPLIERS */}
      <div className="card shadow-sm mb-4 border-start border-danger border-3">
        <div className="card-header bg-white fw-bold text-danger">📦 Supplier Payable</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Supplier Code</th>
                <th>Supplier Name</th>
                <th className="text-end">Total Purchase</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.supplier_code}</td>
                  <td className="fw-semibold">{r.supplier_name}</td>
                  <td className="text-end">{fmt(r.purchase_total)}</td>
                  <td className="text-end">{fmt(r.paid)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY BLOCK */}
      <div className="card shadow-sm">
        <div className="card-header bg-white fw-bold text-primary">📌 Summary Details</div>
        <table className="table mb-0">
          <tbody>
            <tr>
              <td>💰 Total Customer Receivable (Standard + Registered)</td>
              <td className="text-end fw-bold text-success">{fmt(data.summary?.total_receivable)}</td>
            </tr>
            <tr>
              <td>📦 Total Supplier Payable</td>
              <td className="text-end fw-bold text-danger">{fmt(data.summary?.total_payable)}</td>
            </tr>
            <tr>
              <td>💎 Total Extra Received Adjustments</td>
              <td className="text-end fw-bold text-primary">{fmt(data.summary?.total_extra_received)}</td>
            </tr>
            <tr>
              <td>💸 Total Extra Paid Adjustments</td>
              <td className="text-end fw-bold text-primary">{fmt(data.summary?.total_extra_paid)}</td>
            </tr>
            <tr className="table-light fw-bold">
              <td>🔄 Net System Position <br /><small className="text-muted">{(Number(data.summary?.total_receivable) - Number(data.summary?.total_payable)) >= 0 ? "Net Receivable Position" : "Net Payable Position"}</small></td>
              <td className={`text-end ${(Number(data.summary?.total_receivable) - Number(data.summary?.total_payable)) >= 0 ? "text-success" : "text-danger"}`}>
                {fmt(Math.abs(Number(data.summary?.total_receivable) - Number(data.summary?.total_payable)))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}