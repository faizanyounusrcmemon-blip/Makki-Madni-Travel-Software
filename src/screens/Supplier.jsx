import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Supplier({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [form, setForm] = useState({
    supplier_name: "",
    category: "",
    contact_no: "",
  });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`
    );
    const d = await r.json();
    if (d.success) {
      setRows(d.rows);
      setFilteredRows(d.rows);
    }
  };

  useEffect(() => {
    load();
  }, []);

/* ================= PASSWORD POPUP ================= */
const askPassword = async (title = "Enter Password") => {
  const { value } = await Swal.fire({
    width: "300px",
    html: `
      <div style="text-align:left;font-size:13px">
        <b>${title}</b>
        <div style="position:relative;margin-top:10px">
          <input
            id="swal-pass"
            type="password"
            class="swal2-input"
            style="height:34px;font-size:13px;padding-right:40px"
            placeholder="Enter password"
          />
          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            user-select:none;
            font-size:16px;
          ">👁</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "OK",
    focusConfirm: false,
    preConfirm: () => {
      const input = document.getElementById("swal-pass");
      const val = input.value.trim();
      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }
      return val;
    },
    didOpen: () => {
      const input = document.getElementById("swal-pass");
      const toggle = document.getElementById("toggle-pass");
      let show = false;

      toggle.onclick = () => {
        show = !show;
        input.type = show ? "text" : "password";
        toggle.textContent = show ? "🙈" : "👁";
      };

      setTimeout(() => input.focus(), 100);

      const handleEnter = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.querySelector(".swal2-confirm")?.click();
        }
      };
      document.addEventListener("keydown", handleEnter);

      Swal.getPopup()?.addEventListener("remove", () => {
        document.removeEventListener("keydown", handleEnter);
      });
    }
  });
  return value;
};


/* ================= SAVE / UPDATE ================= */
const save = async () => {
  const url = editId ? `/update/${editId}` : "/create";
  const method = editId ? "PUT" : "POST";

  const r = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/supplier${url}`,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }
  );

  const d = await r.json();

  if (d.success) {
    Swal.fire({
      width: "300px",
      icon: "success",
      text: editId
        ? "Supplier Updated Successfully"
        : "Supplier Saved Successfully",
    });

    setForm({ supplier_name: "", category: "", contact_no: "" });
    setEditId(null);
    load();
  } else {
    Swal.fire({
      width: "300px",
      icon: "error",
      text: d.error,
    });
  }
};


/* ================= DELETE ================= */
const del = async (id) => {
  const confirmDelete = await Swal.fire({
    width: "300px",
    icon: "warning",
    text: "Are you sure you want to delete this supplier?",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel"
  });

  if (!confirmDelete.isConfirmed) return;

  const pass = await askPassword("Enter Delete Password");
  if (!pass) return;

  Swal.fire({
    width: "260px",
    title: "Deleting...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const r = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/supplier/delete/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    }
  );

  const d = await r.json();
  Swal.close();

  if (d.success) {
    Swal.fire({
      width: "280px",
      icon: "success",
      text: "Supplier Deleted Successfully"
    });
    load();
  } else {
    Swal.fire({
      width: "300px",
      icon: "error",
      text: d.error || "Wrong Password 😎"
    });
  }
};

  /* ================= SEARCH FILTER ================= */
  const handleSearch = (value) => {
    setSearch(value);
    const lower = value.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.supplier_code.toLowerCase().includes(lower) ||
        r.supplier_name.toLowerCase().includes(lower) ||
        (r.category && r.category.toLowerCase().includes(lower)) ||
        (r.contact_no && r.contact_no.toLowerCase().includes(lower))
    );
    setFilteredRows(filtered);
  };

  return (
    <div className="container py-3">
      {/* ===== TOP BAR ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary">🏷 Supplier Management</h4>
        <button
          className="btn btn-outline-dark btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* ===== FORM CARD ===== */}
      <div className="card shadow-lg border-0 mb-4">
        <div
          className="card-header text-white fw-bold"
          style={{
            background: "linear-gradient(135deg, #0d6efd, #20c997)",
          }}
        >
          {editId ? "✏ Update Supplier" : "➕ Add New Supplier"}
        </div>

        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Supplier Name"
                value={form.supplier_name}
                onChange={(e) =>
                  setForm({ ...form, supplier_name: e.target.value })
                }
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                <option>Ticket</option>
                <option>Hotel</option>
                <option>Visa</option>
                <option>Transport</option>
                <option>Ziyarat</option>
                <option>Groups</option>
                <option>Other</option>
              </select>
            </div>

            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Contact No"
                value={form.contact_no}
                onChange={(e) =>
                  setForm({ ...form, contact_no: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-3 text-end">
            {editId && (
              <button
                className="btn btn-secondary me-2"
                onClick={() => {
                  setForm({ supplier_name: "", category: "", contact_no: "" });
                  setEditId(null);
                }}
              >
                Cancel
              </button>
            )}

            <button
              className={`btn ${editId ? "btn-warning" : "btn-success"}`}
              onClick={save}
            >
              {editId ? "✏ Update Supplier" : "💾 Save Supplier"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== SEARCH BOX ===== */}
      <div className="mb-2">
        <input
          className="form-control"
          placeholder="Search by Code, Name, Category, Contact..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* ===== LIST TABLE ===== */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-dark text-white fw-bold">
          📋 Supplier List
        </div>

        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Contact</th>
                <th width="180">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No suppliers found
                  </td>
                </tr>
              )}

              {filteredRows.map((r) => (
                <tr key={r.id}>
                  <td className="fw-bold">{r.supplier_code}</td>
                  <td>{r.supplier_name}</td>
                  <td>
                    <span className="badge bg-info text-dark">{r.category}</span>
                  </td>
                  <td>{r.contact_no}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-warning me-1"
                      onClick={async () => {
                        const pass = await askPassword("Enter Edit Password");
                        if (!pass) return;

                        // 🔍 Verify Edit Password from Database via API
                        try {
                          const checkRes = await fetch(
                            `${import.meta.env.VITE_BACKEND_URL}/api/supplier/verify-edit-password`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ password: pass }),
                            }
                          );
                          const checkData = await checkRes.json();

                          if (!checkData.success) {
                            return Swal.fire({
                              width: "300px",
                              icon: "error",
                              text: checkData.error || "Wrong Password 😎"
                            });
                          }

                          setForm({
                            supplier_name: r.supplier_name || "",
                            category: r.category || "",
                            contact_no: r.contact_no || "",
                          });

                          setEditId(r.id);

                          Swal.fire({
                            width: "280px",
                            icon: "success",
                            text: "Edit Mode Enabled 😎"
                          });
                        } catch (err) {
                          Swal.fire({
                            width: "300px",
                            icon: "error",
                            text: "Failed to verify password"
                          });
                        }
                      }}
                    >
                      ✏ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => del(r.id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}