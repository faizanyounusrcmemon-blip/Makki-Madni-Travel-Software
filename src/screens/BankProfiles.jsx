import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Building2,
  CheckCircle2,
  CreditCard,
  Building,
  RefreshCw,
  PlusCircle,
  Save,
  X,
  ShieldCheck,
  FileText,
} from "lucide-react";

export default function BankProfiles({ onNavigate }) {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [form, setForm] = useState({
    bank_name: "",
    account_title: "",
    account_number: "",
    status: "Active",
  });
  const [editId, setEditId] = useState(null);
  const [authPassword, setAuthPassword] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOAD BANKS
  ========================================================= */
  const loadBanks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks`);
      const data = await res.json();
      if (data.success) {
        setBanks(data.rows || []);
        setFilteredBanks(data.rows || []);
      }
    } catch (err) {
      console.error("Load banks error:", err);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */
  const totalBanks = banks.length;

  const activeBanksCount = useMemo(
    () => banks.filter((b) => b.status === "Active").length,
    [banks]
  );

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
     VERIFY PASSWORD HELPER (FIXED ENDPOINT ROUTE)
  ========================================================= */
  const verifyPasswordApi = async (password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  };

  /* =========================================================
     SAVE / UPDATE BANK
  ========================================================= */
  const save = async () => {
    if (!form.bank_name.trim() || !form.account_title.trim() || !form.account_number.trim()) {
      return Swal.fire({
        width: "360px",
        icon: "warning",
        title: "Required Information",
        text: "Please fill all required bank fields.",
        confirmButtonColor: "#2563eb",
        customClass: { popup: "rounded-4 shadow-lg border-0" },
      });
    }

    setLoading(true);
    const url = editId ? `/${editId}` : "";
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...form, password: authPassword } : form),
      });

      const data = await res.json();

      if (!data.success) {
        setLoading(false);
        return Swal.fire({
          width: "370px",
          icon: "error",
          title: "Unable to Save",
          text: data.error || "Failed to save bank profile.",
          confirmButtonColor: "#dc2626",
          customClass: { popup: "rounded-4 shadow-lg border-0" },
        });
      }

      await Swal.fire({
        width: "380px",
        icon: "success",
        title: editId ? "Bank Profile Updated" : "Bank Profile Saved",
        text: data.message || "Operation completed successfully.",
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
        customClass: { popup: "rounded-4 shadow-lg border-0" },
      });

      clearForm();
      await loadBanks();
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
    setForm({
      bank_name: "",
      account_title: "",
      account_number: "",
      status: "Active",
    });
    setEditId(null);
    setAuthPassword("");
  };

  /* =========================================================
     DELETE BANK
  ========================================================= */
  const handleDelete = async (b) => {
    const confirmDelete = await Swal.fire({
      width: "390px",
      padding: "0",
      icon: "warning",
      title: "Delete Bank Profile?",
      html: `
        <div style="font-size:13px;color:#334155;line-height:1.6;font-weight:600;">
          You are about to delete <strong style="color:#0f172a;">${b.bank_name}</strong> (${b.account_number})<br/>
          This action requires security verification.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🗑️ Delete Profile",
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
      title: "Deleting Profile...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks/${b.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const data = await res.json();
      Swal.close();

      if (!data.success) {
        return Swal.fire({
          width: "360px",
          icon: "error",
          title: "Delete Failed",
          text: data.error || "Invalid security password.",
          confirmButtonColor: "#dc2626",
        });
      }

      await Swal.fire({
        width: "360px",
        icon: "success",
        title: "Bank Profile Deleted",
        confirmButtonText: "Done",
        confirmButtonColor: "#059669",
      });

      if (editId === b.id) clearForm();
      loadBanks();
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
     EDIT BANK (VERIFIES PASSWORD FIRST)
  ========================================================= */
  const handleEdit = async (b) => {
    const pass = await askPassword("Edit Authorization");
    if (!pass) return;

    Swal.fire({
      width: "300px",
      padding: "20px",
      title: "Verifying Password...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const isValid = await verifyPasswordApi(pass);
    Swal.close();

    if (!isValid) {
      return Swal.fire({
        width: "360px",
        icon: "error",
        title: "Access Denied",
        text: "Incorrect security password.",
        confirmButtonColor: "#dc2626",
      });
    }

    setAuthPassword(pass);
    setForm({
      bank_name: b.bank_name || "",
      account_title: b.account_title || "",
      account_number: b.account_number || "",
      status: b.status || "Active",
    });
    setEditId(b.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================================================
     SEARCH FILTER
  ========================================================= */
  const handleSearch = (value) => {
    setSearch(value);
    const lower = value.toLowerCase();
    const filtered = banks.filter(
      (b) =>
        (b.id && String(b.id).toLowerCase().includes(lower)) ||
        (b.bank_name && b.bank_name.toLowerCase().includes(lower)) ||
        (b.account_title && b.account_title.toLowerCase().includes(lower)) ||
        (b.account_number && b.account_number.toLowerCase().includes(lower))
    );
    setFilteredBanks(filtered);
  };

  return (
    <div className="mmt-users-page">
      <div className="mmt-container">
        {/* HEADER */}
        <div className="mmt-header">
          <div className="mmt-header-content">
            <div className="mmt-brand">
              <div className="mmt-brand-icon">
                <Building2 size={28} />
              </div>
              <div>
                <div className="mmt-overline">FINANCIAL ACCOUNTS</div>
                <h2>Bank Profiles Directory</h2>
                <p>Manage company bank accounts, IBANs, and authorization details</p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="mmt-back-btn"
                onClick={() => onNavigate("dashboard")}
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="mmt-stats">
          <div className="mmt-stat-card blue">
            <div className="mmt-stat-icon">
              <Building size={24} />
            </div>
            <div>
              <span>Total Bank Accounts</span>
              <strong>{totalBanks}</strong>
              <small>Registered bank profiles</small>
            </div>
          </div>
          <div className="mmt-stat-card green">
            <div className="mmt-stat-icon">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span>Active Accounts</span>
              <strong>{activeBanksCount}</strong>
              <small>Operational for ledger entries</small>
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
                <h4>{editId ? "Edit Bank Profile" : "Add New Bank Profile"}</h4>
                <p>
                  {editId
                    ? "Update existing account and IBAN details"
                    : "Configure a new bank account for payment ledger tracking"}
                </p>
              </div>
            </div>
            {editId && (
              <div className="editing-badge">
                <Pencil size={13} />
                Editing Bank Profile #{editId}
              </div>
            )}
          </div>

          <div className="mmt-form-body">
            <div className="row g-3">
              {/* BANK NAME */}
              <div className="col-12 col-md-6 col-xl-4">
                <label>BANK NAME</label>
                <div className="mmt-input-wrap">
                  <Building size={16} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="e.g. Meezan Bank, HBL"
                    value={form.bank_name}
                    onChange={(e) =>
                      setForm({ ...form, bank_name: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ACCOUNT TITLE */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>ACCOUNT TITLE</label>
                <div className="mmt-input-wrap">
                  <FileText size={16} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="e.g. Travel Agency Pvt Ltd"
                    value={form.account_title}
                    onChange={(e) =>
                      setForm({ ...form, account_title: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ACCOUNT / IBAN NUMBER */}
              <div className="col-12 col-md-6 col-xl-3">
                <label>ACCOUNT / IBAN</label>
                <div className="mmt-input-wrap">
                  <CreditCard size={16} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="e.g. PK36MEZN000..."
                    value={form.account_number}
                    onChange={(e) =>
                      setForm({ ...form, account_number: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* STATUS */}
              <div className="col-12 col-md-6 col-xl-2">
                <label>STATUS</label>
                <div className="mmt-input-wrap">
                  <select
                    style={{
                      width: "100%",
                      border: 0,
                      outline: 0,
                      background: "transparent",
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "#0f172a",
                    }}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* SAVE / ACTIONS */}
              <div className="col-12 col-md-6 col-xl-4">
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
                      Update Bank Profile
                    </>
                  ) : (
                    <>
                      <PlusCircle size={17} />
                      Save Bank Profile
                    </>
                  )}
                </button>
              </div>

              {/* CANCEL EDIT */}
              {editId && (
                <div className="col-12 col-md-6 col-xl-4">
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
                <Building2 size={20} />
              </div>
              <div>
                <h4>Active Bank Profiles</h4>
                <p>Overview of bank accounts and active statuses</p>
              </div>
            </div>

            <div className="mmt-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search ID, Bank, Account, IBAN..."
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
                  <th>ID</th>
                  <th>Bank Name</th>
                  <th>Account Title</th>
                  <th>Account / IBAN Number</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-users">
                      <Building2 size={38} />
                      <strong>No Bank Profiles Found</strong>
                      <span>There are currently no bank accounts configured.</span>
                    </td>
                  </tr>
                ) : (
                  filteredBanks.map((b) => (
                    <tr key={b.id} className={editId === b.id ? "editing-row" : ""}>
                      <td>
                        <span className="code-badge blue">#{b.id}</span>
                      </td>
                      <td>
                        <strong className="text-dark">{b.bank_name}</strong>
                      </td>
                      <td>
                        <span className="date-text">{b.account_title || "—"}</span>
                      </td>
                      <td>
                        <strong className="text-primary">{b.account_number}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            background: b.status === "Active" ? "#d1fae5" : "#fee2e2",
                            color: b.status === "Active" ? "#047857" : "#dc2626",
                            border: `1px solid ${b.status === "Active" ? "#a7f3d0" : "#fca5a5"}`,
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="edit-btn"
                            title="Edit"
                            onClick={() => handleEdit(b)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            title="Delete"
                            onClick={() => handleDelete(b)}
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
              <Building2 size={14} />
              {totalBanks} registered bank profiles
            </span>
          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="mmt-security-note">
          <ShieldCheck size={16} />
          <span>
            Bank profile updates and deletions are protected by administrator security verification.
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
        .mmt-stat-card.green .mmt-stat-icon { background: #d1fae5; color: #047857; }
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
        .mmt-save-btn, .mmt-cancel-edit { width: 100%; height: 45px; border: 0; border-radius: 11px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: .2s ease; margin-top: 23px; }
        .mmt-save-btn { color: #ffffff; background: linear-gradient(135deg, #1d4ed8, #4338ca); box-shadow: 0 8px 18px rgba(29,78,216,.25); }
        .mmt-save-btn.edit { background: linear-gradient(135deg, #b45309, #c2410c); }
        .mmt-cancel-edit { background: #e2e8f0; border: 1px solid #cbd5e1; color: #1e293b; }
        .mmt-search-wrap { display: flex; align-items: center; background: #ffffff; border: 1px solid #94a3b8; border-radius: 12px; padding: 0 12px; gap: 8px; width: 320px; height: 40px; }
        .mmt-search-wrap input { border: 0; outline: 0; font-size: 12px; font-weight: 600; width: 100%; }
        .mmt-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .mmt-table thead th { padding: 14px 16px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #1e293b; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .mmt-table tbody td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 12px; font-weight: 600; }
        .code-badge.blue { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; border: 1px solid #7dd3fc; }
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