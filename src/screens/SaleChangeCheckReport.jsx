import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SaleMismatchReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Base API URL for Vercel deployment
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || ""; // Example: "https://makki-madni-travel-software.vercel.app/api"

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE}/purchase/sale-mismatch-report`);

      if (!res.data.success) {
        setError(res.data.error || "Failed to load report");
        setRows([]);
      } else {
        setRows(res.data.rows || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch report"
      );
      setRows([]);
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
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p style={{ color: "green" }}>✅ No sale mismatch found</p>
      )}

      {rows.length > 0 && (
        <table
          width="100%"
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{ borderCollapse: "collapse" }}
        >
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
            {rows.map((r, i) => {
              const diff = (Number(r.current_sale_pkr || 0) - Number(r.purchase_sale_pkr || 0));
              return (
                <tr key={i} style={{ background: "#fff5f5" }}>
                  <td><b>{r.ref_no}</b></td>
                  <td>{r.item}</td>
                  <td style={{ textAlign: "right" }}>
                    {Number(r.purchase_sale_pkr || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {Number(r.current_sale_pkr || 0).toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: diff !== 0 ? "red" : "black",
                      fontWeight: "bold"
                    }}
                  >
                    {diff.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
