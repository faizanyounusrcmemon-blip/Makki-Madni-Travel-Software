import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function PasswordSettings({ onNavigate }) {
  const [passwordsList, setPasswordsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Load data from backend database api
  const loadPasswords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/system-settings/list`);
      const data = await res.json();
      if (data.success) {
        setPasswordsList(data.data || []);
      }
    } catch (err) {
      console.error("Error loading system passwords:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasswords();
  }, []);

  // 2. Dynamic Input Toggle Handler (Inline dynamic listener inside sweetalert container DOM context)
  window.toggleSwalPasswordVisibility = (inputId) => {
    const inputField = document.getElementById(inputId);
    if (!inputField) return;
    
    if (inputField.type === "password") {
      inputField.type = "text";
      document.getElementById(`${inputId}-btn`).innerHTML = "🙈";
    } else {
      inputField.type = "password";
      document.getElementById(`${inputId}-btn`).innerHTML = "👁️";
    }
  };

  // 3. Open Password Modification Modal Interface Window
  const openChangeModal = async (key_name, display_name) => {
    const { value: formValues } = await Swal.fire({
      width: "380px",
      padding: "1.2em",
      title: `🔑 Edit: ${display_name}`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; margin-top: 10px;">
          
          <div style="margin-bottom: 12px;">
            <label style="font-weight: 600; font-size: 12px; color: #475569;">Old Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input id="swal-old-pass" type="password" class="swal2-input" 
                style="width: 100%; height: 38px; font-size: 13px; margin: 4px 0 0 0; padding: 0 40px 0 10px; box-sizing: border-box;" 
                placeholder="Enter Old Password"/>
              <button id="swal-old-pass-btn" type="button" onclick="window.toggleSwalPasswordVisibility('swal-old-pass')"
                style="position: absolute; right: 8px; bottom: 6px; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0;">
                👁️
              </button>
            </div>
          </div>

          <div style="margin-bottom: 5px;">
            <label style="font-weight: 600; font-size: 12px; color: #475569;">New Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input id="swal-new-pass" type="password" class="swal2-input" 
                style="width: 100%; height: 38px; font-size: 13px; margin: 4px 0 0 0; padding: 0 40px 0 10px; box-sizing: border-box;" 
                placeholder="Enter New Password"/>
              <button id="swal-new-pass-btn" type="button" onclick="window.toggleSwalPasswordVisibility('swal-new-pass')"
                style="position: absolute; right: 8px; bottom: 6px; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0;">
                👁️
              </button>
            </div>
          </div>

        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Confirm Change",
      preConfirm: () => {
        const oldPassword = document.getElementById("swal-old-pass").value;
        const newPassword = document.getElementById("swal-new-pass").value;

        if (!oldPassword || !newPassword) {
          Swal.showValidationMessage("Both fields are required!");
          return false;
        }
        return { oldPassword, newPassword };
      }
    });

    if (formValues) {
      try {
        Swal.fire({ title: "Processing...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/system-settings/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key_name,
            oldPassword: formValues.oldPassword, 
            newPassword: formValues.newPassword
          })
        });

        const data = await res.json();
        Swal.close();

        if (data.success) {
          Swal.fire({ width: "300px", title: "Updated!", text: "Password changed successfully.", icon: "success" });
          loadPasswords(); 
        } else {
          Swal.fire("Error", data.message || "Failed to update", "error");
        }
      } catch {
        Swal.fire("Error", "Server sync communication failed", "error");
      }
    }
  };

  return (
    <div className="container py-3">
      {/* Upper Status Banner Section Control */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px", background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center text-white">
          <div>
            <h4 className="fw-bold mb-1">⚙️ Global Password Architecture Control</h4>
            <p className="mb-0 text-white-50 small">Manage dynamic system level functional credentials centrally</p>
          </div>
          <button className="btn btn-outline-light btn-sm fw-semibold" onClick={() => onNavigate("dashboard")}>
            ← Exit Settings
          </button>
        </div>
      </div>

      {/* Database Dynamic Password Table Core UI Module */}
      <div className="card shadow-sm border-0" style={{ borderRadius: "12px" }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: "30%", padding: "15px" }}>Display Name</th>
                <th style={{ width: "25%" }}>System Key</th>
                <th style={{ width: "30%" }}>Description</th>
                <th style={{ width: "15%" }} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">Reading System Settings Securely...</td>
                </tr>
              )}

              {!loading && passwordsList.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "15px" }} className="fw-bold text-dark">🔒 {p.display_name}</td>
                  <td><span className="badge bg-light text-secondary border font-monospace">{p.key_name}</span></td>
                  <td className="text-muted" style={{ fontSize: "13px" }}>{p.description || "-"}</td>
                  <td className="text-center">
                    <button className="btn btn-warning btn-sm fw-bold px-3" onClick={() => openChangeModal(p.key_name, p.display_name)}>
                      ✏️ Change Password
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && passwordsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">No dynamic keys registered in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}