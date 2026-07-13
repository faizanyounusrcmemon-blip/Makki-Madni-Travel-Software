import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";



export default function DeletedReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");


/* ================= FILTER ================= */
const filteredRows = rows.filter((r) => {
  const s = search.toLowerCase();

  const matchSearch =
    r.ref_no?.toLowerCase().includes(s) ||
    r.customer_name?.toLowerCase().includes(s) ||
    r.type?.toLowerCase().includes(s);

  const matchCategory =
    category === "ALL"
      ? true
      : r.type?.toUpperCase() === category;

  return matchSearch && matchCategory;
});

/* ================= TOTAL ================= */
const totalAmount = filteredRows.reduce(
  (sum, r) => sum + (Number(r.amount) || 0),
  0
);

  /* ================= LOAD ================= */
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/deleted/list`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load deleted reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

/* ================= COMMON PASSWORD POPUP ================= */
const askPasswordPopup = async (
  title,
  type,
  ref_no,
  customer_name,
  amount,
  mode = "default" // restore | delete
) => {

  // 🎨 AUTO COLOR + TEXT
  let btnColor = "#0d6efd";
  let confirmText = "Submit";

  if (mode === "restore") {
    btnColor = "#198754";
    confirmText = "Restore";
  }

  if (mode === "delete") {
    btnColor = "#dc3545";
    confirmText = "Delete";
  }

  const { value: password } = await Swal.fire({
    width: "380px",
    confirmButtonColor: btnColor,
    html: `
      <div style="text-align:left;font-size:13px;line-height:1.5">
        <b style="color:${btnColor}">${title}</b><br><br>

        <b>Type:</b> ${type}<br>
        <b>Ref No:</b> ${ref_no}<br>
        <b>Customer:</b> ${customer_name || "-"}<br>
        <b>Amount:</b> ${amount ? Number(amount).toLocaleString() : "-"}<br><br>

        <div style="position:relative">
          <input id="swal-pass" type="password" class="swal2-input"
            placeholder="Enter password" style="margin:0">

          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            font-size:14px;
          ">👁</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: confirmText,
    focusConfirm: false,

    preConfirm: () => {
      const val = document.getElementById("swal-pass").value;

      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }

      // ❌ WRONG PASSWORD → SHAKE
      if (val.trim() !== "7865") {
        const popup = Swal.getPopup();

        popup.style.animation = "shake 0.3s";
        setTimeout(() => {
          popup.style.animation = "";
        }, 300);

        Swal.showValidationMessage("❌ Wrong Password");
        return false;
      }

      return val;
    },

    didOpen: () => {
      let show = false;
      const input = document.getElementById("swal-pass");
      const toggle = document.getElementById("toggle-pass");

      // 👁 SHOW / HIDE
      toggle.addEventListener("click", () => {
        show = !show;
        input.type = show ? "text" : "password";
        toggle.textContent = show ? "🙈" : "👁";
      });

      // ⌨ ENTER PRESS
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") Swal.clickConfirm();
      });
    }
  });

  return password;
};

/* ================= RESTORE ================= */
const restore = async (type, ref_no, customer_name, amount) => {
  const password = await (async () => {
    const { value } = await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.5">
          <div style="margin-bottom:8px"><b style="color:#198754">♻ RESTORE RECORD</b></div>
          <div style="font-size:12px;margin-bottom:4px"><b>Type:</b> ${type}</div>
          <div style="font-size:12px;margin-bottom:4px"><b>REF NO:</b> ${ref_no}</div>
          <div style="font-size:12px;margin-bottom:4px"><b>Customer:</b> ${customer_name || "-"}</div>
          <div style="font-size:12px;margin-bottom:8px"><b>Amount:</b> ${amount || 0}</div>
          <div style="position:relative;margin-top:8px">
            <input id="swal-pass" type="password" class="swal2-input" style="height:34px;font-size:13px;width:100%;box-sizing:border-box;margin:0;" placeholder="Enter Security Password"/>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Restore",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      }
    });
    return value;
  })();

  if (!password) return;

  Swal.fire({ title: "Restoring...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/deleted/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ref_no, password })
    });
    const data = await res.json();
    Swal.close();

    if (data.success) {
      Swal.fire("Restored!", `Record ${ref_no} is active now.`, "success");
      load();
    } else {
      Swal.fire({
        title: "Error",
        text: data.error || "Failed",
        icon: "error",
        didOpen: () => {
          const popup = document.querySelector(".swal2-popup");
          if (popup) {
            popup.classList.add("shake");
            setTimeout(() => popup.classList.remove("shake"), 500);
          }
        }
      });
    }
  } catch {
    Swal.close();
    Swal.fire("Error", "Server network error", "error");
  }
};

