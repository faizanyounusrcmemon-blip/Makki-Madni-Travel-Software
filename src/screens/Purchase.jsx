import React, { useState } from "react";

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // LOAD PACKAGE SALE DATA
  // ===============================
  const loadPackage = async () => {
    if (!refNo) return alert("Ref No required");

    setLoading(true);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/load/${refNo}`
    );
    const data = await res.json();

    setLoading(false);

    if (!data.success) {
      alert(data.error || "Package not found");
      setRows([]);
      return;
    }

    setRows(
      data.rows.map(r => ({
        item: r.item,

        // SALE (AUTO)
        sale_sar: Number(r.sale_sar) || 0,
        sale_rate: Number(r.sale_rate) || 0,
        sale_pkr: Number(r.sale_pkr) || 0,

        // PURCHASE (MANUAL)
        purchase_sar: "",
        purchase_rate: "",
        purchase_pkr: 0,

        // PROFIT
        profit: 0
      }))
    );
  };

  // ===============================
  // UPDATE PURCHASE
  // ===============================
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    const r = copy[i];

    r[field] = Number(value) || 0;

    r.purchase_pkr = r.purchase_sar * r.purchase_rate;
    r.profit = r.sale_pkr - r.purchase_pkr;

    setRows(copy);
  };

  // ===============================
  // SAVE PURCHASE
  // ===============================
  const savePurchase = async () => {
    if (!rows.length) return alert("No data to save");

    const payload = {
      ref_no: refNo,
      items: rows
    };

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Purchase Saved Successfully");
      onNavigate("dashboard");
    } else {
      alert(data.error || "Save failed");
    }
  };

  // ===============================
  // UI
  // ===============================
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
          💾 Save Purchase
        </button>
      </div>

      <h4>PURCHASE ENTRY</h4>

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          placeholder="PACKAGE REF NO"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={loadPackage}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      <table className="table table-bordered table-sm">
        <thead className="table-light">
          <tr>
            <th>Item</th>

            <th>SALE SAR TOTAL</th>
            <th>SALE SAR RATE</th>
            <th>SALE PKR TOTAL</th>

            <th>PURCHASE SAR TOTAL</th>
            <th>PURCHASE SAR RATE</th>
            <th>PURCHASE PKR TOTAL</th>

            <th>PROFIT</th>
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

              <td>{r.sale_sar}</td>
              <td>{r.sale_rate}</td>
              <td>{r.sale_pkr.toLocaleString()}</td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={r.purchase_sar}
                  onChange={(e) =>
                    updateRow(i, "purchase_sar", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
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
