import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US");

export default function SaleAdjustmentReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let temp = [...rows];

    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          r.customer.toLowerCase().includes(s) ||
          r.ref_no.toLowerCase().includes(s)
      );
    }

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
    const r = await fetch(`${URL}/api/reports/sale-adjustments`);
    const d = await r.json();

    setRows(d.rows);
    setView(d.rows);
  };

  const total = view.reduce(
    (s, r) => s + Number(r.amount || 0),
    0
  );

  return (
    <div className="container py-4">
      <h4 className="fw-bold text-primary">Sale Adjustment Report</h4>

      <div className="row g-2 my-3">
        <div className="col-md-4">
          <input
            className="form-control form-control-sm"
            placeholder="Search customer / ref"
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

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Ref No</th>
            <th>Method</th>
            <th className="text-danger">Amount</th>
          </tr>
        </thead>
        <tbody>
          {view.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.customer}</td>
              <td>{r.ref_no}</td>
              <td>{r.payment_method}</td>
              <td className="text-danger fw-bold">
                {fmt(r.amount)}
              </td>
            </tr>
          ))}
          <tr className="fw-bold table-secondary">
            <td colSpan="4">TOTAL</td>
            <td>{fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
