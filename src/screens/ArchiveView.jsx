import React, { useEffect, useState } from "react";
import API from "../api"; 
import Swal from "sweetalert2";

export default function ArchiveView({ id, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Agar id hi undefined ya null ho to foran loading band karein aur alert dein
    if (!id) {
      console.error("ArchiveView Error: received id is undefined or null");
      Swal.fire("Error", "Invalid Snapshot ID provided", "error");
      setLoading(false);
      return;
    }
    fetchViewData();
  }, [id]);

  const fetchViewData = async () => {
    try {
      setLoading(true);
      // Backend router ke mutabik direct view controller execution link
      const res = await API.get(`/view/${id}`); 
      
      if (res.data.success) {
        setData(res.data);
      } else {
        Swal.fire("Error", res.data.error || "Failed to load archive details", "error");
      }
    } catch (err) {
      console.error("Error fetching archive view:", err);
      Swal.fire("Error", "Server error while fetching data or route not found", "error");
    } finally {
      // Yeh block har haal me chalega taaki endless loading spinner ruk jaye
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="text-center p-5" style={{ color: "#fff" }}>
        <div className="spinner-border text-primary mb-2"></div>
        <p>Loading Archive Details...</p>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div className="container p-4 text-center" style={{ color: "#fff" }}>
        <h3>No Data Found</h3>
        <p className="text-muted">Requested data structure is empty or route broken.</p>
        <button className="btn btn-warning mt-3" onClick={onBack}>← Back</button>
      </div>
    );
  }

  const { snapshot, customers, suppliers, profit } = data;

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#1a1d29", minHeight: "100vh", color: "#fff" }}>
      
      {/* HEADER BAR */}
      <div className="card mb-4 border-0 shadow" style={{ background: "linear-gradient(90deg, #111827, #1f2937)", borderRadius: "15px" }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1 fw-bold text-warning">🔍 INSPECTING SNAPSHOT #{snapshot.id}</h2>
            <p className="mb-0 text-white-50 small">
              Timeline Range: <b>{formatDate(snapshot.date_from)}</b> to <b>{formatDate(snapshot.date_to)}</b>
            </p>
          </div>
          <button onClick={onBack} className="btn btn-danger fw-bold px-4 rounded-pill">
            ← CLOSE INSPECTION
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Opening Cash balance</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.opening_cash)} PKR</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Opening Bank balance</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.opening_bank)} PKR</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #7e3af2, #a855f7)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Total Merged Profit Block</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.total_profit || snapshot.opening_profit)} PKR</h2>
          </div>
        </div>
      </div>

      {/* CUSTOMERS & SUPPLIERS DATA ENGINE */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 p-3 shadow" style={{ backgroundColor: "#212534", borderRadius: "15px" }}>
            <h5 className="fw-bold text-info border-bottom border-secondary pb-2 mb-3">👤 CUSTOMER BALANCES LOG ({customers?.length || 0})</h5>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {customers?.length === 0 ? <p className="text-muted text-center py-3">No customers found.</p> : 
                customers?.map((c, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded shadow-sm" style={{ backgroundColor: "#1a1d29", borderLeft: "4px solid #06b6d4" }}>
                    <div><span className="fw-bold d-block text-white">{c.name || c.customer_name}</span></div>
                    <span className="badge bg-dark text-info border border-secondary">{formatNumber(c.balance)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 p-3 shadow" style={{ backgroundColor: "#212534", borderRadius: "15px" }}>
            <h5 className="fw-bold text-danger border-bottom border-secondary pb-2 mb-3">🏢 SUPPLIER BALANCES LOG ({suppliers?.length || 0})</h5>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {suppliers?.length === 0 ? <p className="text-muted text-center py-3">No suppliers found.</p> : 
                suppliers?.map((s, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded shadow-sm" style={{ backgroundColor: "#1a1d29", borderLeft: "4px solid #f43f5e" }}>
                    <div><span className="fw-bold d-block text-white">{s.name || s.supplier_name}</span></div>
                    <span className="badge bg-dark text-danger border border-secondary">{formatNumber(s.balance)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
