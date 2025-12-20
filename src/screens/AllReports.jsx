import React, { useEffect, useState } from "react";

export default function AllReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // LOAD
  const loadData = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reports/all`
    );
    const data = await res.json();
    setRows(data);
    setFiltered(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔥 SOFT DELETE (PASSWORD = 786)
  const handleDelete = async (type, ref_no) => {
    const pass = prompt("Enter delete password (786)");

    if (pass !== "786") {
      alert("❌ Wrong Password");
      return;
    }

    let endpoint = "";
    if (type === "Packages") endpoint = "bookings";
    if (type === "Hotels") endpoint = "hotels";
    if (type === "Ticketing") endpoint = "ticketing";
    if (type === "Transport") endpoint = "transport";
    if (type === "Visa") endpoint = "visa";

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/delete/${ref_no}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "Delete failed");
      return;
    }

    alert("✅ Soft Deleted");
    loadData();
  };

  // VIEW
  const handleView = (type, ref_no) => {
    const page =
      type === "Packages"
        ? "packages_view"
        : type === "Hotels"
        ? "hotels_view"
        : type === "Ticketing"
        ? "ticket_view"
        : type === "Transport"
        ? "transport_view"
        : "visa_view";

    onNavigate(page, ref_no);
  };

  // FILTER
  useEffect(() => {
    let temp = [...rows];

    if (search)
      temp = temp.filter(
        (r) =>
          r.ref_no.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(search.toLowerCase())
      );

    if (fromDate)
      temp = temp.filter(
        (r) => new Date(r.booking_date) >= new Date(fromDate)
      );

    if (toDate)
      temp = temp.filter(
        (r) => new Date(r.booking_date) <= new Date(toDate)
      );

    setFiltered(temp);
  }, [search, fromDate, toDate, rows]);

  return (
    <div className="container mt-3">
      <h3 className="fw-bold mb-3">All Reports</h3>

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Search Ref / Customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="form-control"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          className="form-control"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Type</th>
            <th>Ref</th>
            <th>Customer</th>
            <th>Date</th>
            <th>PKR</th>
            <th>View</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td>{r.type}</td>
              <td>{r.ref_no}</td>
              <td>{r.customer_name}</td>
              <td>{new Date(r.booking_date).toLocaleDateString()}</td>
              <td>{Number(r.total_pkr).toLocaleString()}</td>

              <td className="text-center">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleView(r.type, r.ref_no)}
                >
                  👁
                </button>
              </td>

              <td className="text-center">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(r.type, r.ref_no)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                No Records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
