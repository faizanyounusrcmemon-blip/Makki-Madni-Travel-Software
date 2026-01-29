import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SaleMismatchReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      const res = await axios.get("/api/purchase/sale-mismatch-report");
      if (!res.data.success) {
        setError(res.data.error || "Failed to load report");
      } else {
        setRows(res.data.rows || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🚨 Sale Change Audit Report</h2>
      <p style={{ color: "#555" }}>
        Only items where <b>sale has changed after purchase</b>
      </p>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "red" }}>
          {typeof error === "string" ? error : JSON.stringify(error)}
        </p>
      )}

      {!loading && rows.length === 0 && !error && (
        <p style={{ color: "green" }}>✅ No sale mismatch found</p>
      )}

      {rows.length > 0 && (
        <table width="100%" border="1" cellPadding="8" cellSpacing="0">
          <thead style={{ background: "#ffe0e0" }}>
            <tr>
              <th>Ref No</th>
              <th>Item</th>
              <th>Purchase Sale PKR</th>
              <th>Current Sale PKR</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: "#fff5f5" }}>
                <td><b>{r.ref_no}</b></td>
                <td>{r.item}</td>
                <td style={{ textAlign: "right" }}>
                  {Number(r.purchase_sale_pkr).toLocaleString()}
                </td>
                <td style={{ textAlign: "right" }}>
                  {Number(r.current_sale_pkr).toLocaleString()}
                </td>
                <td style={{ textAlign: "right", color: "red", fontWeight: "bold" }}>
                  {Number(r.diff).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
