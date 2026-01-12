import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
      const d = await res.json();
      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-white">⏳ Loading...</div>;
  if (!data) return null;

  /* ================= FILTER ================= */
  let customerRows = data.customers.filter((r) => r.balance > 0);
  if (search) {
    const s = search.toLowerCase();
    customerRows = customerRows.filter(
      (r) => r.customer_name.toLowerCase().includes(s) || r.ref_no.toLowerCase().includes(s)
    );
  }
  if (fromDate) customerRows = customerRows.filter((r) => new Date(r.date) >= new Date(fromDate));
  if (toDate) customerRows = customerRows.filter((r) => new Date(r.date) <= new Date(toDate));

  /* ================= TOTALS ================= */
  const customerTotals = customerRows.reduce(
    (a, r) => {
      a.sale += Number(r.sale_total || 0);
      a.adjustment += Number(r.adjustment || 0);
      a.net += Number(r.net_amount || 0);
      return a;
    },
    { sale: 0, adjustment: 0, net: 0 }
  );

  return (
    <div className="container p-4" style={{ fontFamily: "Arial, sans-serif", color: "#fff" }}>
      {/* HEADER */}
      <div className="mb-3 p-3 rounded" style={{ background: "linear-gradient(90deg, #4facfe, #00f2fe)" }}>
        <h3 className="mb-1">📊 Sale Adjustment Report</h3>
        <small>Sale adjustments & net summary</small>
        <button
          className="btn btn-light btn-sm float-end"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* FILTERS */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Search customer / ref no"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-dark table-hover table-bordered rounded text-center">
          <thead className="table-secondary text-dark">
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Ref No</th>
              <th>Total Sale</th>
              <th className="text-danger">Adjustment</th>
              <th className="text-success">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {customerRows.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.date).toLocaleDateString("en-GB")}</td>
                <td className="fw-bold">{r.customer_name}</td>
                <td>{r.ref_no}</td>
                <td>{fmt(r.sale_total)}</td>
                <td className="text-danger">{fmt(r.adjustment)}</td>
                <td className="text-success fw-bold">{fmt(r.net_amount)}</td>
              </tr>
            ))}

            <tr className="table-light fw-bold">
              <td colSpan="3" className="text-end">TOTAL</td>
              <td>{fmt(customerTotals.sale)}</td>
              <td className="text-danger">{fmt(customerTotals.adjustment)}</td>
              <td className="text-success">{fmt(customerTotals.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
