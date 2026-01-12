import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`
      );
      const d = await res.json();
      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-5 text-center text-muted fw-bold">
        ⏳ Loading Balance Sheet...
      </div>
    );
  if (!data) return null;

  /* ================= FILTER ================= */
  const customerRows = data.customers.filter((r) => r.balance > 0);
  const purchaseRows = data.purchases.filter((r) => r.balance > 0);

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

  const purchaseTotals = purchaseRows.reduce(
    (a, r) => {
      a.purchase += Number(r.purchase_total || 0);
      a.paid += Number(r.paid || 0);
      a.balance += Number(r.balance || 0);
      return a;
    },
    { purchase: 0, paid: 0, balance: 0 }
  );

  const netPosition = customerTotals.balance - purchaseTotals.balance;

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">📊 Balance Sheet</h3>
          <small className="text-muted">Receivable, Payable & Net Summary</small>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onNavigate("dashboard")}
        >
          ← Back
        </button>
      </div>

      {/* ================= CUSTOMER RECEIVABLE ================= */}
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
                  <td className="text-end text-success fw-bold">
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}

              {customerRows.length > 0 && (
                <tr className="table-secondary fw-bold">
                  <td colSpan="3" className="text-end">TOTAL</td>
                  <td className="text-end">{fmt(customerTotals.sale)}</td>
                  <td className="text-end">{fmt(customerTotals.received)}</td>
                  <td className="text-end text-success">
                    {fmt(customerTotals.balance)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SUPPLIER PAYABLE ================= */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-bold text-danger">
          📦 Supplier Payable
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Supplier</th>
                <th className="text-end">Total Purchase</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name || "-"}</td>
                  <td className="text-end">{fmt(r.purchase_total)}</td>
                  <td className="text-end">{fmt(r.paid)}</td>
                  <td className="text-end text-danger fw-bold">
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}

              {purchaseRows.length > 0 && (
                <tr className="table-secondary fw-bold">
                  <td colSpan="3" className="text-end">TOTAL</td>
                  <td className="text-end">{fmt(purchaseTotals.purchase)}</td>
                  <td className="text-end">{fmt(purchaseTotals.paid)}</td>
                  <td className="text-end text-danger">
                    {fmt(purchaseTotals.balance)}
                  </td>
                </tr>
              )}
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
              <td>💰 Lene Hain (Customer)</td>
              <td className="text-end fw-bold text-success">
                {fmt(customerTotals.balance)}
              </td>
            </tr>
            <tr>
              <td>📦 Dene Hain (Supplier)</td>
              <td className="text-end fw-bold text-danger">
                {fmt(purchaseTotals.balance)}
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
              <td
                className={`text-end ${
                  netPosition >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {fmt(Math.abs(netPosition))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
