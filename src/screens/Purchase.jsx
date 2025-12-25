import React, { useEffect, useState } from "react";

/* ===============================
   HELPERS
=============================== */

// 30000 → 30,000
const fmt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  return Number(v).toLocaleString("en-US");
};

// "30,000" → 30000
const parse = (v) => {
  if (!v) return 0;
  return Number(String(v).replace(/,/g, ""));
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

        purchase_sar: x.purchase_sar ? fmt(x.purchase_sar) : "",
        purchase_rate: x.purchase_rate ? fmt(x.purchase_rate) : "",
        purchase_pkr: Number(x.purchase_pkr) || 0,

        profit: Number(x.profit) || 0,
      }))
    );
  };

  /* ===============================
     UPDATE ROW (🔥 LIVE FORMAT)
  =============================== */
  const updateRow = (i, field, raw) => {
    const copy = [...rows];
    const r = copy[i];

    // 👉 sirf digits lo
    const digits = raw.replace(/[^\d]/g, "");

    // 👉 live comma format
    r[field] = digits ? fmt(digits) : "";

    const sar = parse(r.purchase_sar);
    const rate = parse(r.purchase_rate);

    r.purchase_pkr = sar * rate;
    r.profit = r.sale_pkr - r.purchase_pkr;

    setRows(copy);
  };

  /* ===============================
     SAVE PURCHASE
  =============================== */
  const savePurchase = async () => {
    if (saving) return;
    if (!rows.length) return alert("No data to save");

    setSaving(true);

    const payload = rows.map((r) => ({
      item: r.item,

      sale_sar: r.sale_sar,
      sale_rate: r.sale_rate,
      sale_pkr: r.sale_pkr,

      purchase_sar: parse(r.purchase_sar),
      purchase_rate: parse(r.purchase_rate),
      purchase_pkr: r.purchase_pkr,
      profit: r.profit,
    }));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_no: refNo,
            items: payload,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Purchase Saved Successfully");

        setRows([]);
        setRefNo("");
        setIsEdit(false);
        loadPending();

        onNavigate("dashboard");
      } else {
        alert(data.error || "Save failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     PARTIAL CHECK
  =============================== */
  const isPartial =
    rows.length > 0 &&
    rows.some(
      (r) => !parse(r.purchase_sar) || !parse(r.purchase_rate)
    );

  /* ===============================
     UI
  =============================== */
  return (
    <div className="container p-3">

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
          disabled={saving}
        >
          {saving ? "Saving..." : "💾 Save Purchase"}
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
      <table className="table table-bordered table-sm mt-3">
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
              <td>{fmt(r.sale_sar)}</td>
              <td>{fmt(r.sale_rate)}</td>
              <td>{fmt(r.sale_pkr)}</td>

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
