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

/* ================= SMART SEARCHABLE CUSTOMER DROPDOWN ================= */
function SmartCustomerSelect({ customers, selectedCustomer, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Filter list on typing inside dropdown search
  const filteredList = customers.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
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
          {selectedCustomer || "ALL"}
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
            placeholder="🔍 Type customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div
            className={`p-2 rounded text-truncate mb-1 ${
              selectedCustomer === "ALL" ? "bg-primary text-white fw-bold" : "text-dark"
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
            filteredList.map((c, i) => (
              <div
                key={i}
                className={`p-2 rounded text-truncate mb-1 ${
                  selectedCustomer === c ? "bg-primary text-white fw-bold" : "text-dark"
                }`}
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                  backgroundColor: selectedCustomer === c ? undefined : "#f8f9fa",
                }}
                onClick={() => {
                  onSelect(c);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {c}
              </div>
            ))
          ) : (
            <div className="text-muted p-2 text-center" style={{ fontSize: "11px" }}>
              No active customer found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= MAIN REPORT COMPONENT ================= */
export default function CustomerSaleDetailReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD REPORT ================= */
  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/customer-sale`
      );
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        setCustomers(data.customers || []);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error("Error loading report:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

/* ================= FILTER & SORT LOGIC ================= */
  const filtered = rows
    .filter((r) => {
      // 🔹 HIDE ZERO SALES (Skip rows where Sale SAR/PKR is 0)
      if (Number(r.sale_sar || 0) <= 0 && Number(r.sale_pkr || 0) <= 0) {
        return false;
      }

      // 1. Customer Smart Dropdown Filter
      if (customer !== "ALL" && r.customer_name?.trim() !== customer.trim()) {
        return false;
      }

      // 2. Category Filter
      if (
        itemType !== "ALL" &&
        !r.item?.toLowerCase().includes(itemType.toLowerCase())
      ) {
        return false;
      }

      // 3. Date Range Filter
      const d = r.booking_date ? new Date(r.booking_date) : null;
      if (from && d && d < new Date(from)) return false;
      if (to && d && d > new Date(to)) return false;

      // 4. Live Search Box
      if (search) {
        const s = search.toLowerCase();
        return (
          r.ref_no?.toLowerCase().includes(s) ||
          r.item?.toLowerCase().includes(s) ||
          r.customer_name?.toLowerCase().includes(s)
        );
      }

      return true;
    })
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date)); 



  /* ================= TOTALS ================= */
  const totals = filtered.reduce(
    (a, b) => {
      a.sale_pkr += Number(b.sale_pkr || 0);
      a.sale_sar += Number(b.sale_sar || 0);
      return a;
    },
    { sale_pkr: 0, sale_sar: 0 }
  );

  /* ================= EXCEL EXPORT ================= */
  const exportExcel = () => {
    const dataRows = filtered.map((r) => ({
      Date: formatDate(r.booking_date),
      Customer: r.customer_name,
      "Ref No": r.ref_no,
      Item: r.item,
      "Sale SAR": Number(r.sale_sar || 0),
      "Sale Rate": Number(r.sale_rate || 0),
      "Sale PKR": Number(r.sale_pkr || 0),
    }));

    dataRows.push({
      Date: "TOTALS",
      Customer: "",
      "Ref No": "",
      Item: "",
      "Sale SAR": totals.sale_sar,
      "Sale Rate": "",
      "Sale PKR": totals.sale_pkr,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Sale Detail");
    XLSX.writeFile(workbook, "customer-sale-detail-report.xlsx");
  };

  /* ================= PDF EXPORT ================= */
  const exportPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("🛒 Customer Sale Detail Report", pageWidth / 2, 14, {
      align: "center",
    });

    const head = [
      [
        "Date",
        "Customer",
        "Ref",
        "Item",
        "Sale SAR",
        "Sale Rate",
        "Sale PKR",
      ],
    ];

    const body = filtered.map((r) => [
      formatDate(r.booking_date),
      r.customer_name,
      r.ref_no,
      r.item,
      fmt(r.sale_sar),
      fmt(r.sale_rate),
      fmt(r.sale_pkr),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 20,
      theme: "grid",
      headStyles: {
        fillColor: [13, 110, 253],
        textColor: 255,
        halign: "center",
      },
      bodyStyles: { halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => {
        const finalY = data.cursor.y + 5;
        const totalsText = `Total Sale SAR: ${fmt(totals.sale_sar)} | Total Sale PKR: ${fmt(totals.sale_pkr)}`;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(totalsText, pageWidth - 10, finalY, { align: "right" });
      },
      margin: { top: 20 },
    });

    doc.save("customer-sale-detail-report.pdf");
  };

  return (
    <div
      className="container-fluid p-3"
      style={{ fontSize: 12, minHeight: "100vh" }}
    >
      {/* HEADER */}
      <div className="card shadow-sm mb-3 border-0">
        <div
          className="card-body py-3 d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(90deg, #0d6efd, #0dcaf0)",
            color: "white",
            borderRadius: "10px",
            fontWeight: "bold",
          }}
        >
          🛒 Customer Sale Detail Report
          <div className="d-flex gap-2">
            <button
              className="btn btn-light btn-sm rounded-pill"
              onClick={() => onNavigate("dashboard")}
            >
              ⬅ Back
            </button>
            <button
              className="btn btn-success btn-sm rounded-pill"
              onClick={exportExcel}
            >
              Export Excel 📊
            </button>
            <button
              className="btn btn-danger btn-sm rounded-pill"
              onClick={exportPDF}
            >
              Export PDF 📄
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div
        className="card shadow-sm mb-3 border-0"
        style={{ background: "#eef2f3", borderRadius: "10px" }}
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            {/* SMART SEARCH CUSTOMER DROPDOWN */}
            <div className="col-md-3">
              <label className="fw-bold mb-1">Customer (Smart Search)</label>
              <SmartCustomerSelect
                customers={customers}
                selectedCustomer={customer}
                onSelect={(val) => setCustomer(val)}
              />
            </div>

            <div className="col-md-2">
              <label className="fw-bold mb-1">Category</label>
              <select
                className="form-select form-select-sm"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
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
              <input
                type="date"
                className="form-control form-control-sm"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="fw-bold mb-1">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="fw-bold mb-1">Global Search</label>
              <input
                type="text"
                placeholder="Walk-in, Ref, Item..."
                className="form-control form-control-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-1 d-grid">
              <button
                className="btn btn-primary btn-sm rounded-pill"
                onClick={loadReport}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Load"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE DISPLAY */}
      <div
        className="card shadow-sm rounded"
        style={{ overflow: "auto", maxHeight: "70vh" }}
      >
        <div className="card-body py-2 p-0">
          {/* HEADER TOTALS BLOCK */}
          <div
            className="p-2 text-end fw-bold d-flex flex-wrap gap-3 justify-content-end align-items-center"
            style={{ fontSize: 13, background: "#ffffff" }}
          >
            <span className="text-primary">
              Total Sale SAR: {fmt(totals.sale_sar)}
            </span>
            <span className="text-primary me-2">
              Total Sale PKR: {fmt(totals.sale_pkr)}
            </span>
          </div>

          <table className="table table-sm table-bordered text-center align-middle m-0">
            {/* STICKY HEADER */}
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "#0d6efd",
                color: "#fff",
              }}
            >
              <tr>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Date</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Customer</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Ref</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Item</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Sale SAR</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Sale Rate</th>
                <th style={{ background: "#0d6efd", color: "#fff" }}>Sale PKR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#e7f1ff" : "#ffffff",
                  }}
                >
                  <td>{formatDate(r.booking_date)}</td>
                  <td className="fw-bold">{r.customer_name}</td>
                  <td>{r.ref_no}</td>
                  <td className="text-start">{r.item}</td>
                  <td className="text-end fw-semibold text-primary">
                    {fmt(r.sale_sar)}
                  </td>
                  <td className="text-end">{fmt(r.sale_rate)}</td>
                  <td className="text-end fw-bold">{fmt(r.sale_pkr)}</td>
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
                <td className="text-end text-info">{fmt(totals.sale_sar)}</td>
                <td></td>
                <td className="text-end text-warning">{fmt(totals.sale_pkr)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}