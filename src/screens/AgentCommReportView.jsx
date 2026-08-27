import React, { useEffect, useMemo, useState } from "react";

export default function AgentCommReportView({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/bookings/list`
      );

      const data = await res.json();

      const commissionRows = Array.isArray(data)
        ? data.filter((r) => {
            const total = Number(
              r.agent_comm_total || r.agent_commission_pkr || 0
            );

            return (
              total > 0 ||
              (Array.isArray(r.agent_comm) && r.agent_comm.length > 0)
            );
          })
        : [];

      setRows(commissionRows);
    } catch (err) {
      console.error("Agent commission load error:", err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= DATE PRESETS ================= */
  const setToday = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFromDate(t);
    setToDate(t);
  };

  const setWeek = () => {
    const now = new Date();
    const day = now.getDay();

    const first = new Date(now);
    first.setDate(now.getDate() - day);

    const last = new Date(first);
    last.setDate(first.getDate() + 6);

    setFromDate(first.toISOString().slice(0, 10));
    setToDate(last.toISOString().slice(0, 10));
  };

  const setMonth = () => {
    const now = new Date();

    const first = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const last = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );

    setFromDate(first.toISOString().slice(0, 10));
    setToDate(last.toISOString().slice(0, 10));
  };

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  /* ================= HELPERS ================= */

  const fmtPKR = (v) =>
    Number(v || 0).toLocaleString("en-PK", {
      maximumFractionDigits: 0,
    });

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getCommission = (r) => {
    let total = Number(
      r.agent_comm_total || r.agent_commission_pkr || 0
    );

    if (!total && Array.isArray(r.agent_comm)) {
      total = r.agent_comm.reduce(
        (sum, a) =>
          sum +
          Number(
            a.total ||
              Number(a.persons || 0) * Number(a.rate || 0)
          ),
        0
      );
    }

    return Number.isFinite(total) ? total : 0;
  };

  const getPersons = (r) => {
    if (Array.isArray(r.agent_comm) && r.agent_comm.length) {
      return r.agent_comm.reduce(
        (sum, a) => sum + Number(a.persons || 0),
        0
      );
    }

    return Number(r.adult_count || 0);
  };

  const getAgent = (r) => {
    if (Array.isArray(r.agent_comm) && r.agent_comm.length) {
      return r.agent_comm
        .map((a) => a.type || "Commission")
        .join(", ");
    }

    return r.agent_name || "Agent Commission";
  };

  /* ================= PER PERSON AMOUNT ================= */
  const getRatePerPerson = (r) => {
    if (Array.isArray(r.agent_comm) && r.agent_comm.length) {
      const rates = r.agent_comm
        .map((a) => Number(a.rate || 0))
        .filter(
          (rate) => Number.isFinite(rate) && rate > 0
        );

      if (rates.length) {
        return rates
          .map((rate) => `${fmtPKR(rate)} PKR`)
          .join(" + ");
      }
    }

    const persons = getPersons(r);
    const total = getCommission(r);

    if (persons > 0 && total > 0) {
      return `${fmtPKR(total / persons)} PKR`;
    }

    return "-";
  };

  /* ================= SEARCH + DATE FILTER ================= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      const text = [
        r.ref_no,
        r.customer_name,
        r.agent_name,
        ...(Array.isArray(r.agent_comm)
          ? r.agent_comm.flatMap((a) => [
              a.type,
              a.rate,
              a.persons,
              a.total,
            ])
          : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const date = r.booking_date
        ? new Date(r.booking_date)
        : null;

      const from = fromDate
        ? new Date(`${fromDate}T00:00:00`)
        : null;

      const to = toDate
        ? new Date(`${toDate}T23:59:59`)
        : null;

      return (
        (!q || text.includes(q)) &&
        (!from || (date && date >= from)) &&
        (!to || (date && date <= to))
      );
    });
  }, [rows, search, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(
    filtered.length / rowsPerPage
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentRows = filtered.slice(
    indexOfFirst,
    indexOfLast
  );

  const getPagination = () => {
    const delta = 2;
    const range = [];
    const result = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta &&
          i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let last;

    for (const p of range) {
      if (last) {
        if (p - last === 2) {
          result.push(last + 1);
        } else if (p - last > 2) {
          result.push("…");
        }
      }

      result.push(p);
      last = p;
    }

    return result;
  };

  /* ================= TOTAL ================= */
  const totalCommission = useMemo(() => {
    return filtered.reduce(
      (sum, r) => sum + getCommission(r),
      0
    );
  }, [filtered]);

  return (
    <div className="container py-4">

      {/* ================= HEADER ================= */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center"
          style={{
            background:
              "linear-gradient(135deg, #0d6efd, #6610f2)",
            color: "#fff",
            borderRadius: "12px",
          }}
        >
          <div>
            <h5 className="fw-bold mb-0">
              💰 Agent Commission Report
            </h5>

            <small style={{ opacity: 0.85 }}>
              Agent commission details & date-wise report
            </small>
          </div>

          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("allreports")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ================= FILTER ================= */}
      <div className="card shadow-sm mb-2">
        <div className="card-body">

          <div className="row g-2">

            <div className="col-md-5">
              <input
                className="form-control form-control-sm"
                placeholder="🔍 Search Ref / Customer / Agent / Rate"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
              />
            </div>

            <div className="col-md-3">
              <button
                className="btn btn-outline-danger btn-sm w-100"
                onClick={resetFilters}
              >
                ♻ Reset Filters
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ================= DATE BUTTONS ================= */}
      <div className="d-flex gap-2 mb-3 flex-wrap">

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={setToday}
        >
          📅 Today
        </button>

        <button
          className="btn btn-outline-success btn-sm"
          onClick={setWeek}
        >
          📆 This Week
        </button>

        <button
          className="btn btn-outline-warning btn-sm"
          onClick={setMonth}
        >
          🗓 This Month
        </button>

      </div>

      {/* ================= TABLE ================= */}
      <div className="card shadow-sm">

        <div className="table-responsive">

          <table className="table table-hover table-sm mb-0 align-middle">

            <thead className="table-light">

              <tr>

                <th className="text-center">
                  SR#
                </th>

                <th className="text-center">
                  Ref
                </th>

                <th className="text-center">
                  Customer
                </th>

                <th className="text-center">
                  Date
                </th>

                <th className="text-center">
                  Agent / Commission
                </th>

                <th className="text-center">
                  Persons
                </th>

                <th className="text-center">
                  Per Person
                </th>

                <th className="text-center">
                  Commission PKR
                </th>

              </tr>

            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-3"
                  >
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                currentRows.map((r, i) => (
                  <tr key={r.id || i}>

                    <td
                      className="fw-bold text-muted"
                      style={{ fontSize: "12px" }}
                    >
                      {i + 1 + indexOfFirst}
                    </td>

                    <td className="fw-bold text-nowrap small-cell">
                      {r.ref_no || "-"}
                    </td>

                    <td className="fw-semibold text-primary text-nowrap small-cell">
                      {r.customer_name || "-"}
                    </td>

                    <td className="text-muted text-nowrap small-cell">
                      {formatDate(r.booking_date)}
                    </td>

                    <td className="small-cell">
                      {getAgent(r)}
                    </td>

                    <td className="text-center">
                      <span className="badge bg-info text-dark">
                        {getPersons(r) || "-"}
                      </span>
                    </td>

                    {/* PER PERSON */}
                    <td className="text-end text-nowrap">
                      <span className="badge bg-warning text-dark">
                        👤 {getRatePerPerson(r)}
                      </span>
                    </td>

                    {/* TOTAL COMMISSION */}
                    <td className="text-end text-nowrap">
                      <span className="badge bg-success">
                        💰 {fmtPKR(getCommission(r))}
                      </span>
                    </td>

                  </tr>
                ))}

              {!loading &&
                filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-3 text-muted"
                    >
                      No Records Found
                    </td>
                  </tr>
                )}

              {!loading &&
                filtered.length > 0 && (
                  <tr className="table-dark">

                    <td
                      colSpan={7}
                      className="text-end fw-bold"
                    >
                      TOTAL COMMISSION
                    </td>

                    <td className="fw-bold text-end">
                      {fmtPKR(totalCommission)}
                    </td>

                  </tr>
                )}

            </tbody>

          </table>

        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">

        <select
          className="form-select form-select-sm"
          style={{ width: "100px" }}
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={75}>75</option>
          <option value={100}>100</option>
          <option value={1000000}>Full View</option>
        </select>

        <div className="d-flex gap-1 align-items-center flex-wrap">

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(currentPage - 1)
            }
          >
            ⬅ Prev
          </button>

          {getPagination().map((p, idx) => (
            <button
              key={idx}
              className={`btn btn-sm ${
                p === currentPage
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              disabled={p === "…"}
              onClick={() =>
                typeof p === "number" &&
                setCurrentPage(p)
              }
            >
              {p}
            </button>
          ))}

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
          >
            Next ➡
          </button>

        </div>

        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder="Go"
          className="form-control form-control-sm"
          style={{ width: "70px" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = Number(e.target.value);

              if (
                val >= 1 &&
                val <= totalPages
              ) {
                setCurrentPage(val);
              }
            }
          }}
        />

      </div>

    </div>
  );
}