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
      temp = temp.filter((r) => new Date(r.date) >= new Date(fromDate));

    if (toDate)
      temp = temp.filter((r) => new Date(r.date) <= new Date(toDate));

    setView(temp);
  }, [search, fromDate, toDate, rows]);

  const load = async () => {
    const r = await fetch(`${URL}/api/reports/purchase-adjustments`);
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
      <div className="card shadow-lg border-0 rounded-4">
        {/* Header */}
        <div
          className="card-header text-white rounded-top-4"
          style={{
            background: "linear-gradient(135deg, #dc3545, #fd7e14)",
          }}
        >
          <h5 className="mb-0 fw-bold">Purchase Adjustment Report</h5>
          <small className="opacity-75">
            Purchase adjustments & net summary
          </small>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="🔍 Search customer / ref no"
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

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Ref No</th>
                  <th className="text-end">Total Purchase</th>
                  <th className="text-end text-danger">Adjustment</th>
                  <th className="text-end text-success">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {view.map((r, i) => {
                  const adj = Number(r.adjustment_amount || 0);
                  const net = Number(r.amount) - adj;

                  return (
                    <tr key={i}>
                      <td>{fmtDate(r.date)}</td>
                      <td className="fw-semibold">{r.customer_name}</td>
                      <td className="text-muted">{r.ref_no}</td>
                      <td className="text-end">{fmt(r.amount)}</td>
                      <td className="text-end text-danger fw-bold">
                        -{fmt(adj)}
                      </td>
                      <td className="text-end text-success fw-bold">
                        {fmt(net)}
                      </td>
                    </tr>
                  );
                })}

                {view.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">
                      No record found
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="table-secondary fw-bold">
                  <td colSpan="5" className="text-end">
                    TOTAL NET
                  </td>
                  <td className="text-end text-success fs-6">
                    {fmt(totalNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
