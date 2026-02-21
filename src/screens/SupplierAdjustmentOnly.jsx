import React, { useEffect, useState, useMemo } from "react";

/* ================= HELPERS ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString() : "-";

export default function SupplierAdjustmentOnly({ onNavigate }) {

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const URL = import.meta.env.VITE_BACKEND_URL;

  /* ================= FETCH ================= */
  const loadData = () => {
    let url = `${URL}/api/reports/supplier-adjustment-only`;

    if (fromDate && toDate) {
      url += `?from=${fromDate}&to=${toDate}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(d => setRows(d.rows || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= SEARCH FILTER ================= */
  const view = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();

    return rows.filter(r =>
      (r.supplier_name || "").toLowerCase().includes(s) ||
      (r.supplier_code || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  /* ================= TOTAL ================= */
  const totalAdjustment = view.reduce(
    (a, r) => a + Number(r.adjustment_amount || 0),
    0
  );

  return (
    <div className="container py-4">
      <div className="card shadow-lg border-0 rounded-4">

        {/* ================= HEADER ================= */}
        <div
          className="card-header text-white d-flex justify-content-between"
          style={{ background: "linear-gradient(135deg,#6f42c1,#0d6efd)" }}
        >
          <div>
            <h5 className="mb-0 fw-bold">
              Supplier Adjustment Report
            </h5>
            <small className="opacity-75">
              Payment Method: Adjustment Only
            </small>
          </div>

          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="card-body">

          {/* ===== DATE FILTER ===== */}
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="fw-semibold">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e)=>setFromDate(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="fw-semibold">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e)=>setToDate(e.target.value)}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={loadData}
              >
                Apply Filter
              </button>
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-secondary btn-sm w-100"
                onClick={()=>{
                  setFromDate("");
                  setToDate("");
                  loadData();
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* ===== SEARCH ===== */}
          <input
            className="form-control form-control-sm mb-3"
            placeholder="🔍 Search supplier / code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* ===== TABLE ===== */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">

              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Supplier Code</th>
                  <th>Supplier</th>
                  <th className="text-end">Adjustment Amount</th>
                </tr>
              </thead>

              <tbody>
                {view.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{fmtDate(r.payment_date)}</td>
                    <td>{r.supplier_code}</td>
                    <td className="fw-semibold">{r.supplier_name}</td>
                    <td className="text-end text-danger fw-bold">
                      {fmt(r.adjustment_amount)}
                    </td>
                  </tr>
                ))}

                {view.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No adjustment record found
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="table-secondary fw-bold">
                  <td colSpan="4" className="text-end">TOTAL</td>
                  <td className="text-end text-danger">
                    {fmt(totalAdjustment)}
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
