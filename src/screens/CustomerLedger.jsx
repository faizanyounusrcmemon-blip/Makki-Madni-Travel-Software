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

// ✅ Today date for default calendar
const today = new Date().toISOString().split("T")[0];

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today); // ✅ Default to today
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Bank");
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING LIST
  ========================== */
const loadPending = async () => {
  const r = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/pending/list`
  );

  const d = await r.json();

  console.log("PENDING API:", d);

  if (d.success) {
    setPending(d.rows || []);
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

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${r}`
    );

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

const pendingItem = pending.find(
  x => x.ref_no === r
);

const currentStatus =
  pendingItem?.payment_status || "CLEARED";

setPaymentStatus(currentStatus);


    // ✅ Customer Name Find
    let customerName = "Unknown Customer";

    const customerRow = (d.rows || []).find(
      x => x.id === "CUSTOMER"
    );

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
          
          <div style="
            background:#f8f9fa;
            padding:10px;
            border-radius:8px;
            margin-top:5px;
          ">
            <b>Ref No:</b><br/>
            <span style="color:#0d6efd">${r}</span>

            <hr style="margin:8px 0"/>

<b>Customer:</b><br/>
<span style="color:#198754">${customerName}</span>

<hr style="margin:8px 0"/>

<b>Payment Status:</b><br/>

<span style="
  color:${
    currentStatus === "PENDING"
      ? "#dc3545"
      : currentStatus === "PARTIAL"
      ? "#fd7e14"
      : "#198754"
  };
  font-weight:bold;
">
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
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Ref No required"
    });
  }

  if (!amountRaw || amountRaw <= 0) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Amount required"
    });
  }

  if (!date) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Date required"
    });
  }

  setSaving(true);

  Swal.fire({
    width: "260px",
    title: "Saving...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          amount: Number(amountRaw),
          payment_date: date,
          payment_method: method,
          type
        }),
      }
    );

    const d = await r.json();

    Swal.close();

    if (!d.success) {
      Swal.fire({
        width: "300px",
        icon: "error",
        text: d.error || "Save failed"
      });
    } else {

      setAmountRaw(0);
      setAmountDisp("");
      setDate(today);

      await loadLedger(refNo);
      await loadPending();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Entry Saved Successfully"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });

  } finally {
    setSaving(false);
  }
};

  /* =========================
     DELETE ENTRY
  ========================== */
