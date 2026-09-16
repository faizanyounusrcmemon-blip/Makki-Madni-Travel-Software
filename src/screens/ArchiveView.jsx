import React, { useEffect, useState } from "react";
import API from "../api";

export default function ArchiveView({ archiveId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Search States
  const [bankSearch, setBankSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  useEffect(() => {
    if (archiveId) {
      load();
    } else {
      setLoading(false);
    }
  }, [archiveId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/archive/view/${archiveId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error loading archive view detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmtPKR = (v) => Number(v || 0).toLocaleString("en-PK");

  const filteredBanks = (data?.banks || []).filter((b) => {
    const term = bankSearch.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(term) ||
      String(b.bank_profile_id || b.code || "").toLowerCase().includes(term)
    );
  });

  const filteredCustomers = (data?.customers || []).filter((c) => {
    const term = customerSearch.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      String(c.customer_code || c.code || "").toLowerCase().includes(term)
    );
  });

  const filteredSuppliers = (data?.suppliers || []).filter((s) => {
    const term = supplierSearch.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(term) ||
      String(s.supplier_code || s.code || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading Snapshot Details...</p>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
        <div className="alert alert-warning border-0 shadow-sm rounded-4">No Snapshot Data Found</div>
        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => onNavigate("archiveList")}>
          ← Back
        </button>
      </div>
    );
  }

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
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🔍</span>
              <h3 className="fw-bold mb-0">Inspect Snapshot #{archiveId}</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">Detailed balances and profit metrics captured at archive time.</p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
            onClick={() => onNavigate("archiveList")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="text-muted small fw-semibold">OPENING CASH</div>
            <div className="h4 fw-bold text-success mb-0">PKR {fmtPKR(data.snapshot.opening_cash)}</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="text-muted small fw-semibold">OPENING BANK</div>
            <div className="h4 fw-bold text-primary mb-0">PKR {fmtPKR(data.snapshot.opening_bank)}</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="text-muted small fw-semibold">TOTAL PROFIT</div>
            <div className="h4 fw-bold text-warning mb-0">PKR {fmtPKR(data.snapshot.total_profit || data.snapshot.opening_profit)}</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="text-muted small fw-semibold">RECEIVABLES</div>
            <div className="h4 fw-bold text-info mb-0">PKR {fmtPKR(data.snapshot.total_customer_receivable)}</div>
          </div>
        </div>
      </div>

      {/* BANKS TABLE */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="card-header bg-white border-0 p-3 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0 text-dark">🏦 Bank Accounts ({filteredBanks.length})</h6>
          <input
            type="text"
            className="form-control border-light-subtle bg-light shadow-none"
            style={{ fontSize: "12px", width: "180px", borderRadius: "8px" }}
            placeholder="Search bank..."
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary">
              <tr>
                <th className="py-2 px-3">SR#</th>
                <th className="py-2">Code / Bank ID</th>
                <th className="py-2">Bank Name</th>
                <th className="py-2 text-end px-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((b, i) => (
                <tr key={b.id || i}>
                  <td className="px-3 text-muted fw-bold">{i + 1}</td>
                  <td className="fw-bold text-primary">{b.bank_profile_id || b.code || "N/A"}</td>
                  <td>{b.name}</td>
                  <td className="text-end fw-bold text-primary px-3">PKR {fmtPKR(b.balance)}</td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted">No bank records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMERS & SUPPLIERS TABLES */}
      <div className="row g-3 mb-4">
        {/* CUSTOMERS */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
            <div className="card-header bg-white border-0 p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark">👥 Customers ({filteredCustomers.length})</h6>
              <input
                type="text"
                className="form-control border-light-subtle bg-light shadow-none"
                style={{ fontSize: "12px", width: "160px", borderRadius: "8px" }}
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="table-responsive" style={{ maxHeight: "350px" }}>
              <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light text-secondary">
                  <tr>
                    <th className="py-2 px-3">SR#</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Name</th>
                    <th className="py-2 text-end px-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, i) => (
                    <tr key={c.id || i}>
                      <td className="px-3 text-muted fw-bold">{i + 1}</td>
                      <td className="fw-bold text-success">{c.customer_code || c.code || "N/A"}</td>
                      <td>{c.name}</td>
                      <td className="text-end fw-bold text-dark px-3">PKR {fmtPKR(c.balance)}</td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">No customer records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SUPPLIERS */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
            <div className="card-header bg-white border-0 p-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark">🏢 Suppliers ({filteredSuppliers.length})</h6>
              <input
                type="text"
                className="form-control border-light-subtle bg-light shadow-none"
                style={{ fontSize: "12px", width: "160px", borderRadius: "8px" }}
                placeholder="Search supplier..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
            <div className="table-responsive" style={{ maxHeight: "350px" }}>
              <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light text-secondary">
                  <tr>
                    <th className="py-2 px-3">SR#</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Name</th>
                    <th className="py-2 text-end px-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((s, i) => (
                    <tr key={s.id || i}>
                      <td className="px-3 text-muted fw-bold">{i + 1}</td>
                      <td className="fw-bold text-warning">{s.supplier_code || s.code || "N/A"}</td>
                      <td>{s.name}</td>
                      <td className="text-end fw-bold text-dark px-3">PKR {fmtPKR(s.balance)}</td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">No supplier records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY PROFIT BREAKDOWN */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="card-header bg-white border-0 p-3">
          <h6 className="fw-bold mb-0 text-dark">📊 Monthly Profit Breakdown</h6>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary">
              <tr>
                <th className="py-2 px-3">SR#</th>
                <th className="py-2">Month / Year</th>
                <th className="py-2 text-end">Total Sales</th>
                <th className="py-2 text-end">Total Purchase</th>
                <th className="py-2 text-end px-3">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {(data.profit || []).map((p, i) => (
                <tr key={p.id || i}>
                  <td className="px-3 text-muted fw-bold">{i + 1}</td>
                  <td className="fw-bold">{p.report_month}/{p.report_year}</td>
                  <td className="text-end text-success fw-semibold">PKR {fmtPKR(p.total_sales)}</td>
                  <td className="text-end text-danger fw-semibold">PKR {fmtPKR(p.total_purchase)}</td>
                  <td className="text-end px-3">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold">
                      PKR {fmtPKR(p.net_profit)}
                    </span>
                  </td>
                </tr>
              ))}
              {(data.profit || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">No profit breakdown saved in snapshot.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}