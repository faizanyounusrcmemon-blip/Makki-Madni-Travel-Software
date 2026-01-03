import React, { useEffect, useState } from "react";

/* ================= FORMAT ================= */
const money = (v) =>
  Number(v || 0).toLocaleString("en-US");

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`
    );
    const d = await r.json();
    if (d.success) setData(d);
    setLoading(false);
  };

  if (loading) return <div className="p-5">Loading...</div>;

  const receivable = data.customers.filter((r) => r.balance > 0);
  const payable = data.purchases.filter((r) => r.balance > 0);

  const rTotal = receivable.reduce((a, b) => a + Number(b.balance), 0);
  const pTotal = payable.reduce((a, b) => a + Number(b.balance), 0);
  const net = rTotal - pTotal;

  return (
    <div className="bs-wrap">

      {/* HEADER */}
      <div className="bs-header">
        <div>
          <h2>Balance Sheet</h2>
          <span>Financial Position Overview</span>
        </div>
        <button onClick={() => onNavigate("dashboard")}>
          Back
        </button>
      </div>

      {/* SUMMARY */}
      <div className="bs-summary">
        <div className="card green">
          <small>Receivable</small>
          <h3>PKR {money(rTotal)}</h3>
        </div>

        <div className="card red">
          <small>Payable</small>
          <h3>PKR {money(pTotal)}</h3>
        </div>

        <div className={`card ${net >= 0 ? "green" : "red"}`}>
          <small>Net Position</small>
          <h3>PKR {money(Math.abs(net))}</h3>
          <span>{net >= 0 ? "You will receive" : "You will pay"}</span>
        </div>
      </div>

      {/* DETAILS */}
      <div className="bs-grid">

        {/* RECEIVABLE */}
        <div className="panel">
          <h4 className="green">Customer Receivable</h4>

          {receivable.map((r, i) => (
            <div key={i} className="row">
              <div>
                <strong>{r.ref_no}</strong>
                <span>Sale: {money(r.sale_total)}</span>
              </div>
              <div className="amount green">
                {money(r.balance)}
              </div>
            </div>
          ))}
        </div>

        {/* PAYABLE */}
        <div className="panel">
          <h4 className="red">Supplier Payable</h4>

          {payable.map((r, i) => (
            <div key={i} className="row">
              <div>
                <strong>{r.ref_no}</strong>
                <span>Purchase: {money(r.purchase_total)}</span>
              </div>
              <div className="amount red">
                {money(r.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .bs-wrap {
          padding: 30px;
          background: #f5f7fa;
          min-height: 100vh;
          font-family: "Segoe UI", system-ui;
        }

        .bs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .bs-header h2 {
          margin: 0;
          font-weight: 600;
        }

        .bs-header span {
          font-size: 13px;
          color: #6b7280;
        }

        .bs-header button {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
        }

        .bs-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }

        .card small {
          color: #6b7280;
          font-size: 12px;
        }

        .card h3 {
          margin: 8px 0 2px;
          font-weight: 700;
        }

        .card span {
          font-size: 12px;
          color: #6b7280;
        }

        .green h3 { color: #0f766e; }
        .red h3 { color: #b91c1c; }

        .bs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .panel {
          background: white;
          padding: 18px;
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }

        .panel h4 {
          margin-bottom: 14px;
          font-weight: 600;
        }

        .panel h4.green { color: #0f766e; }
        .panel h4.red { color: #b91c1c; }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px dashed #e5e7eb;
        }

        .row:last-child {
          border-bottom: none;
        }

        .row span {
          font-size: 12px;
          color: #6b7280;
        }

        .amount {
          font-weight: 700;
        }

        .amount.green { color: #0f766e; }
        .amount.red { color: #b91c1c; }

        @media (max-width: 600px) {
          .bs-wrap {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
