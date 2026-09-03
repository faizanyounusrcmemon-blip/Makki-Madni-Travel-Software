import React, { useEffect, useState, useMemo, useRef } from "react";
import Select from "react-select";
import Swal from "sweetalert2";

/* ===============================
   HELPERS (DECIMAL SAFE)
=============================== */
const formatInput = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let clean = String(v).replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) clean = parts[0] + "." + parts[1];
  return clean;
};

const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  return parseFloat(String(v).replace(/,/g, "")) || 0;
};

const fmt = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "0";

/* 🎨 CUSTOM SELECT STYLES (ENHANCED FOR WIDER SUPPLIER DROP DOWN) */
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    fontSize: "13px",
    borderRadius: "6px",
    border: state.isFocused ? "2px solid #4f46e5" : "1px solid #94a3b8",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
    background: "#ffffff",
    transition: "all 0.2s ease",
    "&:hover": {
      border: "1px solid #6366f1",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
    fontWeight: "800",
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#4f46e5" : "#64748b",
    padding: "4px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "13px",
    fontWeight: state.isSelected ? "800" : "700",
    padding: "8px 12px",
    cursor: "pointer",
    background: state.isSelected
      ? "#4f46e5"
      : state.isFocused
      ? "#e0e7ff"
      : "#ffffff",
    color: state.isSelected
      ? "#ffffff"
      : state.isFocused
      ? "#1e40af"
      : "#1d4ed8",
  }),
};

