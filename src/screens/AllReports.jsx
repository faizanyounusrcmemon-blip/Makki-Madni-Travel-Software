import React, { useEffect, useState, useMemo } from "react";

export default function AllReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD ================= */
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

  /* ================= DELETE ================= */
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

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/delete/${ref_no}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!data.success) {
        // ✅ SHOW ERROR MESSAGE IF PURCHASE/PAYMENT EXISTS
        alert(data.message || data.error || "Delete failed");
        return;
      }

      alert("✅ Soft Deleted");
      loadData();
    } catch (err) {
      console.error("Delete Error:", err);
      alert("❌ Delete failed. Check console for details.");
    }
  };

  /* ================= VIEW ================= */
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

  /* ================= FILTER ================= */
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

  /* ================= TOTAL (AUTO UPDATE) ================= */
  const totalPKR = useMemo(() => {
    return filtered.reduce(
      (sum, r) => sum + Number(r.total_pkr || 0),
      0
    );
  }, [filtered]);

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase(); // 01/DEC/2025
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="d-flex align-items-center mb-2 mb-md-0">
          <span className="fs-3 me-2">📊</span>
          <h4 className="fw-bold mb-0 text-primary">All Reports</h4>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <input
                className="form-control form-control-sm"
                placeholder="🔍 Search Ref / Customer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>PKR</th>
                  <th className="text-center">View</th>
                  <th className="text-center">Delete</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span className="badge bg-info text-dark">
                        {r.type}
                      </span>
                    </td>

                    <td className="fw-bold">{r.ref_no}</td>

                    {/* CUSTOMER NAME KHUBSORAT */}
                    <td className="fw-bold text-primary">
                      {r.customer_name || "-"}
                    </td>

                    {/* DATE FORMATTED */}
                    <td>
                      <span className="text-muted">{formatDate(r.booking_date)}</span>
                    </td>

                    <td>
                      <span className="badge bg-success">
                        {Number(r.total_pkr).toLocaleString()}
                      </span>
                    </td>

                    <td className="text-center">
                      <button
                        className="btn btn-outline-info btn-sm"
                        onClick={() => handleView(r.type, r.ref_no)}
                      >
                        👁
                      </button>
                    </td>

                    <td className="text-center">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(r.type, r.ref_no)}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}

                {/* ===== TOTAL ROW ===== */}
                {filtered.length > 0 && (
                  <tr className="table-dark">
                    <td colSpan={4} className="fw-bold text-end">
                      TOTAL
                    </td>
                    <td className="fw-bold">
                      {totalPKR.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                )}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3">
                      No Records Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
