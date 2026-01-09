import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US");

export default function SaleAdjustmentReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let temp = [...rows];

    // 🔍 SEARCH (Customer / Ref)
    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          r.customer.toLowerCase().includes(s) ||
          r.ref_no.toLowerCase().includes(s)
      );
    }

    // 📅 DATE FILTER
    if (fromDate)
      temp = temp.filter(
        (r) => new Date(r.date) >= new Date(fromDate)
      );
    if (toDate)
      temp = temp.filter(
        (r) => new Date(r.date) <= new Date(toDate)
      );

    setView(temp);
  }, [search, fromDate, toDate, rows]);

  const load = async () => {
    setLoading(true);

    const r = await fetch(`${URL}/api/customer-ledger/pending/list`);
    const d = await r.json();

    let all = [];

    for (const c of d.rows) {
      const led = await fetch(
        `${URL}/api/customer-ledger/${c.ref_no}`
      );
      const ld = await led.json();

      const adj = ld.rows
        .filter((r) => r.description === "Adjustment")
        .map((r) => ({
          date: r.date,
          customer: c.customer_name,
          ref_no: c.ref_no,
          amount: r.debit,
        }));

      all.push(...adj);
    }

    setRows(all);
    setView(all);
    setLoading(false);
  };

  const total = view.reduce(
    (s, r) => s + Number(r.amount || 0),
    0
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h4 className="fw-bold text-primary">Sale Adjustment Report</h4>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <input
            className="form-control form-control-sm"
            placeholder="Search customer / ref no"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : (
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Ref No</th>
              <th className="text-danger">Amount</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr key={i}>
                <td>{r.date}</td>
                <td className="fw-bold">{r.customer}</td>
                <td>{r.ref_no}</td>
                <td className="fw-bold text-danger">
                  {fmt(r.amount)}
                </td>
              </tr>
            ))}
            <tr className="table-secondary fw-bold">
              <td colSpan="3">TOTAL</td>
              <td>{fmt(total)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