const itemCategoryBadge = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("transport")) return { bg: "#e0f2fe", color: "#0369a1", icon: "🚌" };
  if (t.includes("hotel")) return { bg: "#dcfce7", color: "#15803d", icon: "🏨" };
  if (t.includes("visa")) return { bg: "#f3e8ff", color: "#6b21a8", icon: "📑" };
  if (t.includes("card")) return { bg: "#e0e7ff", color: "#3730a3", icon: "💳" };
  if (t.includes("ticket")) return { bg: "#ffedd5", color: "#c2410c", icon: "✈️" };
  if (t.includes("ziyarat")) return { bg: "#ffe4e6", color: "#be123c", icon: "🕌" };
  return { bg: "#f1f5f9", color: "#334155", icon: "📦" };
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [pendingMap, setPendingMap] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");

  // ⌨️ Navigation refs matrix: inputRefs.current[displayRowIndex][fieldIndex]
  // 0: pur_sar, 1: pur_rate, 2: supplier_select
  const inputRefs = useRef([]);

  /* ================= LOAD SUPPLIERS ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`)
      .then((r) => r.json())
      .then((d) => d.success && setSuppliers(d.rows || []));
  }, []);

  /* ================= LOAD PENDING ================= */
  const loadPending = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
      );
      const d = await r.json();
      if (d.success) setPending(d.rows || []);
    } catch (err) {
      console.error("Pending fetch error:", err);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    const map = {};
    pending.forEach((p) => {
      map[p.ref_no] = p.customer_name;
    });
    setPendingMap(map);
  }, [pending]);

  /* ================= LOAD PACKAGE ================= */
  const loadPackage = async (r = refNo) => {
    if (!r) {
      return Swal.fire({
        width: "320px",
        icon: "warning",
        text: "Please enter Ref No",
      });
    }

    setRefNo(r);
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/load/${r}`
      );
      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        setRows([]);
        setCustomerName("");
        return Swal.fire({
          width: "320px",
          icon: "error",
          text: data.error || "Record not found",
        });
      }

      setIsEdit(data.is_edit === true);

      setRows(
        (data.rows || []).map((x) => ({
          item: x.item,
          item_label: x.item_label,
          sale_sar: parseNumber(x.sale_sar),
          sale_rate: parseNumber(x.sale_rate),
          sale_pkr: parseNumber(x.sale_pkr),

          purchase_sar: x.purchase_sar
            ? formatInput(String(x.purchase_sar))
            : "",
          purchase_rate: x.purchase_rate
            ? formatInput(String(x.purchase_rate))
            : "",
          purchase_pkr: parseNumber(x.purchase_pkr),

          profit: parseNumber(x.profit),

          supplier_code: x.supplier_code || "",
          supplier_name: x.supplier_name || "",
        }))
      );

      const cName =
        data.customer_name ||
        data.customer ||
        data.rows?.[0]?.customer_name ||
        data.rows?.[0]?.cust_name ||
        data.rows?.[0]?.client_name ||
        pendingMap[r] ||
        "N/A";

      setCustomerName(cName);

      Swal.fire({
        width: "380px",
        icon: "success",
        html: `
        <div style="text-align:left; font-size:14px">
          <b>✅ Data Loaded Successfully</b><br/><br/>
          <b>Ref No:</b> ${r}<br/>
          <b>Customer:</b> ${cName}<br/>
        </div>
      `,
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        width: "320px",
        icon: "error",
        text: "Network Connection Error",
      });
    }
  };

  /* ================= UPDATE ROW ================= */
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    const r = copy[i];

    if (field === "supplier_code") {
      r.supplier_code = value;
      const s = suppliers.find((x) => x.supplier_code === value);
      r.supplier_name = s ? s.supplier_name : "";
    } else {
      r[field] = formatInput(value);
    }

    const sar = parseNumber(r.purchase_sar);
    const rate = parseNumber(r.purchase_rate);
    const purchaseComplete = sar > 0 && rate > 0;

    r.purchase_pkr = purchaseComplete ? sar * rate : 0;
    r.profit = purchaseComplete ? r.sale_pkr - r.purchase_pkr : 0;

    setRows(copy);
  };

  /* QUICK COPY SALE VALUES TO PURCHASE */
  const copySaleToPurchase = (i) => {
    const copy = [...rows];
    const r = copy[i];
    r.purchase_sar = String(r.sale_sar || "");
    r.purchase_rate = String(r.sale_rate || "");
    const sar = parseNumber(r.purchase_sar);
    const rate = parseNumber(r.purchase_rate);
    r.purchase_pkr = sar * rate;
    r.profit = r.sale_pkr - r.purchase_pkr;
    setRows(copy);
  };

  /* ================= SAVE ================= */
  const savePurchase = async () => {
    if (!rows.length) {
      return Swal.fire({
        width: "320px",
        icon: "warning",
        text: "No data rows available to save",
      });
    }

    const cleanRows = rows
      .filter(
        (r) =>
          parseNumber(r.sale_sar) !== 0 ||
          parseNumber(r.sale_rate) !== 0 ||
          parseNumber(r.sale_pkr) !== 0
      )
      .map((r) => ({
        ...r,
        purchase_sar: parseNumber(r.purchase_sar),
        purchase_rate: parseNumber(r.purchase_rate),
      }));

    if (!cleanRows.length) {
      return Swal.fire({
        width: "320px",
        icon: "warning",
        text: "No valid rows found to save",
      });
    }

    Swal.fire({
      width: "280px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref_no: refNo, items: cleanRows }),
        }
      );

      const data = await res.json();
      Swal.close();

      if (data.success) {
        await Swal.fire({
          width: "320px",
          icon: "success",
          text: isEdit
            ? "Purchase Record Updated Successfully"
            : "Purchase Record Saved Successfully",
        });

        setRows([]);
        setRefNo("");
        setCustomerName("");
        setIsEdit(false);
        loadPending();
        onNavigate("purchase");
      } else {
        Swal.fire({
          width: "320px",
          icon: "error",
          text: data.error || "Failed to save record",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "320px",
        icon: "error",
        text: "Network Connection Error",
      });
    }
  };

  /* ================= CALCULATED SUMMARY TOTALS ================= */
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.salePkr += parseNumber(r.sale_pkr);
        acc.purchasePkr += parseNumber(r.purchase_pkr);
        acc.profit += parseNumber(r.profit);
        return acc;
      },
      { salePkr: 0, purchasePkr: 0, profit: 0 }
    );
  }, [rows]);

  const isPartial = rows
    .filter(
      (r) =>
        parseNumber(r.sale_sar) !== 0 ||
        parseNumber(r.sale_rate) !== 0 ||
        parseNumber(r.sale_pkr) !== 0
    )
    .some(
      (r) =>
        !parseNumber(r.purchase_sar) ||
        !parseNumber(r.purchase_rate) ||
        !r.supplier_code
    );

  const filteredPendingList = useMemo(() => {
    if (!pendingSearch) return pending;
    const q = pendingSearch.toLowerCase();
    return pending.filter(
      (p) =>
        p.ref_no?.toLowerCase().includes(q) ||
        p.customer_name?.toLowerCase().includes(q)
    );
  }, [pending, pendingSearch]);

  const supplierOptions = suppliers.map((s) => ({
    value: s.supplier_code,
    label: s.supplier_name,
  }));

  const visibleRows = useMemo(() => {
    return rows
      .map((r, i) => ({ ...r, originalIndex: i }))
      .filter(
        (r) =>
          parseNumber(r.sale_sar) !== 0 ||
          parseNumber(r.sale_rate) !== 0 ||
          parseNumber(r.sale_pkr) !== 0
      );
  }, [rows]);

  /* ================= KEYBOARD NAVIGATION HANDLERS ================= */
  const focusNextElement = (displayIdx, fieldIdx) => {
    const el = inputRefs.current[displayIdx]?.[fieldIdx];
    if (el) {
      if (typeof el.focus === "function") {
        el.focus();
      }
    }
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }} className="p-3">
      
      {/* 🚀 BANNER HEADER */}
      <div 
        className="card border-0 shadow-sm mb-3 overflow-hidden" 
        style={{ 
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
          borderRadius: "14px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-3.5 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 rounded-3" style={{ background: "rgba(255, 255, 255, 0.12)" }}>
              <span style={{ fontSize: "24px" }}>🧾</span>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-extrabold mb-0 text-white" style={{ fontSize: "18px", fontWeight: "800" }}>Purchase Entry & Procurement</h4>
                {isEdit && (
                  <span className="badge text-dark rounded-pill px-3 py-1 fw-extrabold" style={{ fontSize: "11px", backgroundColor: "#f59e0b" }}>
                    EDIT MODE
                  </span>
                )}
              </div>
              <p className="text-slate-300 mb-0 mt-0.5" style={{ fontSize: "12px", opacity: 0.9 }}>
                Process supplier orders, compare margins, and sync package rates.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 fw-bold"
            style={{ fontSize: "12px", borderColor: "rgba(255,255,255,0.3)" }}
            onClick={() => onNavigate("dashboard")}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* 💳 SUMMARY CARDS */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase text-muted fw-bold mb-0.5" style={{ fontSize: "11px" }}>TOTAL SALE</div>
                <div style={{ fontSize: "18px", color: "#047857", fontWeight: "800" }}>
                  <span className="text-muted fs-6 me-1">PKR</span>{fmt(totals.salePkr)}
                </div>
              </div>
              <span className="fs-4">💵</span>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase text-muted fw-bold mb-0.5" style={{ fontSize: "11px" }}>TOTAL PURCHASE</div>
                <div style={{ fontSize: "18px", color: "#3730a3", fontWeight: "800" }}>
                  <span className="text-muted fs-6 me-1">PKR</span>{fmt(totals.purchasePkr)}
                </div>
              </div>
              <span className="fs-4">🛒</span>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-uppercase text-muted fw-bold mb-0.5" style={{ fontSize: "11px" }}>ESTIMATED MARGIN</div>
                <div style={{ fontSize: "18px", color: totals.profit >= 0 ? "#15803d" : "#be123c", fontWeight: "800" }}>
                  <span className="text-muted fs-6 me-1">PKR</span>{fmt(totals.profit)}
                </div>
              </div>
              <span className="fs-4">{totals.profit >= 0 ? "📈" : "📉"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧩 MAIN LAYOUT */}
      <div className="row g-3">
        
        {/* ⏳ PENDING QUEUE SIDEBAR */}
        <div className="col-lg-2 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div className="card-header bg-white py-3 px-2.5 d-flex justify-content-between align-items-center border-bottom">
              <span className="fw-extrabold text-slate-800 d-flex align-items-center gap-1" style={{ fontSize: "12px", fontWeight: "800" }}>
                ⏳ Pending Queue
              </span>
              <span className="badge rounded-pill px-2 py-1 fw-extrabold" style={{ fontSize: "11px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                {pending.length}
              </span>
            </div>

            <div className="p-2 border-bottom bg-slate-50">
              <input
                type="text"
                className="form-control form-control-sm border-slate-300 bg-white shadow-none"
                style={{ fontSize: "12px", borderRadius: "6px", height: "32px" }}
                placeholder="🔍 Search..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
              />
            </div>

            <div className="card-body p-2 overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {filteredPendingList.length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: "12px" }}>
                  {pending.length === 0 ? "🎉 Empty" : "No results"}
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {filteredPendingList.map((p, i) => (
                    <div 
                      key={i} 
                      className="p-2.5 rounded-3 border bg-white shadow-2xs transition-all"
                      style={{ 
                        borderColor: p.ref_no === refNo ? "#6366f1" : "#cbd5e1",
                        backgroundColor: p.ref_no === refNo ? "#f5f3ff" : "#ffffff"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-extrabold" style={{ fontSize: "12px", color: "#0f172a", fontWeight: "800" }}>
                          {p.ref_no}
                        </span>
                        <span 
                          className="badge rounded-pill fw-bold px-2 py-0.5"
                          style={{ 
                            fontSize: "10px",
                            backgroundColor: p.purchase_status === "PENDING" ? "#be123c" : "#b45309",
                            color: "#ffffff"
                          }}
                        >
                          {p.purchase_status}
                        </span>
                      </div>

                      <div className="fw-bold mb-2 text-wrap" style={{ fontSize: "12.5px", lineHeight: "1.3", color: "#1d4ed8" }}>
                        👤 {p.customer_name || "Walk-In Customer"}
                      </div>

                      <button
                        className="btn btn-sm w-100 fw-bold border-0 text-white rounded-2 py-1"
                        style={{ fontSize: "11.5px", backgroundColor: "#4f46e5" }}
                        onClick={() => loadPackage(p.ref_no)}
                      >
                        Load Reference
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📝 RIGHT FORM TABLE */}
        <div className="col-lg-10 col-md-9">
          
          {isPartial && rows.length > 0 && (
            <div className="alert border-0 rounded-3 p-2.5 px-3 mb-2 d-flex align-items-center gap-2 shadow-2xs" style={{ background: "#fffbebe6", borderLeft: "4px solid #f59e0b", color: "#b45309", fontSize: "12px" }}>
              <span className="fs-6">⚠️</span>
              <div>
                <b>Incomplete Entries:</b> Highlighted red rows require purchase SAR, Rate, & Supplier details.
              </div>
            </div>
          )}

          {/* REF SEARCH HEADER */}
          <div className="card border-0 shadow-sm rounded-3 mb-2 bg-white p-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="d-flex gap-2">
                  <input
                    className="form-control border-slate-300 bg-slate-50 shadow-none fw-bold"
                    style={{ fontSize: "13px", borderRadius: "6px", height: "36px" }}
                    placeholder="Enter Reference No..."
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadPackage()}
                  />
                  <button
                    className="btn fw-bold px-4 text-white shadow-2xs"
                    style={{ fontSize: "12px", backgroundColor: "#4f46e5", height: "36px", whiteSpace: "nowrap" }}
                    onClick={() => loadPackage()}
                    disabled={loading}
                  >
                    {loading ? "..." : "Fetch"}
                  </button>
                </div>
              </div>

              <div className="col-md-7 d-flex align-items-center justify-content-md-end gap-2">
                {customerName && (
                  <div 
                    className="px-3 py-1.5 rounded-2 fw-extrabold text-truncate border shadow-2xs d-flex align-items-center gap-1.5" 
                    style={{ 
                      fontSize: "13px", 
                      maxWidth: "280px",
                      backgroundColor: "#ecfdf5", 
                      color: "#047857",
                      borderColor: "#a7f3d0",
                      fontWeight: "800"
                    }}
                  >
                    <span>👤</span> {customerName}
                  </div>
                )}
                
                {rows.length > 0 && (
                  <button
                    className={`btn rounded-2 px-4 fw-bold shadow-2xs text-white`}
                    style={{ fontSize: "12px", height: "36px", backgroundColor: isEdit ? "#d97706" : "#10b981", whiteSpace: "nowrap" }}
                    onClick={savePurchase}
                  >
                    {isEdit ? "Update Entry" : "Save Purchase"}
                  </button>
                )}
              </div>
            </div>
          </div>

{/* 📊 FORM DATA TABLE (DESKTOP & MOBILE RESPONSIVE) */}
          
          {/* DESKTOP TABLE VIEW (Visible on md and larger screens) */}
          <div className="d-none d-md-block card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
            <div className="w-100 overflow-auto">
              <table className="table align-middle mb-0" style={{ fontSize: "13px", minWidth: "900px", tableLayout: "fixed" }}>
                <thead style={{ background: "#f8fafc", color: "#1e293b", borderBottom: "2px solid #e2e8f0" }}>
                  <tr>
                    <th className="py-2.5 px-3 fw-extrabold" style={{ width: "22%", fontWeight: "800" }}>Description</th>
                    <th className="py-2.5 text-end fw-extrabold px-1" style={{ width: "6%", fontWeight: "800" }}>SAR</th>
                    <th className="py-2.5 text-end fw-extrabold px-1" style={{ width: "6%", fontWeight: "800" }}>Rate</th>
                    <th className="py-2.5 text-end fw-extrabold px-1" style={{ width: "9%", fontWeight: "800" }}>Sale PKR</th>
                    <th className="py-2.5 text-center fw-extrabold px-1" style={{ width: "8%", fontWeight: "800" }}>Pur. SAR</th>
                    <th className="py-2.5 text-center fw-extrabold px-1" style={{ width: "8%", fontWeight: "800" }}>Pur. Rate</th>
                    <th className="py-2.5 text-end fw-extrabold px-1" style={{ width: "9%", fontWeight: "800" }}>Pur. PKR</th>
                    <th className="py-2.5 text-end fw-extrabold px-1" style={{ width: "9%", fontWeight: "800" }}>Margin</th>
                    <th className="py-2.5 fw-extrabold px-2" style={{ width: "23%", fontWeight: "800" }}>Supplier</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <span className="fs-3">📦</span>
                        <p className="mt-2 text-slate-500 mb-0 fw-bold" style={{ fontSize: "13px" }}>No purchase entry loaded.</p>
                      </td>
                    </tr>
                  )}

                  {visibleRows.map((r, displayIdx) => {
                    const badge = itemCategoryBadge(r.item_label || r.item);
                    
                    const isIncomplete =
                      !parseNumber(r.purchase_sar) ||
                      !parseNumber(r.purchase_rate) ||
                      !r.supplier_code;

                    const rowBg = isIncomplete ? "#fef2f2" : "#ffffff";

                    return (
                      <tr
                        key={r.originalIndex}
                        style={{
                          backgroundColor: rowBg,
                          borderBottom: "1px solid #e2e8f0"
                        }}
                      >
                        <td className="px-3 py-2.5" style={{ backgroundColor: rowBg }}>
                          <div className="d-flex align-items-center gap-1.5">
                            <span 
                              className="badge rounded-2 p-1.5 text-wrap text-start lh-sm fw-bold"
                              style={{ 
                                background: badge.bg, 
                                color: badge.color, 
                                fontSize: "12px",
                                wordBreak: "break-word"
                              }}
                            >
                              {badge.icon} {r.item_label || r.item}
                            </span>
                            <button 
                              className="btn btn-sm text-muted border-0 p-0 fs-6" 
                              title="Copy Sale to Purchase"
                              onClick={() => copySaleToPurchase(r.originalIndex)}
                            >
                              📋
                            </button>
                          </div>
                        </td>

                        {/* 🟢 COMPACT NUMERIC FIELDS */}
                        <td className="text-end fw-bold px-1" style={{ backgroundColor: rowBg, color: "#475569", fontSize: "12.5px" }}>
                          {fmt(r.sale_sar)}
                        </td>
                        <td className="text-end fw-bold px-1" style={{ backgroundColor: rowBg, color: "#475569", fontSize: "12.5px" }}>
                          {fmt(r.sale_rate)}
                        </td>
                        <td className="text-end fw-extrabold px-1" style={{ color: "#047857", backgroundColor: rowBg, fontWeight: "800", fontSize: "13px" }}>
                          {fmt(r.sale_pkr)}
                        </td>

                        {/* 🔵 INPUT FIELDS */}
                        {/* 1. Pur. SAR Input */}
                        <td className="px-1" style={{ backgroundColor: rowBg }}>
                          <input
                            ref={(el) => {
                              if (!inputRefs.current[displayIdx]) inputRefs.current[displayIdx] = [];
                              inputRefs.current[displayIdx][0] = el;
                            }}
                            type="text"
                            className="form-control text-center shadow-none p-1 fw-extrabold"
                            style={{ 
                              borderRadius: "6px", 
                              fontSize: "12.5px",
                              height: "34px",
                              fontWeight: "800",
                              color: "#0f172a",
                              borderColor: isIncomplete ? "#fca5a5" : "#cbd5e1",
                              background: "#ffffff"
                            }}
                            value={r.purchase_sar}
                            placeholder="0"
                            onChange={(e) =>
                              updateRow(
                                r.originalIndex,
                                "purchase_sar",
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusNextElement(displayIdx, 1);
                              }
                            }}
                          />
                        </td>

                        {/* 2. Pur. Rate Input */}
                        <td className="px-1" style={{ backgroundColor: rowBg }}>
                          <input
                            ref={(el) => {
                              if (!inputRefs.current[displayIdx]) inputRefs.current[displayIdx] = [];
                              inputRefs.current[displayIdx][1] = el;
                            }}
                            type="text"
                            className="form-control text-center shadow-none p-1 fw-extrabold"
                            style={{ 
                              borderRadius: "6px", 
                              fontSize: "12.5px",
                              height: "34px",
                              fontWeight: "800",
                              color: "#0f172a",
                              borderColor: isIncomplete ? "#fca5a5" : "#cbd5e1",
                              background: "#ffffff"
                            }}
                            value={r.purchase_rate}
                            placeholder="0"
                            onChange={(e) =>
                              updateRow(
                                r.originalIndex,
                                "purchase_rate",
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusNextElement(displayIdx, 2);
                              }
                            }}
                          />
                        </td>

                        <td className="text-end fw-extrabold px-1" style={{ color: "#3730a3", backgroundColor: rowBg, fontWeight: "800", fontSize: "13px" }}>
                          {fmt(r.purchase_pkr)}
                        </td>

                        <td className="text-end fw-extrabold px-1" style={{ backgroundColor: rowBg, color: r.profit >= 0 ? "#15803d" : "#be123c", fontWeight: "800", fontSize: "13px" }}>
                          {fmt(r.profit)}
                        </td>

                        {/* 3. Supplier Select Input */}
                        <td className="px-2" style={{ backgroundColor: rowBg }}>
                          <div
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (displayIdx + 1 < visibleRows.length) {
                                  setTimeout(() => {
                                    focusNextElement(displayIdx + 1, 0);
                                  }, 50);
                                }
                              }
                            }}
                          >
                            <Select
                              ref={(el) => {
                                if (!inputRefs.current[displayIdx]) inputRefs.current[displayIdx] = [];
                                inputRefs.current[displayIdx][2] = el;
                              }}
                              options={supplierOptions}
                              value={
                                supplierOptions.find(
                                  (opt) => opt.value === r.supplier_code
                                ) || null
                              }
                              onChange={(selected) =>
                                updateRow(
                                  r.originalIndex,
                                  "supplier_code",
                                  selected ? selected.value : ""
                                )
                              }
                              placeholder="Select Supplier..."
                              isClearable
                              isSearchable
                              menuPortalTarget={document.body}
                              styles={{
                                ...customSelectStyles,
                                control: (base, state) => ({
                                  ...customSelectStyles.control(base, state),
                                  borderColor: isIncomplete && !r.supplier_code ? "#fca5a5" : base.borderColor,
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {rows.length > 0 && (
                  <tfoot style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                    <tr>
                      <td className="px-3 py-3 fw-extrabold" style={{ fontWeight: "800", fontSize: "13.5px" }}>Summary Total</td>
                      <td colSpan={2}></td>
                      <td className="text-end fw-extrabold px-1" style={{ color: "#047857", fontWeight: "800", fontSize: "13.5px" }}>
                        {fmt(totals.salePkr)}
                      </td>
                      <td colSpan={2}></td>
                      <td className="text-end fw-extrabold px-1" style={{ color: "#3730a3", fontWeight: "800", fontSize: "13.5px" }}>
                        {fmt(totals.purchasePkr)}
                      </td>
                      <td className="text-end fw-extrabold px-1" style={{ color: totals.profit >= 0 ? "#15803d" : "#be123c", fontWeight: "800", fontSize: "13.5px" }}>
                        {fmt(totals.profit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Visible on screens smaller than md) */}
          <div className="d-block d-md-none">
            {visibleRows.length === 0 ? (
              <div className="card border-0 shadow-sm p-4 text-center text-muted bg-white">
                <span className="fs-3">📦</span>
                <p className="mt-2 mb-0 fw-bold" style={{ fontSize: "13px" }}>No purchase entry loaded.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {visibleRows.map((r, displayIdx) => {
                  const badge = itemCategoryBadge(r.item_label || r.item);
                  const isIncomplete =
                    !parseNumber(r.purchase_sar) ||
                    !parseNumber(r.purchase_rate) ||
                    !r.supplier_code;

                  return (
                    <div 
                      key={r.originalIndex}
                      className="card border shadow-sm p-3 rounded-3"
                      style={{ 
                        borderColor: isIncomplete ? "#fca5a5" : "#e2e8f0", 
                        backgroundColor: isIncomplete ? "#fef2f2" : "#ffffff" 
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                        <span 
                          className="badge rounded-2 p-1.5 text-wrap text-start lh-sm fw-bold"
                          style={{ background: badge.bg, color: badge.color, fontSize: "12px" }}
                        >
                          {badge.icon} {r.item_label || r.item}
                        </span>
                        <button 
                          className="btn btn-sm btn-outline-secondary border-0 p-1"
                          onClick={() => copySaleToPurchase(r.originalIndex)}
                        >
                          📋 Copy
                        </button>
                      </div>

                      <div className="row g-2 text-center mb-2 p-2 rounded-2" style={{ background: "rgba(241,245,249,0.7)" }}>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "10px" }}>SALE SAR</small>
                          <strong style={{ fontSize: "12px" }}>{fmt(r.sale_sar)}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "10px" }}>RATE</small>
                          <strong style={{ fontSize: "12px" }}>{fmt(r.sale_rate)}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "10px" }}>SALE PKR</small>
                          <strong className="text-success" style={{ fontSize: "12px" }}>{fmt(r.sale_pkr)}</strong>
                        </div>
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label fw-bold mb-1" style={{ fontSize: "11px" }}>Pur. SAR</label>
                          <input
                            type="text"
                            className="form-control text-center shadow-none p-1 fw-extrabold"
                            style={{ 
                              borderRadius: "6px", 
                              fontSize: "12px", 
                              height: "36px", 
                              borderColor: isIncomplete && !parseNumber(r.purchase_sar) ? "#fca5a5" : "#cbd5e1" 
                            }}
                            value={r.purchase_sar}
                            placeholder="0"
                            onChange={(e) => updateRow(r.originalIndex, "purchase_sar", e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label fw-bold mb-1" style={{ fontSize: "11px" }}>Pur. Rate</label>
                          <input
                            type="text"
                            className="form-control text-center shadow-none p-1 fw-extrabold"
                            style={{ 
                              borderRadius: "6px", 
                              fontSize: "12px", 
                              height: "36px", 
                              borderColor: isIncomplete && !parseNumber(r.purchase_rate) ? "#fca5a5" : "#cbd5e1" 
                            }}
                            value={r.purchase_rate}
                            placeholder="0"
                            onChange={(e) => updateRow(r.originalIndex, "purchase_rate", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: "11px" }}>Supplier</label>
                        <Select
                          options={supplierOptions}
                          value={supplierOptions.find((opt) => opt.value === r.supplier_code) || null}
                          onChange={(selected) => updateRow(r.originalIndex, "supplier_code", selected ? selected.value : "")}
                          placeholder="Select Supplier..."
                          isClearable
                          isSearchable
                          menuPortalTarget={document.body}
                          styles={{
                            ...customSelectStyles,
                            control: (base, state) => ({
                              ...customSelectStyles.control(base, state),
                              borderColor: isIncomplete && !r.supplier_code ? "#fca5a5" : base.borderColor,
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ fontSize: "12px" }}>
                        <span>Pur. PKR: <strong style={{ color: "#3730a3" }}>{fmt(r.purchase_pkr)}</strong></span>
                        <span>Margin: <strong style={{ color: r.profit >= 0 ? "#15803d" : "#be123c" }}>{fmt(r.profit)}</strong></span>
                      </div>
                    </div>
                  );
                })}

                {rows.length > 0 && (
                  <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    <div className="fw-bold mb-2 text-slate-700" style={{ fontSize: "13px" }}>Summary Total</div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "12px" }}>
                      <span>Total Sale PKR:</span>
                      <strong className="text-success">{fmt(totals.salePkr)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: "12px" }}>
                      <span>Total Pur. PKR:</span>
                      <strong style={{ color: "#3730a3" }}>{fmt(totals.purchasePkr)}</strong>
                    </div>
                    <div className="d-flex justify-content-between pt-1 border-top" style={{ fontSize: "12px" }}>
                      <span>Total Margin:</span>
                      <strong style={{ color: totals.profit >= 0 ? "#15803d" : "#be123c" }}>{fmt(totals.profit)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
