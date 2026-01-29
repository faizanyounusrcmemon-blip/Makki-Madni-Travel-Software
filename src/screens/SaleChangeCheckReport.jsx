import React, { useEffect, useState } from "react";

export default function SaleChangeCheckReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/next/sale-mismatch-report")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) setRows(data.rows);
        else setError(data.error || "Unknown error");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading report...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  if (!rows.length) return <div>No mismatches found.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Sale vs Purchase Mismatch Report</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Ref No</th>
            <th style={thStyle}>Item</th>
            <th style={thStyle}>Purchase Sale (PKR)</th>
            <th style={thStyle}>Current Sale (PKR)</th>
            <th style={thStyle}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={i % 2 ? { background: "#f9f9f9" } : {}}>
              <td style={tdStyle}>{r.ref_no}</td>
              <td style={tdStyle}>{r.item}</td>
              <td style={tdStyle}>{r.purchase_sale_pkr.toLocaleString()}</td>
              <td style={tdStyle}>{r.current_sale_pkr.toLocaleString()}</td>
              <td style={{ ...tdStyle, color: r.diff !== 0 ? "red" : "black" }}>
                {r.diff.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  background: "#4CAF50",
  color: "white",
  textAlign: "left"
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px"
};
