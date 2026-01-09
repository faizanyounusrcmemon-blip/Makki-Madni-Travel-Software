import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US");

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function PurchaseAdjustmentReport() {
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
          (r.customer_name || "").toLowerCase().includes(s) ||
          (r.ref_no || "").toLowerCase().includes(s)
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
    const r = await fetch(
      `${URL}/api/reports/purchase-adjustments`
    );
    const d = await r.json();
    setRows(d.rows || []);
    setView(d.rows || []);
  };

  const totalNet = view.reduce(
    (s, r) => s + (Number(r.amount) - Number(r.adjustment_amount || 0)),
    0
  );

  return (
    <div className="container py-4">
      <h4 className="fw-bold text-danger">
        Purchase Adjustment Report
      </h4>

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
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Ref No</th>
            <th>Total Purchase</th>
            <th className="text-danger">Adjustment</th>
            <th className="text-success">Net Amount</th>
          </tr>
        </thead>
        <tbody>
          {view.map((r, i) => {
            const adj = Number(r.adjustment_amount || 0);
            const net = Number(r.amount) - adj;

            return (
              <tr key={i}>
                <td>{fmtDate(r.date)}</td>
                <td>{r.customer_name}</td>
                <td>{r.ref_no}</td>
                <td>{fmt(r.amount)}</td>
                <td className="text-danger fw-bold">
                  {fmt(adj)}
                </td>
                <td className="fw-bold text-success">
                  {fmt(net)}
                </td>
              </tr>
            );
          })}
          <tr className="fw-bold table-secondary">
            <td colSpan="5">TOTAL</td>
            <td>{fmt(totalNet)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
