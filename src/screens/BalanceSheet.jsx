import React, { useEffect, useState } from "react";

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

      if (d.success) {
        setData(d);
      } else {
        alert(d.error || "Failed to load balance sheet");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="container p-4 text-white">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>📊 BALANCE SHEET</h3>
        <button className="btn btn-secondary" onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
      </div>

      {/* ================= CUSTOMER BALANCE ================= */}
      <h5 className="mt-3 text-info">💰 Customer Receivable</h5>

      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>Ref No</th>
            <th>Total Sale</th>
            <th>Received</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.filter(r => r.balance > 0).length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No pending customer balance
              </td>
            </tr>
          )}

          {data.customers
            .filter(r => r.balance > 0)
            .map((r, i) => (
              <tr key={i}>
                <td>{r.ref_no}</td>
                <td>{r.sale_total}</td>
                <td>{r.received}</td>
                <td className="text-danger fw-bold">{r.balance}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ================= PURCHASE BALANCE ================= */}
      <h5 className="mt-5 text-warning">📦 Supplier Payable</h5>

      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>Ref No</th>
            <th>Total Purchase</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.purchases.filter(r => r.balance > 0).length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No pending supplier balance
              </td>
            </tr>
          )}

          {data.purchases
            .filter(r => r.balance > 0)
            .map((r, i) => (
              <tr key={i}>
                <td>{r.ref_no}</td>
                <td>{r.purchase_total}</td>
                <td>{r.paid}</td>
                <td className="text-danger fw-bold">{r.balance}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
