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
  // Flow:
  // Step 1 -> ask ONLY for old password
  // Step 2 -> verify old password on server
  // Step 3 -> if correct, ask for new password + confirmation
  // Step 4 -> update password
  const openPasswordModal = async (key_name, display_name) => {
    // STEP 1: OLD PASSWORD ONLY
    const { value: oldPassword } = await Swal.fire({
      width: "430px",
      padding: "0",
      background: "#ffffff",
      title: "",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;overflow:hidden;border-radius:22px;">
          <div style="
            padding:24px 24px 20px;
            background:linear-gradient(135deg,#07152f 0%,#12356f 55%,#2563eb 100%);
            color:#fff;
            text-align:left;
          ">
            <div style="display:flex;align-items:center;gap:13px;">
              <div style="
                width:48px;height:48px;border-radius:15px;
                display:flex;align-items:center;justify-content:center;
                background:rgba(255,255,255,.13);
                border:1px solid rgba(255,255,255,.18);
                font-size:23px;
              ">🔐</div>
              <div>
                <div style="font-size:10px;font-weight:800;letter-spacing:1.8px;color:#bfdbfe;">
                  SECURITY VERIFICATION
                </div>
                <div style="font-size:20px;font-weight:800;margin-top:3px;">
                  Change Password
                </div>
              </div>
            </div>
            <div style="
              margin-top:17px;padding:10px 12px;border-radius:11px;
              background:rgba(255,255,255,.09);
              border:1px solid rgba(255,255,255,.10);
              font-size:12px;color:#dbeafe;
            ">
              🔑 <strong style="color:#fff;">${display_name}</strong>
            </div>
          </div>

          <div style="padding:22px 24px 8px;text-align:left;">
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:5px;">
              Enter your current password
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:14px;">
              Your current password will be verified before the new password screen opens.
            </div>

            <div style="position:relative;">
              <input
                id="swal-old-pass"
                type="password"
                autocomplete="current-password"
                placeholder="Current / Old Password"
                style="
                  width:100%;height:48px;box-sizing:border-box;
                  padding:0 48px 0 14px;
                  border:1px solid #dbe3ef;border-radius:12px;
                  background:#f8fafc;color:#0f172a;
                  font-size:13px;outline:none;
                "
              />
              <button
                id="swal-old-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-old-pass')"
                style="
                  position:absolute;right:10px;top:50%;transform:translateY(-50%);
                  width:34px;height:34px;border:0;border-radius:9px;
                  background:#eef4ff;color:#2563eb;font-size:16px;
                  cursor:pointer;
                "
              >👁️</button>
            </div>
          </div>

          <div style="
            display:flex;justify-content:center;gap:6px;
            padding:12px 0 2px;
          ">
            <span style="width:24px;height:5px;border-radius:99px;background:#2563eb;"></span>
            <span style="width:24px;height:5px;border-radius:99px;background:#e2e8f0;"></span>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Verify Password →",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-4",
        confirmButton: "px-4",
        cancelButton: "px-4"
      },
      didOpen: () => {
        const input = document.getElementById("swal-old-pass");
        input?.focus();
        input?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") Swal.clickConfirm();
        });
      },
      preConfirm: () => {
        const value = document.getElementById("swal-old-pass")?.value?.trim();

        if (!value) {
          Swal.showValidationMessage("Please enter your current password.");
          return false;
        }

        return value;
      }
    });

    if (!oldPassword) return;

    // STEP 2: VERIFY OLD PASSWORD ON SERVER
    try {
      Swal.fire({
        width: "340px",
        title: "Verifying...",
        text: "Checking your current password securely.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key_name,
            oldPassword
          })
        }
      );

      const verifyData = await verifyRes.json();
      Swal.close();

      if (!verifyData.success) {
        await Swal.fire({
          width: "390px",
          icon: "error",
          title: "Wrong Password",
          text: verifyData.message || "The current password is incorrect.",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Try Again"
        });

        // Start again from OLD PASSWORD — never show new password
        return openPasswordModal(key_name, display_name);
      }
    } catch (err) {
      console.error("PASSWORD VERIFY ERROR:", err);
      Swal.close();

      Swal.fire({
        width: "390px",
        icon: "error",
        title: "Verification Failed",
        text: "Could not verify the current password. Please try again.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    // STEP 3: NEW PASSWORD + CONFIRMATION
    const { value: newPasswords } = await Swal.fire({
      width: "430px",
      padding: "0",
      background: "#ffffff",
      title: "",
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;overflow:hidden;border-radius:22px;">
          <div style="
            padding:24px 24px 20px;
            background:linear-gradient(135deg,#07152f 0%,#12356f 55%,#2563eb 100%);
            color:#fff;text-align:left;
          ">
            <div style="display:flex;align-items:center;gap:13px;">
              <div style="
                width:48px;height:48px;border-radius:15px;
                display:flex;align-items:center;justify-content:center;
                background:rgba(255,255,255,.13);
                border:1px solid rgba(255,255,255,.18);
                font-size:23px;
              ">🛡️</div>
              <div>
                <div style="font-size:10px;font-weight:800;letter-spacing:1.8px;color:#bfdbfe;">
                  STEP 2 OF 2
                </div>
                <div style="font-size:20px;font-weight:800;margin-top:3px;">
                  Create New Password
                </div>
              </div>
            </div>
            <div style="
              margin-top:17px;padding:10px 12px;border-radius:11px;
              background:rgba(16,185,129,.16);
              border:1px solid rgba(167,243,208,.18);
              font-size:11px;color:#d1fae5;
            ">
              ✓ Current password verified successfully
            </div>
          </div>

          <div style="padding:22px 24px 8px;text-align:left;">
            <div style="font-size:12px;font-weight:800;color:#334155;margin-bottom:8px;">
              New Password
            </div>

            <div style="position:relative;">
              <input
                id="swal-new-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Enter new password"
                style="
                  width:100%;height:48px;box-sizing:border-box;
                  padding:0 48px 0 14px;
                  border:1px solid #dbe3ef;border-radius:12px;
                  background:#f8fafc;color:#0f172a;font-size:13px;outline:none;
                "
              />
              <button
                id="swal-new-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-new-pass')"
                style="
                  position:absolute;right:10px;top:50%;transform:translateY(-50%);
                  width:34px;height:34px;border:0;border-radius:9px;
                  background:#eef4ff;color:#2563eb;font-size:16px;cursor:pointer;
                "
              >👁️</button>
            </div>

            <div style="font-size:12px;font-weight:800;color:#334155;margin:14px 0 8px;">
              Confirm New Password
            </div>

            <div style="position:relative;">
              <input
                id="swal-confirm-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                style="
                  width:100%;height:48px;box-sizing:border-box;
                  padding:0 48px 0 14px;
                  border:1px solid #dbe3ef;border-radius:12px;
                  background:#f8fafc;color:#0f172a;font-size:13px;outline:none;
                "
              />
              <button
                id="swal-confirm-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-confirm-pass')"
                style="
                  position:absolute;right:10px;top:50%;transform:translateY(-50%);
                  width:34px;height:34px;border:0;border-radius:9px;
                  background:#eef4ff;color:#2563eb;font-size:16px;cursor:pointer;
                "
              >👁️</button>
            </div>

            <div style="
              margin-top:12px;padding:10px 12px;border-radius:10px;
              background:#f8fafc;border:1px solid #e8eef7;
              font-size:10px;color:#64748b;line-height:1.6;
            ">
              💡 Use a password that is difficult to guess and do not share it with anyone.
            </div>
          </div>

          <div style="
            display:flex;justify-content:center;gap:6px;
            padding:12px 0 2px;
          ">
            <span style="width:24px;height:5px;border-radius:99px;background:#22c55e;"></span>
            <span style="width:24px;height:5px;border-radius:99px;background:#2563eb;"></span>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "🔐 Change Password",
      cancelButtonText: "Back",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-4",
        confirmButton: "px-4",
        cancelButton: "px-4"
      },
      didOpen: () => {
        document.getElementById("swal-new-pass")?.focus();
      },
      preConfirm: () => {
        const newPassword = document.getElementById("swal-new-pass")?.value || "";
        const confirmPassword = document.getElementById("swal-confirm-pass")?.value || "";

        if (!newPassword || !confirmPassword) {
          Swal.showValidationMessage("Both new password fields are required.");
          return false;
        }



        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage("New passwords do not match.");
          return false;
        }

        if (newPassword === oldPassword) {
          Swal.showValidationMessage("New password must be different from the old password.");
          return false;
        }

        return { newPassword, confirmPassword };
      }
    });

    if (!newPasswords) return;

    // STEP 4: UPDATE PASSWORD
    try {
      Swal.fire({
        width: "340px",
        title: "Updating Password...",
        text: "Saving your new password securely.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key_name,
            oldPassword,
            newPassword: newPasswords.newPassword
          })
        }
      );

      const data = await res.json();
      Swal.close();

      if (data.success) {
        await Swal.fire({
          width: "390px",
          icon: "success",
          title: "Password Changed!",
          html: `
            <div style="font-size:13px;color:#475569;line-height:1.6;">
              Your password for <strong style="color:#0f172a;">${display_name}</strong>
              has been changed successfully.
              <div style="
                margin-top:13px;padding:10px;border-radius:10px;
                background:#ecfdf5;color:#047857;font-size:11px;font-weight:700;
              ">
                🛡️ Your account is protected with the new password.
              </div>
            </div>
          `,
          confirmButtonColor: "#059669",
          confirmButtonText: "Done"
        });

        loadPasswords();
      } else {
        Swal.fire({
          width: "390px",
          icon: "error",
          title: "Password Not Changed",
          text: data.message || "Failed to update password.",
          confirmButtonColor: "#dc2626"
        });
      }
    } catch (err) {
      console.error("PASSWORD UPDATE ERROR:", err);
      Swal.fire({
        width: "390px",
        icon: "error",
        title: "Server Error",
        text: "Server communication failed while changing the password.",
        confirmButtonColor: "#dc2626"
      });
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
    <div
      style={{
        minHeight: "100vh",
        padding: "28px",
        boxSizing: "border-box",
        fontFamily: "'Inter', system-ui, sans-serif",
        background:
          "radial-gradient(circle at 15% 10%, rgba(37,99,235,.13), transparent 28%), radial-gradient(circle at 90% 85%, rgba(14,165,233,.10), transparent 25%), linear-gradient(135deg,#f7f9fc 0%,#eef4ff 100%)",
      }}
    >
      <style>{`
        .ps-card {
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }
        .ps-row {
          transition: background .18s ease, transform .18s ease;
        }
        .ps-row:hover {
          background: #f8fbff !important;
        }
        .ps-action {
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .ps-action:hover {
          transform: translateY(-2px);
        }
        .ps-search:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59,130,246,.10) !important;
        }
        @media (max-width: 900px) {
          .ps-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .ps-search-wrap {
            width: 100% !important;
          }
          .ps-search-box {
            width: 100% !important;
          }
        }
      `}</style>

      {/* ========================= HERO HEADER ========================= */}
      <div
        className="ps-card"
        style={{
          maxWidth: "1400px",
          margin: "0 auto 22px",
          borderRadius: "24px",
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg,#081225 0%,#10244b 48%,#1d4ed8 100%)",
          boxShadow: "0 18px 50px rgba(15,23,42,.20)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            borderRadius: "50%",
            right: -130,
            top: -190,
            background: "rgba(255,255,255,.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 210,
            height: 210,
            borderRadius: "50%",
            right: 110,
            bottom: -150,
            background: "rgba(96,165,250,.10)",
          }}
        />

        <div
          className="ps-header"
          style={{
            minHeight: "180px",
            padding: "28px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,.10)",
                border: "1px solid rgba(255,255,255,.16)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
                fontSize: "30px",
                backdropFilter: "blur(10px)",
              }}
            >
              🔐
            </div>

            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "2.6px",
                  color: "#bfdbfe",
                  marginBottom: "7px",
                }}
              >
                SYSTEM SECURITY • CONTROL CENTER
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: "31px",
                  fontWeight: 800,
                  letterSpacing: "-.8px",
                }}
              >
                Global Settings Hub
              </h1>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#dbeafe",
                  fontSize: "13px",
                  maxWidth: "670px",
                }}
              >
                Securely manage system passwords and configuration descriptions
                from one professional workspace.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("dashboard")}
            className="ps-action"
            style={{
              border: "1px solid rgba(255,255,255,.20)",
              background: "rgba(255,255,255,.10)",
              color: "#fff",
              padding: "11px 18px",
              borderRadius: "13px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 20px rgba(0,0,0,.12)",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* ========================= STAT CARDS ========================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div
            className="ps-card"
            style={{
              background: "#fff",
              border: "1px solid #e8eef7",
              borderRadius: "18px",
              padding: "17px",
              boxShadow: "0 10px 28px rgba(15,23,42,.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, letterSpacing: ".7px" }}>
                  TOTAL SETTINGS
                </div>
                <div style={{ color: "#0f172a", fontSize: "28px", fontWeight: 800, marginTop: "5px" }}>
                  {passwordsList.length}
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eff6ff",
                  fontSize: "21px",
                }}
              >
                ⚙️
              </div>
            </div>
          </div>

          <div
            className="ps-card"
            style={{
              background: "#fff",
              border: "1px solid #e8eef7",
              borderRadius: "18px",
              padding: "17px",
              boxShadow: "0 10px 28px rgba(15,23,42,.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, letterSpacing: ".7px" }}>
                  SHOWING
                </div>
                <div style={{ color: "#0f172a", fontSize: "28px", fontWeight: 800, marginTop: "5px" }}>
                  {filteredPasswords.length}
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ecfeff",
                  fontSize: "21px",
                }}
              >
                🔎
              </div>
            </div>
          </div>

          <div
            className="ps-card"
            style={{
              background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
              border: "1px solid #d1fae5",
              borderRadius: "18px",
              padding: "17px",
              boxShadow: "0 10px 28px rgba(15,23,42,.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#047857", fontSize: "11px", fontWeight: 800, letterSpacing: ".7px" }}>
                  SECURITY STATUS
                </div>
                <div style={{ color: "#065f46", fontSize: "18px", fontWeight: 800, marginTop: "7px" }}>
                  Protected
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  fontSize: "21px",
                }}
              >
                🛡️
              </div>
            </div>
          </div>
        </div>

        {/* ========================= SEARCH BAR ========================= */}
        <div
          className="ps-card"
          style={{
            background: "#fff",
            border: "1px solid #e8eef7",
            borderRadius: "18px",
            padding: "14px",
            marginBottom: "18px",
            boxShadow: "0 10px 28px rgba(15,23,42,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "18px",
              }}
            >
              🔍
            </div>

            <div>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>
                Search Settings
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                Search by display name, key or description
              </div>
            </div>

            <div
              className="ps-search-wrap"
              style={{
                marginLeft: "auto",
                width: "min(520px,48%)",
                minWidth: "240px",
              }}
            >
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control ps-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                  style={{
                    height: "44px",
                    borderRadius: "12px",
                    border: "1px solid #dbe3ef",
                    background: "#f8fafc",
                    padding: searchTerm ? "0 42px 0 14px" : "0 14px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#e2e8f0",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================= TABLE ========================= */}
        <div
          className="ps-card"
          style={{
            background: "#fff",
            border: "1px solid #e8eef7",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 14px 34px rgba(15,23,42,.07)",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #edf2f7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                🔐 System Credentials
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Passwords and setting descriptions
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                borderRadius: "999px",
                padding: "7px 12px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              {filteredPasswords.length} RECORDS
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th className="px-4 py-3 text-muted" style={{ width: "7%", fontSize: "10px", letterSpacing: "1px" }}>
                    #
                  </th>
                  <th className="py-3 text-muted" style={{ width: "22%", fontSize: "10px", letterSpacing: "1px" }}>
                    DISPLAY NAME
                  </th>
                  <th className="py-3 text-muted" style={{ width: "20%", fontSize: "10px", letterSpacing: "1px" }}>
                    SYSTEM KEY
                  </th>
                  <th className="py-3 text-muted" style={{ width: "28%", fontSize: "10px", letterSpacing: "1px" }}>
                    DESCRIPTION
                  </th>
                  <th className="py-3 pe-4 text-center text-muted" style={{ width: "23%", fontSize: "10px", letterSpacing: "1px" }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          border: "4px solid #dbeafe",
                          borderTopColor: "#2563eb",
                          margin: "0 auto 12px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <div className="fw-bold text-dark">Loading system settings...</div>
                      <div className="text-muted small mt-1">Please wait</div>
                    </td>
                  </tr>
                )}

                {!loading && filteredPasswords.map((p, index) => (
                  <tr key={p.id} className="ps-row">
                    <td className="px-4 py-3">
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </div>
                    </td>

                    <td className="py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "11px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                            fontSize: "18px",
                          }}
                        >
                          🔒
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: "13px" }}>
                            {p.display_name}
                          </div>
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                            System credential
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 10px",
                          borderRadius: "9px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #dbeafe",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {p.key_name}
                      </span>
                    </td>

                    <td className="py-3">
                      {p.description ? (
                        <div
                          style={{
                            color: "#475569",
                            fontSize: "12px",
                            lineHeight: 1.55,
                            maxWidth: "360px",
                          }}
                        >
                          {p.description}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>
                          No description added
                        </span>
                      )}
                    </td>

                    <td className="py-3 pe-4">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="ps-action"
                          style={{
                            border: "none",
                            color: "#fff",
                            background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 6px 15px rgba(37,99,235,.18)",
                          }}
                          onClick={() => openPasswordModal(p.key_name, p.display_name)}
                        >
                          🔑 Change Password
                        </button>

                        <button
                          type="button"
                          className="ps-action"
                          style={{
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            background: "#fff",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                          onClick={() => openDescriptionModal(p.key_name, p.display_name, p.description)}
                        >
                          📝 Description
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredPasswords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div
                        style={{
                          width: "74px",
                          height: "74px",
                          borderRadius: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: "32px",
                        }}
                      >
                        🔎
                      </div>
                      <div className="fw-bold text-dark" style={{ fontSize: "15px" }}>
                        No matching settings
                      </div>
                      <div className="text-muted small mt-1">
                        Try another search term.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
            color: "#64748b",
            fontSize: "11px",
          }}
        >
          <span>🛡️</span>
          <span>Protected system settings • Changes are synchronized with the server</span>
        </div>
      </div>
    </div>
  );
}