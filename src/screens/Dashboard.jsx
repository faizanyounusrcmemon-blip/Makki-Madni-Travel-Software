import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./dashboard.css";
import axios from "axios";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // BACKGROUND IMAGES
  const images = [
    "/images/haram1.jpg", "/images/haram2.jpg", "/images/haram3.jpg",
    "/images/haram4.jpg", "/images/haram5.jpg", "/images/haram6.jpg",
    "/images/haram7.jpg", "/images/haram8.jpg", "/images/haram9.jpg",
    "/images/haram10.jpg", "/images/haram11.jpg", "/images/haram12.jpg",
  ];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadLastBackup = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/last`);
      const data = await res.json();
      if (data.success) setLastBackup(data.last_backup);
    } catch {}
  };

  useEffect(() => { loadLastBackup(); }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "-";

  // SHARED SWEETALERT FOR SYSTEM PASSWORD VERIFICATION
  const askPassword = async (titleText, subText) => {
    return await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:center;font-size:14px;line-height:1.5">
          <b style="color:#198754;font-size:16px">${titleText}</b><br>
          <span style="font-size:13px;color:#555">${subText}</span>
          <div style="position:relative; margin-top:10px">
            <input type="password" id="swal-pass" class="swal2-input" placeholder="Enter password" style="height:34px; font-size:14px; padding:6px 10px;">
            <span id="toggle-pass" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:15px;">👁</span>
          </div>
          <div id="swal-error" style="color:#dc3545; font-size:12px; min-height:18px; margin-top:4px"></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Proceed",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal-btn-confirm",
        cancelButton: "swal-btn-cancel",
        popup: "swal-backup-popup",
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        input.focus();
        let visible = false;
        toggle.addEventListener("click", () => {
          visible = !visible;
          input.type = visible ? "text" : "password";
          toggle.textContent = visible ? "🙈" : "👁";
        });
        input.addEventListener("keyup", (e) => {
          if (e.key === "Enter") {
            document.querySelector(".swal-btn-confirm").click();
          }
        });
      },
      preConfirm: async () => {
        const input = document.getElementById("swal-pass");
        const errorBox = document.getElementById("swal-error");
        const popup = document.querySelector(".swal-backup-popup");

        if (!input.value) {
          errorBox.textContent = "Password required";
          popup.classList.add("shake");
          setTimeout(() => popup.classList.remove("shake"), 500);
          return false;
        }
        return input.value;
      }
    });
  };

  // 1. CLOUD MANUAL BACKUP
  const runBackup = async () => {
    const { value: pass, isDismissed } = await askPassword("💾 Cloud Backup", "Enter password to start cloud backup");
    if (isDismissed || !pass) return;

    Swal.fire({
      title: "💾 Creating Cloud Backup...",
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:24px; background:#e5e7eb; border-radius:50px; overflow:hidden; box-shadow:inset 0 2px 5px rgba(0,0,0,.08);">
            <div id="backupBar" style="width:0%; height:100%; background:linear-gradient(90deg, #22c55e, #16a34a); transition:width .35s ease;"></div>
          </div>
          <div id="backupPercent" style="margin-top:10px; font-size:18px; font-weight:800; color:#0f172a;">0%</div>
          <div style="margin-top:5px; font-size:12px; color:#64748b;">Generating secure backup...</div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    let percent = 0;
    const timer = setInterval(() => {
      if (percent >= 90) return;
      percent += 5;
      const bar = document.getElementById("backupBar");
      const txt = document.getElementById("backupPercent");
      if (bar) bar.style.width = `${percent}%`;
      if (txt) txt.innerHTML = `${percent}%`;
    }, 250);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const data = await res.json();
      clearInterval(timer);

      const bar = document.getElementById("backupBar");
      const txt = document.getElementById("backupPercent");
      if (bar) bar.style.width = "100%";
      if (txt) txt.innerHTML = "100%";

      await new Promise((r) => setTimeout(r, 500));
      Swal.close();

      if (data.success) {
        Swal.fire({ icon: "success", title: "Backup Completed ✅", text: "Your backup was created successfully.", confirmButtonColor: "#16a34a" });
        loadLastBackup();
      } else {
        Swal.fire({ icon: "error", title: "Backup Failed", text: data.error || "Wrong password or error occured" });
      }
    } catch (err) {
      clearInterval(timer);
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.message || "Backup process failed" });
    }
  };

  // 2. DOWNLOAD ZIP TO PC FUNCTION
  const downloadPCBackup = async () => {
    const { value: pass, isDismissed } = await askPassword("📥 Download ZIP", "Enter password to download backup to PC");
    if (isDismissed || !pass) return;

    Swal.fire({
      title: "📦 Generating ZIP...",
      text: "Please wait while we prepare the file for your PC...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/download-direct`,
        { password: pass },
        { responseType: "blob" }
      );

      Swal.close();

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const stamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `MMT_Local_Backup_${stamp}.zip`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({ icon: "success", title: "Success", text: "ZIP downloaded to PC successfully! 💻" });
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Download Failed", text: "Wrong password or Server authorization failed." });
    }
  };

  return (
    <div
      className="dashboard-container"
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        color: "white",
        backgroundImage: `url(${images[bgIndex]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 1s ease-in-out",
      }}
    >
      {/* LIGHT OVERLAY */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.25)", zIndex: 0 }}></div>

      {/* CONTENT */}
      <div style={{ position: "relative", zIndex: 2, padding: 20 }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <h2 style={{ fontSize: 32, margin: 0 }}>Makki Madni Travel</h2>
          <i>Live Travel Management Dashboard</i>
        </div>

        {/* CLOUDS */}
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>

        {/* AIRPLANE */}
        <div className="airplane">
          <img src="/images/plane.png" alt="plane" />
          <div className="trail"></div>
        </div>

        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <div className="backup-side-box" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            <button className="vip-backup-btn" onClick={runBackup} disabled={loading}>
              {loading ? (<><span className="btn-loader"></span> Backing up...</>) : "Cloud Backup Now"}
            </button>

            {/* Naya PC Download Button */}
            <button className="vip-backup-btn" onClick={downloadPCBackup} style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}>
              📥 Download ZIP to PC
            </button>

            <div className="last-backup-box">
              <span>Last Backup</span>
              <b>{lastBackup ? `${lastBackup.name} · ${formatDate(lastBackup.created_at)}` : "Not yet"}</b>
            </div>

            {loading && (
              <div className="vip-progress">
                <div className="vip-progress-bar" style={{ width: `${progress}%` }}>{progress}%</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}