import React, { useEffect, useState } from "react";

export default function SaleMismatchReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/purchase/sale-mismatch-report");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Unknown error");
        setRows(data.rows || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) return <div className="p-4 text-blue-700">Loading report...</div>;
  if (error) return <div className="p-4 text-red-700">Error: {error}</div>;
  if (!rows.length) return <div className="p-4 text-gray-700">No sale changes found.</div>;

  return (
    <div className="overflow-x-auto p-4">
      <h2 className="text-xl font-bold mb-4">🚨 Sale Change Audit Report</h2>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-3 py-2 text-left">Ref No</th>
            <th className="border px-3 py-2 text-left">Item</th>
            <th className="border px-3 py-2 text-right">Purchase Sale (PKR)</th>
            <th className="border px-3 py-2 text-right">Current Sale (PKR)</th>
            <th className="border px-3 py-2 text-right">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const diff = Number(r.diff || 0);
            const diffClass = diff > 0 ? "text-green-600 font-bold" : diff < 0 ? "text-red-600 font-bold" : "text-gray-700";

            return (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border px-3 py-2">{r.ref_no}</td>
                <td className="border px-3 py-2">{r.item}</td>
                <td className="border px-3 py-2 text-right">{Number(r.purchase_sale_pkr || 0).toLocaleString()}</td>
                <td className="border px-3 py-2 text-right">{Number(r.current_sale_pkr || 0).toLocaleString()}</td>
                <td className={`border px-3 py-2 text-right ${diffClass}`}>{diff.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
