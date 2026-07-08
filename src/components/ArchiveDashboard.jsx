import React, { useEffect, useState } from "react";
import API from "../api"; 

export default function ArchiveDashboard() {
  const [liveStartDate, setLiveStartDate] = useState("Loading...");
  const [checkingTables, setCheckingTables] = useState(false);

  const targetTables = [
    "bookings", "hotels", "visa", "card", "ticketing", "transport", "ziyarat",
    "purchase_entries", "customer_payments", "supplier_payments", "expense_ledger",
    "bank_transactions", "cash_transactions"
  ];

  useEffect(() => {
    fetchLiveDatabaseStartDate();
  }, []);

  const formatCustomDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  const fetchLiveDatabaseStartDate = async () => {
    try {
      setCheckingTables(true);
      
      // Prefix fixed to align with express controller base config
      const res = await API.post("/api/archive/live-data-start", {
        tables: targetTables
      }).catch(async () => {
        return await API.get("/api/archive/live-data-start");
      });

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
      <div className="card mb-4 border-0 shadow-sm" style={{ background: "#222533", borderRadius: "12px", borderLeft: "6px solid #ffc107" }}>
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
                <span className="badge bg-dark fs-5 px-3 py-2 text-warning border border-warning" style={{ fontWeight: "bold" }}>
                  📅 {liveStartDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
