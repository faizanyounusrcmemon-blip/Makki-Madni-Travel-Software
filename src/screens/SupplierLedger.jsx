import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; //  Excel Export ke liye library import ki

/* =========================
   HELPERS (NO -0 EVER)
========================= */
const normalizeZero = (n) => Math.abs(Number(n || 0)) < 0.005 ? 0 : Number(n);

const fmtAmt = (v) => {
  let n = normalizeZero(v);
  return n.toLocaleString("en-US");
};

const parseAmt = (v) => {
  const n = Number(String(v).replace(/,/g, ""));
  return normalizeZero(Math.round(n || 0));
};

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-US", { month: "short" });
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000) return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    if (n < 10000000)
      return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    if (n < 100000000)
      return w(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + w(n % 1000000) : "");

    return "";
  };
  return w(num) + " Only";
};

const today = new Date().toISOString().split("T")[0];

export default function SupplierLedger({ onNavigate }) {
  const [supplierCode, setSupplierCode] = useState("");
  const [ledger, setLedger] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [payDate, setPayDate] = useState(today);
  const [method, setMethod] = useState("Bank");
  const [type, setType] = useState("Payment");
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledgerView, setLedgerView] = useState([]);
  const pdfRef = useRef(null);
  const [snapshotDate, setSnapshotDate] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(0);

  /* =========================
     LOAD PENDING / PARTIAL
  ========================== */
  const loadPendingAlways = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/pending`);
      const d = await res.json();
      if (d.success) {
        const clean = (d.pending || [])
          .map(p => ({
            ...p,
            pending_amount: normalizeZero(p.pending_amount),
            total_purchase: normalizeZero(p.total_purchase),
            total_paid: normalizeZero(p.total_paid)
          }))
          .filter(p => p.status !== "PAID")
          .sort((a, b) => b.pending_amount - a.pending_amount);
        setPending(clean);
      }
    } catch (e) {
      console.error("Pending load error:", e);
    }
  };

  /* =========================
     LOAD LEDGER
  ========================== */
  const loadLedger = async (code = supplierCode) => {
    if (!code) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Supplier Code required"
      });
    }

    Swal.fire({
      width: "260px",
      title: "Loading Ledger...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/${code}`
      );
      const d = await res.json();

      if (!d.success) {
        Swal.close();
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Failed to load ledger"
        });
      }

      setSnapshotDate(d.snapshotDate || null);
      setOpeningBalance(Number(d.openingBalance || 0));

      const mapped = (d.ledger || []).map(row => {
        const t = (row.type || "").toLowerCase();
        const isPay = t === "payment" || t === "adjustment";
        const debit = Math.round(normalizeZero(row.debit));
        const credit = Math.round(normalizeZero(row.credit));
        const balance = Math.round(normalizeZero(row.balance));

        return {
          ...row,
          entry_type: isPay ? "payment" : "purchase",
          id: isPay ? (row.id || row.payment_id) : null,
          type: isPay ? t.charAt(0).toUpperCase() + t.slice(1) : "Purchase",
          detail: row.item || "Purchase Entry",
          debit,
          credit,
          balance,
          ref_no: row.ref_no || row.purchase_ref || row.invoice_no || "-"
        };
      });

      setLedger(mapped);
      setLedgerView(mapped);

      let supplierName = "Unknown Supplier";
      const found = pending?.find(p => p.supplier_code === code);
      if (found?.supplier_name) {
        supplierName = found.supplier_name;
      }

      Swal.close();

      Swal.fire({
        width: "300px",
        icon: "success",
        title: "Ledger Loaded",
        html: `
          <div style="text-align:left; font-size:12px; line-height:1.4;">
            <div style="background:#0d6efd; color:#fff; padding:6px 8px; border-radius:8px; font-weight:bold; margin-bottom:8px;">
              📦 Supplier Info
            </div>
            <div style="margin-bottom:6px;">
              <span style="color:#777;">Supplier Code:</span><br/>
              <span style="background:#212529; color:#fff; padding:3px 6px; border-radius:6px; font-weight:600; display:inline-block;">
                ${code}
              </span>
            </div>
            <div>
              <span style="color:#777;">Supplier Name:</span><br/>
              <span style="background:linear-gradient(135deg,#198754,#20c997); color:#fff; padding:4px 8px; border-radius:6px; font-weight:600; display:inline-block;">
                ${supplierName}
              </span>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#0d6efd"
      });

    } catch (e) {
      console.error("Ledger load error:", e);
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  useEffect(() => { loadPendingAlways(); }, []);

  /* =========================
     AUTO DATE FILTER
  ========================== */
  useEffect(() => {
    let rows = [...ledger];
    if (fromDate) rows = rows.filter((r) => new Date(r.date) >= new Date(fromDate));
    if (toDate) rows = rows.filter((r) => new Date(r.date) <= new Date(toDate));
    setLedgerView([...rows].reverse());
  }, [fromDate, toDate, ledger]);

  /* =========================
     SAVE ENTRY
  ========================== */
  const saveEntry = async () => {
    if (!supplierCode) return Swal.fire({ icon: "warning", text: "Supplier Code required" });
    if (!amountRaw || amountRaw <= 0) return Swal.fire({ icon: "warning", text: "Amount required" });

    setSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplier_code: supplierCode,
            payment_date: payDate,
            payment_method: method,
            amount: amountRaw,
            type
          }),
        }
      );

      const d = await res.json();
      if (!d.success) {
        Swal.fire({ icon: "error", text: d.error || "Save failed" });
        return;
      }

      setAmountRaw(0);
      setAmountDisp("");
      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ icon: "success", text: "Entry saved" });
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================
     DELETE ENTRY WITH PASSWORD
  ==================================================== */
  const askPassword = async (title = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "300px",
      html: `
        <div style="text-align:left;font-size:13px">
          <b>${title}</b>
          <div style="position:relative;margin-top:10px">
            <input id="swal-pass" type="password" class="swal2-input"
              style="height:34px;font-size:13px;width:100%;margin:0;padding-right:35px;" placeholder="Enter password"/>
            <span id="toggle-pass" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; user-select:none;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "OK",
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById("swal-pass");
        const val = input.value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        let show = false;
        toggle.onclick = () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        };
        setTimeout(() => input.focus(), 100);
        const handleEnter = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            document.querySelector(".swal2-confirm").click();
          }
        };
        document.addEventListener("keydown", handleEnter);
        Swal.getPopup().addEventListener("remove", () => {
          document.removeEventListener("keydown", handleEnter);
        });
      }
    });
    return value;
  };

  const deleteEntry = async (entry) => {
    if (entry.entry_type !== "payment" || !entry.id) return;

    const confirm = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Delete this entry?",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    const pwd = await askPassword("Enter Delete Password");
    if (!pwd) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/delete/${entry.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd, type: "payment" }),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ icon: "error", text: d.error || "Delete failed" });
        return;
      }

      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ icon: "success", text: "Entry deleted" });
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", text: "Network Error" });
    }
  };

  /* =========================
     EXPORT PDF (WITH LOADER)
  ========================= */
  const exportPDF = async () => {
    if (!pdfRef.current || ledger.length === 0) return;

    Swal.fire({
      width: "260px",
      title: "Generating PDF...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const headerHeight = 30;

        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - headerHeight - margin;
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const totalPages = Math.ceil(imgHeight / usableHeight);

        const supplierRow = ledger.find(r => r.supplier_name);
        const supplierName = supplierRow?.supplier_name || "Supplier";
        const rangeText = fromDate || toDate ? `${formatDate(fromDate)} → ${formatDate(toDate)}` : "All Dates";
        const safeName = supplierName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          // Header
          pdf.setFillColor(18, 97, 160);
          pdf.rect(0, 0, pageWidth, 20, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.text("MAKKI MADNI TRAVEL & TOURS", pageWidth / 2, 10, { align: "center" });
          pdf.setFontSize(10);
          pdf.text("Supplier Ledger Statement", pageWidth / 2, 16, { align: "center" });

          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(11);
          pdf.text(`Supplier: ${supplierName}`, margin, 26);
          pdf.text(`Code: ${supplierCode}`, pageWidth - margin, 26, { align: "right" });

          pdf.setFontSize(9);
          pdf.text(`Date Range: ${rangeText}`, pageWidth / 2, 31, { align: "center" });

          // Image
          const yOffset = -(usableHeight * page);
          pdf.addImage(imgData, "PNG", margin, headerHeight + yOffset, imgWidth, imgHeight);

          // Footer
          pdf.setFontSize(9);
          pdf.setTextColor(120);
          pdf.text(`Page ${page + 1} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
        }

        pdf.save(`${supplierCode}-${safeName}-ledger.pdf`);
        Swal.close();
      } catch (err) {
        console.error(err);
        Swal.close();
        Swal.fire({ icon: "error", text: "Failed to generate PDF" });
      }
    }, 150);
  };

  /* ==========================================
     ✨ NEW: EXPORT EXCEL (WITH LOADER)
  ========================================== */
  const exportExcel = () => {
    if (ledger.length === 0) return;

    Swal.fire({
      width: "250px",
      title: "Generating Excel...",
      text: "Please wait a moment",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    setTimeout(() => {
      try {
        const supplierRow = ledger.find(r => r.supplier_name);
        const supplierName = supplierRow?.supplier_name || "Supplier";

        // Header Rows Info
        const headerInfo = [
          ["MAKKI MADNI TRAVEL & TOURS"],
          ["SUPPLIER LEDGER STATEMENT"],
          [""],
          ["Supplier Name:", supplierName.toUpperCase(), "", "Printed Date:", formatDate(today)],
          ["Supplier Code:", supplierCode, "", "Statement Period:", fromDate || toDate ? `${formatDate(fromDate)} to ${formatDate(toDate)}` : "All Records"],
          [""]
        ];

        const tableHeaders = ["Date", "Type", "Ref No", "Item Detail", "Payment Method", "Debit", "Credit", "Balance"];
        
        const tableData = ledgerView.map((r) => [
          formatDate(r.date),
          r.type || "-",
          r.ref_no || "-",
          r.detail || "-",
          r.payment_method || "-",
          r.debit > 0 ? r.debit : 0,
          r.credit > 0 ? r.credit : 0,
          r.balance
        ]);

        const sheetData = [...headerInfo, tableHeaders, ...tableData];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Ledger");

        worksheet["!cols"] = [
          { wch: 15 }, // Date
          { wch: 12 }, // Type
          { wch: 15 }, // Ref No
          { wch: 30 }, // Item Detail
          { wch: 15 }, // Method
          { wch: 15 }, // Debit
          { wch: 15 }, // Credit
          { wch: 18 }  // Balance
        ];

        const safeName = supplierName.replace(/[^a-zA-Z0-9]/g, "_");
        XLSX.writeFile(workbook, `Supplier-${supplierCode}-${safeName}.xlsx`);

        Swal.close();
      } catch (error) {
        console.error(error);
        Swal.close();
        Swal.fire({ width: "300px", icon: "error", text: "Failed to generate Excel sheet" });
      }
    }, 150);
  };

  /* =========================
     UI RENDER
  ========================= */
  return (
    <div className="container-fluid p-3">
      {/* HEADER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center py-2">
          <h4 className="fw-bold mb-0 text-primary">📘 SUPPLIER LEDGER SYSTEM</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

      {/* 2-COLUMN SIDE-BY-SIDE LAYOUT */}
      <div className="row g-3">
        
        {/* LEFT COLUMN: PENDING LIST (width 3) */}
        <div className="col-lg-3 col-md-4 col-12">
          <div className="card shadow-sm" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
            <div className="card-header fw-bold text-danger bg-light sticky-top">⏳ Pending / Partial List</div>
            <ul className="list-group list-group-flush">
              {pending.length === 0 && <li className="list-group-item text-success text-center py-3">✅ No pending</li>}
              {pending.map((p, i) => (
                <li key={i} className="list-group-item p-2 d-flex flex-column gap-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="fw-bold text-dark small" style={{ maxWidth: "70%" }}>
                      {p.supplier_code} <span className="text-primary d-block">{p.supplier_name}</span>
                    </span>
                    <span className={`badge ${
                      p.status === "EXTRA PAID" ? "bg-primary"
                      : normalizeZero(p.pending_amount) === 0 ? "bg-success"
                      : p.status === "PARTIAL" ? "bg-warning text-dark"
                      : "bg-danger"
                    }`} style={{ fontSize: "0.68rem" }}>
                      {normalizeZero(p.pending_amount) === 0 ? "PAID" : p.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="text-danger fw-bold small">Rs {fmtAmt(p.pending_amount)}</span>
                    <button className="btn btn-xs btn-primary py-0 px-2" style={{ fontSize: "0.75rem" }}
                      onClick={() => { setSupplierCode(p.supplier_code); loadLedger(p.supplier_code); }}>
                      Load
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: SEARCH, FORM & LEDGER TABLE (width 9) */}
        <div className="col-lg-9 col-md-8 col-12">
          
          {/* SEARCH & FILTER BAR */}
          <div className="card mb-3 shadow-sm">
            <div className="card-body p-2 d-flex flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <span className="small fw-bold text-muted text-nowrap">From:</span>
                <input type="date" className="form-control form-control-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <span className="small fw-bold text-muted text-nowrap">To:</span>
                <input type="date" className="form-control form-control-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <input className="form-control form-control-sm" placeholder="Supplier Code" value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
              </div>
              <div className="d-flex gap-1 ms-auto">
                <button className="btn btn-sm btn-primary px-3" onClick={() => loadLedger()}>Load</button>
                <button className="btn btn-sm btn-danger px-3" onClick={exportPDF}>PDF</button>
                <button className="btn btn-sm btn-success px-3" onClick={exportExcel}>Excel</button>
              </div>
            </div>
          </div>

          {/* PAYMENT / ADJUSTMENT ENTRY FORM */}
          <div className="card shadow-sm mb-3 bg-light">
            <div className="card-body py-2 px-3 row g-2 align-items-end">
              <div className="col-md-2">
                <label className="form-label small fw-bold mb-1">Payment Date</label>
                <input type="date" className="form-control form-control-sm" value={payDate} onChange={e => setPayDate(e.target.value)} />
                <small className="text-muted d-block mt-1" style={{ fontSize: "0.7rem" }}>{formatDate(payDate)}</small>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold mb-1">Amount (PKR)</label>
                <input className="form-control form-control-sm" placeholder="Amount" value={amountDisp}
                  onChange={e => {
                    const raw = parseAmt(e.target.value);
                    setAmountRaw(raw);
                    setAmountDisp(fmtAmt(raw));
                  }} />
                {amountRaw > 0 && (
                  <span className="d-block mt-1 text-success fw-bold" style={{ fontSize: "0.75rem" }}>
                    {numberToWords(amountRaw)}
                  </span>
                )}
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold mb-1">Type</label>
                <select className="form-control form-control-sm" value={type} onChange={e => setType(e.target.value)}>
                  <option>Payment</option>
                  <option>Adjustment</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold mb-1">Method</label>
                <select className="form-control form-control-sm" value={method} onChange={e => setMethod(e.target.value)}>
                  <option>Bank</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="col-md-3">
                <button className="btn btn-success btn-sm w-100" disabled={saving} onClick={saveEntry}>
                  {saving ? "Saving..." : "💾 Save Entry"}
                </button>
              </div>
            </div>
          </div>

          {/* LEDGER TABLE */}
          <div ref={pdfRef} className="card shadow-sm">
            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-0 text-end" style={{ fontSize: "0.85rem" }}>
                <thead className="table-dark text-center">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Ref No</th>
                    <th>Supplier</th>
                    <th>Item Detail</th>
                    <th>Payment Method</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 && (
                    <tr><td colSpan="10" className="text-center text-muted py-3">No ledger entries. Please load a supplier first.</td></tr>
                  )}
                  {ledgerView.map((r, i) => (
                    <tr key={i}>
                      <td className="text-center fw-bold small">{formatDate(r.date)}</td>
                      <td className="text-center">
                        <span className={`badge ${
                          r.type?.toLowerCase() === "purchase" ? "bg-danger"
                          : r.type?.toLowerCase() === "payment" ? "bg-success"
                          : "bg-primary"
                        }`} style={{ fontSize: "0.75rem" }}>
                          {r.type}
                        </span>
                      </td>
                      <td className="text-center fw-bold text-secondary small">{r.ref_no || "-"}</td>
                      <td className="text-start fw-bold text-primary small">{r.entry_type === "purchase" ? r.supplier_name : "-"}</td>
                      <td className="text-start fw-bold text-success small">{r.entry_type === "purchase" ? r.detail : "-"}</td>
                      <td className="text-center small">
                        {r.payment_method ? (
                          <span className={`badge ${
                            r.payment_method.toLowerCase() === "cash" ? "bg-success" : "bg-primary"
                          }`}>{r.payment_method}</span>
                        ) : "-"}
                      </td>
                      <td className={normalizeZero(r.debit) > 0 ? "text-danger fw-bold" : ""}>{fmtAmt(r.debit)}</td>
                      <td className={normalizeZero(r.credit) > 0 ? "text-success fw-bold" : ""}>{fmtAmt(r.credit)}</td>
                      <td className="fw-bold">{fmtAmt(r.balance)}</td>
                      <td className="text-center">
                        {r.entry_type === "payment" && r.id ? (
                          <button className="btn btn-xs btn-outline-danger py-0 px-1" onClick={() => deleteEntry(r)}>Delete</button>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* LEDGER FOOTER METADATA */}
              <div className="card p-2 m-2 bg-light border-0">
                <div className="row text-center text-md-start">
                  <div className="col-md-4">
                    <span className="text-muted small">Snapshot Date:</span> <strong className="small">{snapshotDate ? formatDate(snapshotDate) : "No Snapshot"}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small">Opening Balance:</span> <strong className="text-dark small">{fmtAmt(openingBalance)}</strong>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <span className="text-muted small">Current Balance:</span> <strong className="text-primary">{ledger.length ? fmtAmt(ledger[ledger.length - 1].balance) : 0}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}