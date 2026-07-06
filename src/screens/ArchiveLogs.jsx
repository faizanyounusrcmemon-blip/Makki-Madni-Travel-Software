import React, { useEffect, useState } from "react";
import API from "../api"; // ✅ Fixed: Import central API instead of raw axios

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
      console.log("ArchiveLogs ID =", archiveId);
      setLoading(true);

      // ✅ Fixed route path structure mapping
      const res = await API.get(`/archive/logs/${archiveId}`);
      console.log("ArchiveLogs Response =", res.data);

      if (res.data.success) {
        setLog(res.data.log);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div 
          className="d-flex justify-content-between align-items-center mb-4"
          style={{
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            padding: "15px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
          }}
        >
          <h2 className="mb-0 fw-bold" style={{ color: "#fff", fontSize: "26px" }}>
            🗑 Archive Delete Log
          </h2>
          <button
            className="btn btn-light btn-sm fw-bold"
            onClick={() => onNavigate("archiveList")}
            style={{ borderRadius: "8px", padding: "8px 18px" }}
          >
            ← Back
          </button>
        </div>

        <div className="text-center mt-5">
          <div className="spinner-border text-danger" style={{ width: "50px", height: "50px" }}></div>
          <h5 className="mt-3 text-white">Loading Archive Log...</h5>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">No delete log found for this archive</div>
        <button className="btn btn-secondary" onClick={() => onNavigate("archiveList")}>
          ← Back
        </button>
      </div>
    );
  }

  const rows = [
    ["📘", "Bookings", log.bookings_count],
    ["🏨", "Hotels", log.hotels_count],
    ["🛂", "Visa", log.visa_count],
    ["💳", "Card", log.card_count],
    ["👨‍👩‍👧‍👦", "Groups", log.groups_count],
    ["🎫", "Ticketing", log.ticketing_count],
    ["🚐", "Transport", log.transport_count],
    ["🕌", "Ziyarat", log.ziyarat_count],
    ["👤", "Customer Payments", log.customer_payments_count],
    ["🏪", "Supplier Payments", log.supplier_payments_count],
    ["🛒", "Purchase Entries", log.purchase_entries_count]
  ];

  return (
    <div className="container-fluid p-4">
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          padding: "15px 20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
        }}
      >
        <h2 className="mb-0 fw-bold" style={{ color: "#fff", fontSize: "26px" }}>
          🗑 Archive Delete Log
        </h2>
        <button
          className="btn btn-light btn-sm fw-bold"
          onClick={() => onNavigate("archiveList")}
          style={{ borderRadius: "8px", padding: "8px 18px" }}
        >
          ← Back
        </button>
      </div>

      <div className="card shadow border-0">
        <div className="card-header bg-danger text-white">
          <h5 className="mb-0">Deleted Records Summary</h5>
        </div>

        <div className="card-body">
          <div className="row g-3">
            {rows.map((r, index) => (
              <div className="col-md-4 col-lg-3" key={index}>
                <div className="card shadow-sm h-100">
                  <div className="card-body text-center">
                    <div style={{ fontSize: "35px" }}>{r[0]}</div>
                    <h6 className="text-muted mt-2">{r[1]}</h6>
                    <h3 className="fw-bold mb-0 text-danger">{formatNumber(r[2])}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div className="alert alert-secondary border-0 mb-0">
            <b>🕒 Deleted At: </b>
            <span className="ms-2 fw-semibold">
              {new Date(log.deleted_at || log.archived_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
