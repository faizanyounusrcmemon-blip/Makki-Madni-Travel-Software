import React, { useEffect, useState } from "react";

/* ===============================
   HELPERS (DOT + COMMA SAFE)
=============================== */

// typing ke waqt (comma + decimal allowed)
const formatInput = (v) => {
  if (v === "") return "";

  // sirf digits + dot
  let clean = v.replace(/[^0-9.]/g, "");

  // ek se zyada dot allow nahi
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }

  const [int, dec] = clean.split(".");

  // integer part me comma
  const intFmt =
    int === "" ? "" : Number(int).toLocaleString("en-US");

  return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
};

// calculation / backend ke liye
const parseNumber = (v) => {
  if (!v) return 0;
  return parseFloat(String(v).replace(/,/g, "")) || 0;
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  /* ===============================
     LOAD PENDING + PARTIAL LIST
  =============================== */
  const loadPending = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
    );
    const d = await r.json();
    if (d.success) setPending(d.rows || []);
  };

  useEffect(() => {
    loadPending();
  }, []);

  /* ===============================
     LOAD PACKAGE
  =============================== */
  const loadPackage = async (r = refNo) => {
    if (!r) return alert("Ref No required");

    setRefNo(r);
    setLoading(true);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/load/${r}`
    );
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.error || "Package not found");
      setRows([]);
      return;
    }

    setIsEdit(data.is_edit === true);

    setRows(
      data.rows.map((x) => ({
        item: x.item,

        sale_sar: Number(x.sale_sar) || 0,
        sale_rate: Number(x.sale_rate) || 0,
        sale_pkr: Number(x.sale_pkr) || 0,

        purchase_sar: x.purchase_sar
          ? formatInput(String(x.purchase_sar))
          : "",
        purchase_rate: x.purchase_rate
          ? formatInput(String(x.purchase_rate))
          : "",

        purchase_pkr: Number(x.purchase_pkr) || 0,
        profit: Number(x.profit) || 0,
      }))
    );
  };

  /* ===============================
     UPDATE ROW (FIXED)
  =============================== */
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    const r = copy[i];

    // 🔴 YAHI MAIN FIX HAI
    r[field] = formatInput(value);

    const sar = parseNumber(r.purchase_sar);
    const rate = parseNumber(r.purchase_rate);

    r.purchase_pkr = sar * rate;
    r.profit = r.sale_pkr - r.purchase_pkr;

    setRows(copy);
  };

  /* ===============================
     SAVE / UPDATE
  =============================== */
  const savePurchase = async () => {
    if (!rows.length) return alert("No data to save");

    const url = isEdit
      ? "/api/purchase/update"
      : "/api/purchase/save";

    const cleanRows = rows.map((r) => ({
      ...r,
      purchase_sar: parseNumber(r.purchase_sar),
      purchase_rate: parseNumber(r.purchase_rate),
    }));

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}${url}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          items: cleanRows,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert(isEdit ? "Purchase Updated" : "Purchase Saved");
      setRows([]);
      setRefNo("");
      setIsEdit(false);
      loadPending();
      onNavigate("dashboard");
    } else {
      alert(data.error || "Save failed");
    }
  };

  /* ===============================
     PARTIAL CHECK
  =============================== */
  const isPartial =
    rows.length > 0 &&
    rows.some(
      (r) =>
        !parseNumber(r.purchase_sar) ||
        !parseNumber(r.purchase_rate)
    );

  /* ===============================
     UI
  =============================== */
  return (
    <div className="container p-3">

      {/* TOP BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>

        <button
          className="btn btn-success btn-sm"
          onClick={savePurchase}
        >
          {isEdit ? "✏️ Update Purchase" : "💾 Save Purchase"}
        </button>
      </div>

      <h4 className="fw-bold">
        PURCHASE ENTRY{" "}
        {isEdit && (
          <span className="text-warning">(EDIT MODE)</span>
        )}
      </h4>

      {isPartial && (
        <div className="alert alert-warning fw-bold mt-2">
          ⚠️ This purchase is <u>PARTIALLY COMPLETED</u>
        </div>
      )}

      {/* PENDING LIST */}
      <div className="mb-3">
        <h6 className="fw-bold text-danger">
          ⏳ Pending / Partial Purchases
        </h6>

        {pending.length === 0 ? (
          <p className="text-success">✅ No pending purchases</p>
        ) : (
          <ul className="list-group">
            {pending.map((p, i) => (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <b>{p.ref_no}</b>
                  {p.status === "PENDING" && (
                    <span className="badge bg-danger ms-2">
                      Pending
                    </span>
                  )}
                  {p.status === "PARTIAL" && (
                    <span className="badge bg-warning text-dark ms-2">
                      Partial
                    </span>
                  )}
                  <div className="small text-muted">
                    {p.note}
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => loadPackage(p.ref_no)}
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* LOAD BY REF */}
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          placeholder="PACKAGE REF NO"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => loadPackage()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {/* TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Item</th>
            <th>Sale SAR</th>
            <th>Rate</th>
            <th>Sale PKR</th>
            <th>Purchase SAR</th>
            <th>Purchase Rate</th>
            <th>Purchase PKR</th>
            <th>Profit</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.item}</td>
              <td>{r.sale_sar}</td>
              <td>{r.sale_rate}</td>
              <td>{r.sale_pkr.toLocaleString()}</td>

              <td>
                <input
                  className="form-control form-control-sm"
                  value={r.purchase_sar}
                  onChange={(e) =>
                    updateRow(i, "purchase_sar", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  className="form-control form-control-sm"
                  value={r.purchase_rate}
                  onChange={(e) =>
                    updateRow(i, "purchase_rate", e.target.value)
                  }
                />
              </td>

              <td>{r.purchase_pkr.toLocaleString()}</td>

              <td
                className={
                  r.profit >= 0
                    ? "text-success fw-bold"
                    : "text-danger fw-bold"
                }
              >
                {r.profit.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
