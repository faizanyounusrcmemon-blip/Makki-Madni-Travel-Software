import React, { useEffect, useState, useRef } from "react";
import useReportExport from "../hooks/useReportExport";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function SmartSupplierSelect({ suppliers, selectedSupplier, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const cleanSuppliers = suppliers.filter((s) => s !== "ALL");
  const filteredList = cleanSuppliers.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        type="button"
        className="form-select form-select-sm text-start bg-white d-flex justify-content-between align-items-center shadow-none"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}
      >
        <span className="text-truncate" style={{ maxWidth: "85%" }}>
          {selectedSupplier || "ALL"}
        </span>
      </button>

      {isOpen && (
        <div
          className="position-absolute start-0 w-100 bg-white border rounded-3 shadow-lg p-2"
          style={{ zIndex: 1050, top: "100%", marginTop: "3px", maxHeight: "220px", overflowY: "auto" }}
        >
          <input
            type="text"
            className="form-control form-control-sm mb-2"
            placeholder="🔍 Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div
            className={`p-2 rounded text-truncate mb-1 ${
              selectedSupplier === "ALL" ? "bg-primary text-white fw-bold" : "text-dark"
            }`}
            style={{ cursor: "pointer", fontSize: "12px" }}
            onClick={() => {
              onSelect("ALL");
              setIsOpen(false);
              setSearch("");
            }}
          >
            ALL
          </div>
          {filteredList.map((s, i) => (
            <div
              key={i}
              className={`p-2 rounded text-truncate mb-1 ${
                selectedSupplier === s ? "bg-primary text-white fw-bold" : "text-dark"
              }`}
              style={{ cursor: "pointer", fontSize: "12px" }}
              onClick={() => {
                onSelect(s);
                setIsOpen(false);
                setSearch("");
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

  const { exportPDF, exportExcel } = useReportExport();

  const loadSuppliers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`);
      const data = await res.json();
      if (data.success) setSuppliers(["ALL", ...(data.suppliers || [])]);
    } catch (err) {
      console.error("Error loading suppliers:", err);
    }
  };

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
    loadReport();
  }, []);

  const filtered = rows
    .filter((r) => {
      if (Number(r.purchase_sar || 0) <= 0 && Number(r.purchase_pkr || 0) <= 0) return false;
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
    })
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

  const totals = filtered.reduce(
    (a, b) => {
      if (showSale) {
        a.sale_pkr += Number(b.sale_pkr || 0);
        a.sale_sar += Number(b.sale_sar || 0);
      }
      a.purchase_pkr += Number(b.purchase_pkr || 0);
      a.purchase_sar += Number(b.purchase_sar || 0);
      if (showProfit) a.profit += Number(b.profit || 0);
      return a;
    },
    { sale_pkr: 0, sale_sar: 0, purchase_pkr: 0, purchase_sar: 0, profit: 0 }
  );

  const handleExportExcel = () => {
    exportExcel({
      code: supplier,
      name: supplier === "ALL" ? "All Suppliers" : supplier,
      fromDate: from,
      toDate: to,
      ledgerData: filtered,
      title: "Supplier Purchase Detail Report",
      filePrefix: "Supplier_Purchase_Detail_Report",
      reportType: "supplier_purchase",
      totals,
      showSale,
      showProfit
    });
  };

  const handleExportPDF = () => {
    exportPDF({
      code: supplier,
      name: supplier === "ALL" ? "All Suppliers" : supplier,
      fromDate: from,
      toDate: to,
      ledgerData: filtered,
      title: "Supplier Purchase Detail Report",
      filePrefix: "Supplier_Purchase_Detail_Report",
      reportType: "supplier_purchase",
      totals,
      showSale,
      showProfit
    });
  };

  return (
    <div className="container-fluid p-3 csdl-premium" style={{ fontSize: 12, minHeight: "100vh", background: "linear-gradient(135deg,#f4f7fc 0%,#eef2f8 55%,#fff8e8 100%)" }}>
      <style>{`
        .csdl-premium{color:#17243b;font-family:Inter,Segoe UI,Arial,sans-serif}
        .csdl-premium .card{border:1px solid #e0e7f1!important;border-radius:18px!important;box-shadow:0 8px 25px rgba(20,43,79,.09)!important;overflow:visible}
        .csdl-premium .card-body{border-radius:18px}
        .csdl-premium .csdl-header{background:linear-gradient(115deg,#071b3a 0%,#123f78 58%,#c99a35 140%)!important;border:1px solid rgba(218,177,83,.8)}
        .csdl-premium .csdl-title{font-size:clamp(16px,2vw,23px);font-weight:900;letter-spacing:.25px;color:#fff}
        .csdl-premium .btn{font-weight:750;border-radius:10px!important}
        .csdl-premium .csdl-filter-card{background:linear-gradient(135deg,#fff 0%,#f4f7fc 100%)!important;border-top:3px solid #d4a83f!important}
        .csdl-premium label{font-size:11px;text-transform:uppercase;color:#27466e;font-weight:850!important}
        .csdl-premium .form-control,.csdl-premium .form-select{min-height:36px;border:1px solid #cbd6e5;border-radius:10px;font-weight:600;color:#172b49}
        .csdl-premium .csdl-table-wrap{max-height:65vh;overflow:auto;border-radius:0 0 16px 16px}
        .csdl-premium table{font-size:12px;white-space:nowrap}
        .csdl-premium table thead th{background:linear-gradient(180deg,#173e70,#0c2548)!important;color:#fff!important;padding:12px 10px;font-size:10px;text-transform:uppercase}
        .csdl-premium table tbody td{padding:9px 10px;border-color:#e1e8f1}
        .csdl-premium table tbody tr:nth-child(even){background:#f2f6fc}
        .csdl-premium table tbody tr:hover{background:#fff5d9!important}
      `}</style>

      {/* HEADER */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body py-3 d-flex justify-content-between align-items-center csdl-header" style={{ borderRadius: "16px" }}>
          <span className="csdl-title">📦 SUPPLIER PURCHASE DETAIL REPORT</span>
          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm rounded-pill" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
            <button className="btn btn-success btn-sm rounded-pill" onClick={handleExportExcel}>Export Excel 📊</button>
            <button className="btn btn-danger btn-sm rounded-pill" onClick={handleExportPDF}>Export PDF 📄</button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-3 border-0 csdl-filter-card" style={{ borderRadius: "10px" }}>
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="fw-bold mb-1">Supplier Selection</label>
              <SmartSupplierSelect suppliers={suppliers} selectedSupplier={supplier} onSelect={(val) => setSupplier(val)} />
            </div>
            <div className="col-md-2">
              <label className="fw-bold mb-1">Category</label>
              <select className="form-select form-select-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                <option value="ALL">All Items</option>
                <option value="Ticket">Ticket</option>
                <option value="Hotel">Hotel</option>
                <option value="Visa">Visa</option>
                <option value="Card">Card</option>
                <option value="Transport">Transport</option>
                <option value="Ziyarat">Ziyarat</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="fw-bold mb-1">From Date</label>
              <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="fw-bold mb-1">To Date</label>
              <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="fw-bold mb-1">Global Search</label>
              <input type="text" placeholder="Ref, Item..." className="form-control form-control-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-1 d-grid">
              <button className="btn btn-primary btn-sm rounded-pill" onClick={loadReport}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Load"}
              </button>
            </div>
          </div>

          <div className="d-flex gap-4 mt-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="chkSale" checked={showSale} onChange={(e) => setShowSale(e.target.checked)} />
              <label className="form-check-label fw-semibold" htmlFor="chkSale">Show Sale Columns</label>
            </div>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="chkProfit" checked={showProfit} onChange={(e) => setShowProfit(e.target.checked)} />
              <label className="form-check-label fw-semibold" htmlFor="chkProfit">Show Profit Column</label>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div className="card shadow-sm rounded" style={{ overflow: "hidden", borderTop: "3px solid #123f78" }}>
        <div className="p-3 text-end fw-bold d-flex flex-wrap gap-3 justify-content-between align-items-center bg-white border-bottom">
          <div style={{fontWeight:900,color:"#12345d",fontSize:14}}>📋 Records View ({filtered.length})</div>
          <div className="d-flex gap-3 flex-wrap" style={{ fontSize: 13 }}>
            {showSale && <span className="text-primary">Sale PKR: {fmt(totals.sale_pkr)}</span>}
            <span className="text-danger">Purchase PKR: {fmt(totals.purchase_pkr)}</span>
            {showProfit && <span className={totals.profit >= 0 ? "text-success" : "text-danger"}>Profit: {fmt(totals.profit)}</span>}
          </div>
        </div>
        <div className="csdl-table-wrap">
          <table className="table table-sm table-bordered text-center align-middle m-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Ref</th>
                <th>Item</th>
                {showSale && (
                  <>
                    <th>Sale SAR</th>
                    <th>Sale Rate</th>
                    <th>Sale PKR</th>
                  </>
                )}
                <th>Purchase SAR</th>
                <th>Purchase Rate</th>
                <th>Purchase PKR</th>
                {showProfit && <th>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r.booking_date)}</td>
                  <td className="fw-bold text-dark">{r.supplier_name}</td>
                  <td><span className="badge bg-light text-dark border">{r.ref_no}</span></td>
                  <td className="text-start">{r.item}</td>
                  {showSale && (
                    <>
                      <td className="text-end text-primary">{fmt(r.sale_sar)}</td>
                      <td className="text-end">{fmt(r.sale_rate)}</td>
                      <td className="text-end">{fmt(r.sale_pkr)}</td>
                    </>
                  )}
                  <td className="text-end text-danger">{fmt(r.purchase_sar)}</td>
                  <td className="text-end">{fmt(r.purchase_rate)}</td>
                  <td className="text-end fw-bold">{fmt(r.purchase_pkr)}</td>
                  {showProfit && <td className={`text-end fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>{fmt(r.profit)}</td>}
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={10} className="py-4 text-muted">No records found.</td></tr>}
            </tbody>
            <tfoot className="table-dark fw-bold" style={{ position: "sticky", bottom: 0, zIndex: 5 }}>
              <tr>
                <td colSpan="4">TOTALS</td>
                {showSale && (
                  <>
                    <td className="text-end text-info">{fmt(totals.sale_sar)}</td>
                    <td></td>
                    <td className="text-end">{fmt(totals.sale_pkr)}</td>
                  </>
                )}
                <td className="text-end text-warning">{fmt(totals.purchase_sar)}</td>
                <td></td>
                <td className="text-end">{fmt(totals.purchase_pkr)}</td>
                {showProfit && <td className="text-end">{fmt(totals.profit)}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}