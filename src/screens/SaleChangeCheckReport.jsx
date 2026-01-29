import React, { useState } from "react";
import axios from "axios";

export default function SaleChangeCheckReport() {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    if (!refNo) return alert("Ref No required");

    setLoading(true);
    setError("");
    setRows([]);

    try {
      const res = await axios.get(
        `/api/purchase/sale-change-check/${refNo}`
      );

      if (!res.data.success) {
        setError(res.data.error || "Failed to load report");
      } else {
        setRows(res.data.rows || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changedCount = rows.filter(r => r.status === "CHANGED").length;

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Sale vs Purchase Sale Check</h2>

      {/* ================= INPUT ================= */}
      <div style={{ marginBottom: 15 }}>
        <input
          value={refNo}
          onChange={e => setRefNo(e.target.value)}
          placeholder="Enter Ref No (PKG- / HOT- / etc)"
          style={{ padding: 8, width: 260 }}
        />
        <button
          onClick={loadReport}
          style={{ marginLeft: 10, padding: "8px 16px" }}
        >
          Check
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ================= SUMMARY ================= */}
      {rows.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <b>Total Items:</b> {rows.length} &nbsp; | &nbsp;
          <b style={{ color: "red" }}>Changed:</b> {changedCount}
        </div>
      )}

      {/* ================= TABLE ================= */}
      {rows.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          width="100%"
        >
          <thead style={{ background: "#f3f3f3" }}>
            <tr>
              <th>Item</th>
              <th>Old Sale PKR</th>
              <th>Current Sale PKR</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background:
                    r.status === "CHANGED" ? "#ffe5e5" : "#e9ffe9"
                }}
              >
                <td>{r.item}</td>

                <td style={{ textAlign: "right" }}>
                  {Number(r.old_sale_pkr).toLocaleString()}
                </td>

                <td style={{ textAlign: "right" }}>
                  {Number(r.current_sale_pkr).toLocaleString()}
                </td>

                <td style={{ fontWeight: "bold" }}>
                  {r.status === "CHANGED" ? "❌ CHANGED" : "✅ OK"}
                </td>

                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
