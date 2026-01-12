import React, { useEffect, useState, useMemo } from "react";

/* ================= HELPERS ================= */
const fmt = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "0";

const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PurchaseAdjustmentReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const URL = import.meta.env.VITE_BACKEND_URL;

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await fetch(
        `${URL}/api/reports/purchase-adjustments`
      );
      const data = await res.json();
      const rows = data.rows || [];
      setRows(rows);
      setView(rows);
    } catch (err) {
      console.error("Load Error:", err);
      setRows([]);
      setView([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= FILTER ================= */
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

    if (fromDate) {
      temp = temp.filter(
        (r) => new Date(r.date) >= new Date(fromDate)
      );
    }

    if (toDate) {
      temp = temp.filter(
        (r) => new Date(r.date) <= new Date(toDate)
      );
    }

    setView(temp);
  }, [search, fromDate, toDate, rows]);

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    return view.reduce(
      (acc, r) => {
        const amount = Number(r.amount || 0);
        const adj = Number(r.adjustment_amount || 0);
        acc.amount += amount;
        acc.adjustment += adj;
        acc.net += amount - adj;
        return acc;
      },
      { amount: 0, adjustment: 0, net: 0 }
    );
  }, [view]);

  return (
    <div className="container py-4">
      <div className="card shadow-lg border-0 rounded-4">
        {/* ================= HEADER ================= */}
        <div
          className="card-header text-white d-flex justify-content-between align-items-center rounded-top-4"
          style={{
            background: "linear-gradient(135deg, #dc3545, #fd7e14)",
          }}
        >
          <div>
            <h5 className="mb-0 fw-bold">
              Purchase Adjustment Report
            </h5>
            <small className="opacity-75">
              Purchase adjustments & net summary
            </small>
          </div>

          {/* ✅ WORKING BACK BUTTON */}
          <button
            className="btn btn-light btn-sm fw-semibold"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>

        <div className="card-body">
          {/* ================= FILTERS ================= */}
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

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Ref No</th>
                  <th className="text-end">
                    Total Purchase
                  </th>
                  <th className="text-end text-danger">
                    Adjustment
                  </th>
                  <th className="text-end text-success">
                    Net Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {view.map((r, i) => {
                  const adj = Number(
                    r.adjustment_amount || 0
                  );
                  const net =
                    Number(r.amount || 0) - adj;

                  return (
                    <tr key={i}>
                      <td>{fmtDate(r.date)}</td>
                      <td className="fw-semibold">
                        {r.customer_name || "-"}
                      </td>
                      <td className="text-muted">
                        {r.ref_no || "-"}
                      </td>
                      <td className="text-end">
                        {fmt(r.amount)}
                      </td>
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
                    <td
                      colSpan="6"
                      className="text-center text-muted py-3"
                    >
                      No record found
                    </td>
                  </tr>
                )}
              </tbody>

              {/* ================= FOOTER TOTALS ================= */}
              <tfoot>
                <tr className="table-secondary fw-bold">
                  <td colSpan="3" className="text-end">
                    TOTAL
                  </td>

                  <td className="text-end text-primary fs-6">
                    {fmt(totals.amount)}
                  </td>

                  <td className="text-end text-danger fs-6">
                    -{fmt(totals.adjustment)}
                  </td>

                  <td className="text-end text-success fs-6">
                    {fmt(totals.net)}
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
