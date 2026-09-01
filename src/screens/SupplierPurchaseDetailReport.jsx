import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

/* ================= SMART SEARCHABLE SUPPLIER DROPDOWN ================= */
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
          {filteredList.length > 0 ? (
            filteredList.map((s, i) => (
              <div
                key={i}
                className={`p-2 rounded text-truncate mb-1 ${
                  selectedSupplier === s ? "bg-primary text-white fw-bold" : "text-dark"
                }`}
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                  backgroundColor: selectedSupplier === s ? undefined : "#f8f9fa",
                }}
                onClick={() => {
                  onSelect(s);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {s}
              </div>
            ))
          ) : (
            <div className="text-muted p-2 text-center" style={{ fontSize: "11px" }}>
              No supplier found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= MAIN REPORT COMPONENT ================= */
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

/* ================= FILTER & SORT ================= */
  const filtered = rows
    .filter((r) => {
      // Hide 0 purchase records
      if (Number(r.purchase_sar || 0) <= 0 && Number(r.purchase_pkr || 0) <= 0) {
        return false;
      }

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
    // 🔹 DATE SORTING (Ascending order)
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

  /* ================= TOTALS ================= */
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

  /* ================= EXCEL EXPORT FUNCTION ================= */
  const exportExcel = () => {
    const dataRows = filtered.map((r) => {
      const rowObj = {
        "Date": formatDate(r.booking_date),
        "Supplier": r.supplier_name,
        "Ref No": r.ref_no,
        "Item": r.item,
      };

      if (showSale) {
        rowObj["Sale SAR"] = Number(r.sale_sar || 0);
        rowObj["Sale Rate"] = Number(r.sale_rate || 0);
        rowObj["Sale PKR"] = Number(r.sale_pkr || 0);
      }

      rowObj["Purchase SAR"] = Number(r.purchase_sar || 0);
      rowObj["Purchase Rate"] = Number(r.purchase_rate || 0);
      rowObj["Purchase PKR"] = Number(r.purchase_pkr || 0);

      if (showProfit) {
        rowObj["Profit"] = Number(r.profit || 0);
      }
      return rowObj;
    });

    const totalRow = {
      "Date": "TOTALS",
      "Supplier": "",
      "Ref No": "",
      "Item": "",
    };

    if (showSale) {
      totalRow["Sale SAR"] = totals.sale_sar;
      totalRow["Sale Rate"] = "";
      totalRow["Sale PKR"] = totals.sale_pkr;
    }

    totalRow["Purchase SAR"] = totals.purchase_sar;
    totalRow["Purchase Rate"] = "";
    totalRow["Purchase PKR"] = totals.purchase_pkr;

    if (showProfit) {
      totalRow["Profit"] = totals.profit;
    }

    dataRows.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Detail");
    XLSX.writeFile(workbook, "supplier-purchase-report.xlsx");
  };

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
        if (showSale) totalsText += `Sale SAR: ${fmt(totals.sale_sar)} | Sale PKR: ${fmt(totals.sale_pkr)}   `;
        totalsText += `Purchase SAR: ${fmt(totals.purchase_sar)} | Purchase PKR: ${fmt(totals.purchase_pkr)}   `;
        if (showProfit) totalsText += `Profit: ${fmt(totals.profit)}`;
        doc.setFontSize(10);
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
            <button className="btn btn-success btn-sm rounded-pill" onClick={exportExcel}>
              Export Excel 📊
            </button>
            <button className="btn btn-danger btn-sm rounded-pill" onClick={exportPDF}>
              Export PDF 📄
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-3 border-0" style={{ background: "#eef2f3", borderRadius: "10px" }}>
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="fw-bold mb-1">Supplier (Smart Search)</label>
              <SmartSupplierSelect
                suppliers={suppliers}
                selectedSupplier={supplier}
                onSelect={(val) => setSupplier(val)}
              />
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
                <option value="Groups">Groups</option>
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
              <label className="fw-bold mb-1">Search</label>
              <input type="text" placeholder="Ref, Item, Supplier..." className="form-control form-control-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="col-md-1 d-grid">
              <button className="btn btn-primary btn-sm rounded-pill" onClick={loadReport}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : "Load"}
              </button>
            </div>
          </div>

          {/* CHECKBOXES */}
          <div className="d-flex gap-4 mt-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="chkSale" checked={showSale} onChange={(e) => setShowSale(e.target.checked)} />
              <label className="form-check-label fw-semibold" htmlFor="chkSale">Show Sale</label>
            </div>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="chkProfit" checked={showProfit} onChange={(e) => setShowProfit(e.target.checked)} />
              <label className="form-check-label fw-semibold" htmlFor="chkProfit">Show Profit</label>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div className="card shadow-sm rounded" style={{ overflow: "auto", maxHeight: "70vh" }}>
        <div className="card-body py-2 p-0">
          {/* HEADER TOTALS BLOCK */}
          <div className="p-2 text-end fw-bold d-flex flex-wrap gap-3 justify-content-end align-items-center" style={{ fontSize: 13, background: "#ffffff" }}>
            {showSale && (
              <>
                <span className="text-primary">Sale SAR Total: {fmt(totals.sale_sar)}</span>
                <span className="text-primary me-2">Sale PKR Total: {fmt(totals.sale_pkr)}</span>
                <span className="text-muted">|</span>
              </>
            )}
            <span className="text-danger">Purchase SAR Total: {fmt(totals.purchase_sar)}</span>
            <span className="text-danger me-2">Purchase PKR Total: {fmt(totals.purchase_pkr)}</span>
            {showProfit && (
              <>
                <span className="text-muted">|</span>
                <span className={totals.profit >= 0 ? "text-success" : "text-danger"}>
                  Net Profit: {fmt(totals.profit)}
                </span>
              </>
            )}
          </div>

          <table className="table table-sm table-bordered text-center align-middle m-0">
            {/* FREEZE HEADER STYLES ADDED HERE */}
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#ff9a9e",
                color: "#fff",
              }}
            >
              <tr>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Date</th>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Supplier</th>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Ref</th>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Item</th>
                {showSale && (
                  <>
                    <th style={{ background: "#ff9a9e", color: "#fff" }}>Sale SAR</th>
                    <th style={{ background: "#ff9a9e", color: "#fff" }}>Sale Rate</th>
                    <th style={{ background: "#ff9a9e", color: "#fff" }}>Sale PKR</th>
                  </>
                )}
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Purchase SAR</th>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Purchase Rate</th>
                <th style={{ background: "#ff9a9e", color: "#fff" }}>Purchase PKR</th>
                {showProfit && <th style={{ background: "#ff9a9e", color: "#fff" }}>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff8e1" : "#ffe0b2" }}>
                  <td>{formatDate(r.booking_date)}</td>
                  <td className="fw-bold">{r.supplier_name}</td>
                  <td>{r.ref_no}</td>
                  <td className="text-start">{r.item}</td>
                  {showSale && <>
                    <td className="text-end fw-semibold text-primary">{fmt(r.sale_sar)}</td>
                    <td className="text-end">{fmt(r.sale_rate)}</td>
                    <td className="text-end">{fmt(r.sale_pkr)}</td>
                  </>}
                  <td className="text-end fw-semibold text-danger">{fmt(r.purchase_sar)}</td>
                  <td className="text-end">{fmt(r.purchase_rate)}</td>
                  <td className="text-end fw-bold">{fmt(r.purchase_pkr)}</td>
                  {showProfit && <td className={`text-end fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>{fmt(r.profit)}</td>}
                </tr>
              ))}
            </tbody>

            {/* STICKY FOOTER SUMMARY */}
            <tfoot
              className="table-dark fw-bold"
              style={{
                position: "sticky",
                bottom: 0,
                zIndex: 5,
              }}
            >
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