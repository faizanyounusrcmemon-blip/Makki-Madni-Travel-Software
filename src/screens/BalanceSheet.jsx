import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

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

  if (loading) return <div className="p-4">Loading...</div>;

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
        <h3 className="fw-bold mb-0">Balance Sheet</h3>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* ================= CUSTOMER RECEIVABLE ================= */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white fw-bold text-success">
          Customer Receivable
        </div>

        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Total Sale</th>
                <th>Received</th>
                <th className="text-danger">Balance</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td>{fmt(r.sale_total)}</td>
                  <td>{fmt(r.received)}</td>
                  <td className="fw-bold text-danger">
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}

              {customerRows.length > 0 && (
                <tr className="table-success fw-bold">
                  <td colSpan="2" className="text-end">
                    TOTAL
                  </td>
                  <td>{fmt(customerTotals.sale)}</td>
                  <td>{fmt(customerTotals.received)}</td>
                  <td>{fmt(customerTotals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SUPPLIER PAYABLE ================= */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white fw-bold text-warning">
          Supplier Payable
        </div>

        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Total Purchase</th>
                <th>Paid</th>
                <th className="text-danger">Balance</th>
              </tr>
            </thead>
            <tbody>
              {purchaseRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td>{fmt(r.purchase_total)}</td>
                  <td>{fmt(r.paid)}</td>
                  <td className="fw-bold text-danger">
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}

              {purchaseRows.length > 0 && (
                <tr className="table-warning fw-bold">
                  <td colSpan="2" className="text-end">
                    TOTAL
                  </td>
                  <td>{fmt(purchaseTotals.purchase)}</td>
                  <td>{fmt(purchaseTotals.paid)}</td>
                  <td>{fmt(purchaseTotals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Summary</h5>

          <div className="row text-center">
            <div className="col-md-4 mb-3">
              <div className="p-3 rounded bg-light">
                <small className="text-muted">Receivable</small>
                <h5 className="fw-bold text-success mt-1">
                  PKR {fmt(customerTotals.balance)}
                </h5>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="p-3 rounded bg-light">
                <small className="text-muted">Payable</small>
                <h5 className="fw-bold text-danger mt-1">
                  PKR {fmt(purchaseTotals.balance)}
                </h5>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div className="p-3 rounded bg-light">
                <small className="text-muted">Net Position</small>
                <h5
                  className={`fw-bold mt-1 ${
                    netPosition >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  PKR {fmt(Math.abs(netPosition))}
                </h5>
                <small className="text-muted">
                  {netPosition >= 0
                    ? "You will receive"
                    : "You will pay"}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
