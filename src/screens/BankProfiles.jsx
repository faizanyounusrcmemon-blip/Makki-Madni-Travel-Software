import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function BankProfiles({ onNavigate }) {
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");

  // Form State
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks`);
      const data = await res.json();
      if (data.success) {
        setBanks(data.rows);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SAVE NEW BANK ================= */
  const handleSave = async () => {
    if (!bankName || !accountTitle || !accountNumber) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Fill all required fields!" });
    }

    Swal.fire({ width: "260px", title: "Saving...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: bankName,
          account_title: accountTitle,
          account_number: accountNumber,
          status,
        }),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        setBankName("");
        setAccountTitle("");
        setAccountNumber("");
        setStatus("Active");
        loadBanks();
        Swal.fire({ width: "280px", icon: "success", text: data.message });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: data.error || "Failed to add bank" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* ================= EDIT BANK (PASSWORD PROTECTED) ================= */
  const handleEdit = async (bank) => {
    const { value: formValues } = await Swal.fire({
      width: "360px",
      title: "✏️ Edit Bank Profile",
      html: `
        <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
          <div>
            <label class="fw-bold mb-1">Bank Name</label>
            <input id="swal-bank-name" class="form-control form-control-sm" value="${bank.bank_name}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Account Title</label>
            <input id="swal-acc-title" class="form-control form-control-sm" value="${bank.account_title}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Account / IBAN Number</label>
            <input id="swal-acc-num" class="form-control form-control-sm" value="${bank.account_number}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Status</label>
            <select id="swal-status" class="form-select form-select-sm">
              <option value="Active" ${bank.status === "Active" ? "selected" : ""}>Active</option>
              <option value="Inactive" ${bank.status === "Inactive" ? "selected" : ""}>Inactive</option>
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Authorization Password</label>
            <div style="position:relative;">
              <input id="swal-pass" type="password" class="form-control form-control-sm" placeholder="Password" style="padding-right:35px;" />
              <span id="toggle-pass" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer;">👁</span>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Profile",
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        let visible = false;
        toggle.addEventListener("click", () => {
          visible = !visible;
          input.type = visible ? "text" : "password";
          toggle.textContent = visible ? "🙈" : "👁";
        });
      },
      preConfirm: () => {
        const bName = document.getElementById("swal-bank-name").value.trim();
        const aTitle = document.getElementById("swal-acc-title").value.trim();
        const aNum = document.getElementById("swal-acc-num").value.trim();
        const stat = document.getElementById("swal-status").value;
        const pass = document.getElementById("swal-pass").value.trim();

        if (!bName || !aTitle || !aNum) {
          Swal.showValidationMessage("Please fill required fields");
          return false;
        }
        if (!pass) {
          Swal.showValidationMessage("Password required");
          return false;
        }

        return { bank_name: bName, account_title: aTitle, account_number: aNum, status: stat, password: pass };
      },
    });

    if (!formValues) return;

    Swal.fire({ width: "260px", title: "Updating...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks/${bank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        loadBanks();
        Swal.fire({ width: "280px", icon: "success", text: "Updated Successfully" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: data.error || "Update Failed" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* ================= DELETE BANK (PASSWORD PROTECTED) ================= */
  const handleDelete = async (id) => {
    const { value: password } = await Swal.fire({
      width: "320px",
      title: "Delete Bank Profile?",
      text: "Enter authorization password to confirm:",
      input: "password",
      inputPlaceholder: "Enter Password",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
      inputValidator: (val) => {
        if (!val) return "Password is required!";
      },
    });

    if (!password) return;

    Swal.fire({ width: "260px", title: "Deleting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/banks/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        loadBanks();
        Swal.fire({ width: "280px", icon: "success", text: "Bank Profile Deleted" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: data.error || "Delete Failed" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  const filteredBanks = banks.filter(
    (b) =>
      b.bank_name.toLowerCase().includes(search.toLowerCase()) ||
      b.account_title.toLowerCase().includes(search.toLowerCase()) ||
      b.account_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="d-flex align-items-center">
          <span className="fs-3 me-2">🏛️</span>
          <h4 className="fw-bold mb-0 text-primary">Bank Profiles</h4>
        </div>
        {onNavigate && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
            ⬅ Back
          </button>
        )}
      </div>

      {/* CREATE FORM */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <h6 className="fw-bold mb-3">➕ Create New Bank Profile</h6>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-0 small fw-bold">Bank Name</label>
              <input
                className="form-control form-control-sm"
                placeholder="e.g. Meezan Bank, HBL"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-0 small fw-bold">Account Title</label>
              <input
                className="form-control form-control-sm"
                placeholder="e.g. Travel Agency Pvt Ltd"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-0 small fw-bold">Account / IBAN Number</label>
              <input
                className="form-control form-control-sm"
                placeholder="e.g. PK36MEZN0001000200"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-0 small fw-bold">Status</label>
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-1">
              <button className="btn btn-success btn-sm w-100" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body pb-0">
          <input
            type="text"
            className="form-control form-control-sm mb-3"
            placeholder="🔍 Search Bank Profile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ fontSize: "0.85rem" }}>#</th>
                <th style={{ fontSize: "0.85rem" }}>Bank Name</th>
                <th style={{ fontSize: "0.85rem" }}>Account Title</th>
                <th style={{ fontSize: "0.85rem" }}>Account / IBAN Number</th>
                <th style={{ fontSize: "0.85rem" }}>Status</th>
                <th className="text-center" style={{ fontSize: "0.85rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((b, index) => (
                <tr key={b.id}>
                  <td style={{ fontSize: "0.85rem" }}>{index + 1}</td>
                  <td className="fw-bold text-primary" style={{ fontSize: "0.85rem" }}>{b.bank_name}</td>
                  <td style={{ fontSize: "0.85rem" }}>{b.account_title}</td>
                  <td className="fw-bold" style={{ fontSize: "0.85rem" }}>{b.account_number}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    <span className={`badge ${b.status === "Active" ? "bg-success" : "bg-danger"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex gap-1 justify-content-center">
                      <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleEdit(b)}>
                        Edit
                      </button>
                      <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: "11px" }} onClick={() => handleDelete(b.id)}>
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">No bank profiles found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}