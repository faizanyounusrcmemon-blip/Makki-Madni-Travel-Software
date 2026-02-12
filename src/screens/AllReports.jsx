import React, { useEffect, useState, useMemo } from "react";

export default function AllReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/all`
      );
      const data = await res.json();
      setRows(data || []);
      setFiltered(data || []);
    } catch {
      alert("Server error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (type, ref_no) => {
    const pass = prompt(
      `DELETE RECORD\nTYPE: ${type}\nREF NO: ${ref_no}\nCustomer: ${customer_name}\n\nEnter password`
    );

    if (pass !== "786") {
      alert("❌ Wrong Password");
      return;
    }

    if (
      !window.confirm(
        `Confirm delete?\nTYPE: ${type}\nREF NO: ${ref_no}\n\nThis will move to deleted list`
      )
    )
      return;

    let endpoint = "";
    if (type === "Packages") endpoint = "bookings";
    if (type === "Hotels") endpoint = "hotels";
    if (type === "Ticketing") endpoint = "ticketing";
    if (type === "Transport") endpoint = "transport";
    if (type === "Ziyarat") endpoint = "ziyarat";
    if (type === "Visa") endpoint = "visa";

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/delete/${ref_no}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message || data.error || "Delete failed");
        return;
      }

      alert(`✅ Record Deleted\nREF NO: ${ref_no}`);
      loadData();
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Delete failed");
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
        : type === "Ziyarat"
        ? "ziyarat_view"
        : "visa_view";

    onNavigate(page, ref_no);
  };

  /* ================= FILTER ================= */
  useEffect(() => {
    let temp = [...rows];

    if (search)
      temp = temp.filter(
        (r) =>
          (r.ref_no || "").toLowerCase().includes(search.toLowerCase()) ||
          (r.customer_name || "").toLowerCase().includes(search.toLowerCase())
      );

    if (fromDate)
      temp = temp.filter((r) => new Date(r.booking_date) >= new Date(fromDate));

    if (toDate)
      temp = temp.filter((r) => new Date(r.booking_date) <= new Date(toDate));

    setFiltered(temp);
  }, [search, fromDate, toDate, rows]);

  /* ================= TOTAL ================= */
  const totalPKR = useMemo(() => {
    return filtered.reduce((sum, r) => sum + Number(r.total_pkr || 0), 0);
  }, [filtered]);

  /* ================= FORMAT ================= */
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtPKR = (v) => {
    if (!v) return "0";
    return Number(v).toLocaleString("en-PK");
  };

  const typeIcon = (type) => {
    if (type === "Packages") return "📦";
    if (type === "Hotels") return "🏨";
    if (type === "Ticketing") return "✈️";
    if (type === "Transport") return "🚐";
    if (type === "Ziyarat") return "🕌";
    if (type === "Visa") return "🛂";
    return "📄";
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center flex-wrap"
          style={{
            background: "linear-gradient(135deg, #0d6efd, #6610f2)",
            color: "#fff",
            borderRadius: "12px",
          }}
        >
          <h5 className="fw-bold mb-0">📊 All Reports</h5>
          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* FILTER */}
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

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>SR#</th>
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
                  <td className="fw-bold text-muted">{i + 1}</td>

                  <td>
                    <span className="badge bg-info text-dark">
                      {typeIcon(r.type)} {r.type}
                    </span>
                  </td>

                  <td className="fw-bold">{r.ref_no}</td>

                  <td className="fw-semibold text-primary">
                    {r.customer_name || "-"}
                  </td>

                  <td className="text-muted">{formatDate(r.booking_date)}</td>

                  <td>
                    <span className="badge bg-success">💰 {fmtPKR(r.total_pkr)}</span>
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={() => handleView(r.type, r.ref_no)}
                    >
                      VIEW
                    </button>
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(r.type, r.ref_no, r.customer_name)}
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length > 0 && (
                <tr className="table-dark">
                  <td colSpan={5} className="text-end fw-bold">
                    TOTAL
                  </td>
                  <td className="fw-bold">{fmtPKR(totalPKR)}</td>
                  <td colSpan={2}></td>
                </tr>
              )}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-3">
                    No Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



