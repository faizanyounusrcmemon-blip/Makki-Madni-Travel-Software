import React, { useEffect, useState } from "react";

export default function SaleChangeCheckReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/next/sale-mismatch-report");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Unknown error");
        setRows(data.rows || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading Sale Mismatch Report...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!rows.length) return <p>No mismatches found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Sale vs Purchase Mismatch Report</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Ref No</th>
            <th style={thStyle}>Item</th>
            <th style={thStyle}>Purchase Sale PKR</th>
            <th style={thStyle}>Current Sale PKR</th>
            <th style={thStyle}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={tdStyle}>{r.ref_no}</td>
              <td style={tdStyle}>{r.item}</td>
              <td style={tdStyle}>{r.purchase_sale_pkr.toLocaleString()}</td>
              <td style={tdStyle}>{r.current_sale_pkr.toLocaleString()}</td>
              <td
                style={{
                  ...tdStyle,
                  color: r.diff < 0 ? "red" : "green",
                  fontWeight: "bold",
                }}
              >
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
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f5f5f5",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
};
