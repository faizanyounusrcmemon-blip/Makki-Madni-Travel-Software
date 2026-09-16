import React, { useEffect, useState } from "react";
import API from "../api";

export default function ArchiveLogs({ archiveId, onNavigate }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (archiveId) {
      load();
    }
  }, [archiveId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/archive/logs/${archiveId}`);
      if (res.data.success) {
        setLog(res.data.log);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmtPKR = (num) => Number(num || 0).toLocaleString("en-PK");

  if (loading) {
    return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading Archive Logs...</p>
      </div>
    );
  }

  if (!log) {
    return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
        <div className="alert alert-warning border-0 shadow-sm rounded-4">No delete log found for this archive.</div>
        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => onNavigate("archiveList")}>
          ← Back to Archives
        </button>
      </div>
    );
  }

  const rows = [
    ["📦", "Bookings", log.bookings_count],
    ["🏨", "Hotels", log.hotels_count],
    ["🛂", "Visa", log.visa_count],
    ["💳", "Card", log.card_count],
    ["👥", "Groups", log.groups_count],
    ["✈️", "Ticketing", log.ticketing_count],
    ["🚐", "Transport", log.transport_count],
    ["🕌", "Ziyarat", log.ziyarat_count],
    ["👤", "Customer Payments", log.customer_payments_count],
    ["🏪", "Supplier Payments", log.supplier_payments_count],
    ["🛒", "Purchase Entries", log.purchase_entries_count]
  ];

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* HEADER BANNER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🗑️</span>
              <h3 className="fw-bold mb-0">Archive Delete Log</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Deletion timestamp: <strong>{new Date(log.deleted_at || log.archived_at).toLocaleString("en-GB")}</strong>
            </p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
            onClick={() => onNavigate("archiveList")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* SUMMARY GRID CARDS */}
      <div className="row g-3 mb-4">
        {rows.map((r, index) => (
          <div className="col-md-4 col-lg-3" key={index}>
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small fw-semibold">{r[1]}</div>
                  <div className="h4 fw-bold text-danger mb-0">{fmtPKR(r[2])}</div>
                </div>
                <div className="fs-2">{r[0]}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}