/* ================= PERMANENT DELETE ================= */
const permanentDelete = async (type, ref_no, customer_name, amount) => {
  const password = await (async () => {
    const { value } = await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.5">
          <div style="margin-bottom:8px"><b style="color:#dc3545">🚨 PERMANENT DELETE (🚨 CRITICAL)</b></div>
          <div style="font-size:12px;margin-bottom:4px"><b>Type:</b> ${type}</div>
          <div style="font-size:12px;margin-bottom:4px"><b>REF NO:</b> ${ref_no}</div>
          <div style="font-size:12px;margin-bottom:4px"><b>Customer:</b> ${customer_name || "-"}</div>
          <div style="font-size:12px;margin-bottom:8px"><b>Amount:</b> ${amount || 0}</div>
          <div style="position:relative;margin-top:8px">
            <input id="swal-pass" type="password" class="swal2-input" style="height:34px;font-size:13px;width:100%;box-sizing:border-box;margin:0;" placeholder="Enter Security Password"/>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "DELETE FOREVER",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      }
    });
    return value;
  })();

  if (!password) return;

  const finalConfirm = await Swal.fire({
    title: "Are you absolutely sure?",
    text: "This record will be erased forever from the system database!",
    icon: "danger",
    showCancelButton: true,
    confirmButtonText: "Yes, Erase Completely"
  });

  if (!finalConfirm.isConfirmed) return;

  Swal.fire({ title: "Erasing...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/deleted/permanent-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ref_no, password })
    });
    const data = await res.json();
    Swal.close();

    if (data.success) {
      Swal.fire("Erased!", `Record ${ref_no} removed permanently.`, "success");
      load();
    } else {
      Swal.fire({
        title: "Error",
        text: data.error || "Failed",
        icon: "error",
        didOpen: () => {
          const popup = document.querySelector(".swal2-popup");
          if (popup) {
            popup.classList.add("shake");
            setTimeout(() => popup.classList.remove("shake"), 500);
          }
        }
      });
    }
  } catch {
    Swal.close();
    Swal.fire("Error", "Server error", "error");
  }
};





  /* ================= VIEW ================= */
  const handleView = (type, ref_no) => {
    const t = type?.toUpperCase();
    let route = "";

    if (t === "PACKAGE") route = "packages_view_deleted";
    else if (t === "HOTEL") route = "hotels_view_deleted";
    else if (t === "TICKETING") route = "ticket_view_deleted";
    else if (t === "TRANSPORT") route = "transport_view_deleted";
    else if (t === "ZIYARAT") route = "ziyarat_view_deleted";
    else if (t === "VISA") route = "visa_view_deleted";
    else if (t === "CARD") route = "card_view_deleted";
    else if (t === "GROUPS") route = "groups_view_deleted";
    else if (t === "PURCHASE") route = "purchase_view_deleted";
    else {
      alert("No view available");
      return;
    }

    onNavigate(route, ref_no);
  };

  /* ================= HELPERS ================= */
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
  const isPurchase = (t) => t?.toUpperCase() === "PURCHASE";
  const isSupplier = (t) => t?.toUpperCase() === "SUPPLIER";

  /* ================= UI ================= */