const askPassword = async (title = "Enter Password") => {
  const { value } = await Swal.fire({
    width: "300px",
    html: `
      <div style="text-align:left;font-size:13px">
        <b>${title}</b>

        <div style="position:relative;margin-top:10px">
          <input id="swal-pass" type="password" class="swal2-input"
            style="height:34px;font-size:13px" placeholder="Enter password"/>

          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            user-select:none;
          ">👁</span>
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

      if (val !== "786") {
        const popup = document.querySelector(".swal2-popup");
        if (popup) {
          popup.classList.add("shake");
          setTimeout(() => popup.classList.remove("shake"), 400);
        }
        Swal.showValidationMessage("Wrong Password 😎");
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
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "یہ entry delete نہیں ہو سکتی"
    });
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

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      }
    );

    const d = await r.json();
    Swal.close();

    if (d.success) {

      await loadPending();
      await loadLedger(refNo);


      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Entry Deleted Successfully"
      });

    } else {
      Swal.fire({
        width: "300px",
        icon: "error",
        text: d.error || "Delete failed"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
  }
};

/* =========================
   EXPORT PDF
========================= */
const exportPDF = async () => {
  const canvas = await html2canvas(pdfRef.current, { scale: 3 });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const w = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(18, 97, 160);
  pdf.rect(0, 0, w, 25, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text("MAKKI MADNI TRAVEL", w / 2, 15, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Customer Ledger Statement", w / 2, 22, { align: "center" });

  pdf.addImage(img, "PNG", 10, 30, 190, (canvas.height * 190) / canvas.width);

  // ✅ Get Customer Name
  let customerName = "Customer";
  const customerRow = rows.find(r => r.id === "CUSTOMER");

  if (customerRow && customerRow.description) {
    customerName = customerRow.description
      .replace(/[^a-zA-Z0-9 ]/g, "")   // remove special chars
      .replace(/\s+/g, "_");          // space to underscore
  }

  // ✅ Save as Ref + CustomerName
  pdf.save(`${refNo}-${customerName}-Ledger.pdf`);
};
   
  return (
    <div className="container p-3">

      {/* HEADER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">
  📘 CUSTOMER LEDGER — {refNo}

{paymentStatus === "PENDING" && (
  <span className="badge bg-danger ms-2">
    PENDING
  </span>
)}

{paymentStatus === "PARTIAL" && (
  <span className="badge bg-warning text-dark ms-2">
    PARTIAL
  </span>
)}

{paymentStatus === "CLEARED" && refNo && (
  <span className="badge bg-success ms-2">
    CLEARED
  </span>
)}

</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

    {/* PENDING LIST */}
    <div className="card shadow-sm mb-3">
      <div className="card-header fw-bold text-danger">⏳ Pending / Partial Ledgers</div>
      <div className="card-body p-2">
        {pending.length === 0 ? (
          <p className="text-success mb-0">✅ No pending ledgers</p>
        ) : (
          <ul className="list-group list-group-flush">
            {pending.map((p, i) => (
<li
  key={i}
  className={`list-group-item d-flex justify-content-between align-items-center ${
    p.payment_status === "PENDING"
      ? "list-group-item-danger"
      : p.payment_status === "PARTIAL"
      ? "list-group-item-warning"
      : ""
  }`}
>
  <div>
    <b>
      <span className="badge bg-dark me-2">
        {p.ref_no}
      </span>

      <span className="text-primary">
        {p.customer_name || "-"}
      </span>
    </b>

<span
  className={`badge ms-2 ${
    p.payment_status === "PENDING"
      ? "bg-danger"
      : p.payment_status === "PARTIAL"
      ? "bg-warning text-dark"
      : "bg-success"
  }`}
>
  {p.payment_status}
</span>

    <div
      style={{
        fontSize: "11px",
        color: "#666",
        marginTop: "2px"
      }}
    >
      {p.note}
    </div>
  </div>

                <button className="btn btn-sm btn-outline-primary" onClick={() => loadLedger(p.ref_no)}>Load</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

      {/* CONTROLS */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2">
          <input className="form-control" placeholder="Ref No" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
          <button className="btn btn-primary" onClick={() => loadLedger()}>Load</button>
          <button className="btn btn-success" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* ENTRY FORM */}
      <div className="card shadow-sm mb-3">
        <div className="card-body row g-2">
          <div className="col-md-3">
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="col-md-3">
            <input className="form-control" placeholder="Amount" value={amountDisp} onChange={(e) => {
              const raw = parseAmt(e.target.value);
              if (!isNaN(raw)) { setAmountRaw(raw); setAmountDisp(fmtAmt(raw)); }
            }} />
          {amountRaw > 0 && (
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "green" }}>
              {numberToWords(amountRaw)}
            </span>
          )}
        </div>

          <div className="col-md-3">
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="payment">Payment</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div className="col-md-3">
            <select className="form-control" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Bank</option>
              <option>Cash</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          <button className="btn btn-success" disabled={saving} onClick={saveEntry}>{saving ? "Saving..." : "💾 Save Entry"}</button>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div ref={pdfRef} className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered table-sm mb-0">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>❌</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted">No ledger entries</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{getRowDate(r)}</td>
                  <td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>{r.description}</td>
                  <td>{fmtAmt(r.debit)}</td>
                  <td>{fmtAmt(r.credit)}</td>
                  <td className="fw-bold">{fmtAmt(r.balance)}</td>
                  <td>
                    {r.id !== "SALE" && r.id !== "CUSTOMER" && (
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>Del</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}


