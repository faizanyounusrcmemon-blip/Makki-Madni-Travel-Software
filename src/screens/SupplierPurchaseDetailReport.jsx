import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export default function SupplierPurchasedetailreport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState(["ALL"]);
  const [supplier, setSupplier] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔥 NEW STATE */
  const [showProfit, setShowProfit] = useState(false);

  const boxRef = useRef(null);

  /* ================= LOAD SUPPLIERS ================= */
  const loadSuppliers = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
    );
    const data = await res.json();
    if (data.success) setSuppliers(data.suppliers || ["ALL"]);
  };

  /* ================= LOAD REPORT ================= */
  const loadReport = async () => {
    setLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
    );
    const data = await res.json();
    if (data.success) setRows(data.rows || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  /* ================= FILTER ================= */
  const filtered = rows.filter((r) => {
    if (supplier !== "ALL" && r.supplier_name !== supplier) return false;
    if (
      itemType !== "ALL" &&
      !r.item?.toLowerCase().includes(itemType.toLowerCase())
    )
      return false;
    if (from && new Date(r.booking_date) < new Date(from)) return false;
    if (to && new Date(r.booking_date) > new Date(to)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.ref_no?.toLowerCase().includes(s) ||
        r.item?.toLowerCase().includes(s) ||
        r.supplier_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  /* ================= TOTALS ================= */
  const totals = filtered.reduce(
    (a, b) => {
      a.purchase += Number(b.purchase_pkr || 0);
      a.sale += Number(b.sale_pkr || 0);
      a.profit += Number(b.profit || 0);
      return a;
    },
    { purchase: 0, sale: 0, profit: 0 }
  );

  /* ================= PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(boxRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("supplier-purchase-report.pdf");
  };

  return (
    <div className="container-fluid p-3 bg-light min-vh-100">
      {/* HEADER */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body d-flex justify-content-between align-items-center bg-primary text-white rounded">
          <h4 className="mb-0">📦 Supplier Wise Purchase Report</h4>
          <div className="d-flex gap-2">
            <button
              className="btn btn-light btn-sm"
              onClick={() => onNavigate("dashboard")}
            >
              ⬅ Back
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={exportPDF}
            >
              📄 Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="fw-semibold">Supplier</label>
              <select
                className="form-select form-select-sm"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                {suppliers.map((s, i) => (
                  <option key={i} value={s}>
                    {s === "ALL" ? "All Suppliers" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="fw-semibold">Item</label>
              <select
                className="form-select form-select-sm"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="Ticket">Ticket</option>
                <option value="Hotel">Hotel</option>
                <option value="Visa">Visa</option>
                <option value="Transport">Transport</option>
                <option value="Ziyarat">Ziyarat</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="fw-semibold">From</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="fw-semibold">To</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="fw-semibold">Search</label>
              <input
                className="form-control form-control-sm"
                placeholder="Ref / Item / Supplier"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-1">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={loadReport}
                disabled={loading}
              >
                {loading ? "..." : "Load"}
              </button>
            </div>

            {/* ✅ SHOW PROFIT CHECKBOX */}
            <div className="col-md-2 mt-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showProfit"
                  checked={showProfit}
                  onChange={(e) => setShowProfit(e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="showProfit">
                  Show Profit
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-success">
            <div className="card-body text-center">
              <div className="fw-semibold">Sale</div>
              <h4 className="fw-bold mb-0">{fmt(totals.sale)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-warning">
            <div className="card-body text-center">
              <div className="fw-semibold">Purchase</div>
              <h4 className="fw-bold mb-0">{fmt(totals.purchase)}</h4>
            </div>
          </div>
        </div>

        {showProfit && (
          <div className="col-md-4">
            <div
              className={`card shadow-sm border-0 text-${
                totals.profit >= 0 ? "primary" : "danger"
              }`}
            >
              <div className="card-body text-center">
                <div className="fw-semibold">Profit</div>
                <h4 className="fw-bold mb-0">{fmt(totals.profit)}</h4>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div ref={boxRef} className="card shadow-sm border-0">
        <table className="table table-hover table-sm mb-0">
          <thead className="table-dark sticky-top text-center">
            <tr>
              <th>Supplier</th>
              <th>Ref No</th>
              <th>Item</th>
              <th className="text-end">Sale</th>
              <th className="text-end">Purchase</th>
              {showProfit && <th className="text-end">Profit</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.length ? (
              filtered.map((r, i) => (
                <tr key={i}>
                  <td>{r.supplier_name}</td>
                  <td>{r.ref_no}</td>
                  <td>{r.item}</td>
                  <td className="text-end">{fmt(r.sale_pkr)}</td>
                  <td className="text-end">{fmt(r.purchase_pkr)}</td>
                  {showProfit && (
                    <td
                      className={`text-end fw-bold ${
                        r.profit >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {fmt(r.profit)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={showProfit ? 6 : 5}
                  className="text-center text-muted py-4"
                >
                  📌 Report load karne ke liye <b>Load</b> button dabayein
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


