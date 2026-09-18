import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function PasswordSettings({ onNavigate }) {
  const [passwordsList, setPasswordsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOAD SETTINGS
  ===================================================== */
  const loadPasswords = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/list`
      );

      const data = await res.json();

      if (data.success) {
        setPasswordsList(data.data || []);
      }
    } catch (err) {
      console.error("Error loading system passwords:", err);

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to load system settings.",
        confirmButtonColor: "#1e40af",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasswords();
  }, []);

  /* =====================================================
     PASSWORD SHOW / HIDE
  ===================================================== */
  window.toggleSwalPasswordVisibility = (inputId) => {
    const input = document.getElementById(inputId);
    const button = document.getElementById(`${inputId}-btn`);

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      if (button) button.innerHTML = "🙈";
    } else {
      input.type = "password";
      if (button) button.innerHTML = "👁️";
    }
  };

  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */
  const openPasswordModal = async (key_name, display_name) => {

    /* =================================================
       STEP 1 — OLD PASSWORD
    ================================================= */
    const { value: oldPassword } = await Swal.fire({
      width: "400px",
      padding: "0",
      background: "#ffffff",
      showCancelButton: true,
      confirmButtonText: "Verify Password →",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#1e40af",
      cancelButtonColor: "#475569",
      focusConfirm: false,

      html: `
        <div style="
          font-family: Inter, system-ui, -apple-system, sans-serif;
          overflow: hidden;
          border-radius: 18px;
        ">

          <div style="
            padding: 22px;
            background: linear-gradient(135deg, #0f172a, #1e3a8a, #1d4ed8);
            color: #ffffff;
            text-align: left;
          ">

            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
            ">

              <div style="
                width: 44px;
                height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.25);
                font-size: 20px;
              ">
                🔐
              </div>

              <div>
                <div style="
                  font-size: 10px;
                  font-weight: 800;
                  letter-spacing: 1.5px;
                  color: #93c5fd;
                ">
                  SECURITY VERIFICATION
                </div>

                <div style="
                  font-size: 20px;
                  font-weight: 800;
                  margin-top: 2px;
                  color: #ffffff;
                ">
                  Change Password
                </div>
              </div>

            </div>

            <div style="
              margin-top: 14px;
              padding: 9px 12px;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.12);
              font-size: 12px;
              font-weight: 600;
              color: #ffffff;
              border: 1px solid rgba(255, 255, 255, 0.2);
            ">
              🔑 ${display_name}
            </div>

          </div>


          <div style="
            padding: 20px 22px 10px;
            text-align: left;
          ">

            <div style="
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 4px;
            ">
              Current Password
            </div>

            <div style="
              font-size: 11px;
              color: #334155;
              font-weight: 500;
              margin-bottom: 12px;
            ">
              Enter your current password to continue.
            </div>

            <div style="position: relative;">

              <input
                id="swal-old-pass"
                type="password"
                autocomplete="current-password"
                placeholder="Enter old password"
                style="
                  width: 100%;
                  height: 44px;
                  box-sizing: border-box;
                  padding: 0 45px 0 12px;
                  border: 1.5px solid #cbd5e1;
                  border-radius: 10px;
                  background: #f8fafc;
                  color: #0f172a;
                  font-weight: 600;
                  font-size: 13px;
                  outline: none;
                "
              />

              <button
                id="swal-old-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-old-pass')"
                style="
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 32px;
                  height: 32px;
                  border: 0;
                  border-radius: 8px;
                  background: #e2e8f0;
                  color: #1e293b;
                  cursor: pointer;
                "
              >
                👁️
              </button>

            </div>

          </div>


          <div style="
            display: flex;
            justify-content: center;
            gap: 6px;
            padding: 10px 0 4px;
          ">
            <span style="
              width: 26px;
              height: 5px;
              border-radius: 99px;
              background: #1d4ed8;
            "></span>

            <span style="
              width: 26px;
              height: 5px;
              border-radius: 99px;
              background: #cbd5e1;
            "></span>
          </div>

        </div>
      `,

      didOpen: () => {
        document.getElementById("swal-old-pass")?.focus();
      },

      preConfirm: () => {
        const value =
          document.getElementById("swal-old-pass")?.value?.trim() || "";

        if (!value) {
          Swal.showValidationMessage(
            "Please enter your current password."
          );
          return false;
        }

        return value;
      },
    });

    if (!oldPassword) return;


    /* =================================================
       VERIFY OLD PASSWORD
    ================================================= */
    try {
      Swal.fire({
        width: "320px",
        title: "Verifying...",
        text: "Checking current password",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/verify-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name,
            oldPassword,
          }),
        }
      );

      const verifyData = await verifyRes.json();

      Swal.close();

      if (!verifyData.success) {
        await Swal.fire({
          width: "360px",
          icon: "error",
          title: "Wrong Password",
          text: verifyData.message || "The current password is incorrect.",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Try Again",
        });

        return openPasswordModal(key_name, display_name);
      }

    } catch (err) {
      console.error("PASSWORD VERIFY ERROR:", err);

      Swal.close();

      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Verification Failed",
        text: "Unable to verify current password.",
        confirmButtonColor: "#1e40af",
      });

      return;
    }


    /* =================================================
       STEP 2 — NEW PASSWORD
    ================================================= */
    const { value: passwords } = await Swal.fire({
      width: "400px",
      padding: "0",
      background: "#ffffff",
      showCancelButton: true,
      confirmButtonText: "🔐 Change Password",
      cancelButtonText: "Back",
      confirmButtonColor: "#047857",
      cancelButtonColor: "#475569",
      focusConfirm: false,

      html: `
        <div style="
          font-family: Inter, system-ui, -apple-system, sans-serif;
          overflow: hidden;
          border-radius: 18px;
        ">

          <div style="
            padding: 22px;
            background: linear-gradient(135deg, #0f172a, #065f46, #047857);
            color: #ffffff;
            text-align: left;
          ">

            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
            ">

              <div style="
                width: 44px;
                height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.25);
                font-size: 20px;
              ">
                🛡️
              </div>

              <div>

                <div style="
                  font-size: 10px;
                  font-weight: 800;
                  letter-spacing: 1.5px;
                  color: #a7f3d0;
                ">
                  STEP 2 OF 2
                </div>

                <div style="
                  font-size: 20px;
                  font-weight: 800;
                  margin-top: 2px;
                  color: #ffffff;
                ">
                  New Password
                </div>

              </div>

            </div>

            <div style="
              margin-top: 14px;
              padding: 9px 12px;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.15);
              font-size: 11px;
              font-weight: 700;
              color: #ecfdf5;
              border: 1px solid rgba(255, 255, 255, 0.25);
            ">
              ✓ Current password verified
            </div>

          </div>


          <div style="
            padding: 20px 22px 10px;
            text-align: left;
          ">

            <!-- NEW PASSWORD -->

            <div style="
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 6px;
            ">
              New Password
            </div>

            <div style="position: relative;">

              <input
                id="swal-new-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Enter new password"
                style="
                  width: 100%;
                  height: 44px;
                  box-sizing: border-box;
                  padding: 0 45px 0 12px;
                  border: 1.5px solid #cbd5e1;
                  border-radius: 10px;
                  background: #f8fafc;
                  color: #0f172a;
                  font-weight: 600;
                  font-size: 13px;
                  outline: none;
                "
              />

              <button
                id="swal-new-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-new-pass')"
                style="
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 32px;
                  height: 32px;
                  border: 0;
                  border-radius: 8px;
                  background: #e2e8f0;
                  color: #1e293b;
                  cursor: pointer;
                "
              >
                👁️
              </button>

            </div>


            <!-- CONFIRM PASSWORD -->

            <div style="
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
              margin: 14px 0 6px;
            ">
              Confirm New Password
            </div>

            <div style="position: relative;">

              <input
                id="swal-confirm-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                style="
                  width: 100%;
                  height: 44px;
                  box-sizing: border-box;
                  padding: 0 45px 0 12px;
                  border: 1.5px solid #cbd5e1;
                  border-radius: 10px;
                  background: #f8fafc;
                  color: #0f172a;
                  font-weight: 600;
                  font-size: 13px;
                  outline: none;
                "
              />

              <button
                id="swal-confirm-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-confirm-pass')"
                style="
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 32px;
                  height: 32px;
                  border: 0;
                  border-radius: 8px;
                  background: #e2e8f0;
                  color: #1e293b;
                  cursor: pointer;
                "
              >
                👁️
              </button>

            </div>


            <div style="
              margin-top: 12px;
              padding: 9px 12px;
              border-radius: 8px;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              color: #334155;
              font-weight: 600;
              font-size: 11px;
            ">
              💡 Password length is completely flexible.
            </div>

          </div>


          <div style="
            display: flex;
            justify-content: center;
            gap: 6px;
            padding: 10px 0 4px;
          ">
            <span style="
              width: 26px;
              height: 5px;
              border-radius: 99px;
              background: #16a34a;
            "></span>

            <span style="
              width: 26px;
              height: 5px;
              border-radius: 99px;
              background: #16a34a;
            "></span>
          </div>

        </div>
      `,

      didOpen: () => {
        document.getElementById("swal-new-pass")?.focus();
      },

      preConfirm: () => {
        const newPassword =
          document.getElementById("swal-new-pass")?.value || "";

        const confirmPassword =
          document.getElementById("swal-confirm-pass")?.value || "";

        if (!newPassword) {
          Swal.showValidationMessage("Please enter a new password.");
          return false;
        }

        if (!confirmPassword) {
          Swal.showValidationMessage("Please confirm your new password.");
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage("New passwords do not match.");
          return false;
        }

        if (newPassword === oldPassword) {
          Swal.showValidationMessage(
            "New password must be different from the old password."
          );
          return false;
        }

        return {
          newPassword,
          confirmPassword,
        };
      },
    });

    if (!passwords) return;


    /* =================================================
       UPDATE PASSWORD
    ================================================= */
    try {
      Swal.fire({
        width: "320px",
        title: "Updating Password...",
        text: "Saving new password securely",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name,
            oldPassword,
            newPassword: passwords.newPassword,
          }),
        }
      );

      const data = await res.json();

      Swal.close();

      if (data.success) {
        await Swal.fire({
          width: "350px",
          icon: "success",
          title: "Password Changed!",
          text: "Your password has been changed successfully.",
          confirmButtonColor: "#047857",
          confirmButtonText: "Done",
        });

        loadPasswords();

      } else {
        Swal.fire({
          width: "350px",
          icon: "error",
          title: "Password Not Changed",
          text: data.message || "Failed to update password.",
          confirmButtonColor: "#dc2626",
        });
      }

    } catch (err) {
      console.error("PASSWORD UPDATE ERROR:", err);

      Swal.close();

      Swal.fire({
        width: "350px",
        icon: "error",
        title: "Server Error",
        text: "Server communication failed.",
        confirmButtonColor: "#dc2626",
      });
    }
  };


  /* =====================================================
     DESCRIPTION MODAL
  ===================================================== */
  const openDescriptionModal = async (
    key_name,
    display_name,
    current_description
  ) => {

    const { value: descriptionValue } = await Swal.fire({
      width: "400px",
      padding: "20px",
      title: "📝 Edit Description",

      html: `
        <div style="
          text-align: left;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        ">

          <div style="
            font-size: 12px;
            color: #334155;
            font-weight: 600;
            margin-bottom: 10px;
          ">
            Update description for
            <strong style="color: #0f172a; font-weight: 800;">
              ${display_name}
            </strong>
          </div>

          <textarea
            id="swal-desc"
            style="
              width: 100%;
              height: 90px;
              box-sizing: border-box;
              resize: none;
              border: 1.5px solid #cbd5e1;
              border-radius: 10px;
              padding: 10px 12px;
              font-size: 13px;
              font-weight: 500;
              color: #0f172a;
              background: #f8fafc;
              outline: none;
            "
            placeholder="Enter description..."
          >${current_description || ""}</textarea>

        </div>
      `,

      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#047857",
      cancelButtonColor: "#475569",

      preConfirm: () => {
        return document.getElementById("swal-desc")?.value || "";
      },
    });

    if (descriptionValue === undefined) return;

    try {

      Swal.fire({
        width: "320px",
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system-settings/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name,
            description: descriptionValue,
          }),
        }
      );

      const data = await res.json();

      Swal.close();

      if (data.success) {

        await Swal.fire({
          width: "340px",
          icon: "success",
          title: "Saved!",
          text: "Description updated successfully.",
          confirmButtonColor: "#047857",
        });

        loadPasswords();

      } else {

        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to update description.",
        });

      }

    } catch (err) {

      console.error("DESCRIPTION UPDATE ERROR:", err);

      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Server communication failed.",
      });
    }
  };


  /* =====================================================
     SEARCH FILTER
  ===================================================== */
  const filteredPasswords = passwordsList.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.display_name?.toLowerCase().includes(search) ||
      item.key_name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search)
    );
  });


  /* =====================================================
     PAGE RENDER
  ===================================================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background: "radial-gradient(circle at 15% 10%, rgba(29, 78, 216, 0.08), transparent 30%), linear-gradient(135deg, #f1f5f9, #e2e8f0)",
      }}
    >

      <style>{`
        .ps-card {
          transition: box-shadow .2s ease, transform .2s ease;
        }

        .ps-row {
          transition: background .15s ease;
        }

        .ps-row:hover {
          background: #f1f5f9 !important;
        }

        .ps-action {
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
        }

        .ps-action:hover {
          transform: translateY(-1px);
        }

        .ps-search:focus {
          border-color: #1d4ed8 !important;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15) !important;
        }

        @media(max-width: 900px) {
          .ps-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .ps-search-wrap {
            width: 100% !important;
          }
        }
      `}</style>


      {/* =================================================
          COMPACT HEADER
      ================================================= */}
      <div
        className="ps-card"
        style={{
          maxWidth: "1400px",
          margin: "0 auto 14px",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg, #0f172a, #1e3a8a, #1d4ed8)",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
        }}
      >

        <div
          className="ps-header"
          style={{
            minHeight: "95px",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
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
              🔐
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
                SYSTEM SECURITY
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
                Global Settings Hub
              </h1>

              <div style={{ marginTop: "2px", color: "#e0f2fe", fontSize: "11px", fontWeight: 500 }}>
                Manage system passwords & configuration entries
              </div>

            </div>

          </div>


          <button
            onClick={() => onNavigate("dashboard")}
            className="ps-action"
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
            ← Dashboard
          </button>

        </div>

      </div>


      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* =================================================
            STAT STRIP
        ================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "12px",
          }}
        >

          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >

            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 800, letterSpacing: "0.5px" }}>
              TOTAL SETTINGS
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >

              <strong style={{ fontSize: "22px", color: "#0f172a", fontWeight: 800 }}>
                {passwordsList.length}
              </strong>

              <span style={{ fontSize: "18px" }}>⚙️</span>

            </div>

          </div>


          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >

            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 800, letterSpacing: "0.5px" }}>
              SHOWING RECORDS
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >

              <strong style={{ fontSize: "22px", color: "#0f172a", fontWeight: 800 }}>
                {filteredPasswords.length}
              </strong>

              <span style={{ fontSize: "18px" }}>🔎</span>

            </div>

          </div>


          <div
            style={{
              background: "#ecfdf5",
              border: "1.5px solid #a7f3d0",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >

            <div style={{ fontSize: "10px", color: "#047857", fontWeight: 800, letterSpacing: "0.5px" }}>
              SYSTEM SECURITY
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >

              <strong style={{ fontSize: "16px", color: "#064e3b", fontWeight: 800 }}>
                Protected
              </strong>

              <span style={{ fontSize: "18px" }}>🛡️</span>

            </div>

          </div>

        </div>


        {/* =================================================
            SEARCH BAR
        ================================================= */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: "14px",
            padding: "12px 16px",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
          }}
        >

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#dbeafe",
                fontSize: "16px",
              }}
            >
              🔍
            </div>

            <div style={{ minWidth: "160px" }}>

              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "12px" }}>
                Search Settings
              </div>

              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>
                Filter by name, key, or description
              </div>

            </div>


            <div className="ps-search-wrap" style={{ marginLeft: "auto", width: "min(480px, 50%)" }}>

              <div style={{ position: "relative" }}>

                <input
                  type="text"
                  className="ps-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search settings..."
                  style={{
                    width: "100%",
                    height: "38px",
                    boxSizing: "border-box",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: "600",
                    padding: searchTerm ? "0 36px 0 12px" : "0 12px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    style={{
                      position: "absolute",
                      right: "7px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "24px",
                      height: "24px",
                      border: 0,
                      borderRadius: "6px",
                      background: "#cbd5e1",
                      color: "#0f172a",
                      fontWeight: "bold",
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


        {/* =================================================
            TABLE
        ================================================= */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
          }}
        >

          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >

            <div>

              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                🔐 System Credentials & Configs
              </div>

              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600, marginTop: "1px" }}>
                Manage passwords and edit system descriptions
              </div>

            </div>

            <div
              style={{
                background: "#e2e8f0",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                borderRadius: "999px",
                padding: "4px 10px",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {filteredPasswords.length} RECORDS
            </div>

          </div>


          <div className="table-responsive">

            <table
              className="table table-hover align-middle mb-0"
              style={{ fontSize: "12px" }}
            >

              <thead>

                <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1" }}>

                  <th
                    className="px-3 py-2.5 text-dark"
                    style={{
                      width: "5%",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    #
                  </th>

                  <th
                    className="py-2.5 text-dark"
                    style={{
                      width: "22%",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    DISPLAY NAME
                  </th>

                  <th
                    className="py-2.5 text-dark"
                    style={{
                      width: "22%",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    SYSTEM KEY
                  </th>

                  <th
                    className="py-2.5 text-dark"
                    style={{
                      width: "26%",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    DESCRIPTION
                  </th>

                  <th
                    className="py-2.5 pe-3 text-center text-dark"
                    style={{
                      width: "25%",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      color: "#0f172a",
                    }}
                  >
                    ACTIONS
                  </th>

                </tr>

              </thead>


              <tbody>

                {/* LOADING */}

                {loading && (
                  <tr>

                    <td colSpan={5} className="text-center" style={{ padding: "30px 10px" }}>

                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          border: "3px solid #bfdbfe",
                          borderTopColor: "#1d4ed8",
                          margin: "0 auto 10px",
                          animation: "spin 1s linear infinite",
                        }}
                      />

                      <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>
                        Loading system settings...
                      </div>

                    </td>

                  </tr>
                )}


                {/* RECORDS */}

                {!loading &&
                  filteredPasswords.map((p, index) => (

                    <tr key={p.id} className="ps-row" style={{ borderBottom: "1px solid #e2e8f0" }}>

                      {/* NUMBER */}

                      <td className="px-3 py-2.5">

                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#e2e8f0",
                            color: "#0f172a",
                            fontWeight: 800,
                            fontSize: "11px",
                          }}
                        >
                          {index + 1}
                        </div>

                      </td>


                      {/* DISPLAY NAME */}

                      <td className="py-2.5">

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#dbeafe",
                              fontSize: "16px",
                            }}
                          >
                            🔒
                          </div>

                          <div>

                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "12px" }}>
                              {p.display_name}
                            </div>

                            <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700 }}>
                              System Credential
                            </div>

                          </div>

                        </div>

                      </td>


                      {/* KEY */}

                      <td className="py-2.5">

                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 9px",
                            borderRadius: "6px",
                            background: "#eff6ff",
                            color: "#1e3a8a",
                            border: "1px solid #bfdbfe",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          {p.key_name}
                        </span>

                      </td>


                      {/* DESCRIPTION */}

                      <td className="py-2.5">

                        {p.description ? (

                          <div
                            style={{
                              color: "#1e293b",
                              fontSize: "11px",
                              fontWeight: 600,
                              lineHeight: 1.4,
                              maxWidth: "340px",
                            }}
                          >
                            {p.description}
                          </div>

                        ) : (

                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "11px",
                              fontStyle: "italic",
                              fontWeight: 500,
                            }}
                          >
                            No description provided
                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}

                      <td className="py-2.5 pe-3">

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >

                          <button
                            type="button"
                            className="ps-action"
                            onClick={() => openPasswordModal(p.key_name, p.display_name)}
                            style={{
                              border: 0,
                              color: "#ffffff",
                              background: "linear-gradient(135deg, #1d4ed8, #1e40af)",
                              padding: "7px 11px",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: "0 3px 8px rgba(29, 78, 216, 0.25)",
                            }}
                          >
                            🔑 Change Password
                          </button>


                          <button
                            type="button"
                            className="ps-action"
                            onClick={() =>
                              openDescriptionModal(p.key_name, p.display_name, p.description)
                            }
                            style={{
                              border: "1.5px solid #94a3b8",
                              color: "#0f172a",
                              background: "#ffffff",
                              padding: "6px 11px",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            📝 Description
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}


                {/* EMPTY STATE */}

                {!loading && filteredPasswords.length === 0 && (

                  <tr>

                    <td colSpan={5} className="text-center" style={{ padding: "35px 10px" }}>

                      <div style={{ fontSize: "28px", marginBottom: "6px" }}>🔎</div>

                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                        No matching settings found
                      </div>

                      <div style={{ color: "#475569", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                        Try searching with a different term.
                      </div>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
            marginTop: "12px",
            color: "#334155",
            fontWeight: 700,
            fontSize: "10px",
          }}
        >
          🛡️
          <span>
            Protected system settings • Server synchronized
          </span>
        </div>

      </div>

    </div>
  );
}