return (
  <div
    className="container py-3"
    style={{
      fontSize: "13px",
      maxWidth: "1400px"
    }}
  >
    {/* HEADER */}
    <div
      className="mb-4 position-relative overflow-hidden rounded-4 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg,#ff416c 0%, #ff4b2b 45%, #ff7b54 100%)",
        padding: "18px 20px",
      }}
    >
      {/* GLOW EFFECT */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "140px",
          height: "140px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          left: "-40px",
          width: "170px",
          height: "170px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
        }}
      />

      {/* CONTENT */}
      <div className="d-flex justify-content-between align-items-center position-relative">
        <div>
          <div
            className="fw-bold text-white"
            style={{
              fontSize: "22px",
              letterSpacing: "0.5px",
            }}
          >
            🗑 Deleted Reports
          </div>

          <div
            style={{
              fontSize: "12px",
              opacity: 0.9,
              marginTop: "2px",
              color: "#fff",
            }}
          >
            Restore or permanently delete removed records
          </div>
        </div>

        {/* BACK BUTTON */}
        <button
          className="btn btn-light border-0 fw-bold px-3"
          style={{
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "0.2s",
          }}
          onClick={() => onNavigate("dashboard")}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          ← Back
        </button>
      </div>
    </div>

{/* SEARCH + FILTER */}
<div className="card border-0 shadow-sm rounded-3 p-2 mb-3">
  <div className="row g-2">
    
    {/* SEARCH */}
    <div className="col-md-8">
      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="🔍 Search Ref / Customer / Type..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* CATEGORY */}
    <div className="col-md-4">
      <select
        className="form-select form-select-sm"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="ALL">All Categories</option>
        <option value="PACKAGE">PACKAGE</option>
        <option value="HOTEL">HOTEL</option>
        <option value="TICKETING">TICKETING</option>
        <option value="TRANSPORT">TRANSPORT</option>
        <option value="ZIYARAT">ZIYARAT</option>
        <option value="VISA">VISA</option>
        <option value="CARD">CARD</option>
        <option value="GROUPS">GROUPS</option>
        <option value="PURCHASE">PURCHASE</option>
      </select>
    </div>
  </div>
</div>

      {/* TABLE */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead style={{ background: "#f8f9fa", fontSize: "12px" }}>
              <tr className="text-secondary">
                <th>Type</th>
                <th>Ref</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="text-end">Amount</th>
                <th className="text-center">View</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12.5px" }}>
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-3">⏳ Loading...</td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-3 text-muted">
                    No deleted records
                  </td>
                </tr>
              )}
              {filteredRows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span
                      className={`badge px-2 py-1 ${
                        isPurchase(r.type)
                          ? "bg-primary"
                          : isSupplier(r.type)
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td className="text-primary">{r.customer_name || "-"}</td>
                  <td>{formatDate(r.booking_date)}</td>
                  <td className="text-end fw-bold text-success">
                    {r.amount ? Number(r.amount).toLocaleString() : "-"}
                  </td>
                  {/* VIEW */}
                  <td className="text-center">
                    <button
                      className="btn btn-sm px-2 py-1"
                      style={{
                        background: "linear-gradient(135deg,#36d1dc,#5b86e5)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: 6
                      }}
                      onClick={() => handleView(r.type, r.ref_no)}
                    >
                      👁 View
                    </button>
                  </td>
                  {/* ACTIONS */}
                  <td className="text-center">
<button
  className="btn btn-outline-success btn-sm me-1"
  style={{ fontSize: "11px", padding: "2px 6px" }}
  onClick={() => restore(r.type, r.ref_no, r.customer_name, r.amount)}
>
  ♻ Restore
</button>

<button
  className="btn btn-outline-danger btn-sm"
  style={{ fontSize: "11px", padding: "2px 6px" }}
  onClick={() => permanentDelete(r.type, r.ref_no, r.customer_name, r.amount)}
>
  🗑 Delete
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
{/* TOTAL FOOTER */}
<div
  className="d-flex justify-content-between align-items-center px-3 py-2 border-top"
  style={{
    background: "linear-gradient(135deg,#f8f9fa,#eef2f7)",
    fontSize: "13px",
  }}
>
  <div className="fw-bold text-secondary">
    📦 Total Records:{" "}
    <span className="text-dark">{filteredRows.length}</span>
  </div>

  <div
    className="fw-bold px-3 py-1 rounded-pill"
    style={{
      background: "linear-gradient(135deg,#198754,#20c997)",
      color: "#fff",
      fontSize: "13px",
      boxShadow: "0 3px 10px rgba(25,135,84,0.25)",
    }}
  >
    💰 Total Amount: {totalAmount.toLocaleString()}
  </div>
</div>

        </div>
      </div>
    </div>
  );
}