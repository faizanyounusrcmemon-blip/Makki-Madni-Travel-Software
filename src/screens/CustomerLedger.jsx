import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

/* =========================
   HELPERS
========================= */
const getRowDate = (r) => {
  if (!r?.date) return "-";
  const d = new Date(r.date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "") || 0);

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000)
      return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    if (n < 10000000)
      return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    if (n < 100000000)
      return w(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + w(n % 1000000) : "");
    return "";
  };
  return w(num) + " Only";
};

const today = new Date().toISOString().split("T")[0];

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Bank");
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING LIST
  ========================== */
  const loadPending = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/pending/list`);
      const d = await r.json();
      if (d.success) {
        setPending(d.rows || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadPending(); }, []);

  /* =========================
     LOAD LEDGER
  ========================== */
  const loadLedger = async (r = refNo) => {
    if (!r) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Ref No required"
      });
    }

    setRefNo(r);

    Swal.fire({
      width: "260px",
      title: "Loading Ledger...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${r}`);
      const d = await res.json();

      if (!d.success) {
        Swal.close();
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Failed to load ledger"
        });
        setRows([]);
        return;
      }

      setRows(d.rows || []);
      const pendingItem = pending.find(x => x.ref_no === r);
      const currentStatus = pendingItem?.payment_status || "CLEARED";
      setPaymentStatus(currentStatus);

      let customerName = "Unknown Customer";
      const customerRow = (d.rows || []).find(x => x.id === "CUSTOMER");
      if (customerRow?.description) {
        customerName = customerRow.description;
      }

      Swal.close();
      Swal.fire({
        width: "360px",
        icon: "success",
        title: "Ledger Loaded Successfully",
        html: `
          <div style="text-align:left;font-size:14px">
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-top:5px;">
              <b>Ref No:</b><br/>
              <span style="color:#0d6efd">${r}</span>
              <hr style="margin:8px 0"/>
              <b>Customer:</b><br/>
              <span style="color:#198754">${customerName}</span>
              <hr style="margin:8px 0"/>
              <b>Payment Status:</b><br/>
              <span style="color:${
                currentStatus === "PENDING"
                  ? "#dc3545"
                  : currentStatus === "PARTIAL"
                  ? "#fd7e14"
                  : "#198754"
              }; font-weight:bold;">
                ${currentStatus}
              </span>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error("Ledger load error:", err);
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network Error"
      });
    }
  };

  /* =========================
     SAVE ENTRY
  ========================== */
  const saveEntry = async () => {
    if (!refNo) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Ref No required" });
    }
    if (!amountRaw || amountRaw <= 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Amount required" });
    }
    if (!date) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Date required" });
    }

    setSaving(true);
    Swal.fire({
      width: "260px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          amount: Number(amountRaw),
          payment_date: date,
          payment_method: method,
          type
        }),
      });

      const d = await r.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Save failed" });
      } else {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(today);

        await loadLedger(refNo);
        await loadPending();

        Swal.fire({ width: "280px", icon: "success", text: "Entry Saved Successfully" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    } finally {
      setSaving(false);
    }
  };

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
      confirmButtonText: "Delete",
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
        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });
      }
    });
    return value;
  };

  const del = async (id) => {
    if (id === "SALE" || id === "CUSTOMER") {
      return Swal.fire({ width: "300px", icon: "warning", text: "یہ entry delete نہیں ہو سکتی" });
    }

    const confirmDelete = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Are you sure you want to delete this entry?",
      showCancelButton: true,
      confirmButtonText: "Yes Delete"
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("Enter Delete Password");
    if (!pass) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await loadPending();
        await loadLedger(refNo);
        Swal.fire({ width: "280px", icon: "success", text: "Entry Deleted Successfully" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Delete failed" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(18, 97, 160);
    pdf.rect(0, 0, w, 25, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("MAKKI MADNI TRAVEL & TOURS", w / 2, 15, { align: "center" });
    pdf.setFontSize(10);
    pdf.text("Customer Ledger Statement", w / 2, 22, { align: "center" });

    pdf.addImage(img, "PNG", 10, 30, 190, (canvas.height * 190) / canvas.width);

    let customerName = "Customer";
    const customerRow = rows.find(r => r.id === "CUSTOMER");
    if (customerRow && customerRow.description) {
      customerName = customerRow.description
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, "_");
    }
    pdf.save(`${refNo}-${customerName}-Ledger.pdf`);
  };

  return (
    <div className="container-fluid p-4">
      {/* HEADER BANNER */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center bg-dark text-white rounded">
          <h4 className="fw-bold mb-0 text-white">
            📘 CUSTOMER LEDGER {refNo && `— ${refNo}`}
            {paymentStatus === "PENDING" && <span className="badge bg-danger ms-2">PENDING</span>}
            {paymentStatus === "PARTIAL" && <span className="badge bg-warning text-dark ms-2">PARTIAL</span>}
            {paymentStatus === "CLEARED" && refNo && <span className="badge bg-success ms-2">CLEARED</span>}
          </h4>
          <button className="btn btn-light btn-sm fw-bold" onClick={() => onNavigate("dashboard")}>⬅ Back to Home</button>
        </div>
      </div>

      <div className="row">
        {/* SIDEBAR: PENDING / PARTIAL LIST (Left or Right side as side panel) */}
        <div className="col-lg-3 col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-danger text-white fw-bold d-flex align-items-center">
              <span>⏳ Pending / Partial Ledgers</span>
            </div>
            <div className="card-body p-2" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {pending.length === 0 ? (
                <div className="p-3 text-center text-success">
                  <h5>✅ All Cleared!</h5>
                  <p className="small mb-0 text-muted">No pending/partial manual ledgers found.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {pending.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => loadLedger(p.ref_no)}
                      className="list-group-item list-group-item-action p-3 mb-2 rounded border-start border-4 cursor-pointer"
                      style={{
                        cursor: "pointer",
                        borderStartColor: p.payment_status === "PENDING" ? "#dc3545" : "#ffc107",
                        backgroundColor: p.ref_no === refNo ? "#e9ecef" : "#f8f9fa"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-dark font-monospace">{p.ref_no}</span>
                        <span className={`badge ${p.payment_status === "PENDING" ? "bg-danger" : "bg-warning text-dark"}`}>
                          {p.payment_status}
                        </span>
                      </div>
                      <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.95rem" }}>
                        {p.customer_name || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN PANEL: SEARCH, ENTRY FORM & LEDGER TABLE */}
        <div className="col-lg-9 col-md-8">
          
          {/* SEARCH & CONTROLS */}
          <div className="card shadow-sm mb-3">
            <div className="card-body py-3">
              <div className="row g-2">
                <div className="col-md-6">
                  <input
                    className="form-control form-control-lg"
                    placeholder="Enter Reference Number (e.g., PKG-1002)"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary btn-lg w-100 fw-bold" onClick={() => loadLedger()}>🔍 Load Ledger</button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-success btn-lg w-100 fw-bold" onClick={exportPDF} disabled={rows.length === 0}>
                    📄 Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ENTRY FORM (Disabled if no ledger is loaded) */}
          <div className={`card shadow-sm mb-3 ${!refNo ? "opacity-50" : ""}`} style={{ pointerEvents: !refNo ? "none" : "auto" }}>
            <div className="card-header bg-light fw-bold text-secondary">📥 Add Payment / Adjustment Receipt</div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Amount</label>
                  <input
                    className="form-control fw-bold text-success"
                    placeholder="Enter Amount"
                    value={amountDisp}
                    onChange={(e) => {
                      const raw = parseAmt(e.target.value);
                      if (!isNaN(raw)) {
                        setAmountRaw(raw);
                        setAmountDisp(fmtAmt(raw));
                      }
                    }}
                  />
                  {amountRaw > 0 && (
                    <div className="mt-1 small text-success fw-semibold text-truncate">
                      {numberToWords(amountRaw)}
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="payment">Payment</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Payment Method</label>
                  <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option>Bank</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-success px-4 py-2 fw-bold" disabled={saving || !refNo} onClick={saveEntry}>
                {saving ? "Saving..." : "💾 Save Transaction"}
              </button>
            </div>
          </div>

          {/* LEDGER TABLE CARD */}
          <div ref={pdfRef} className="card shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "15%" }}>Date</th>
                    <th style={{ width: "45%" }}>Description</th>
                    <th style={{ width: "12%" }} className="text-end">Debit (-)</th>
                    <th style={{ width: "12%" }} className="text-end">Credit (+)</th>
                    <th style={{ width: "12%" }} className="text-end">Balance</th>
                    <th style={{ width: "6%" }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-4 text-muted fs-5">
                        No ledger entries loaded. Enter a valid Ref No above and click "Load".
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>{getRowDate(r)}</td>
                        <td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>
                          {r.description}
                        </td>
                        <td className="text-end text-danger fw-bold">{r.debit > 0 ? fmtAmt(r.debit) : "-"}</td>
                        <td className="text-end text-success fw-bold">{r.credit > 0 ? fmtAmt(r.credit) : "-"}</td>
                        <td className="text-end fw-bold" style={{ backgroundColor: "#f8f9fa" }}>
                          {fmtAmt(r.balance)}
                        </td>
                        <td className="text-center">
                          {r.id !== "SALE" && r.id !== "CUSTOMER" ? (
                            <button className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => del(r.id)}>Del</button>
                          ) : (
                            <span className="text-muted small">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}