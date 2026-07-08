import React, { useEffect, useState } from "react";
import API from "../api"; 

export default function ArchiveDashboard() {
  const [liveStartDate, setLiveStartDate] = useState("Loading...");
  const [checkingTables, setCheckingTables] = useState(false);

  const targetTables = [
    "bookings", "hotels", "visa", "card", "ticketing", "transport", "ziyarat", "groups",
    "purchase_entries", "customer_payments", "supplier_payments", "expense_ledger",
    "bank_transactions", "cash_transactions"
  ];

  useEffect(() => {
    fetchLiveDatabaseStartDate();
  }, []);

  const formatCustomDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const fetchLiveDatabaseStartDate = async () => {
    try {
      setCheckingTables(true);
      // ✅ Fixed: POST ki jagah GET use kiya kyunki backend par router.get hai
      const res = await API.get("/archive/live-data-start");

      if (res.data.success && res.data.first_date) {
        setLiveStartDate(formatCustomDate(res.data.first_date));
      } else {
        setLiveStartDate("No Data Found");
      }
    } catch (err) {
      console.error("Error fetching live start date:", err);
      setLiveStartDate("Error Loading");
    } finally {
      setCheckingTables(false);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ color: "#fff" }}>
      <div 
        className="card mb-4 border-0 shadow-sm" 
        style={{ 
          background: "#222533", 
          borderRadius: "12px", 
          borderLeft: "6px solid #ffc107",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}
      >
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-auto fs-1">📊</div>
            
            <div className="col">
              <h6 className="text-uppercase mb-2 fw-bold" style={{ fontSize: "12px", color: "#ffc107", letterSpacing: "1px" }}>
                Supabase Live Database Connection {checkingTables && "⏳ (Scanning...)"}
              </h6>
              
              <div className="d-flex align-items-center flex-wrap gap-2 mt-1">
                <span className="text-white fw-semibold" style={{ fontSize: "16px" }}>
                  Aapke live database me transactions is date se shuru ho rahi hain:
                </span>
                <span 
                  className="badge bg-dark fs-5 px-3 py-2 text-warning border border-warning"
                  style={{ letterSpacing: "0.5px", fontWeight: "bold" }}
                >
                  📅 {liveStartDate}
                </span>
              </div>
              
              <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
                <small className="text-info fw-bold me-1" style={{ fontSize: "12px" }}>Checked Tables:</small>
                {targetTables.map((tbl) => (
                  <span 
                    key={tbl} 
                    className="badge bg-dark text-white border border-secondary" 
                    style={{ fontSize: "11px", padding: "5px 10px", backgroundColor: "#1a1d29" }}
                  >
                    {tbl}
                  </span>
                ))}
              </div>
            </div>
            
            <div 
              className="col-md-4 text-warning bg-dark p-3 rounded border border-warning small mt-2 mt-md-0"
              style={{ fontWeight: "6px", fontStyle: "italic", lineHeight: "1.4", backgroundColor: "#1a1d29" }}
            >
              💡 <strong style={{ color: "#fff" }}>Important Tip:</strong> Snapshot create karte waqt <span style={{ color: "#00f2fe", fontWeight: "bold" }}>"START DATE"</span> yahan se dekh kar set karein.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
