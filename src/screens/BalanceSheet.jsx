import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState({ customers: [], purchases: [] }); // safe default
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
        setData({
          customers: Array.isArray(d.customers) ? d.customers : [],
          purchases: Array.isArray(d.purchases) ? d.purchases : [],
        });
      } else {
        alert(d.error || "Failed to load balance sheet");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-white">Loading...</div>;

  const customerRows = (data.customers || []).filter(
    (r) => Number(r.balance || 0) > 0
  );
  const purchaseRows = (data.purchases || []).filter(
    (r) => Number(r.balance || 0) > 0
  );

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
    <div className="container p-4 text-white">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>📊 BALANCE SHEET</h3>
        <button
          className="btn btn-secondary"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* CUSTOMER RECEIVABLE */}
      <h5 className="text-info">💰 Customer Receivable</h5>
      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Customer</th>
            <th>Total Sale</th>
            <th>Received</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {customerRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.ref_no || "-"}</td>
              <td className="text-info fw-bold">{r.customer_name || "-"}</td>
              <td>{fmt(r.sale_total)}</td>
              <td>{fmt(r.received)}</td>
              <td className="text-danger fw-bold">{fmt(r.balance)}</td>
            </tr>
          ))}
          {customerRows.length > 0 && (
            <tr className="table-secondary text-dark fw-bold">
              <td colSpan="3" className="text-end">
                GRAND TOTAL
              </td>
              <td>{fmt(customerTotals.sale)}</td>
              <td>{fmt(customerTotals.received)}</td>
              <td>{fmt(customerTotals.balance)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* SUPPLIER PAYABLE */}
      <h5 className="text-warning mt-4">📦 Supplier Payable</h5>
      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Supplier</th>
            <th>Total Purchase</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {purchaseRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.ref_no || "-"}</td>
              <td className="text-info fw-bold">{r.customer_name || "-"}</td>
              <td>{fmt(r.purchase_total)}</td>
              <td>{fmt(r.paid)}</td>
              <td className="text-danger fw-bold">{fmt(r.balance)}</td>
            </tr>
          ))}
          {purchaseRows.length > 0 && (
            <tr className="table-secondary text-dark fw-bold">
              <td colSpan="3" className="text-end">
                GRAND TOTAL
              </td>
              <td>{fmt(purchaseTotals.purchase)}</td>
              <td>{fmt(purchaseTotals.paid)}</td>
              <td>{fmt(purchaseTotals.balance)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* SUMMARY */}
      <div className="mt-5 p-4 rounded bg-dark border border-light">
        <h4 className="mb-3">📌 SUMMARY</h4>
        <table className="table table-dark table-bordered mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Details</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>💰 Lene Hain (Customer)</td>
              <td className="text-success fw-bold">{fmt(customerTotals.balance)}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>📦 Dene Hain (Supplier)</td>
              <td className="text-danger fw-bold">{fmt(purchaseTotals.balance)}</td>
            </tr>
            <tr className="table-secondary text-dark fw-bold">
              <td>3</td>
              <td>
                🔄 Net Position
                <br />
                <small>
                  {netPosition >= 0 ? "Aap lene wale ho" : "Aap dene wale ho"}
                </small>
              </td>
              <td className={netPosition >= 0 ? "text-success" : "text-danger"}>
                {fmt(Math.abs(netPosition))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
