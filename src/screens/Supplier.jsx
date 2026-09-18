import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Truck,
  Tag,
  Phone,
  RefreshCw,
  PlusCircle,
  Save,
  X,
  ShieldCheck,
  Building2,
} from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOAD SUPPLIERS
  ========================================================= */
  const load = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`
      );
      const d = await r.json();
      if (d.success) {
        setRows(d.rows || []);
        setFilteredRows(d.rows || []);
      }
    } catch (err) {
      console.error("Load supplier error:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */
  const totalSuppliers = rows.length;

  const totalCategories = useMemo(() => {
    const cats = new Set(rows.map((r) => r.category).filter(Boolean));
    return cats.size;
  }, [rows]);

  /* =========================================================
     PASSWORD POPUP
  ========================================================= */
  const askPassword = async (title = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "390px",
      padding: "0",
      background: "#fff",
      customClass: {
        popup: "mmt-user-popup",
        confirmButton: "mmt-confirm-btn",
        cancelButton: "mmt-cancel-btn",
      },
      html: `
        <div style="padding:24px;text-align:left;font-family:Inter,Arial,sans-serif;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
            <div style="width:48px;height:48px;border-radius:15px;background:linear-gradient(135deg,#1e3a8a,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 22px rgba(37,99,235,.22);">
              🔐
            </div>
            <div>
              <div style="font-size:17px;font-weight:800;color:#0f172a;">${title}</div>
              <div style="font-size:11px;color:#475569;margin-top:3px;font-weight:600;">Security verification required</div>
            </div>
          </div>
          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;margin-bottom:14px;color:#334155;font-size:12px;font-weight:600;line-height:1.5;">
            🛡️ Please enter your authorized security password to continue.
          </div>
          <div style="position:relative;">
            <input
              id="swal-pass"
              type="password"
              class="swal2-input"
              style="width:100%;height:43px;box-sizing:border-box;margin:0;padding:0 46px 0 13px;border-radius:10px;border:1px solid #94a3b8;font-size:13px;color:#0f172a;font-weight:600;box-shadow:none;"
              placeholder="Enter security password"
            />
            <span id="toggle-pass" style="position:absolute;right:13px;top:50%;transform:translateY(-50%);cursor:pointer;z-index:10;color:#475569;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🔓 Continue",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById("swal-pass");
        const val = input?.value.trim();
        if (!val) {
          Swal.showValidationMessage("Password is required");
          return false;
        }
        return val;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        if (input && toggle) {
          let show = false;
          toggle.addEventListener("click", () => {
            show = !show;
            input.type = show ? "text" : "password";
            toggle.textContent = show ? "🙈" : "👁";
          });
          input.focus();
        }
      },
    });
    return value;
  };

  /* =========================================================
     SAVE / UPDATE SUPPLIER
  ========================================================= */
  const save = async () => {
    if (!form.supplier_name.trim()) {
      return Swal.fire({
        width: "360px",
        icon: "warning",
        title: "Required Information",
        text: "Please enter Supplier Name.",
        confirmButtonColor: "#2563eb",
        customClass: { popup: "rounded-4 shadow-lg border-0" },
      });
    }

    setLoading(true);
    const url = editId ? `/update/${editId}` : "/create";
    const method = editId ? "PUT" : "POST";

    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier${url}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const d = await r.json();

      if (!d.success) {
        setLoading(false);
        return Swal.fire({
          width: "370px",
          icon: "error",
          title: "Unable to Save",
          text: d.error || "Something went wrong.",
          confirmButtonColor: "#dc2626",
          customClass: { popup: "rounded-4 shadow-lg border-0" },
        });
      }

      await Swal.fire({
        width: "380px",
        icon: "success",
        title: editId
          ? "Supplier Updated Successfully"
          : "Supplier Saved Successfully",
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
        customClass: { popup: "rounded-4 shadow-lg border-0" },
      });

      clearForm();
      await load();
    } catch (err) {
      Swal.fire({
        width: "370px",
        icon: "error",
        title: "Connection Error",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLEAR FORM
  ========================================================= */
  const clearForm = () => {
    setForm({ supplier_name: "", category: "", contact_no: "" });
    setEditId(null);
  };

  /* =========================================================
     DELETE SUPPLIER
  ========================================================= */
  const del = async (r) => {
    const confirmDelete = await Swal.fire({
      width: "390px",
      padding: "0",
      icon: "warning",
      title: "Delete Supplier?",
      html: `
        <div style="font-size:13px;color:#334155;line-height:1.6;font-weight:600;">
          You are about to delete <strong style="color:#0f172a;">${r.supplier_name}</strong><br/>
          This action requires security verification.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🗑️ Delete Supplier",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      customClass: { popup: "rounded-4 shadow-lg border-0" },
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("Delete Authorization");
    if (!pass) return;

    Swal.fire({
      width: "300px",
      padding: "25px",
      title: "Deleting Supplier...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier/delete/${r.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        return Swal.fire({
          width: "360px",
          icon: "error",
          title: "Delete Failed",
          text: d.error || "Invalid security password.",
          confirmButtonColor: "#dc2626",
        });
      }

      await Swal.fire({
        width: "360px",
        icon: "success",
        title: "Supplier Deleted",
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
      });

      if (editId === r.id) clearForm();
      load();
    } catch {
      Swal.close();
      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Delete Failed",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /* =========================================================
     EDIT SUPPLIER
  ========================================================= */
  const editSupplier = async (r) => {
    const pass = await askPassword("Edit Authorization");
    if (!pass) return;

    Swal.fire({
      width: "300px",
      padding: "25px",
      title: "Verifying...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier/verify-edit-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        return Swal.fire({
          width: "360px",
          icon: "error",
          title: "Access Denied",
          text: d.error || "Invalid security password.",
          confirmButtonColor: "#dc2626",
        });
      }

      setForm({
        supplier_name: r.supplier_name || "",
        category: r.category || "",
        contact_no: r.contact_no || "",
      });
      setEditId(r.id);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      Swal.close();
      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Verification Failed",
        text: "Could not connect to the server.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /* =========================================================
     SEARCH FILTER
  ========================================================= */
  const handleSearch = (value) => {
    setSearch(value);
    const lower = value.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        (r.supplier_code && r.supplier_code.toLowerCase().includes(lower)) ||
        (r.supplier_name && r.supplier_name.toLowerCase().includes(lower)) ||
        (r.category && r.category.toLowerCase().includes(lower)) ||
        (r.contact_no && r.contact_no.toLowerCase().includes(lower))
    );
    setFilteredRows(filtered);
  };

  return (
    <div className="mmt-users-page">
      <div className="mmt-container">
        {/* HEADER */}
        <div className="mmt-header">
          <div className="mmt-header-content">
            <div className="mmt-brand">
              <div className="mmt-brand-icon">
                <Truck size={28} />
              </div>
              <div>
                <div className="mmt-overline">MAKKI MADNI TRAVEL & TOURS</div>
                <h2>Supplier Management</h2>
                <p>Manage vendors, service providers, and contact records</p>
              </div>
            </div>
            <button
              type="button"
              className="mmt-back-btn"
              onClick={() => onNavigate("dashboard")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mmt-stats">
          <div className="mmt-stat-card blue">
            <div className="mmt-stat-icon">
              <Truck size={24} />
            </div>
            <div>
              <span>Total Suppliers</span>
              <strong>{totalSuppliers}</strong>
              <small>Registered vendors</small>
            </div>
          </div>
          <div className="mmt-stat-card purple">
            <div className="mmt-stat-icon">
              <Tag size={24} />
            </div>
            <div>
              <span>Categories</span>
              <strong>{totalCategories}</strong>
              <small>Service types</small>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <div className="mmt-form-card">
          <div className="mmt-section-head">
            <div className="mmt-section-title">
              <div className="mmt-section-icon">
                {editId ? <Pencil size={20} /> : <PlusCircle size={20} />}
              </div>
              <div>
                <h4>{editId ? "Edit Supplier Record" : "Add New Supplier"}</h4>
                <p>
                  {editId
                    ? "Update supplier vendor details"
                    : "Add a new vendor or service provider"}
                </p>
              </div>
            </div>
            {editId && (
              <div className="editing-badge">
                <Pencil size={13} />
                Editing Supplier #{editId}
              </div>
            )}
          </div>

          <div className="mmt-form-body">
            <div className="row g-3">
              {/* NAME */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>SUPPLIER NAME</label>
                <div className="mmt-input-wrap">
                  <Building2 size={16} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="Enter supplier/vendor name"
                    value={form.supplier_name}
                    onChange={(e) =>
                      setForm({ ...form, supplier_name: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>CATEGORY</label>
                <div className="mmt-select-wrap">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    <option value="Ticket">🎫 Ticket</option>
                    <option value="Hotel">🏨 Hotel</option>
                    <option value="Visa">📄 Visa</option>
                    <option value="Transport">🚌 Transport</option>
                    <option value="Ziyarat">🕌 Ziyarat</option>
                    <option value="Groups">👥 Groups</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </div>
              </div>

              {/* CONTACT */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>CONTACT NUMBER</label>
                <div className="mmt-input-wrap">
                  <Phone size={16} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="e.g. +92 300 0000000"
                    value={form.contact_no}
                    onChange={(e) =>
                      setForm({ ...form, contact_no: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* SAVE / ACTIONS */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>{editId ? "UPDATE SUPPLIER" : "SAVE SUPPLIER"}</label>
                <button
                  type="button"
                  disabled={loading}
                  onClick={save}
                  className={editId ? "mmt-save-btn edit" : "mmt-save-btn"}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="spin" />
                      Saving...
                    </>
                  ) : editId ? (
                    <>
                      <Save size={17} />
                      Update Supplier
                    </>
                  ) : (
                    <>
                      <PlusCircle size={17} />
                      Save Supplier
                    </>
                  )}
                </button>
              </div>

              {/* CANCEL */}
              {editId && (
                <div className="col-12 col-md-6 col-xl-4">
                  <label>CANCEL EDIT</label>
                  <button
                    type="button"
                    className="mmt-cancel-edit"
                    onClick={clearForm}
                  >
                    <X size={17} />
                    Cancel & Clear Form
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIST CARD */}
        <div className="mmt-list-card">
          <div className="mmt-list-header">
            <div className="mmt-section-title">
              <div className="mmt-section-icon list">
                <Truck size={20} />
              </div>
              <div>
                <h4>Registered Suppliers</h4>
                <p>Monitor vendor accounts and contact details</p>
              </div>
            </div>

            <div className="mmt-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search Code, Name, Category..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="table-responsive mmt-table-wrap">
            <table className="mmt-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Supplier Name</th>
                  <th>Category</th>
                  <th>Contact Number</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-users">
                      <Truck size={38} />
                      <strong>No Suppliers Found</strong>
                      <span>There are currently no supplier records.</span>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} className={editId === r.id ? "editing-row" : ""}>
                      <td>
                        <span className="code-badge">{r.supplier_code}</span>
                      </td>
                      <td>
                        <strong className="text-dark">{r.supplier_name}</strong>
                      </td>
                      <td>
                        <span className="role-badge user">{r.category || "General"}</span>
                      </td>
                      <td>
                        <span className="date-text">{r.contact_no || "—"}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="edit-btn"
                            title="Edit"
                            onClick={() => editSupplier(r)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            title="Delete"
                            onClick={() => del(r)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="mmt-list-footer">
            <span>
              <Truck size={14} />
              {totalSuppliers} total suppliers
            </span>
          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="mmt-security-note">
          <ShieldCheck size={16} />
          <span>
            Supplier editing and deletion are protected by administrator security verification.
          </span>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .mmt-users-page {
          min-height: 100vh;
          padding: 24px 16px 40px;
          background: radial-gradient(circle at 10% 10%, rgba(37,99,235,.12), transparent 28%), radial-gradient(circle at 90% 20%, rgba(124,58,237,.12), transparent 25%), linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 48%, #f1f5f9 100%);
          font-family: Inter, system-ui, sans-serif;
          color: #0f172a;
        }
        .mmt-container { max-width: 1500px; margin: 0 auto; }
        .mmt-header { position: relative; overflow: hidden; border-radius: 24px; background: linear-gradient(135deg, #090d16 0%, #1e293b 45%, #1e1b4b 100%); box-shadow: 0 20px 45px rgba(15,23,42,.25); margin-bottom: 20px; }
        .mmt-header-content { padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .mmt-brand { display: flex; align-items: center; gap: 16px; }
        .mmt-brand-icon { width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; background: linear-gradient(135deg, rgba(255,255,255,.25), rgba(255,255,255,.10)); border: 1px solid rgba(255,255,255,.30); box-shadow: 0 10px 25px rgba(0,0,0,.3); }
        .mmt-overline { color: #93c5fd; font-size: 10px; letter-spacing: 2px; font-weight: 800; margin-bottom: 4px; }
        .mmt-brand h2 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; }
        .mmt-brand p { margin: 4px 0 0; color: #cbd5e1; font-size: 12px; font-weight: 500; }
        .mmt-back-btn { border: 1px solid rgba(255,255,255,.30); background: rgba(255,255,255,.15); color: #ffffff; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: .2s ease; }
        .mmt-back-btn:hover { background: rgba(255,255,255,.25); transform: translateY(-1px); }
        .mmt-stats { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-bottom: 20px; }
        .mmt-stat-card { min-height: 105px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 18px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 6px 20px rgba(15,23,42,.06); }
        .mmt-stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mmt-stat-card.blue .mmt-stat-icon { background: #dbeafe; color: #1d4ed8; }
        .mmt-stat-card.purple .mmt-stat-icon { background: #ede9fe; color: #6d28d9; }
        .mmt-stat-card span { display: block; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .mmt-stat-card strong { display: block; margin-top: 2px; color: #0f172a; font-size: 26px; font-weight: 900; }
        .mmt-stat-card small { display: block; margin-top: 4px; color: #64748b; font-size: 11px; font-weight: 600; }
        .mmt-form-card, .mmt-list-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; box-shadow: 0 10px 30px rgba(15,23,42,.08); overflow: hidden; margin-bottom: 20px; }
        .mmt-section-head, .mmt-list-header { padding: 18px 22px; border-bottom: 1px solid #cbd5e1; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; gap: 15px; }
        .mmt-section-title { display: flex; align-items: center; gap: 12px; }
        .mmt-section-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #dbeafe; color: #1d4ed8; }
        .mmt-section-icon.list { background: #ede9fe; color: #6d28d9; }
        .mmt-section-title h4 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
        .mmt-section-title p { margin: 3px 0 0; font-size: 12px; color: #475569; font-weight: 600; }
        .editing-badge { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 20px; background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 800; }
        .mmt-form-body { padding: 22px; }
        .mmt-form-body label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 800; color: #334155; letter-spacing: .7px; }
        .mmt-input-wrap { height: 45px; border: 1px solid #94a3b8; background: #ffffff; border-radius: 11px; display: flex; align-items: center; padding: 0 12px; gap: 10px; }
        .mmt-input-wrap input { width: 100%; border: 0; outline: 0; background: transparent; color: #0f172a; font-size: 13px; font-weight: 700; }
        .mmt-select-wrap select { width: 100%; height: 45px; border: 1px solid #94a3b8; border-radius: 11px; padding: 0 12px; background: #ffffff; color: #0f172a; font-size: 13px; font-weight: 700; outline: 0; }
        .mmt-save-btn, .mmt-cancel-edit { width: 100%; height: 45px; border: 0; border-radius: 11px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: .2s ease; }
        .mmt-save-btn { color: #ffffff; background: linear-gradient(135deg, #1d4ed8, #4338ca); box-shadow: 0 8px 18px rgba(29,78,216,.25); }
        .mmt-save-btn.edit { background: linear-gradient(135deg, #b45309, #c2410c); }
        .mmt-cancel-edit { background: #e2e8f0; border: 1px solid #cbd5e1; color: #1e293b; }
        .mmt-search-wrap { display: flex; align-items: center; background: #ffffff; border: 1px solid #94a3b8; border-radius: 12px; padding: 0 12px; gap: 8px; width: 300px; height: 40px; }
        .mmt-search-wrap input { border: 0; outline: 0; font-size: 12px; font-weight: 600; width: 100%; }
        .mmt-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .mmt-table thead th { padding: 14px 16px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .mmt-table tbody td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: 600; }
        .code-badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; border: 1px solid #7dd3fc; }
        .role-badge.user { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .action-buttons { display: flex; align-items: center; gap: 8px; }
        .edit-btn, .delete-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .edit-btn { background: #fff7ed; color: #c2410c; border-color: #fdba74; }
        .delete-btn { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .mmt-list-footer { padding: 14px 18px; display: flex; align-items: center; justify-content: flex-end; gap: 20px; border-top: 1px solid #cbd5e1; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 700; }
        .mmt-security-note { margin-top: 8px; padding: 12px 16px; border-radius: 14px; background: #ffffff; border: 1px solid #cbd5e1; color: #334155; font-size: 11px; font-weight: 700; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .spin { animation: mmtSpin 1s linear infinite; }
        @keyframes mmtSpin { to { transform: rotate(360deg); } }
        .empty-users { text-align: center; padding: 40px !important; color: #64748b; }
        .empty-users strong { display: block; margin-top: 10px; font-size: 14px; color: #1e293b; }
      `}</style>
    </div>
  );
}