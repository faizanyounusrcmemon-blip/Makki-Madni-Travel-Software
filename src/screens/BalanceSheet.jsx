import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

/* ================= ROUNDING TOLERANCE ================= */
const EPS = 1;

/* normalize balance */
const cleanBalance = (v) => {
  const n = Number(v || 0);
  return Math.abs(n) <= EPS ? 0 : n;
};

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  if (loading)
    return <div className="p-5 text-center text-danger fw-bold">⏳ Loading Balance Sheet...</div>;
  if (!data) return null;

  /* ================= CLEAN + FILTER ================= */
  const customerRows = (data.customers || [])
    .map(r => ({ ...r, balance: cleanBalance(r.balance) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => b.balance - a.balance);

  const supplierRows = (data.suppliers || [])
    .map(r => ({ ...r, balance: cleanBalance(r.balance) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => b.balance - a.balance);

  /* ================= TOTALS FROM CLEANED ROWS ================= */
  const customerTotals = customerRows.reduce(
    (a, r) => {
      a.sale += Number(r.sale_total || 0);
      a.received += Number(r.received || 0);

      if (r.balance > 0) a.balance += r.balance;
      if (r.balance < 0) a.extra += Math.abs(r.balance);

      return a;
    },
    { sale: 0, received: 0, balance: 0, extra: 0 }
  );

  const supplierTotals = supplierRows.reduce(
    (a, r) => {
      a.purchase += Number(r.purchase_total || 0);
      a.paid += Number(r.paid || 0);

      if (r.balance > 0) a.balance += r.balance;
      if (r.balance < 0) a.extra += Math.abs(r.balance);

      return a;
    },
    { purchase: 0, paid: 0, balance: 0, extra: 0 }
  );

  /* ================= CLEAN TOTALS ================= */
  const totalReceivable = cleanBalance(customerTotals.balance);
  const totalPayable = cleanBalance(supplierTotals.balance);
  const totalExtraReceived = cleanBalance(customerTotals.extra);
  const totalExtraPaid = cleanBalance(supplierTotals.extra);

  /* ================= NET POSITION ================= */
  const netPosition = cleanBalance(totalReceivable - totalPayable - supplierTotals.extra + customerTotals.extra);

  /* ================= STATUS ================= */
const getStatusBadge = (status) => {
  if (!status) return null;

  switch (status.toUpperCase()) {

    case "PENDING":
      return (
        <span className="badge bg-danger">
          PENDING
        </span>
      );

    case "PARTIAL":
      return (
        <span className="badge bg-warning text-dark">
          PARTIAL
        </span>
      );

    case "PAID":
      return (
        <span className="badge bg-success">
          PAID
        </span>
      );

    default:
      return (
        <span className="badge bg-secondary">
          {status}
        </span>
      );
  }
};

  const balanceColor = (bal, type) => {
    if (bal < 0) return "text-primary";
    if (type === "customer") return "text-success";
    return "text-danger";
  };

  return (
    <div className="container py-4">

      {/* ================= HEADER ================= */}
      <div
        className="mb-4 p-4 rounded-3 shadow-sm text-white"
        style={{ background: "linear-gradient(90deg, #2563eb, #06b6d4)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", fontSize: 22 }}
            >
              📊
            </div>
            <div>
              <h4 className="mb-1 fw-bold">Balance Sheet</h4>
              <small className="opacity-75">
                Receivable, Payable & Supplier Ledger Summary
              </small>
            </div>
          </div>
          <button
            className="btn btn-light btn-sm fw-semibold"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>
      
      {/* CUSTOMER */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-bold text-success">
          💰 Customer Receivable
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Customer</th>
                <th className="text-end">Total Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name || "-"}</td>
                  <td className="text-end">{fmt(r.sale_total)}</td>
                  <td className="text-end">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${balanceColor(r.balance,"customer")}`}>
                    {fmt(r.balance)}
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPPLIER */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-bold text-danger">
          📦 Supplier Payable
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Supplier Code</th>
                <th>Supplier</th>
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
                  <td>{r.supplier_code}</td>
                  <td className="fw-semibold">{r.supplier_name || "-"}</td>
                  <td className="text-end">{fmt(r.purchase_total)}</td>
                  <td className="text-end">{fmt(r.paid)}</td>
                  <td className={`text-end fw-bold ${balanceColor(r.balance,"supplier")}`}>
                    {fmt(r.balance)}
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="card shadow-sm">
        <div className="card-header bg-white fw-bold text-primary">📌 Summary</div>
        <table className="table mb-0">
          <tbody>
            <tr>
              <td>💰 Customer Receivable</td>
              <td className="text-end fw-bold text-success">{fmt(totalReceivable)}</td>
            </tr>
            <tr>
              <td>📦 Supplier Payable</td>
              <td className="text-end fw-bold text-danger">{fmt(totalPayable)}</td>
            </tr>
            <tr>
              <td>💎 Extra Received</td>
              <td className="text-end fw-bold text-primary">{fmt(totalExtraReceived)}</td>
            </tr>
            <tr>
              <td>💸 Extra Paid</td>
              <td className="text-end fw-bold text-primary">{fmt(totalExtraPaid)}</td>
            </tr>
            <tr className="table-light fw-bold">
              <td>
                🔄 Net Position
                <br />
                <small className="text-muted">
                  {netPosition >= 0 ? "Aap lene wale ho" : "Aap dene wale ho"}
                </small>
              </td>
              <td className={`text-end ${netPosition >= 0 ? "text-success" : "text-danger"}`}>
                {fmt(Math.abs(netPosition))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}

