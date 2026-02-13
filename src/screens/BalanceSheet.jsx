import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

/* ================= ROUNDING TOLERANCE ================= */
const EPS = 1; // 1 rupee ignore

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
    return (
      <div className="p-5 text-center text-danger fw-bold">
        ⏳ Loading Balance Sheet...
      </div>
    );
  if (!data) return null;

  /* ================= CLEAN + FILTER ================= */
  const customerRows = (data.customers || [])
    .map(r => ({ ...r, balance: cleanBalance(r.balance) }))
    .filter(r => r.balance !== 0) // PAID hide
    .sort((a, b) => b.balance - a.balance);

  const supplierRows = (data.suppliers || [])
    .map(r => ({ ...r, balance: cleanBalance(r.balance) }))
    .filter(r => r.balance !== 0)
    .sort((a, b) => b.balance - a.balance);

  /* ================= TOTALS ================= */
  const customerTotals = customerRows.reduce(
    (a, r) => {
      a.sale += Number(r.sale_total || 0);
      a.received += Number(r.received || 0);
      a.balance += Number(r.balance || 0);
      return a;
    },
    { sale: 0, received: 0, balance: 0 }
  );

  const supplierTotals = supplierRows.reduce(
    (a, r) => {
      a.purchase += Number(r.purchase_total || 0);
      a.paid += Number(r.paid || 0);
      a.balance += Number(r.balance || 0);
      return a;
    },
    { purchase: 0, paid: 0, balance: 0 }
  );
  /* ================= ROUNDING IGNORE ================= */
  const EPS = 1; // 1 rupee ignore

  const clean = (v) => {
    const n = Number(v || 0);
    return Math.abs(n) <= EPS ? 0 : n;
  };


  const netPosition = customerTotals.balance - supplierTotals.balance;

  /* ================= STATUS ================= */
  const getStatusBadge = (status) => {
    if (!status) return null;

    const s = status.toUpperCase();
    if (s === "EXTRA PAID") return <span className="badge bg-primary">{s}</span>;
    if (s === "PARTIAL") return <span className="badge bg-warning text-dark">{s}</span>;
    if (s === "PENDING") return <span className="badge bg-danger">{s}</span>;

    return null; // PAID hide
  };

  /* ================= BALANCE COLOR ================= */
  const balanceColor = (bal, type) => {
    if (bal < 0) return "text-primary"; // extra paid
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
          <h4 className="mb-0 fw-bold">Balance Sheet</h4>
          <button
            className="btn btn-light btn-sm fw-semibold"
            onClick={() => onNavigate("dashboard")}
          >
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

      {/* ================= SUMMARY ================= */}
     <div className="card shadow-sm">
       <div className="card-header bg-white fw-bold text-primary">
         📌 Summary
       </div>
       <table className="table mb-0">
         <tbody>
           <tr>
             <td>💰 Customer Receivable</td>
             <td className="text-end fw-bold text-success">
               {fmt(clean(data.summary?.total_receivable))}
             </td>
           </tr>

           <tr>
             <td>📦 Supplier Payable</td>
             <td className="text-end fw-bold text-danger">
               {fmt(clean(data.summary?.total_payable))}
             </td>
           </tr>

           <tr>
             <td>💎 Extra Received (Customers)</td>
             <td className="text-end fw-bold text-primary">
               {fmt(clean(data.summary?.total_extra_received))}
             </td>
           </tr>

           <tr>
             <td>💸 Extra Paid (Suppliers)</td>
             <td className="text-end fw-bold text-primary">
               {fmt(clean(data.summary?.total_extra_paid))}
             </td>
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
               {fmt(Math.abs(clean(netPosition)))}
             </td>
           </tr>
         </tbody>
       </table>
     </div>
   </div>
  );
}
