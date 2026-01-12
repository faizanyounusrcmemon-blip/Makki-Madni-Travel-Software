import React, { useEffect, useState, useMemo } from "react";

const fmt = (v) =>
  v != null ? Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0";

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState({ customers: [], purchases: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
      const d = await res.json();
      if (d && d.success) {
        setData({
          customers: Array.isArray(d.customers) ? d.customers : [],
          purchases: Array.isArray(d.purchases) ? d.purchases : [],
        });
      } else {
        alert(d?.error || "Failed to load balance sheet");
      }
    } catch (err) {
      alert("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-white">Loading...</div>;

  const customerRows = data.customers.filter((r) => Number(r.balance) > 0);
  const purchaseRows = data.purchases.filter((r) => Number(r.balance) > 0);

  const customerTotals = useMemo(() => {
    let totals = { sale: 0, received: 0, balance: 0 };
    for (let r of customerRows) {
      totals.sale += Number(r.sale_total || 0);
      totals.received += Number(r.received || 0);
      totals.balance += Number(r.balance || 0);
    }
    return totals;
  }, [customerRows]);

  const purchaseTotals = useMemo(() => {
    let totals = { purchase: 0, paid: 0, balance: 0 };
    for (let r of purchaseRows) {
      totals.purchase += Number(r.purchase_total || 0);
      totals.paid += Number(r.paid || 0);
      totals.balance += Number(r.balance || 0);
    }
    return totals;
  }, [purchaseRows]);

  const netPosition = customerTotals.balance - purchaseTotals.balance;

  return (
    <div className="container py-4">
      <div className="card shadow-lg border-0 rounded-4">
        <div
          className="card-header text-white d-flex justify-content-between align-items-center rounded-top-4"
          style={{ background: "linear-gradient(135deg, #6610f2, #6f42c1)" }}
        >
          <div>
            <h5 className="mb-0 fw-bold">📊 BALANCE SHEET</h5>
            <small className="opacity-75">Customers & Suppliers summary</small>
          </div>
          <button className="btn btn-light btn-sm fw-semibold" onClick={() => onNavigate("dashboard")}>
            ← Back
          </button>
        </div>

        <div className="card-body">
          <h5 className="text-info">💰 Customer Receivable</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm align-middle">
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
                    <td>{r.ref_no || "-"}</td>
                    <td className="text-info fw-semibold">{r.customer_name || "-"}</td>
                    <td className="text-end">{fmt(r.sale_total)}</td>
                    <td className="text-end">{fmt(r.received)}</td>
                    <td className="text-end text-danger fw-bold">{fmt(r.balance)}</td>
                  </tr>
                ))}
                {customerRows.length > 0 && (
                  <tr className="table-secondary fw-bold text-dark">
                    <td colSpan="3" className="text-end">GRAND TOTAL</td>
                    <td className="text-end">{fmt(customerTotals.sale)}</td>
                    <td className="text-end">{fmt(customerTotals.received)}</td>
                    <td className="text-end text-danger fw-bold">{fmt(customerTotals.balance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h5 className="text-warning mt-4">📦 Supplier Payable</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm align-middle">
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
                    <td>{r.ref_no || "-"}</td>
                    <td className="text-info fw-semibold">{r.customer_name || "-"}</td>
                    <td className="text-end">{fmt(r.purchase_total)}</td>
                    <td className="text-end">{fmt(r.paid)}</td>
                    <td className="text-end text-danger fw-bold">{fmt(r.balance)}</td>
                  </tr>
                ))}
                {purchaseRows.length > 0 && (
                  <tr className="table-secondary fw-bold text-dark">
                    <td colSpan="3" className="text-end">GRAND TOTAL</td>
                    <td className="text-end">{fmt(purchaseTotals.purchase)}</td>
                    <td className="text-end">{fmt(purchaseTotals.paid)}</td>
                    <td className="text-end text-danger fw-bold">{fmt(purchaseTotals.balance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
                    <small>{netPosition >= 0 ? "Aap lene wale ho" : "Aap dene wale ho"}</small>
                  </td>
                  <td className={netPosition >= 0 ? "text-success" : "text-danger"}>
                    {fmt(Math.abs(netPosition))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
