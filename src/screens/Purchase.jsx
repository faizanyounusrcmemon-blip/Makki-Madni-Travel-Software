import React, { useEffect, useState } from "react";

/* ===============================
   HELPERS (DOT + COMMA SAFE)
================================ */

// DISPLAY FORMAT
const fmt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(String(v).replace(/,/g, ""));
  if (isNaN(n)) return v; // allow "30." or "."
  return n.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
};

// PARSE FOR CALCULATION
const parse = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const x = String(v).replace(/,/g, "");
  if (x === "." || x.endsWith(".")) return x; // 👈 dot typing allow
  const n = parseFloat(x);
  return isNaN(n) ? 0 : n;
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  /* ===============================
     LOAD PENDING
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

        // 👇 STRING rakha hai (typing safe)
        purchase_sar: x.purchase_sar ? String(x.purchase_sar) : "",
        purchase_rate: x.purchase_rate ? String(x.purchase_rate) : "",

        purchase_pkr: Number(x.purchase_pkr) || 0,
        profit: Number(x.profit) || 0,
      }))
    );
  };

  /* ===============================
     UPDATE ROW (DOT SAFE)
  =============================== */
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    const r = copy[i];

    // 👇 typing ke liye raw string
    r[field] = value;

    const sar = parse(r.purchase_sar);
    const rate = parse(r.purchase_rate);

    const sarNum = typeof sar === "number" ? sar : 0;
    const rateNum = typeof rate === "number" ? rate : 0;

    r.purchase_pkr = sarNum * rateNum;
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

    // 👇 backend ko NUMBER bhejna
    const payloadRows = rows.map((r) => ({
      ...r,
      purchase_sar: parseFloat(parse(r.purchase_sar)) || 0,
      purchase_rate: parseFloat(parse(r.purchase_rate)) || 0,
    }));

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}${url}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          items: payloadRows,
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
        !parseFloat(parse(r.purchase_sar)) ||
        !parseFloat(parse(r.purchase_rate))
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

        <button className="btn btn-success btn-sm" onClick={savePurchase}>
          {isEdit ? "✏️ Update Purchase" : "💾 Save Purchase"}
        </button>
      </div>

      <h4 className="fw-bold">
        PURCHASE ENTRY{" "}
        {isEdit && <span className="text-warning">(EDIT MODE)</span>}
      </h4>

      {isPartial && (
        <div className="alert alert-warning fw-bold mt-2">
          ⚠️ This purchase is <u>PARTIALLY COMPLETED</u>.
        </div>
      )}

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
          {rows.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center text-muted">
                No data loaded
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.item}</td>
              <td>{fmt(r.sale_sar)}</td>
              <td>{fmt(r.sale_rate)}</td>
              <td>{fmt(r.sale_pkr)}</td>

              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={fmt(r.purchase_sar)}
                  onChange={(e) =>
                    updateRow(i, "purchase_sar", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={fmt(r.purchase_rate)}
                  onChange={(e) =>
                    updateRow(i, "purchase_rate", e.target.value)
                  }
                />
              </td>

              <td>{fmt(r.purchase_pkr)}</td>

              <td
                className={
                  r.profit >= 0
                    ? "text-success fw-bold"
                    : "text-danger fw-bold"
                }
              >
                {fmt(r.profit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
