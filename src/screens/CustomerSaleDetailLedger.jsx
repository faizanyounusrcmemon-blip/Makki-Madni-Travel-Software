import React, { useEffect, useState, useRef } from "react";
import useReportExport from "../hooks/useReportExport";

const fmt = (n) => Math.round(Number(n || 0)).toLocaleString("en-US");

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function SmartCustomerSelect({ customers, selectedCustomer, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // 🔹 Customer Code ki بنیاد par Sort aur Filter karna
  const filteredList = [...customers]
    .sort((a, b) => (a.code || "").localeCompare(b.code || "", undefined, { numeric: true }))
    .filter((c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.code || "").toLowerCase().includes(search.toLowerCase())
    );

  const selectedText =
    selectedCustomer === "ALL"
      ? "ALL"
      : selectedCustomer === "WALKIN"
      ? "🚶 WALKIN CUSTOMER"
      : (() => {
          const found = customers.find((c) => c.code === selectedCustomer);
          return found ? `${found.name} (${found.code})` : selectedCustomer;
        })();

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
          {selectedText}
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
            placeholder="🔍 Type customer name or code..."
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

          <div
            className={`p-2 rounded text-truncate mb-1 ${
              selectedCustomer === "WALKIN" ? "bg-primary text-white fw-bold" : "text-dark"
            }`}
            style={{ cursor: "pointer", fontSize: "12px", backgroundColor: "#fff3cd" }}
            onClick={() => {
              onSelect("WALKIN");
              setIsOpen(false);
              setSearch("");
            }}
          >
            🚶 WALKIN CUSTOMER
          </div>

          {filteredList.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded text-truncate mb-1 d-flex justify-content-between align-items-center ${
                selectedCustomer === c.code ? "bg-primary text-white fw-bold" : "text-dark"
              }`}
              style={{ cursor: "pointer", fontSize: "12px" }}
              onClick={() => {
                onSelect(c.code);
                setIsOpen(false);
                setSearch("");
              }}
            >
              <span>{c.name}</span>
              <span className={`badge ${selectedCustomer === c.code ? "bg-light text-dark" : "bg-secondary"}`} style={{ fontSize: "10px" }}>
                {c.code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerSaleDetailLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const { exportPDF, exportExcel } = useReportExport();

  const loadReport = async () => {
    try {
      setLoading(true);
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/reports/customer-sale-detail-ledger?customer_code=${customer}`;
      if (from) url += `&from_date=${from}`;
      if (to) url += `&to_date=${to}`;

      const res = await fetch(url);
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
  }, [customer, from, to]);

const filteredUnprocessed = rows.filter((r) => {
    // Agar koi specific category selected hai (ALL nahi hai), to PAYMENT entries ko filter out kar dein
    if (itemType !== "ALL") {
      if (r.type === "PAYMENT") return false;
      if (!r.item?.toLowerCase().includes(itemType.toLowerCase())) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        r.ref_no?.toLowerCase().includes(s) ||
        r.item?.toLowerCase().includes(s) ||
        r.customer_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  let runningBal = 0;
  const filtered = filteredUnprocessed.map((r) => {
    const sale = Math.round(Number(r.sale_pkr || 0));
    const paid = Math.round(Number(r.payment_pkr || 0));
    
    runningBal += (sale - paid);

    return {
      ...r,
      sale_pkr: sale,
      payment_pkr: paid,
      sale_sar: Math.round(Number(r.sale_sar || 0)),
      sale_rate: Number(r.sale_rate || 0),
      running_balance: Math.round(runningBal)
    };
  });

  const totals = filtered.reduce(
    (a, b) => {
      a.sale_pkr += Math.round(Number(b.sale_pkr || 0));
      a.sale_sar += Math.round(Number(b.sale_sar || 0));
      a.payment_pkr += Math.round(Number(b.payment_pkr || 0));
      return a;
    },
    { sale_pkr: 0, sale_sar: 0, payment_pkr: 0 }
  );

  const handleExportExcel = () => {
    exportExcel({
      code: customer,
      name: customer === "ALL" ? "All Customers" : customers.find(c => c.code === customer)?.name || customer,
      fromDate: from,
      toDate: to,
      ledgerData: filtered,
      title: "Customer Sale & Payment Detail Ledger",
      filePrefix: "Customer_Sale_Detail_Ledger",
      reportType: "customer_sale_ledger",
      totals: { 
        sale_sar: totals.sale_sar, 
        sale_pkr: totals.sale_pkr, 
        payment_pkr: totals.payment_pkr, 
        running_balance: runningBal 
      }
    });
  };

  const handleExportPDF = () => {
    exportPDF({
      code: customer,
      name: customer === "ALL" ? "All Customers" : customers.find(c => c.code === customer)?.name || customer,
      fromDate: from,
      toDate: to,
      ledgerData: filtered,
      title: "Customer Sale & Payment Detail Ledger",
      filePrefix: "Customer_Sale_Detail_Ledger",
      reportType: "customer_sale_ledger",
      totals: { 
        sale_sar: totals.sale_sar, 
        sale_pkr: totals.sale_pkr, 
        payment_pkr: totals.payment_pkr, 
        running_balance: runningBal 
      }
    });
  };

  return (
    <div className="container-fluid p-3 csdl-premium" style={{ fontSize: 12, minHeight: "100vh", background: "linear-gradient(135deg,#f4f7fc 0%,#eef2f8 55%,#fff8e8 100%)" }}>
      <style>{`
        .csdl-premium{color:#17243b;font-family:Inter,Segoe UI,Arial,sans-serif}
        .csdl-premium .card{border:1px solid #e0e7f1!important;border-radius:18px!important;box-shadow:0 8px 25px rgba(20,43,79,.09)!important;overflow:visible}
        .csdl-premium .card-body{border-radius:18px}
        .csdl-premium .csdl-header{background:linear-gradient(115deg,#071b3a 0%,#123f78 58%,#c99a35 140%)!important;border:1px solid rgba(218,177,83,.8);box-shadow:inset 0 1px rgba(255,255,255,.18)}
        .csdl-premium .csdl-title{font-size:clamp(16px,2vw,23px);font-weight:900;letter-spacing:.25px;text-shadow:0 2px 5px rgba(0,0,0,.2)}
        .csdl-premium .btn{font-weight:750;letter-spacing:.1px;transition:transform .18s ease,box-shadow .18s ease;border-radius:10px!important}
        .csdl-premium .btn:hover{transform:translateY(-1px);box-shadow:0 5px 12px rgba(0,0,0,.16)}
        .csdl-premium .btn-light{color:#102c51;border:1px solid #e4c778}
        .csdl-premium .csdl-filter-card{background:linear-gradient(135deg,#fff 0%,#f4f7fc 100%)!important;border-top:3px solid #d4a83f!important}
        .csdl-premium label{font-size:11px;text-transform:uppercase;letter-spacing:.55px;color:#27466e;font-weight:850!important}
        .csdl-premium .form-control,.csdl-premium .form-select{min-height:36px;border:1px solid #cbd6e5;border-radius:10px;font-weight:600;color:#172b49;background-color:#fff}
        .csdl-premium .csdl-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
        .csdl-premium .csdl-stat{padding:14px 16px;border-radius:16px;background:#fff;border:1px solid #e0e7f1;box-shadow:0 5px 18px rgba(20,43,79,.07);position:relative;overflow:hidden}
        .csdl-premium .csdl-stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:850;color:#65748a;margin-bottom:5px}
        .csdl-premium .csdl-stat-value{font-size:clamp(16px,2vw,22px);font-weight:900;color:#12345d;overflow-wrap:anywhere}
        .csdl-premium .csdl-stat.gold .csdl-stat-value{color:#a87812}.csdl-premium .csdl-stat.green .csdl-stat-value{color:#13804a}.csdl-premium .csdl-stat.red .csdl-stat-value{color:#c13742}
        .csdl-premium .csdl-table-card{overflow:hidden!important;border-top:3px solid #123f78!important}
        .csdl-premium .csdl-table-wrap{max-height:62vh;overflow:auto;border-radius:0 0 16px 16px}
        .csdl-premium table{font-size:12px;white-space:nowrap}
        .csdl-premium table thead th{background:linear-gradient(180deg,#173e70,#0c2548)!important;color:#fff!important;padding:12px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.45px}
        .csdl-premium table tbody td{padding:9px 10px;border-color:#e1e8f1}
        .csdl-premium table tbody tr:nth-child(even){background:#f2f6fc}
        .csdl-premium table tbody tr:hover{background:#fff5d9!important}
        .csdl-premium table tfoot td{padding:12px 10px;background:#102746!important;color:#fff!important}
        .csdl-premium .csdl-customer{font-weight:800;color:#173e70}
        .csdl-premium .csdl-ref{display:inline-block;background:#e7eef9;color:#173e70;border:1px solid #cfdbed;padding:4px 7px;border-radius:7px;font-weight:800}
      `}</style>
      
      {/* HEADER */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body py-3 d-flex justify-content-between align-items-center csdl-header" style={{ color: "white", borderRadius: "16px" }}>
          <span className="csdl-title">✈️ CUSTOMER SALE & PAYMENT LEDGER</span>
          <div className="d-flex gap-2 csdl-header-actions">
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
              <label className="fw-bold mb-1">Customer Selection</label>
              <SmartCustomerSelect customers={customers} selectedCustomer={customer} onSelect={(val) => setCustomer(val)} />
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
            <div className="col-md-3">
              <label className="fw-bold mb-1">Search (Name or Ref No)</label>
              <input type="text" placeholder="Search PKG-00007..." className="form-control form-control-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="csdl-stats">
        <div className="csdl-stat"><div className="csdl-stat-label">Total Sale · PKR</div><div className="csdl-stat-value">{fmt(totals.sale_pkr)}</div></div>
        <div className="csdl-stat green"><div className="csdl-stat-label">Total Received · PKR</div><div className="csdl-stat-value">{fmt(totals.payment_pkr)}</div></div>
        <div className="csdl-stat gold"><div className="csdl-stat-label">Sale Value · SAR</div><div className="csdl-stat-value">{fmt(totals.sale_sar)}</div></div>
        <div className="csdl-stat red"><div className="csdl-stat-label">Net Balance · PKR</div><div className="csdl-stat-value">{fmt(runningBal)}</div></div>
      </div>

      {/* TABLE DATA */}
      <div className="card shadow-sm rounded csdl-table-card">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 py-3" style={{borderBottom:"1px solid #e3e9f2"}}>
          <div><div style={{fontWeight:900,color:"#12345d",fontSize:15}}>📋 Ledger Transactions</div><div style={{fontSize:11,color:"#738198",fontWeight:650}}>{filtered.length.toLocaleString("en-US")} records found</div></div>
          {loading && <span className="badge rounded-pill text-bg-warning px-3 py-2">⏳ Loading…</span>}
        </div>
        <div className="csdl-table-wrap">
          <table className="table table-sm table-bordered text-center align-middle m-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Ref No</th>
                <th>Item Details</th>
                <th>Sale SAR</th>
                <th>Rate</th>
                <th>Sale PKR</th>
                <th>Paid PKR</th>
                <th>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.ref_no || "row"}-${i}`}>
                  <td>{formatDate(r.date || r.booking_date)}</td>
                  <td className="csdl-customer">{r.customer_name}</td>
                  <td><span className="csdl-ref">{r.ref_no}</span></td>
                  <td className="text-start">{r.item}</td>
                  <td className="text-end text-primary">{fmt(r.sale_sar)}</td>
                  <td className="text-end text-muted">{Number(r.sale_rate || 0) % 1 !== 0 ? Number(r.sale_rate).toFixed(2) : fmt(r.sale_rate)}</td>
                  <td className="text-end fw-bold text-dark">{fmt(r.sale_pkr)}</td>
                  <td className="text-end fw-bold text-success">{fmt(r.payment_pkr)}</td>
                  <td className="text-end fw-bold text-danger">{fmt(r.running_balance)}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="9" className="csdl-empty py-4 text-muted">{loading ? "Loading records..." : "No records found."}</td></tr>}
            </tbody>
            <tfoot className="table-dark fw-bold" style={{ position: "sticky", bottom: 0, zIndex: 5 }}>
              <tr>
                <td colSpan="4">TOTALS</td>
                <td className="text-end text-info">{fmt(totals.sale_sar)}</td>
                <td>-</td>
                <td className="text-end text-warning">{fmt(totals.sale_pkr)}</td>
                <td className="text-end text-success">{fmt(totals.payment_pkr)}</td>
                <td className="text-end text-danger">{fmt(runningBal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}