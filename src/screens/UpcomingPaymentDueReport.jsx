import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${day}/${mon}/${d.getFullYear()}`;
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  });

const calcDaysLeft = (travelDate) => {
  if (!travelDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(travelDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function UpcomingPaymentDueReport({ onNavigate }) {
  const [days, setDays] = useState("7");
  const [customDays, setCustomDays] = useState("14");
  const [type, setType] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const selectedDays =
    days === "custom" ? Math.max(0, Number(customDays) || 0) : Number(days);

  const loadData = async () => {
    try {
      setLoading(true);
      const baseURL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
      const url = `${baseURL}/api/reports/upcoming-payment-due?days=${encodeURIComponent(selectedDays)}&type=${encodeURIComponent(type)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || data.message || "Unable to load report");
      }

      const rawRows = data.rows || data.data || [];
      const normalizedRows = rawRows.map((r) => {
        const dLeft = calcDaysLeft(r.travel_date);
        const totalSale = Number(r.total_sale ?? r.sale_amount ?? 0);
        const paidAmount = Number(r.paid_amount ?? r.total_paid ?? 0);
        const balanceAmount = Number(r.balance_amount ?? r.balance_due ?? (totalSale - paidAmount));
        const custType = r.customer_type || (r.type === 'Registered' || r.customer_id?.startsWith('CUST-') ? 'REGISTERED' : 'WALK-IN');

        return {
          ...r,
          days_left: dLeft,
          customer_code: r.customer_code || r.customer_id || "N/A",
          customer_type: custType,
          total_sale: totalSale,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          service_breakup: r.service_breakup || r.modules || "General Services"
        };
      });

      setRows(normalizedRows);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Report Error",
        text: err.message || "Could not retrieve records.",
        width: "340px",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      [r.ref_no, r.customer_name, r.customer_code, r.customer_type, r.service_breakup]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    let u02 = 0;
    let n37 = 0;
    let reg = 0;
    let walk = 0;
    let totalDue = 0;

    filtered.forEach((r) => {
      if (r.days_left !== null && r.days_left >= 0 && r.days_left <= 2) u02++;
      if (r.days_left !== null && r.days_left >= 3 && r.days_left <= 7) n37++;
      if (r.customer_type === "REGISTERED") reg++;
      else walk++;
      totalDue += Number(r.balance_amount || 0);
    });

    return {
      urgent_0_2: u02,
      next_3_7: n37,
      registered: reg,
      walkin: walk,
      total_due: totalDue,
    };
  }, [filtered]);

  // Popup Modal for References
  const showRefModal = (customerName, refStr) => {
    const refs = (refStr || "")
      .replace(/\.\.\.$/, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const refPillsHtml = refs
      .map(
        (ref) =>
          `<span style="display:inline-block; margin:4px; padding:6px 12px; background:#e6f0ff; color:#0757b8; font-weight:bold; border-radius:6px; font-size:13px; border:1px solid #b8d5ff;">${ref}</span>`
      )
      .join("");

    Swal.fire({
      title: `<strong>Booking References</strong>`,
      html: `
        <div style="text-align:left; font-size:14px; margin-bottom:12px;">
          <strong>Customer:</strong> ${customerName}
        </div>
        <div style="max-height:250px; overflow-y:auto; padding:8px; border:1px solid #eee; border-radius:8px; background:#f9fbfd;">
          ${refPillsHtml || "No reference numbers found."}
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#0d6efd",
      width: "450px",
    });
  };

  const renderRefCell = (row) => {
    const rawRef = row.ref_no || "N/A";
    const refs = rawRef
      .replace(/\.\.\.$/, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (refs.length <= 3) {
      return <span className="fw-bold text-primary">{refs.join(", ")}</span>;
    }

    const visibleRefs = refs.slice(0, 2).join(", ");
    const extraCount = refs.length - 2;

    return (
      <div>
        <span className="fw-bold text-primary">{visibleRefs}</span>
        <button
          className="btn btn-link btn-sm p-0 ms-1 fw-bold text-decoration-none"
          onClick={() => showRefModal(row.customer_name, rawRef)}
          style={{ fontSize: "11px", color: "#0d6efd" }}
          title="Click to view all reference numbers"
        >
          +{extraCount} more 🔍
        </button>
      </div>
    );
  };

  const exportCSV = () => {
    if (!filtered.length) {
      Swal.fire({ icon: "info", title: "No Records", text: "There is nothing to export.", width: "300px" });
      return;
    }
    const headers = ["Days Left", "Travel Date", "Ref No", "Customer", "Customer Code", "Customer Type", "Services / Module Breakdown", "Total Sale", "Paid", "Balance Due"];
    const csvRows = filtered.map(r => [
      r.days_left === null ? "N/A" : (r.days_left < 0 ? `${r.days_left}d` : (r.days_left === 0 ? "TODAY" : `${r.days_left}d`)),
      fmtDate(r.travel_date),
      r.ref_no,
      r.customer_name,
      r.customer_code,
      r.customer_type,
      r.service_breakup,
      r.total_sale,
      r.paid_amount,
      r.balance_amount
    ]);
    const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Upcoming_Payment_Due_${selectedDays}_Days.csv`;
    a.click();
  };

  return (
    <div className="upcoming-report-page">
      <style>{`
        .upcoming-report-page {
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
        .upcoming-hero:after {
          content: ""; position: absolute; width: 230px; height: 230px; border-radius: 50%;
          right: -65px; top: -90px; border: 35px solid rgba(255,255,255,.10);
        }
        .upcoming-hero h2 { margin: 0; font-weight: 800; letter-spacing: .3px; }
        .upcoming-hero p { margin: 6px 0 0; opacity: .9; }
        .filter-card {
          margin-top: 16px; background: rgba(255,255,255,.94);
          border: 1px solid #dbe7f5; border-radius: 18px; padding: 16px;
          box-shadow: 0 8px 24px rgba(30,65,100,.10);
        }
        .filter-label { font-size: 11px; font-weight: 800; color: #52647a; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .filter-card .form-select, .filter-card .form-control { border-radius: 10px; min-height: 40px; }
        .preset-btn { border-radius: 10px !important; font-weight: 700; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 16px 0; }
        .summary-card { background: #fff; border-radius: 16px; padding: 14px 16px; border: 1px solid #e2eaf3; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .summary-card .label { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; }
        .summary-card .value { font-size: 23px; font-weight: 900; color: #102a43; margin-top: 4px; }
        .summary-card.urgent { border-left: 5px solid #dc3545; }
        .summary-card.attention { border-left: 5px solid #f0ad4e; }
        .summary-card.registered { border-left: 5px solid #0d6efd; }
        .summary-card.walkin { border-left: 5px solid #20c997; }
        .summary-card.balance { border-left: 5px solid #d4a72c; }
        .table-card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #dfe8f2; box-shadow: 0 10px 28px rgba(30,65,100,.10); }
        .table-head { padding: 13px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid #e8eef5; }
        .table-head strong { color: #123456; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-table th { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 11px 9px; white-space: nowrap; }
        .report-table td { padding: 10px 9px; border-bottom: 1px solid #edf1f5; vertical-align: middle; }
        .report-table tbody tr:hover { background: #f8fbff; }
        .days-badge { display: inline-flex; min-width: 45px; justify-content: center; padding: 5px 8px; border-radius: 999px; font-weight: 900; font-size: 11px; }
        .days-red { background: #ffe1e4; color: #b4232f; }
        .days-orange { background: #fff0d8; color: #a15c00; }
        .days-yellow { background: #fff8c9; color: #856404; }
        .days-past { background: #fce8e6; color: #c5221f; font-weight: 800; }
        .customer-badge { padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 900; }
        .registered-badge { background: #e6f0ff; color: #0757b8; }
        .walkin-badge { background: #e5fbf4; color: #087f5b; }
        .balance-cell { font-weight: 900; color: #b4232f; font-size: 14px; }
        .ref-cell { max-width: 180px; word-break: break-word; line-height: 1.4; }
        .empty-state { padding: 55px 20px; text-align: center; color: #64748b; }
        @media(max-width:1100px) { .summary-grid { grid-template-columns: repeat(3,1fr); } .report-table { min-width: 1200px; } .table-wrap { overflow: auto; } }
        @media(max-width:700px) { .upcoming-report-page { padding: 12px; } .summary-grid { grid-template-columns: repeat(2,1fr); } .upcoming-hero h2 { font-size: 20px; } .table-head { align-items: stretch; flex-direction: column; } }
        @media print { .upcoming-report-page { padding: 0; background: #fff; } .upcoming-hero { box-shadow: none; color: #000; background: #fff; border: 2px solid #123456; } .filter-card, .no-print { display: none !important; } .summary-grid { margin: 10px 0; } .table-card { box-shadow: none; } .report-table { font-size: 10px; } .report-table th { background: #123456 !important; color: #fff !important; } }
      `}</style>

      <div className="upcoming-shell">
        <div className="upcoming-hero">
          <h2>⏰ Upcoming Travel & Payment Due Report</h2>
          <p>
            Customer due balances synchronized with upcoming travel and active ledgers.
          </p>
        </div>

        <div className="filter-card no-print">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Timeframe (Days)</div>
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
                <div className="filter-label">Custom Days</div>
                <input
                  type="number"
                  min="0"
                  max="3650"
                  className="form-control"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              </div>
            )}

            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Booking Type</div>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ALL">All Modules</option>
                <option value="PACKAGE">Packages</option>
                <option value="HOTEL">Hotels</option>
                <option value="TICKETING">Ticketing</option>
                <option value="GROUP">Groups</option>
                <option value="TRANSPORT">Transport</option>
                <option value="ZIYARAT">Ziyarat</option>
                <option value="VISA">Visa</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="filter-label">Search Customer / Ref No</div>
              <input
                className="form-control"
                placeholder="Search by customer, ref_no, services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-lg-1 col-md-12 d-grid">
              <button className="btn btn-primary preset-btn" onClick={loadData} disabled={loading}>
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card urgent">
            <div className="label">Urgent · 0–2 Days</div>
            <div className="value">{summary.urgent_0_2 || 0}</div>
          </div>
          <div className="summary-card attention">
            <div className="label">3–7 Days</div>
            <div className="value">{summary.next_3_7 || 0}</div>
          </div>
          <div className="summary-card registered">
            <div className="label">Registered</div>
            <div className="value">{summary.registered || 0}</div>
          </div>
          <div className="summary-card walkin">
            <div className="label">Walk-in</div>
            <div className="value">{summary.walkin || 0}</div>
          </div>
          <div className="summary-card balance">
            <div className="label">Total Balance Due</div>
            <div className="value">PKR {money(summary.total_due)}</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-head no-print">
            <div>
              <strong>
                📋 {filtered.length} Pending Customer Record{filtered.length === 1 ? "" : "s"}
              </strong>
              <div className="text-muted small">
                Showing upcoming bookings within {selectedDays} day{selectedDays === 1 ? "" : "s"} & active pending balances
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-success btn-sm fw-bold" onClick={exportCSV}>
                📥 CSV
              </button>
              <button className="btn btn-dark btn-sm fw-bold" onClick={() => window.print()}>
                🖨 Print
              </button>
              {onNavigate && (
                <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={() => onNavigate("dashboard")}>
                  ↩ Back
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner-border text-primary mb-3" role="status" />
              <div>Loading payment due records...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>🎉</div>
              <h5 className="mt-2">No Pending Payments Found</h5>
              <div>Selected timeframe mein koi pending balance nahi mila.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: "90px" }} className="text-center">Days Left</th>
                    <th style={{ width: "110px" }}>Travel Date</th>
                    <th>Ref No</th>
                    <th>Customer Details</th>
                    <th>Services / Module Breakup</th>
                    <th className="text-end">Total Sale</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const d = r.days_left;
                    let cls = "days-yellow";
                    if (d === null) cls = "days-past";
                    else if (d < 0) cls = "days-past";
                    else if (d <= 2) cls = "days-red";
                    else if (d <= 5) cls = "days-orange";

                    const dayText = d === null ? "N/A" : (d < 0 ? `${d}d` : (d === 0 ? "TODAY" : `${d}d`));

                    return (
                      <tr key={idx}>
                        <td className="text-center">
                          <span className={`days-badge ${cls}`}>{dayText}</span>
                        </td>
                        <td>
                          <strong>{fmtDate(r.travel_date)}</strong>
                        </td>
                        <td className="ref-cell">
                          {renderRefCell(r)}
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{r.customer_name || "-"}</div>
                          <div>
                            {r.customer_type === 'REGISTERED' ? (
                              <span className="customer-badge registered-badge">{r.customer_code}</span>
                            ) : (
                              <span className="customer-badge walkin-badge">WALK-IN</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: "11px" }}>
                            🛠️ {r.service_breakup}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">PKR {money(r.total_sale)}</td>
                        <td className="text-end text-success fw-semibold">PKR {money(r.paid_amount)}</td>
                        <td className="text-end balance-cell">PKR {money(r.balance_amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}