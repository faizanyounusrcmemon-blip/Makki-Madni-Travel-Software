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
        confirmButtonColor: "#2563eb",
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
     
     STEP 1:
     Old Password

     STEP 2:
     New Password + Confirm Password
  ===================================================== */
  const openPasswordModal = async (key_name, display_name) => {

    /* =================================================
       STEP 1 — OLD PASSWORD
    ================================================= */
    const { value: oldPassword } = await Swal.fire({
      width: "390px",
      padding: "0",
      background: "#fff",
      showCancelButton: true,
      confirmButtonText: "Verify Password →",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      focusConfirm: false,

      html: `
        <div style="
          font-family:Inter,system-ui,sans-serif;
          overflow:hidden;
          border-radius:18px;
        ">

          <div style="
            padding:20px;
            background:linear-gradient(135deg,#081225,#173b78,#2563eb);
            color:white;
            text-align:left;
          ">

            <div style="
              display:flex;
              align-items:center;
              gap:12px;
            ">

              <div style="
                width:44px;
                height:44px;
                border-radius:13px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(255,255,255,.12);
                border:1px solid rgba(255,255,255,.16);
                font-size:21px;
              ">
                🔐
              </div>

              <div>
                <div style="
                  font-size:9px;
                  font-weight:800;
                  letter-spacing:1.6px;
                  color:#bfdbfe;
                ">
                  SECURITY VERIFICATION
                </div>

                <div style="
                  font-size:19px;
                  font-weight:800;
                  margin-top:3px;
                ">
                  Change Password
                </div>
              </div>

            </div>

            <div style="
              margin-top:13px;
              padding:8px 10px;
              border-radius:9px;
              background:rgba(255,255,255,.09);
              font-size:11px;
              color:#dbeafe;
            ">
              🔑 ${display_name}
            </div>

          </div>


          <div style="
            padding:18px 20px 8px;
            text-align:left;
          ">

            <div style="
              font-size:12px;
              font-weight:800;
              color:#0f172a;
              margin-bottom:4px;
            ">
              Current Password
            </div>

            <div style="
              font-size:10px;
              color:#64748b;
              margin-bottom:11px;
            ">
              Enter your current password to continue.
            </div>

            <div style="position:relative;">

              <input
                id="swal-old-pass"
                type="password"
                autocomplete="current-password"
                placeholder="Enter old password"
                style="
                  width:100%;
                  height:44px;
                  box-sizing:border-box;
                  padding:0 45px 0 12px;
                  border:1px solid #dbe3ef;
                  border-radius:10px;
                  background:#f8fafc;
                  color:#0f172a;
                  font-size:12px;
                  outline:none;
                "
              />

              <button
                id="swal-old-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-old-pass')"
                style="
                  position:absolute;
                  right:8px;
                  top:50%;
                  transform:translateY(-50%);
                  width:32px;
                  height:32px;
                  border:0;
                  border-radius:8px;
                  background:#eef4ff;
                  color:#2563eb;
                  cursor:pointer;
                "
              >
                👁️
              </button>

            </div>

          </div>


          <div style="
            display:flex;
            justify-content:center;
            gap:5px;
            padding:8px 0 2px;
          ">
            <span style="
              width:24px;
              height:4px;
              border-radius:99px;
              background:#2563eb;
            "></span>

            <span style="
              width:24px;
              height:4px;
              border-radius:99px;
              background:#e2e8f0;
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
          text:
            verifyData.message ||
            "The current password is incorrect.",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Try Again",
        });

        return openPasswordModal(
          key_name,
          display_name
        );
      }

    } catch (err) {
      console.error(
        "PASSWORD VERIFY ERROR:",
        err
      );

      Swal.close();

      Swal.fire({
        width: "360px",
        icon: "error",
        title: "Verification Failed",
        text: "Unable to verify current password.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }


    /* =================================================
       STEP 2 — NEW PASSWORD
    ================================================= */
    const { value: passwords } = await Swal.fire({
      width: "390px",
      padding: "0",
      background: "#fff",
      showCancelButton: true,
      confirmButtonText: "🔐 Change Password",
      cancelButtonText: "Back",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      focusConfirm: false,

      html: `
        <div style="
          font-family:Inter,system-ui,sans-serif;
          overflow:hidden;
          border-radius:18px;
        ">

          <div style="
            padding:20px;
            background:linear-gradient(135deg,#081225,#173b78,#2563eb);
            color:#fff;
            text-align:left;
          ">

            <div style="
              display:flex;
              align-items:center;
              gap:12px;
            ">

              <div style="
                width:44px;
                height:44px;
                border-radius:13px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(255,255,255,.12);
                border:1px solid rgba(255,255,255,.16);
                font-size:21px;
              ">
                🛡️
              </div>

              <div>

                <div style="
                  font-size:9px;
                  font-weight:800;
                  letter-spacing:1.6px;
                  color:#bfdbfe;
                ">
                  STEP 2 OF 2
                </div>

                <div style="
                  font-size:19px;
                  font-weight:800;
                  margin-top:3px;
                ">
                  New Password
                </div>

              </div>

            </div>

            <div style="
              margin-top:13px;
              padding:8px 10px;
              border-radius:9px;
              background:rgba(16,185,129,.15);
              font-size:10px;
              color:#d1fae5;
            ">
              ✓ Current password verified
            </div>

          </div>


          <div style="
            padding:18px 20px 8px;
            text-align:left;
          ">

            <!-- NEW PASSWORD -->

            <div style="
              font-size:11px;
              font-weight:800;
              color:#334155;
              margin-bottom:6px;
            ">
              New Password
            </div>

            <div style="position:relative;">

              <input
                id="swal-new-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Enter new password"
                style="
                  width:100%;
                  height:44px;
                  box-sizing:border-box;
                  padding:0 45px 0 12px;
                  border:1px solid #dbe3ef;
                  border-radius:10px;
                  background:#f8fafc;
                  color:#0f172a;
                  font-size:12px;
                  outline:none;
                "
              />

              <button
                id="swal-new-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-new-pass')"
                style="
                  position:absolute;
                  right:8px;
                  top:50%;
                  transform:translateY(-50%);
                  width:32px;
                  height:32px;
                  border:0;
                  border-radius:8px;
                  background:#eef4ff;
                  color:#2563eb;
                  cursor:pointer;
                "
              >
                👁️
              </button>

            </div>


            <!-- CONFIRM PASSWORD -->

            <div style="
              font-size:11px;
              font-weight:800;
              color:#334155;
              margin:13px 0 6px;
            ">
              Confirm New Password
            </div>

            <div style="position:relative;">

              <input
                id="swal-confirm-pass"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter new password"
                style="
                  width:100%;
                  height:44px;
                  box-sizing:border-box;
                  padding:0 45px 0 12px;
                  border:1px solid #dbe3ef;
                  border-radius:10px;
                  background:#f8fafc;
                  color:#0f172a;
                  font-size:12px;
                  outline:none;
                "
              />

              <button
                id="swal-confirm-pass-btn"
                type="button"
                onclick="window.toggleSwalPasswordVisibility('swal-confirm-pass')"
                style="
                  position:absolute;
                  right:8px;
                  top:50%;
                  transform:translateY(-50%);
                  width:32px;
                  height:32px;
                  border:0;
                  border-radius:8px;
                  background:#eef4ff;
                  color:#2563eb;
                  cursor:pointer;
                "
              >
                👁️
              </button>

            </div>


            <div style="
              margin-top:10px;
              padding:8px 10px;
              border-radius:8px;
              background:#f8fafc;
              border:1px solid #e8eef7;
              color:#64748b;
              font-size:9px;
            ">
              💡 Password length is completely flexible.
            </div>

          </div>


          <div style="
            display:flex;
            justify-content:center;
            gap:5px;
            padding:8px 0 2px;
          ">
            <span style="
              width:24px;
              height:4px;
              border-radius:99px;
              background:#22c55e;
            "></span>

            <span style="
              width:24px;
              height:4px;
              border-radius:99px;
              background:#2563eb;
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

        /* NO MINIMUM LENGTH */

        if (!newPassword) {
          Swal.showValidationMessage(
            "Please enter a new password."
          );
          return false;
        }

        if (!confirmPassword) {
          Swal.showValidationMessage(
            "Please confirm your new password."
          );
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage(
            "New passwords do not match."
          );
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
          confirmButtonColor: "#059669",
          confirmButtonText: "Done",
        });

        loadPasswords();

      } else {
        Swal.fire({
          width: "350px",
          icon: "error",
          title: "Password Not Changed",
          text:
            data.message ||
            "Failed to update password.",
          confirmButtonColor: "#dc2626",
        });
      }

    } catch (err) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        err
      );

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

    const { value: descriptionValue } =
      await Swal.fire({
        width: "380px",
        padding: "18px",
        title: "📝 Edit Description",

        html: `
          <div style="
            text-align:left;
            font-family:Inter,system-ui,sans-serif;
          ">

            <div style="
              font-size:11px;
              color:#64748b;
              margin-bottom:10px;
            ">
              Update description for
              <strong style="color:#0f172a;">
                ${display_name}
              </strong>
            </div>

            <textarea
              id="swal-desc"
              style="
                width:100%;
                height:80px;
                box-sizing:border-box;
                resize:none;
                border:1px solid #dbe3ef;
                border-radius:10px;
                padding:10px;
                font-size:12px;
                outline:none;
              "
              placeholder="Enter description..."
            >${current_description || ""}</textarea>

          </div>
        `,

        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#059669",
        cancelButtonColor: "#64748b",

        preConfirm: () => {
          return (
            document.getElementById(
              "swal-desc"
            )?.value || ""
          );
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
          confirmButtonColor: "#059669",
        });

        loadPasswords();

      } else {

        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            data.message ||
            "Failed to update description.",
        });

      }

    } catch (err) {

      console.error(
        "DESCRIPTION UPDATE ERROR:",
        err
      );

      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Server communication failed.",
      });
    }
  };


  /* =====================================================
     SEARCH
  ===================================================== */
  const filteredPasswords = passwordsList.filter(
    (item) => {
      const search =
        searchTerm.toLowerCase();

      return (
        item.display_name
          ?.toLowerCase()
          .includes(search) ||

        item.key_name
          ?.toLowerCase()
          .includes(search) ||

        item.description
          ?.toLowerCase()
          .includes(search)
      );
    }
  );


  /* =====================================================
     PAGE
  ===================================================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px",
        boxSizing: "border-box",
        fontFamily:
          "'Inter',system-ui,sans-serif",

        background:
          "radial-gradient(circle at 15% 10%,rgba(37,99,235,.10),transparent 25%),linear-gradient(135deg,#f7f9fc,#eef4ff)",
      }}
    >

      <style>{`

        .ps-card {
          transition:
            box-shadow .18s ease,
            transform .18s ease;
        }

        .ps-row {
          transition:
            background .15s ease;
        }

        .ps-row:hover {
          background:#f8fbff !important;
        }

        .ps-action {
          transition:
            transform .15s ease,
            box-shadow .15s ease;
        }

        .ps-action:hover {
          transform:translateY(-1px);
        }

        .ps-search:focus {
          border-color:#3b82f6 !important;
          box-shadow:
            0 0 0 3px rgba(59,130,246,.09) !important;
        }

        @media(max-width:900px) {

          .ps-header {
            flex-direction:column !important;
            align-items:flex-start !important;
          }

          .ps-search-wrap {
            width:100% !important;
          }

          .ps-search-box {
            width:100% !important;
          }

        }

      `}</style>


      {/* =================================================
          COMPACT HEADER
      ================================================= */}
      <div
        className="ps-card"
        style={{
          maxWidth:"1400px",
          margin:"0 auto 12px",
          borderRadius:"18px",
          overflow:"hidden",
          position:"relative",

          background:
            "linear-gradient(135deg,#081225,#173b78,#2563eb)",

          boxShadow:
            "0 10px 28px rgba(15,23,42,.14)",
        }}
      >

        <div
          className="ps-header"
          style={{
            minHeight:"100px",
            padding:"17px 20px",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            gap:"15px",
          }}
        >

          <div
            style={{
              display:"flex",
              alignItems:"center",
              gap:"12px",
            }}
          >

            <div
              style={{
                width:"48px",
                height:"48px",
                borderRadius:"14px",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",

                background:
                  "rgba(255,255,255,.10)",

                border:
                  "1px solid rgba(255,255,255,.15)",

                fontSize:"22px",
              }}
            >
              🔐
            </div>

            <div>

              <div
                style={{
                  fontSize:"9px",
                  fontWeight:800,
                  letterSpacing:"1.7px",
                  color:"#bfdbfe",
                  marginBottom:"3px",
                }}
              >
                SYSTEM SECURITY
              </div>

              <h1
                style={{
                  margin:0,
                  color:"#fff",
                  fontSize:"23px",
                  fontWeight:800,
                  letterSpacing:"-.4px",
                }}
              >
                Global Settings Hub
              </h1>

              <div
                style={{
                  marginTop:"3px",
                  color:"#dbeafe",
                  fontSize:"10px",
                }}
              >
                Manage passwords & system configurations
              </div>

            </div>

          </div>


          <button
            onClick={() =>
              onNavigate("dashboard")
            }
            className="ps-action"
            style={{
              border:
                "1px solid rgba(255,255,255,.20)",

              background:
                "rgba(255,255,255,.10)",

              color:"#fff",

              padding:"8px 13px",
              borderRadius:"10px",

              fontWeight:800,
              fontSize:"11px",

              cursor:"pointer",
            }}
          >
            ← Dashboard
          </button>

        </div>

      </div>


      <div
        style={{
          maxWidth:"1400px",
          margin:"0 auto",
        }}
      >

        {/* =================================================
            COMPACT STAT STRIP
        ================================================= */}
        <div
          style={{
            display:"grid",
            gridTemplateColumns:
              "repeat(3,1fr)",
            gap:"10px",
            marginBottom:"10px",
          }}
        >

          <div
            style={{
              background:"#fff",
              border:"1px solid #e8eef7",
              borderRadius:"13px",
              padding:"10px 13px",
              boxShadow:
                "0 5px 15px rgba(15,23,42,.04)",
            }}
          >

            <div
              style={{
                fontSize:"9px",
                color:"#64748b",
                fontWeight:800,
              }}
            >
              TOTAL SETTINGS
            </div>

            <div
              style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                marginTop:"2px",
              }}
            >

              <strong
                style={{
                  fontSize:"21px",
                  color:"#0f172a",
                }}
              >
                {passwordsList.length}
              </strong>

              <span
                style={{
                  fontSize:"17px",
                }}
              >
                ⚙️
              </span>

            </div>

          </div>


          <div
            style={{
              background:"#fff",
              border:"1px solid #e8eef7",
              borderRadius:"13px",
              padding:"10px 13px",
              boxShadow:
                "0 5px 15px rgba(15,23,42,.04)",
            }}
          >

            <div
              style={{
                fontSize:"9px",
                color:"#64748b",
                fontWeight:800,
              }}
            >
              SHOWING
            </div>

            <div
              style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                marginTop:"2px",
              }}
            >

              <strong
                style={{
                  fontSize:"21px",
                  color:"#0f172a",
                }}
              >
                {filteredPasswords.length}
              </strong>

              <span
                style={{
                  fontSize:"17px",
                }}
              >
                🔎
              </span>

            </div>

          </div>


          <div
            style={{
              background:
                "linear-gradient(135deg,#f0fdf4,#ecfdf5)",

              border:"1px solid #d1fae5",
              borderRadius:"13px",

              padding:"10px 13px",
              boxShadow:
                "0 5px 15px rgba(15,23,42,.04)",
            }}
          >

            <div
              style={{
                fontSize:"9px",
                color:"#047857",
                fontWeight:800,
              }}
            >
              SECURITY
            </div>

            <div
              style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                marginTop:"2px",
              }}
            >

              <strong
                style={{
                  fontSize:"14px",
                  color:"#065f46",
                }}
              >
                Protected
              </strong>

              <span
                style={{
                  fontSize:"17px",
                }}
              >
                🛡️
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            COMPACT SEARCH
        ================================================= */}
        <div
          style={{
            background:"#fff",
            border:"1px solid #e8eef7",
            borderRadius:"13px",
            padding:"10px",
            marginBottom:"10px",
            boxShadow:
              "0 5px 15px rgba(15,23,42,.04)",
          }}
        >

          <div
            style={{
              display:"flex",
              alignItems:"center",
              gap:"10px",
            }}
          >

            <div
              style={{
                width:"34px",
                height:"34px",
                borderRadius:"9px",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                background:"#eff6ff",
                fontSize:"15px",
              }}
            >
              🔍
            </div>

            <div
              style={{
                minWidth:"150px",
              }}
            >

              <div
                style={{
                  fontWeight:800,
                  color:"#0f172a",
                  fontSize:"11px",
                }}
              >
                Search Settings
              </div>

              <div
                style={{
                  fontSize:"9px",
                  color:"#94a3b8",
                }}
              >
                Name, key or description
              </div>

            </div>


            <div
              className="ps-search-wrap"
              style={{
                marginLeft:"auto",
                width:"min(450px,45%)",
              }}
            >

              <div
                style={{
                  position:"relative",
                }}
              >

                <input
                  type="text"
                  className="ps-search"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  placeholder="Type to search..."
                  style={{
                    width:"100%",
                    height:"36px",
                    boxSizing:"border-box",

                    borderRadius:"9px",
                    border:"1px solid #dbe3ef",

                    background:"#f8fafc",

                    padding:
                      searchTerm
                        ? "0 35px 0 11px"
                        : "0 11px",

                    fontSize:"11px",
                    outline:"none",
                  }}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                    style={{
                      position:"absolute",
                      right:"6px",
                      top:"50%",
                      transform:
                        "translateY(-50%)",

                      width:"25px",
                      height:"25px",

                      border:0,
                      borderRadius:"7px",

                      background:"#e2e8f0",
                      color:"#475569",

                      cursor:"pointer",
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
            background:"#fff",
            border:"1px solid #e8eef7",
            borderRadius:"15px",
            overflow:"hidden",
            boxShadow:
              "0 7px 20px rgba(15,23,42,.05)",
          }}
        >

          <div
            style={{
              padding:"11px 15px",
              borderBottom:
                "1px solid #edf2f7",

              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
            }}
          >

            <div>

              <div
                style={{
                  fontSize:"14px",
                  fontWeight:800,
                  color:"#0f172a",
                }}
              >
                🔐 System Credentials
              </div>

              <div
                style={{
                  fontSize:"9px",
                  color:"#94a3b8",
                  marginTop:"2px",
                }}
              >
                Passwords and descriptions
              </div>

            </div>

            <div
              style={{
                background:"#f8fafc",
                border:"1px solid #e2e8f0",
                color:"#475569",
                borderRadius:"999px",
                padding:"5px 9px",
                fontSize:"9px",
                fontWeight:800,
              }}
            >
              {filteredPasswords.length} RECORDS
            </div>

          </div>


          <div className="table-responsive">

            <table
              className="table table-hover align-middle mb-0"
              style={{
                fontSize:"11px",
              }}
            >

              <thead>

                <tr
                  style={{
                    background:"#f8fafc",
                  }}
                >

                  <th
                    className="px-3 py-2 text-muted"
                    style={{
                      width:"5%",
                      fontSize:"9px",
                      letterSpacing:".7px",
                    }}
                  >
                    #
                  </th>

                  <th
                    className="py-2 text-muted"
                    style={{
                      width:"22%",
                      fontSize:"9px",
                      letterSpacing:".7px",
                    }}
                  >
                    DISPLAY NAME
                  </th>

                  <th
                    className="py-2 text-muted"
                    style={{
                      width:"20%",
                      fontSize:"9px",
                      letterSpacing:".7px",
                    }}
                  >
                    SYSTEM KEY
                  </th>

                  <th
                    className="py-2 text-muted"
                    style={{
                      width:"28%",
                      fontSize:"9px",
                      letterSpacing:".7px",
                    }}
                  >
                    DESCRIPTION
                  </th>

                  <th
                    className="py-2 pe-3 text-center text-muted"
                    style={{
                      width:"25%",
                      fontSize:"9px",
                      letterSpacing:".7px",
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

                    <td
                      colSpan={5}
                      className="text-center"
                      style={{
                        padding:"28px 10px",
                      }}
                    >

                      <div
                        style={{
                          width:"30px",
                          height:"30px",
                          borderRadius:"50%",
                          border:
                            "3px solid #dbeafe",
                          borderTopColor:
                            "#2563eb",

                          margin:
                            "0 auto 8px",

                          animation:
                            "spin 1s linear infinite",
                        }}
                      />

                      <div
                        style={{
                          fontWeight:700,
                          fontSize:"12px",
                        }}
                      >
                        Loading settings...
                      </div>

                    </td>

                  </tr>
                )}


                {/* RECORDS */}

                {!loading &&
                  filteredPasswords.map(
                    (p, index) => (

                      <tr
                        key={p.id}
                        className="ps-row"
                      >

                        {/* NUMBER */}

                        <td className="px-3 py-2">

                          <div
                            style={{
                              width:"27px",
                              height:"27px",
                              borderRadius:"8px",

                              display:"flex",
                              alignItems:"center",
                              justifyContent:"center",

                              background:"#f1f5f9",
                              color:"#64748b",

                              fontWeight:800,
                              fontSize:"10px",
                            }}
                          >
                            {index + 1}
                          </div>

                        </td>


                        {/* DISPLAY NAME */}

                        <td className="py-2">

                          <div
                            style={{
                              display:"flex",
                              alignItems:"center",
                              gap:"8px",
                            }}
                          >

                            <div
                              style={{
                                width:"31px",
                                height:"31px",
                                borderRadius:"9px",

                                display:"flex",
                                alignItems:"center",
                                justifyContent:"center",

                                background:
                                  "linear-gradient(135deg,#eff6ff,#dbeafe)",

                                fontSize:"15px",
                              }}
                            >
                              🔒
                            </div>

                            <div>

                              <div
                                style={{
                                  fontWeight:800,
                                  color:"#0f172a",
                                  fontSize:"11px",
                                }}
                              >
                                {p.display_name}
                              </div>

                              <div
                                style={{
                                  fontSize:"8px",
                                  color:"#94a3b8",
                                }}
                              >
                                System credential
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* KEY */}

                        <td className="py-2">

                          <span
                            style={{
                              display:"inline-block",
                              padding:"5px 8px",
                              borderRadius:"7px",

                              background:"#eff6ff",
                              color:"#1d4ed8",

                              border:
                                "1px solid #dbeafe",

                              fontFamily:
                                "ui-monospace,SFMono-Regular,Menlo,monospace",

                              fontSize:"9px",
                              fontWeight:700,
                            }}
                          >
                            {p.key_name}
                          </span>

                        </td>


                        {/* DESCRIPTION */}

                        <td className="py-2">

                          {p.description ? (

                            <div
                              style={{
                                color:"#475569",
                                fontSize:"10px",
                                lineHeight:1.4,
                                maxWidth:"330px",
                              }}
                            >
                              {p.description}
                            </div>

                          ) : (

                            <span
                              style={{
                                color:"#94a3b8",
                                fontSize:"10px",
                                fontStyle:"italic",
                              }}
                            >
                              No description
                            </span>

                          )}

                        </td>


                        {/* ACTIONS */}

                        <td className="py-2 pe-3">

                          <div
                            style={{
                              display:"flex",
                              justifyContent:"center",
                              flexWrap:"wrap",
                              gap:"5px",
                            }}
                          >

                            <button
                              type="button"
                              className="ps-action"
                              onClick={() =>
                                openPasswordModal(
                                  p.key_name,
                                  p.display_name
                                )
                              }
                              style={{
                                border:0,

                                color:"#fff",

                                background:
                                  "linear-gradient(135deg,#2563eb,#1d4ed8)",

                                padding:"7px 9px",
                                borderRadius:"8px",

                                fontSize:"9px",
                                fontWeight:800,

                                cursor:"pointer",

                                boxShadow:
                                  "0 4px 10px rgba(37,99,235,.16)",
                              }}
                            >
                              🔑 Change Password
                            </button>


                            <button
                              type="button"
                              className="ps-action"
                              onClick={() =>
                                openDescriptionModal(
                                  p.key_name,
                                  p.display_name,
                                  p.description
                                )
                              }
                              style={{
                                border:
                                  "1px solid #cbd5e1",

                                color:"#334155",

                                background:"#fff",

                                padding:"7px 9px",
                                borderRadius:"8px",

                                fontSize:"9px",
                                fontWeight:800,

                                cursor:"pointer",
                              }}
                            >
                              📝 Description
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}


                {/* EMPTY */}

                {!loading &&
                  filteredPasswords.length === 0 && (

                    <tr>

                      <td
                        colSpan={5}
                        className="text-center"
                        style={{
                          padding:"30px 10px",
                        }}
                      >

                        <div
                          style={{
                            fontSize:"25px",
                            marginBottom:"5px",
                          }}
                        >
                          🔎
                        </div>

                        <div
                          style={{
                            fontWeight:800,
                            color:"#0f172a",
                            fontSize:"13px",
                          }}
                        >
                          No matching settings
                        </div>

                        <div
                          style={{
                            color:"#94a3b8",
                            fontSize:"10px",
                            marginTop:"2px",
                          }}
                        >
                          Try another search term.
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
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            gap:"6px",

            marginTop:"9px",

            color:"#64748b",
            fontSize:"9px",
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