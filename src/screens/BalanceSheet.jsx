import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

/* ================= ROUNDING TOLERANCE ================= */
const EPS = 1; // 1 rupee ignore globally

const clean = (v) => {
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
    return <div className="p-5 text-center text-danger fw-bold">⏳ Loading...</div>;

  if (!data) return null;

  /* ================= CLEAN ROWS ================= */
  const customerRows = (data.customers || [])
    .map(r => ({ ...r, balance: clean(r.balance) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => b.balance - a.balance);

  const supplierRows = (data.suppliers || [])
    .map(r => ({ ...r, balance: clean(r.balance) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => b.balance - a.balance);

  /* ================= TOTALS ================= */
  const rawCustomerBalance = customerRows.reduce((a, r) => a + r.balance, 0);
  const rawSupplierBalance = supplierRows.reduce((a, r) => a + r.balance, 0);

  const customerBalance = clean(rawCustomerBalance);
  const supplierBalance = clean(rawSupplierBalance);

  /* ================= NET POSITION ================= */
  const netPosition = clean(customerBalance - supplierBalance);

  /* ================= EXTRA TOTALS ================= */
  const extraReceived = clean(
    (data.customers || [])
      .filter(r => Number(r.balance) < 0)
      .reduce((a, r) => a + Math.abs(Number(r.balance)), 0)
  );

  const extraPaid = clean(
    (data.suppliers || [])
      .filter(r => Number(r.balance) < 0)
      .reduce((a, r) => a + Math.abs(Number(r.balance)), 0)
  );

  /* ================= STATUS ================= */
  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toUpperCase();
    if (s === "EXTRA PAID") return <span className="badge bg-primary">{s}</span>;
    if (s === "PARTIAL") return <span className="badge bg-warning text-dark">{s}</span>;
    if (s === "PENDING") return <span className="badge bg-danger">{s}</span>;
    return null;
  };

  const balanceColor = (bal, type) => {
    if (bal < 0) return "text-primary";
    if (type === "customer") return "text-success";
    return "text-danger";
  };

  return (
    <div className="container py-4">

      {/* ================= HEADER ================= */}
      <div className="mb-4 p-4 rounded-3 shadow-sm text-white"
        style={{ background: "linear-gradient(90deg, #2563eb, #06b6d4)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-bold">Balance Sheet</h4>
          <button className="btn btn-light btn-sm" onClick={() => onNavigate("dashboard")}>
            ← Back
          </button>
        </div>
      </div>

      {/* ================= CUSTOMER ================= */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-bold text-success">
          💰 Customer Receivable
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Ref</th>
                <th>Customer</th>
                <th className="text-end">Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r,i)=>(
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name}</td>
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

      {/* ================= SUPPLIER ================= */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-bold text-danger">
          📦 Supplier Payable
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Supplier</th>
                <th className="text-end">Purchase</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((r,i)=>(
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{r.supplier_code}</td>
                  <td className="fw-semibold">{r.supplier_name}</td>
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

      {/* ================= SUMMARY ================= */}
      <div className="card shadow-sm">
        <div className="card-header bg-white fw-bold text-primary">
          📌 Summary
        </div>
        <table className="table mb-0">
          <tbody>
            <tr>
              <td>💰 Customer Receivable</td>
              <td className="text-end fw-bold text-success">{fmt(customerBalance)}</td>
            </tr>

            <tr>
              <td>📦 Supplier Payable</td>
              <td className="text-end fw-bold text-danger">{fmt(supplierBalance)}</td>
            </tr>

            <tr>
              <td>💎 Extra Received</td>
              <td className="text-end fw-bold text-primary">{fmt(extraReceived)}</td>
            </tr>

            <tr>
              <td>💸 Extra Paid</td>
              <td className="text-end fw-bold text-primary">{fmt(extraPaid)}</td>
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
