import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./dashboard.css";
import axios from "axios";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // LIVE CLOCK STATE
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

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

  /* ================= MODERN CUSTOM CALENDAR POPUP ================= */
  const openCalendarModal = () => {
    let currYear = new Date().getFullYear();
    let currMonth = new Date().getMonth();

    const renderCalendarHTML = (year, month) => {
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const today = new Date();

      let daysHtml = "";
      for (let i = 0; i < firstDay; i++) {
        daysHtml += `<div style="padding:10px;"></div>`;
      }

      for (let day = 1; day <= lastDate; day++) {
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const bg = isToday ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent";
        const color = isToday ? "#ffffff" : "#334155";
        const border = isToday ? "none" : "1px solid #e2e8f0";
        const shadow = isToday ? "0 4px 12px rgba(37,99,235,0.4)" : "none";

        daysHtml += `
          <div style="
            background: ${bg}; 
            color: ${color}; 
            border: ${border}; 
            box-shadow: ${shadow};
            border-radius: 10px; 
            padding: 10px 0; 
            font-weight: ${isToday ? "bold" : "600"}; 
            font-size: 14px;
            text-align: center;
            transition: all 0.2s;
          ">${day}</div>
        `;
      }

      return `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 10px 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button id="cal-prev" style="background:#f1f5f9; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold;">◀</button>
            <h4 style="margin:0; font-weight:700; color:#0f172a;">${monthNames[month]} ${year}</h4>
            <button id="cal-next" style="background:#f1f5f9; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold;">▶</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; font-weight: 700; color: #64748b; font-size: 13px; margin-bottom: 10px;">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
            ${daysHtml}
          </div>
        </div>
      `;
    };

    const showModal = () => {
      Swal.fire({
        width: "480px",
        html: renderCalendarHTML(currYear, currMonth),
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
          document.getElementById("cal-prev").onclick = () => {
            currMonth--;
            if (currMonth < 0) { currMonth = 11; currYear--; }
            showModal();
          };
          document.getElementById("cal-next").onclick = () => {
            currMonth++;
            if (currMonth > 11) { currMonth = 0; currYear++; }
            showModal();
          };
        }
      });
    };

    showModal();
  };

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
      title: "📦 Generating PC ZIP Backup...",
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:24px; background:#e5e7eb; border-radius:50px; overflow:hidden; box-shadow:inset 0 2px 5px rgba(0,0,0,.08);">
            <div id="pcBackupBar" style="width:0%; height:100%; background:linear-gradient(90deg, #0284c7, #0369a1); transition:width .2s ease;"></div>
          </div>
          <div id="pcBackupPercent" style="margin-top:10px; font-size:18px; font-weight:800; color:#0f172a;">0%</div>
          <div style="margin-top:5px; font-size:12px; color:#64748b;">Compressing & preparing file download...</div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    let percent = 0;
    const timer = setInterval(() => {
      if (percent >= 85) return;
      percent += 5;
      const bar = document.getElementById("pcBackupBar");
      const txt = document.getElementById("pcBackupPercent");
      if (bar) bar.style.width = `${percent}%`;
      if (txt) txt.innerHTML = `${percent}%`;
    }, 200);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/download-direct`,
        { password: pass },
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const loadedPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const bar = document.getElementById("pcBackupBar");
              const txt = document.getElementById("pcBackupPercent");
              if (bar) bar.style.width = `${loadedPercent}%`;
              if (txt) txt.innerHTML = `${loadedPercent}%`;
            }
          }
        }
      );

      clearInterval(timer);

      const bar = document.getElementById("pcBackupBar");
      const txt = document.getElementById("pcBackupPercent");
      if (bar) bar.style.width = "100%";
      if (txt) txt.innerHTML = "100%";

      await new Promise((r) => setTimeout(r, 400));
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

      Swal.fire({ icon: "success", title: "Success ✅", text: "ZIP downloaded to PC successfully! 💻", confirmButtonColor: "#0284c7" });
    } catch (err) {
      clearInterval(timer);
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
        
{/* TOP BAR: CLOCK ON LEFT, BACKUPS ON RIGHT */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, position: "relative", zIndex: 10 }}>
  
  {/* ELEGANT LIVE DATE & TIME WIDGET WITH CALENDAR BUTTON */}
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
    <div style={{
      background: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "12px 22px",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
    }}>
      <div style={{
        fontSize: "26px",
        fontWeight: "700",
        letterSpacing: "1px",
        fontFamily: "monospace, monospace",
        color: "#ffffff",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)"
      }}>
        {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
      </div>
      <div style={{
        fontSize: "12px",
        fontWeight: "500",
        color: "#e2e8f0",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginTop: "2px"
      }}>
        📅 {currentTime.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </div>

    {/* CALENDAR BUTTON */}
    <button 
      onClick={openCalendarModal}
      style={{
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: "600",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(8px)",
        color: "white",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        transition: "all 0.2s ease"
      }}
      onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
      onMouseOut={(e) => e.target.style.background = "rgba(0, 0, 0, 0.55)"}
    >
      📅 View Calendar
    </button>
  </div>


          {/* BACKUP BUTTONS */}
          <div className="backup-side-box" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button className="vip-backup-btn" onClick={runBackup} disabled={loading}>
              {loading ? (<><span className="btn-loader"></span> Backing up...</>) : "Cloud Backup Now"}
            </button>

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

        {/* HEADER */}
        <div style={{ textAlign: "center", paddingTop: 10 }}>
          <h2 style={{ fontSize: 32, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>Makki Madni Travel & Tours</h2>
          <i style={{ opacity: 0.9 }}>Live Travel Management Dashboard</i>
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
      </div>
    </div>
  );
}