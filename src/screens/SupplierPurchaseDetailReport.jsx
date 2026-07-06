import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SupplierPurchasedetailreport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState(["ALL"]);
  const [supplier, setSupplier] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSale, setShowSale] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  /* ================= LOAD SUPPLIERS ================= */
  const loadSuppliers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`);
      const data = await res.json();
      if (data.success) setSuppliers(["ALL", ...(data.suppliers || [])]);
    } catch (err) {
      console.error("Error loading suppliers:", err);
    }
  };

  /* ================= LOAD REPORT ================= */
  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`);
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
      else setRows([]);
    } catch (err) {
      console.error("Error loading report:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  /* ================= FILTER ================= */
  const filtered = rows.filter((r) => {
    if (supplier !== "ALL" && r.supplier_name?.trim() !== supplier.trim()) return false;
    if (itemType !== "ALL" && !r.item?.toLowerCase().includes(itemType.toLowerCase())) return false;

    const d = r.booking_date ? new Date(r.booking_date) : null;
    if (from && d && d < new Date(from)) return false;
    if (to && d && d > new Date(to)) return false;

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
      if (showSale) a.sale += Number(b.sale_pkr || 0);
      a.purchase += Number(b.purchase_pkr || 0);
      if (showProfit) a.profit += Number(b.profit || 0);
      return a;
    },
    { sale: 0, purchase: 0, profit: 0 }
  );

  /* ================= PDF EXPORT ================= */
  const exportPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("📦 Supplier Purchase Detail Report", pageWidth / 2, 14, { align: "center" });

    const head = [
      [
        "Date",
        "Supplier",
        "Ref",
        "Item",
        ...(showSale ? ["Sale SAR", "Sale Rate", "Sale PKR"] : []),
        "Purchase SAR",
        "Purchase Rate",
        "Purchase PKR",
        ...(showProfit ? ["Profit"] : [])
      ]
    ];

    const body = filtered.map((r) => [
      formatDate(r.booking_date),
      r.supplier_name,
      r.ref_no,
      r.item,
      ...(showSale ? [fmt(r.sale_sar), fmt(r.sale_rate), fmt(r.sale_pkr)] : []),
      fmt(r.purchase_sar),
      fmt(r.purchase_rate),
      fmt(r.purchase_pkr),
      ...(showProfit ? [fmt(r.profit)] : [])
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 20,
      theme: "grid",
      headStyles: { fillColor: [255, 102, 102], textColor: 255, halign: "center" },
      bodyStyles: { halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => {
        const finalY = data.cursor.y + 5;
        let totalsText = "";
        if (showSale) totalsText += `Sale PKR: ${fmt(totals.sale)}    `;
        totalsText += `Purchase PKR: ${fmt(totals.purchase)}    `;
        if (showProfit) totalsText += `Profit: ${fmt(totals.profit)}`;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(totalsText, pageWidth - 10, finalY, { align: "right" });
      },
      margin: { top: 20 }
    });

    doc.save("supplier-purchase-report.pdf");
  };

  return (
    <div className="container-fluid p-3" style={{ fontSize: 12, minHeight: "100vh" }}>
      {/* HEADER */}
      <div className="card shadow-sm mb-3 border-0">
        <div
          className="card-body py-3 d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(90deg, #ff758c, #ff7eb3)",
            color: "white",
            borderRadius: "10px",
            fontWeight: "bold",
          }}
        >
          📦 Supplier Purchase Detail Report
          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm rounded-pill" onClick={() => onNavigate("dashboard")}>
              ⬅ Back
            </button>
            <button className="btn btn-success btn-sm rounded-pill" onClick={exportPDF}>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-3 border-0" style={{ background: "#eef2f3", borderRadius: "10px" }}>
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                {suppliers.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                <option value="ALL">All Items</option>
                <option value="Ticket">Ticket</option>
                <option value="Hotel">Hotel</option>
                <option value="Visa">Visa</option>
                <option value="Card">Visa</option>
                <option value="Transport">Transport</option>
                <option value="Ziyarat">Ziyarat</option>
                <option value="Groups">Groups</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="text" placeholder="Search" className="form-control form-control-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-primary btn-sm rounded-pill" onClick={loadReport}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Load"}
              </button>
            </div>
          </div>

          {/* CHECKBOXES */}
          <div className="d-flex gap-4 mt-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" checked={showSale} onChange={(e) => setShowSale(e.target.checked)} />
              <label className="form-check-label">Show Sale</label>
            </div>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" checked={showProfit} onChange={(e) => setShowProfit(e.target.checked)} />
              <label className="form-check-label">Show Profit</label>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div className="card shadow-sm rounded" style={{ overflowX: "auto", maxHeight: "70vh" }}>
        <div className="card-body py-2">
          <div className="mb-2 text-end fw-bold">
            {showSale && <span className="me-3 text-primary">Sale PKR: {fmt(totals.sale)}</span>}
            <span className="me-3 text-danger">Purchase PKR: {fmt(totals.purchase)}</span>
            {showProfit && <span className={totals.profit >= 0 ? "text-success" : "text-danger"}>Profit: {fmt(totals.profit)}</span>}
          </div>

          <table className="table table-sm table-bordered text-center align-middle">
            <thead style={{ background: "#ff9a9e", color: "#fff" }}>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Ref</th>
                <th>Item</th>
                {showSale && <>
                  <th>Sale SAR</th>
                  <th>Sale Rate</th>
                  <th>Sale PKR</th>
                </>}
                <th>Purchase SAR</th>
                <th>Purchase Rate</th>
                <th>Purchase PKR</th>
                {showProfit && <th>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff8e1" : "#ffe0b2" }}>
                  <td>{formatDate(r.booking_date)}</td>
                  <td>{r.supplier_name}</td>
                  <td>{r.ref_no}</td>
                  <td>{r.item}</td>
                  {showSale && <>
                    <td className="text-end">{fmt(r.sale_sar)}</td>
                    <td className="text-end">{fmt(r.sale_rate)}</td>
                    <td className="text-end">{fmt(r.sale_pkr)}</td>
                  </>}
                  <td className="text-end">{fmt(r.purchase_sar)}</td>
                  <td className="text-end">{fmt(r.purchase_rate)}</td>
                  <td className="text-end">{fmt(r.purchase_pkr)}</td>
                  {showProfit && <td className={`text-end fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>{fmt(r.profit)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
