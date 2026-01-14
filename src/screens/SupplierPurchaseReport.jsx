import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export default function SupplierPurchaseReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState(["ALL"]);
  const [supplier, setSupplier] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

  /* ================= LOAD SUPPLIERS (AUTO) ================= */
  const loadSuppliers = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
      );
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers || ["ALL"]);
      }
    } catch (err) {
      console.error("Supplier load error:", err);
    }
  };

  /* ================= LOAD REPORT (BUTTON) ================= */
  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
      );
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
      }
    } catch (err) {
      console.error("Report load error:", err);
    }
    setLoading(false);
  };

  /* ✅ ONLY SUPPLIERS LOAD ON OPEN */
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
    <div className="container p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-3">
        <h4 className="fw-bold">📦 Supplier Wise Purchase Report</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
            ⬅ Back
          </button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            📄 PDF
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card p-2 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="fw-bold">Supplier</label>
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

          <div className="col-md-3">
            <label className="fw-bold">Item Type</label>
            <select
              className="form-select form-select-sm"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            >
              <option value="ALL">All Items</option>
              <option value="Ticket">Ticket</option>
              <option value="Hotel">Hotel</option>
              <option value="Visa">Visa</option>
              <option value="Transport">Transport</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="fw-bold">From</label>
            <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="col-md-2">
            <label className="fw-bold">To</label>
            <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="col-md-2">
            <button
              className="btn btn-primary btn-sm w-100"
              onClick={loadReport}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reload"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div ref={boxRef} className="card p-2">
        <table className="table table-bordered table-sm">
          <thead className="table-dark text-center">
            <tr>
              <th>Supplier</th>
              <th>Ref No</th>
              <th>Item</th>
              <th>Sale</th>
              <th>Purchase</th>
              <th>Profit</th>
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
                  <td className={`text-end fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>
                    {fmt(r.profit)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  PLZ Click Reload button
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="fw-bold text-end">
            <tr>
              <td colSpan="3">TOTAL</td>
              <td>{fmt(totals.sale)}</td>
              <td>{fmt(totals.purchase)}</td>
              <td>{fmt(totals.profit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

