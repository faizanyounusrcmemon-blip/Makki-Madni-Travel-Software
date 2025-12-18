import React, { useEffect, useState } from "react";

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`
    );
    const d = await r.json();
    if (d.success) setData(d);
    else alert(d.error);
  };

  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h3>📊 BALANCE SHEET</h3>

      {/* ================= CUSTOMER ================= */}
      <h5 className="mt-4">🧑 Customer Receivable</h5>
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Ref No</th>
            <th>Sale</th>
            <th>Received</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.map((r,i)=>(
            <tr key={i}>
              <td>{r.ref_no}</td>
              <td>{r.sale_total.toLocaleString()}</td>
              <td>{r.received.toLocaleString()}</td>
              <td className="fw-bold text-danger">
                {r.balance.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= PURCHASE ================= */}
      <h5 className="mt-4">🏭 Purchase Payable</h5>
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Ref No</th>
            <th>Purchase</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.purchases.map((r,i)=>(
            <tr key={i}>
              <td>{r.ref_no}</td>
              <td>{r.purchase_total.toLocaleString()}</td>
              <td>{r.paid.toLocaleString()}</td>
              <td className="fw-bold text-danger">
                {r.balance.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= SUMMARY ================= */}
      <h5 className="mt-4">📌 Summary</h5>
      <table className="table table-bordered w-50">
        <tbody>
          <tr>
            <th>Total Receivable</th>
            <td>{data.summary.total_receivable.toLocaleString()}</td>
          </tr>
          <tr>
            <th>Total Payable</th>
            <td>{data.summary.total_payable.toLocaleString()}</td>
          </tr>
          <tr className="table-success">
            <th>Net Position</th>
            <td className="fw-bold">
              {data.summary.net_position.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
