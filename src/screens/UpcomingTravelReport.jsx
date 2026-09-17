import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// 🗓️ Format Date strictly as DD/MMM/YYYY (e.g. 15/SEP/2026)
const fmtDate = (value) => {
  if (!value || value === 'N/A') return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${day}/${mon}/${d.getFullYear()}`;
};

export default function UpcomingTravelReport({ onNavigate }) {
  const [days, setDays] = useState("7");
  const [customDays, setCustomDays] = useState("14");
  const [filterService, setFilterService] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const selectedDays =
    days === "custom" ? Math.max(0, Number(customDays) || 0) : Number(days);

  /* ============================================================
     FETCH DATA FROM API
  ============================================================ */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const baseURL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
      const url = `${baseURL}/api/reports/upcoming-travel-report?days=${selectedDays}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setReportData(res.data.data || []);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to fetch travel records.",
          width: "340px",
        });
      }
    } catch (err) {
      console.error("Fetch Travel Report Error:", err);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.message || err.response?.data?.error || `Could not connect to server. (${err.response?.status || "Network Error"})`,
        width: "340px",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays]);

  /* ============================================================
     FILTER LOGIC
  ============================================================ */
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return reportData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.customer_name, row.ref_no, row.customer_id, row.details, row.module]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesService =
        filterService === "ALL" || row.service_type === filterService;

      return matchesSearch && matchesService;
    });
  }, [reportData, searchTerm, filterService]);

  /* ============================================================
     METRICS / SUMMARY COMPUTATION
  ============================================================ */
  const summary = useMemo(() => {
    let todayCount = 0;
    let next3Count = 0;
    let next7Count = 0;
    let totalPax = 0;

    filteredRows.forEach((r) => {
      const d = Number(r.days_count);
      if (d === 0) todayCount++;
      if (d >= 0 && d <= 3) next3Count++;
      if (d >= 0 && d <= 7) next7Count++;
      totalPax += Number(r.pax_count || 1);
    });

    return {
      total: filteredRows.length,
      today: todayCount,
      next3: next3Count,
      next7: next7Count,
      pax: totalPax,
    };
  }, [filteredRows]);

  /* ============================================================
     CSV EXPORT
  ============================================================ */
  const exportCSV = () => {
    if (!filteredRows.length) {
      Swal.fire({
        icon: "info",
        title: "No Records",
        text: "There is nothing to export.",
        width: "300px",
      });
      return;
    }

    const headers = [
      "Days Left",
      "Travel Date",
      "Module",
      "Service Type",
      "Ref No",
      "Customer Name",
      "Customer ID",
      "Details",
      "Pax Count",
    ];

    const csvRows = filteredRows.map((r) => [
      r.days_count === 0 ? "TODAY" : `${r.days_count}d`,
      fmtDate(r.travel_date),
      (r.module || "").toUpperCase(),
      r.service_type || "",
      r.ref_no || "",
      r.customer_name || "",
      r.customer_id || "",
      r.details || "",
      r.pax_count || 1,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Upcoming_Travel_Report_${selectedDays}_Days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  return (
    <div className="upcoming-travel-page">
      <style>{`
        .upcoming-travel-page {
          min-height: calc(100vh - 65px);
          padding: 24px;
          background: radial-gradient(circle at 10% 10%, rgba(255,215,120,.22), transparent 28%), radial-gradient(circle at 90% 0%, rgba(13,110,253,.12), transparent 30%), linear-gradient(135deg, #f8fbff 0%, #eef6ff 45%, #fffaf0 100%);
          font-family: Arial, sans-serif;
        }
        .upcoming-shell { max-width: 1450px; margin: auto; }
        .upcoming-hero {
          border-radius: 22px; padding: 20px 22px; color: #fff;
          background: linear-gradient(135deg, #063b78, #0d6efd 55%, #d4a72c);
          box-shadow: 0 14px 34px rgba(10,55,105,.22); position: relative; overflow: hidden;
        }
        .upcoming-hero h2 { margin: 0; font-weight: 800; letter-spacing: .3px; }
        .upcoming-hero p { margin: 6px 0 0; opacity: .9; }
        .filter-card {
          margin-top: 16px; background: rgba(255,255,255,.94);
          border: 1px solid #dbe7f5; border-radius: 18px; padding: 16px;
          box-shadow: 0 8px 24px rgba(30,65,100,.10);
        }
        .filter-label { font-size: 11px; font-weight: 800; color: #52647a; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .preset-btn { border-radius: 10px !important; font-weight: 700; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 16px 0; }
        .summary-card { background: #fff; border-radius: 16px; padding: 14px 16px; border: 1px solid #e2eaf3; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .summary-card .label { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; }
        .summary-card .value { font-size: 23px; font-weight: 900; color: #102a43; margin-top: 4px; }
        .summary-card.total { border-left: 5px solid #0d6efd; }
        .summary-card.today { border-left: 5px solid #dc3545; }
        .summary-card.next3 { border-left: 5px solid #f0ad4e; }
        .summary-card.next7 { border-left: 5px solid #20c997; }
        .summary-card.pax { border-left: 5px solid #d4a72c; }
        .table-card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #dfe8f2; box-shadow: 0 10px 28px rgba(30,65,100,.10); }
        .table-head { padding: 13px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid #e8eef5; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-table th { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 11px 9px; white-space: nowrap; }
        .report-table td { padding: 10px 9px; border-bottom: 1px solid #edf1f5; vertical-align: middle; }
        .report-table tbody tr:hover { background: #f8fbff; }
        .days-badge { display: inline-flex; min-width: 48px; justify-content: center; padding: 5px 8px; border-radius: 999px; font-weight: 900; }
        .days-red { background: #ffe1e4; color: #b4232f; }
        .days-orange { background: #fff0d8; color: #a15c00; }
        .days-yellow { background: #fff8c9; color: #856404; }
        .module-badge { padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 900; background: #e6f0ff; color: #0757b8; text-transform: uppercase; }
        .service-badge { padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 900; background: #e5fbf4; color: #087f5b; }
        .pax-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 900; background: #fff3cd; color: #856404; }
        .empty-state { padding: 55px 20px; text-align: center; color: #64748b; }
        @media print { .filter-card, .no-print { display: none !important; } }
      `}</style>

      <div className="upcoming-shell">
        {/* Banner */}
        <div className="upcoming-hero">
          <h2>✈️ Upcoming Departures & Check-ins Report</h2>
          <p>
            Upcoming travel schedules, flight departures, hotel check-ins aur transport movements ki details.
          </p>
        </div>

        {/* Filters */}
        <div className="filter-card no-print">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Timeframe Criteria</div>
              <select className="form-select" value={days} onChange={(e) => setDays(e.target.value)}>
                <option value="1">Today Only</option>
                <option value="3">Next 3 Days</option>
                <option value="7">Next 7 Days</option>
                <option value="15">Next 15 Days</option>
                <option value="30">Next 30 Days</option>
                <option value="custom">Custom Days</option>
              </select>
            </div>

            {days === "custom" && (
              <div className="col-lg-2 col-md-6">
                <div className="filter-label">Days</div>
                <input
                  type="number"
                  min="0"
                  max="365"
                  className="form-control"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              </div>
            )}

            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Service Type</div>
              <select
                className="form-select"
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
              >
                <option value="ALL">All Services</option>
                <option value="Flight">Package Flight</option>
                <option value="Hotel">Package Hotel</option>
                <option value="Transport">Package Transport</option>
                <option value="Air Ticket">Air Ticket Standalone</option>
                <option value="Hotel Standalone">Hotel Standalone</option>
                <option value="Transport Standalone">Transport Standalone</option>
                <option value="Group Departure">Group Departure</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Search Customer / Ref</div>
              <input
                className="form-control"
                placeholder="Name, Ref No, CUST-xxxx..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-lg-1 col-md-12 d-grid">
              <button className="btn btn-primary preset-btn" onClick={fetchReport} disabled={loading}>
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="summary-grid">
          <div className="summary-card total">
            <div className="label">Total Schedule</div>
            <div className="value">{summary.total}</div>
          </div>
          <div className="summary-card today">
            <div className="label">Today</div>
            <div className="value">{summary.today}</div>
          </div>
          <div className="summary-card next3">
            <div className="label">Next 3 Days</div>
            <div className="value">{summary.next3}</div>
          </div>
          <div className="summary-card next7">
            <div className="label">Next 7 Days</div>
            <div className="value">{summary.next7}</div>
          </div>
          <div className="summary-card pax">
            <div className="label">Total Passengers</div>
            <div className="value">{summary.pax}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-card">
          <div className="table-head">
            <div>
              <strong>Showing {filteredRows.length} Upcoming Departure(s)</strong>
            </div>
            <div className="no-print d-flex gap-2">
              <button className="btn btn-outline-success btn-sm fw-bold" onClick={exportCSV}>
                📥 Export CSV
              </button>
              <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={printReport}>
                🖨️ Print Report
              </button>
            </div>
          </div>

          <div className="table-responsive table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "90px", textAlign: "center" }}>Days Left</th>
                  <th style={{ width: "110px" }}>Travel Date</th>
                  <th style={{ width: "100px" }}>Module</th>
                  <th style={{ width: "140px" }}>Service</th>
                  <th style={{ width: "110px" }}>Ref No</th>
                  <th>Customer Name</th>
                  <th style={{ width: "110px" }}>Customer ID</th>
                  <th>Itinerary / Service Details</th>
                  <th style={{ width: "70px", textAlign: "center" }}>Pax</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 fw-bold text-muted">
                      ⏳ Fetching upcoming schedules...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="empty-state">
                        <h5>No departures found for the selected criteria</h5>
                        <p className="mb-0">Try expanding your timeframe or clear filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const daysCount = Number(r.days_count);
                    let badgeClass = "days-yellow";
                    if (daysCount === 0) badgeClass = "days-red";
                    else if (daysCount <= 3) badgeClass = "days-orange";

                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>
                          <span className={`days-badge ${badgeClass}`}>
                            {daysCount === 0 ? "TODAY" : `${daysCount}d`}
                          </span>
                        </td>
                        <td className="fw-bold">{fmtDate(r.travel_date)}</td>
                        <td>
                          <span className="module-badge">{(r.module || "").toUpperCase()}</span>
                        </td>
                        <td>
                          <span className="service-badge">{r.service_type}</span>
                        </td>
                        <td className="fw-bold text-primary">{r.ref_no}</td>
                        <td className="fw-bold text-dark">{r.customer_name}</td>
<td className="text-muted fw-bold">
  {(!r.customer_id || r.customer_id === 'N/A' || r.customer_id.toUpperCase().includes('WALK')) 
    ? <span className="badge bg-secondary">Walk-in</span> 
    : r.customer_id}
</td>
                        <td style={{ fontSize: "12px", color: "#334155" }}>{r.details}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="pax-badge">{r.pax_count || 1}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}