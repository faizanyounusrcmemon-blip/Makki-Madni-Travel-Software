import React, { useEffect, useState } from "react";

export default function AllReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // LOAD REPORT DATA
  const loadData = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/all`)
      .then((res) => res.json())
      .then((data) => {
        setRows(data);
        setFiltered(data);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // DELETE WITH PASSWORD
  const handleDelete = async (type, id) => {
    const pass = prompt("Enter delete password:");

    if (pass !== "786") {
      return alert("❌ Wrong Password!");
    }

    let endpoint = "";

    if (type === "Packages") endpoint = "bookings";
    if (type === "Hotels") endpoint = "hotels";
    if (type === "Ticketing") endpoint = "ticketing";
    if (type === "Transport") endpoint = "transport";
    if (type === "Visa") endpoint = "visa";

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/delete/${id}`, {
      method: "DELETE",
    });

    alert("Deleted!");
    loadData();
  };

  // VIEW BUTTON — FIXED
  const handleView = (type, id) => {
    const page =
      type === "Packages"
        ? "packages_view"
        : type === "Hotels"
        ? "hotels_view"
        : type === "Ticketing"
        ? "ticket_view"
        : type === "Transport"
        ? "transport_view"
        : type === "Visa"
        ? "visa_view"
        : "";

    onNavigate(page, id); // ONLY ID SENT ✔
  };

  // SEARCH + DATE FILTER
  useEffect(() => {
    let temp = [...rows];

    if (search.trim() !== "") {
      temp = temp.filter(
        (r) =>
          r.ref_no?.toLowerCase().includes(search.toLowerCase()) ||
          r.customer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (fromDate !== "") {
      temp = temp.filter(
        (r) => new Date(r.booking_date) >= new Date(fromDate)
      );
    }

    if (toDate !== "") {
      temp = temp.filter(
        (r) => new Date(r.booking_date) <= new Date(toDate)
      );
    }

    setFiltered(temp);
  }, [search, fromDate, toDate, rows]);

  return (
    <div className="container mt-3">
      <h3 className="fw-bold mb-3">All Reports</h3>

      {/* FILTER BAR */}
      <div className="d-flex gap-3 mb-3">
        <input
          type="text"
          placeholder="Search Ref No / Customer"
          className="form-control"
          style={{ maxWidth: "250px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div>
          <label className="small fw-bold">From</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label className="small fw-bold">To</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Type</th>
            <th>Ref No</th>
            <th>Customer</th>
            <th>Date</th>
            <th>PKR</th>
            <th style={{ width: "80px" }}>View</th>
            <th style={{ width: "80px" }}>Delete</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td>{r.type}</td>
              <td>{r.ref_no}</td>
              <td>{r.customer_name}</td>
              <td>{r.booking_date}</td>
              <td>{Number(r.total_pkr).toLocaleString()}</td>

              {/* VIEW */}
              <td className="text-center">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleView(r.type, r.id)}
                >
                  👁 View
                </button>
              </td>

              {/* DELETE */}
              <td className="text-center">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(r.type, r.id)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                No Records Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
