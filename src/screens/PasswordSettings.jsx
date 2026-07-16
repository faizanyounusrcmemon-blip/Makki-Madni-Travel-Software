import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function PasswordSettings({ onNavigate }) {
  const [passwordsList, setPasswordsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // 2. Dynamic Input Toggle Handler
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

  // 3. Open Password Modification Modal
  const openPasswordModal = async (key_name, display_name) => {
    const { value: formValues } = await Swal.fire({
      width: "400px",
      padding: "1.5em",
      title: `🔑 Change Password`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; margin-top: 10px; font-family: system-ui, sans-serif;">
          <p style="margin-bottom: 16px; color: #64748b;">Updating credentials for <strong style="color: #1e293b;">${display_name}</strong></p>
          
          <div style="margin-bottom: 14px;">
            <label style="font-weight: 600; font-size: 12px; color: #475569;">Old Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input id="swal-old-pass" type="password" class="swal2-input" 
                style="width: 100%; height: 42px; font-size: 13px; margin: 6px 0 0 0; padding: 0 40px 0 12px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; transition: border 0.2s;" 
                placeholder="Enter Old Password"/>
              <button id="swal-old-pass-btn" type="button" onclick="window.toggleSwalPasswordVisibility('swal-old-pass')"
                style="position: absolute; right: 12px; bottom: 9px; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0;">
                👁️
              </button>
            </div>
          </div>

          <div style="margin-bottom: 5px;">
            <label style="font-weight: 600; font-size: 12px; color: #475569;">New Password</label>
            <div style="position: relative; display: flex; align-items: center;">
              <input id="swal-new-pass" type="password" class="swal2-input" 
                style="width: 100%; height: 42px; font-size: 13px; margin: 6px 0 0 0; padding: 0 40px 0 12px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; transition: border 0.2s;" 
                placeholder="Enter New Password"/>
              <button id="swal-new-pass-btn" type="button" onclick="window.toggleSwalPasswordVisibility('swal-new-pass')"
                style="position: absolute; right: 12px; bottom: 9px; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0;">
                👁️
              </button>
            </div>
          </div>

        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Update Password",
      customClass: {
        popup: 'rounded-4'
      },
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
        Swal.fire({ title: "Updating Password...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
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
          Swal.fire({ width: "320px", title: "Success!", text: "Password changed successfully.", icon: "success" });
          loadPasswords(); 
        } else {
          Swal.fire("Error", data.message || "Failed to update password", "error");
        }
      } catch {
        Swal.fire("Error", "Server sync communication failed", "error");
      }
    }
  };

  // 4. Open Description Modification Modal
  const openDescriptionModal = async (key_name, display_name, current_description) => {
    const { value: descriptionValue } = await Swal.fire({
      width: "400px",
      padding: "1.5em",
      title: `📝 Edit Description`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; margin-top: 10px; font-family: system-ui, sans-serif;">
          <p style="margin-bottom: 14px; color: #64748b;">Update description for <strong style="color: #1e293b;">${display_name}</strong></p>
          <div>
            <label style="font-weight: 600; font-size: 12px; color: #475569;">Description</label>
            <textarea id="swal-desc" class="swal2-textarea" 
              style="width: 100%; height: 90px; font-size: 13px; margin: 6px 0 0 0; padding: 10px 12px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; resize: none; transition: border 0.2s;" 
              placeholder="Enter setting description">${current_description || ""}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Save Description",
      preConfirm: () => {
        return document.getElementById("swal-desc").value;
      }
    });

    if (descriptionValue !== undefined) {
      try {
        Swal.fire({ title: "Updating Description...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/system-settings/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key_name,
            description: descriptionValue
          })
        });

        const data = await res.json();
        Swal.close();

        if (data.success) {
          Swal.fire({ width: "320px", title: "Success!", text: "Description updated successfully.", icon: "success" });
          loadPasswords(); 
        } else {
          Swal.fire("Error", data.message || "Failed to update description", "error");
        }
      } catch {
        Swal.fire("Error", "Server sync communication failed", "error");
      }
    }
  };

  // 5. Live Search Filter Logic
  const filteredPasswords = passwordsList.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.display_name?.toLowerCase().includes(search) ||
      item.key_name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Upper Elegant Header Banner */}
      <div className="card shadow border-0 mb-4" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
        <div className="card-body p-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center text-white gap-3">
          <div>
            <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ letterSpacing: "-0.5px" }}>
              <span>⚙️</span> Global Settings Hub
            </h4>
            <p className="mb-0 text-white-50 small">Manage dynamic system architecture credentials and descriptions</p>
          </div>
          <button className="btn btn-outline-light btn-sm fw-semibold px-3 py-2 text-nowrap" style={{ borderRadius: "10px", transition: "all 0.2s" }} onClick={() => onNavigate("dashboard")}>
            ← Exit Settings
          </button>
        </div>
      </div>

      {/* Action Bar (Search Input Block) */}
      <div className="row mb-3 g-3 align-items-center">
        <div className="col-12 col-md-5 col-lg-4 ms-auto">
          <div className="position-relative d-flex align-items-center">
            <span className="position-absolute start-0 ps-3 text-muted" style={{ zIndex: 5, fontSize: "15px" }}>🔍</span>
            <input 
              type="text" 
              className="form-control bg-white shadow-sm border-secondary-subtle py-2.5" 
              style={{ paddingLeft: "40px", borderRadius: "12px", fontSize: "14px", transition: "all 0.2s" }}
              placeholder="Search keys, names or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="btn position-absolute end-0 border-0 me-1 text-muted small" 
                style={{ zIndex: 5, background: "none" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card shadow-sm border border-light-subtle" style={{ borderRadius: "16px", overflow: "hidden", background: "#ffffff" }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "14px" }}>
<thead className="table-light" style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
  <tr>
    <th style={{ width: "8%", padding: "18px 20px" }}>S.No</th> {/* <-- Yeh line add karein */}
    <th style={{ width: "22%" }} className="fw-semibold">Display Name</th>
    <th style={{ width: "20%" }} className="fw-semibold">System Key</th>
    <th style={{ width: "30%" }} className="fw-semibold">Description</th>
    <th style={{ width: "20%" }} className="text-center fw-semibold">Actions</th>
  </tr>
</thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Reading System Settings Securely...
                  </td>
                </tr>
              )}

