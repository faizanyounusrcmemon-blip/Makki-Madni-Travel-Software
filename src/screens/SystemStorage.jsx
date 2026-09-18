import React, { useEffect, useState } from "react";

export default function SystemStorage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system/capacity-rows`
      );
      const d = await res.json();
      if (!d.success) setError(d.error || "Failed to load report");
      else setData(d);
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3.5px solid #cbd5e1",
              borderTopColor: "#1d4ed8",
              margin: "0 auto 12px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
            Loading system storage analytics...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fef2f2",
            border: "1.5px solid #fca5a5",
            padding: "20px 24px",
            borderRadius: "14px",
            color: "#991b1b",
            fontWeight: 800,
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)",
          }}
        >
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const usedPercent = Math.round((data.usedMB / data.dbLimitMB) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background:
          "radial-gradient(circle at 15% 10%, rgba(29, 78, 216, 0.08), transparent 30%), linear-gradient(135deg, #f1f5f9, #e2e8f0)",
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ss-card {
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .ss-row {
          transition: background .15s ease;
        }

        .ss-row:hover {
          background: #f1f5f9 !important;
        }

        .ss-btn {
          transition: transform .15s ease, background .15s ease;
        }

        .ss-btn:hover {
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* =================================================
            HEADER
        ================================================= */}
        <div
          className="ss-card"
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #0f172a, #1e3a8a, #1d4ed8)",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  fontSize: "22px",
                }}
              >
                💾
              </div>

              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "1.8px",
                    color: "#93c5fd",
                    marginBottom: "2px",
                  }}
                >
                  DATABASE CAPACITY & METRICS
                </div>

                <h1
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.4px",
                  }}
                >
                  System Storage Report
                </h1>

                <div
                  style={{
                    marginTop: "2px",
                    color: "#e0f2fe",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  Live storage monitoring, row analysis & capacity growth projections
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("dashboard")}
              className="ss-btn"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                padding: "9px 16px",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ⬅ Dashboard
            </button>
          </div>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          {/* TOTAL LIMIT */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#475569",
                  letterSpacing: "0.8px",
                  marginBottom: "4px",
                }}
              >
                TOTAL CAPACITY LIMIT
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                {data.dbLimitMB}{" "}
                <span style={{ fontSize: "14px", color: "#64748b" }}>MB</span>
              </div>
            </div>

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              📊
            </div>
          </div>

          {/* USED STORAGE */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #fde68a",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#b45309",
                  letterSpacing: "0.8px",
                  marginBottom: "4px",
                }}
              >
                USED STORAGE
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                {data.usedMB}{" "}
                <span style={{ fontSize: "14px", color: "#64748b" }}>MB</span>
              </div>
            </div>

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              ⚠️
            </div>
          </div>

          {/* FREE STORAGE */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #a7f3d0",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#047857",
                  letterSpacing: "0.8px",
                  marginBottom: "4px",
                }}
              >
                FREE STORAGE
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                {data.freeMB}{" "}
                <span style={{ fontSize: "14px", color: "#64748b" }}>MB</span>
              </div>
            </div>

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              ✅
            </div>
          </div>
        </div>

        {/* =================================================
            USAGE BAR & ROW METRICS
        ================================================= */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
              📊 Storage Capacity Utilization
            </div>
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {usedPercent}% CAPACITY USED
            </div>
          </div>

          <div
            style={{
              height: "24px",
              background: "#e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              padding: "3px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${usedPercent}%`,
                borderRadius: "9px",
                background:
                  usedPercent < 60
                    ? "linear-gradient(90deg, #16a34a, #22c55e)"
                    : usedPercent < 80
                    ? "linear-gradient(90deg, #d97706, #f59e0b)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 800,
                transition: "width 0.4s ease",
              }}
            >
              {usedPercent > 8 ? `${usedPercent}%` : ""}
            </div>
          </div>

          <div
            style={{
              margin: "20px 0 16px",
              borderTop: "1.5px solid #e2e8f0",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 800, letterSpacing: "0.5px" }}>
                TOTAL SYSTEM ROWS
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {data.totalRows.toLocaleString()}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 800, letterSpacing: "0.5px" }}>
                AVG ROW SIZE
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {data.avgRowKB} <span style={{ fontSize: "12px", color: "#64748b" }}>KB</span>
              </div>
            </div>

            <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <div style={{ fontSize: "10px", color: "#047857", fontWeight: 800, letterSpacing: "0.5px" }}>
                MORE ROWS POSSIBLE
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#065f46", marginTop: "2px" }}>
                {data.possibleMoreRows.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            MONTHLY PROJECTION CARD
        ================================================= */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderLeft: "6px solid #1d4ed8",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>
            📈 Monthly Growth & Capacity Projection
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "10px", color: "#475569", fontWeight: 800, display: "block" }}>
                DATA DURATION
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "4px", display: "block" }}>
                {data.totalMonths ?? 1} Months
              </span>
            </div>

            <div style={{ background: "#fefce8", padding: "12px", borderRadius: "12px", border: "1px solid #fef08a" }}>
              <span style={{ fontSize: "10px", color: "#854d0e", fontWeight: 800, display: "block" }}>
                AVG USAGE / MONTH
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#a16207", marginTop: "4px", display: "block" }}>
                {data.avgMBPerMonth ?? 0} MB/mo
              </span>
            </div>

            <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              <span style={{ fontSize: "10px", color: "#047857", fontWeight: 800, display: "block" }}>
                ESTIMATED MONTHS LEFT
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#065f46", marginTop: "4px", display: "block" }}>
                ~{data.remainingMonths ?? 0} Months
              </span>
            </div>

            <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
              <span style={{ fontSize: "10px", color: "#1e40af", fontWeight: 800, display: "block" }}>
                ESTIMATED STORAGE UNTIL
              </span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#1d4ed8", marginTop: "4px", display: "block", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                📅 {data.estimatedEndDate || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            TABLE-WISE ROW COUNT
        ================================================= */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "16px",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
              📋 Table-wise Row Breakdown
            </div>
            <div
              style={{
                background: "#e2e8f0",
                color: "#0f172a",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {data.tables.length} TABLES
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1" }}>
                  <th
                    style={{
                      padding: "10px 20px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    TABLE NAME
                  </th>
                  <th
                    className="text-end"
                    style={{
                      padding: "10px 20px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    TOTAL ROWS
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.tables.map((t, i) => (
                  <tr key={`${t.table}-${i}`} className="ss-row" style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 20px", color: "#0f172a", fontWeight: 700 }}>
                      <span
                        style={{
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          background: "#f1f5f9",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          color: "#1e293b",
                        }}
                      >
                        {t.table}
                      </span>
                    </td>
                    <td
                      className="text-end"
                      style={{
                        padding: "10px 20px",
                        color: "#0f172a",
                        fontWeight: 800,
                        fontSize: "13px",
                      }}
                    >
                      {Number(t.rows).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================
            CALCULATION LOGIC INFO
        ================================================= */}
        <div
          style={{
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            borderRadius: "14px",
            padding: "16px 20px",
            color: "#1e3a8a",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "12px", color: "#1e40af", marginBottom: "6px" }}>
            ℹ️ Calculation Logic & Guidance
          </div>
          <div style={{ fontSize: "11px", lineHeight: "1.6", fontWeight: 600, color: "#1e293b" }}>
            • <strong>Avg Monthly Growth:</strong> Used storage ÷ Active months count <br />
            • <strong>Remaining Months:</strong> Free storage ÷ Avg monthly growth rate <br />
            • <strong>Estimated End Date:</strong> Current date + Remaining estimated months <br />
            <div style={{ marginTop: "6px", fontWeight: 800, color: "#1d4ed8" }}>
              Note: This projection is dynamically calculated based on past database growth trends.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}