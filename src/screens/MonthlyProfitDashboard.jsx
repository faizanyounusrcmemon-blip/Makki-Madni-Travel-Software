import React, { useEffect, useState } from "react";

const fmt = (v) => Math.round(v || 0).toLocaleString("en-US");

export default function MonthlyProfitDashboard({ onNavigate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState([]);

  const loadData = async (y = year) => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/monthly-profit-report?year=${y}`
      );

      const d = await r.json();

      if (d.success) {
        setMonths(d.months || []);
      } else {
        alert(d.error || "Failed to load");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading report");
    }
  };

  useEffect(() => {
    loadData(year);
  }, []);

  return (
    <div className="monthly-wrap">
      <div className="container py-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-white mb-0">
              📅 Monthly Profit Dashboard
            </h3>
            <small className="text-white-50">
              Full year monthly business report
            </small>
          </div>

          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>

        {/* YEAR FILTER */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-2 align-items-end">

              <div className="col-md-3">
                <label className="form-label text-white">
                  Year
                </label>

                <input
                  className="form-control"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <button
                  className="btn btn-warning w-100 fw-bold"
                  onClick={() => loadData(year)}
                >
                  Refresh
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* MONTH CARDS */}
        <div className="row g-4">



          {months.map((m, i) => (
            <div className="col-xl-3 col-lg-4 col-md-6" key={i}>

              <div className="month-card">

                <div className="month-head">
                  {m.month_name}
                </div>

                <div className="month-body">

                  <div className="line">
                    <span>Total Sales</span>
                    <b className="text-info">
                      {fmt(m.total_sales)}
                    </b>
                  </div>

                  <div className="line">
                    <span>Purchase</span>
                    <b className="text-primary">
                      {fmt(m.total_purchase)}
                    </b>
                  </div>

                  <div className="line">
                    <span>Base Profit</span>
                    <b className="text-success">
                      {fmt(m.base_profit)}
                    </b>
                  </div>

                  <div className="line">
                    <span>Supplier Adj</span>
                    <b className="text-warning">
                      {fmt(m.supplier_adjustment)}
                    </b>
                  </div>

                  <div className="line">
                    <span>Customer Adj</span>
                    <b className="text-danger">
                      {fmt(m.customer_adjustment)}
                    </b>
                  </div>

                  <div className="line">
                    <span>Expense</span>
                    <b className="text-danger">
                      {fmt(m.total_expense)}
                    </b>
                  </div>

                  <hr />

                  <div className="net-box">
                    <small>NET PROFIT</small>
                    <h4>
                      PKR {fmt(m.net_profit)}
                    </h4>
                  </div>

                </div>
              </div>

            </div>
          ))}

        </div>
      </div>

/* ================= YEAR SUMMARY CARD ================= */
<div className="col-12">
  <div className="year-summary-card">

    <div className="year-title">
      📊 FULL YEAR SUMMARY
    </div>

    <div className="row g-3 p-3">

      <div className="col-md-2">
        <div className="sum-box">
          <span>Total Sales</span>
          <h5 className="text-info">
            {fmt(
              months.reduce((a, b) => a + Number(b.total_sales || 0), 0)
            )}
          </h5>
        </div>
      </div>

      <div className="col-md-2">
        <div className="sum-box">
          <span>Purchase</span>
          <h5 className="text-primary">
            {fmt(
              months.reduce((a, b) => a + Number(b.total_purchase || 0), 0)
            )}
          </h5>
        </div>
      </div>

      <div className="col-md-2">
        <div className="sum-box">
          <span>Base Profit</span>
          <h5 className="text-success">
            {fmt(
              months.reduce((a, b) => a + Number(b.base_profit || 0), 0)
            )}
          </h5>
        </div>
      </div>

      <div className="col-md-2">
        <div className="sum-box">
          <span>Supplier Adj</span>
          <h5 className="text-warning">
            {fmt(
              months.reduce((a, b) => a + Number(b.supplier_adjustment || 0), 0)
            )}
          </h5>
        </div>
      </div>

      <div className="col-md-2">
        <div className="sum-box">
          <span>Customer Adj</span>
          <h5 className="text-danger">
            {fmt(
              months.reduce((a, b) => a + Number(b.customer_adjustment || 0), 0)
            )}
          </h5>
        </div>
      </div>

      <div className="col-md-2">
        <div className="sum-box">
          <span>Expense</span>
          <h5 className="text-danger">
            {fmt(
              months.reduce((a, b) => a + Number(b.total_expense || 0), 0)
            )}
          </h5>
        </div>
      </div>

    </div>

    <div className="year-profit-box">
      <small>🌟 FULL YEAR NET PROFIT</small>

      <h2>
        PKR {fmt(
          months.reduce((a, b) => a + Number(b.net_profit || 0), 0)
        )}
      </h2>
    </div>

  </div>
</div>


      {/* CSS */}
      <style>{`
        .monthly-wrap{
          min-height:100vh;
          background:linear-gradient(135deg,#141e30,#243b55);
        }

        .glass-card{
          background:rgba(255,255,255,0.12);
          backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.15);
          border-radius:18px;
        }

        .month-card{
          border-radius:22px;
          overflow:hidden;
          background:rgba(255,255,255,0.1);
          backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,0.15);
          box-shadow:0 15px 35px rgba(0,0,0,0.25);
          transition:0.3s;
          height:100%;
        }

        .month-card:hover{
          transform:translateY(-6px);
        }

        .month-head{
          padding:14px;
          text-align:center;
          font-size:20px;
          font-weight:800;
          color:white;
          background:linear-gradient(135deg,#ff9966,#ff5e62);
        }

        .month-body{
          padding:18px;
          color:white;
        }

        .line{
          display:flex;
          justify-content:space-between;
          margin-bottom:10px;
          font-size:14px;
        }

        .net-box{
          text-align:center;
          margin-top:15px;
          padding:14px;
          border-radius:16px;
          background:linear-gradient(135deg,#f7971e,#ffd200);
          color:#000;
        }

        .net-box h4{
          font-weight:900;
          margin-top:5px;
        }
      `}</style>
    </div>
  );
}