{!loading && filteredPasswords.map((p, index) => (
  <tr key={p.id} className="align-middle">
    {/* 👇 Serial Number Cell (Index 0 se start hota hai, isliye +1 kiya hai) */}
    <td style={{ padding: "18px 20px" }} className="text-muted fw-semibold">
      {index + 1}
    </td>
    
    <td className="fw-semibold text-dark">
      <span className="me-2">🔒</span> {p.display_name}
    </td>

                  <td>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2.5 py-1.5" style={{ fontSize: "12px", borderRadius: "6px" }}>
                      {p.key_name}
                    </span>
                  </td>
                  <td className="text-secondary" style={{ fontSize: "13px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.description ? (
                      <span>{p.description}</span>
                    ) : (
                      <span className="text-muted fst-italic opacity-50">No description added.</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      {/* Password Button with Gradient Accent */}
                      <button 
                        className="btn btn-sm text-white fw-semibold px-3 py-1.5" 
                        style={{ borderRadius: "8px", fontSize: "12px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" }}
                        onClick={() => openPasswordModal(p.key_name, p.display_name)}
                      >
                        🔑 Change Password
                      </button>
                      
                      {/* Description Button */}
                      <button 
                        className="btn btn-outline-secondary btn-sm fw-semibold px-3 py-1.5" 
                        style={{ borderRadius: "8px", fontSize: "12px", borderColor: "#cbd5e1" }}
                        onClick={() => openDescriptionModal(p.key_name, p.display_name, p.description)}
                      >
                        📝 Change Description
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredPasswords.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted fst-italic">
                    🚫 No matching records found for "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}