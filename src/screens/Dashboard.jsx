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
    } catch (err) {
      console.error("Backup load error:", err);
    }
  };

  useEffect(() => { loadLastBackup(); }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "-";

  /* ================= DYNAMIC HIJRI CONVERSION WITH BOTH PK & KSA OFFSETS ================= */
  // Pakistan Offset (Default -1)
  const [pkOffset, setPkOffset] = useState(() => {
    const saved = localStorage.getItem("pk_hijri_offset");
    return saved !== null ? parseInt(saved, 10) : -1;
  });

  // Saudi Offset (Default 0)
  const [ksaOffset, setKsaOffset] = useState(() => {
    const saved = localStorage.getItem("ksa_hijri_offset");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const updatePkOffset = (delta) => {
    const newOffset = pkOffset + delta;
    setPkOffset(newOffset);
    localStorage.setItem("pk_hijri_offset", newOffset.toString());
  };

  const setPkOffsetDirect = (val) => {
    setPkOffset(val);
    localStorage.setItem("pk_hijri_offset", val.toString());
  };

  const updateKsaOffset = (delta) => {
    const newOffset = ksaOffset + delta;
    setKsaOffset(newOffset);
    localStorage.setItem("ksa_hijri_offset", newOffset.toString());
  };

  const setKsaOffsetDirect = (val) => {
    setKsaOffset(val);
    localStorage.setItem("ksa_hijri_offset", val.toString());
  };

  const getDynamicHijriDate = (dateObj, dayOffset = 0) => {
    try {
      const calcDate = new Date(dateObj);
      calcDate.setDate(calcDate.getDate() + dayOffset);

      const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const parts = formatter.formatToParts(calcDate);
      let day = "", monthName = "", year = "";

      parts.forEach((p) => {
        if (p.type === "day") day = p.value;
        if (p.type === "month") monthName = p.value;
        if (p.type === "year") year = p.value;
      });

      return { day, monthName, year };
    } catch (err) {
      return { day: "22", monthName: "Rabi' al-Awwal", year: "1448" };
    }
  };

  const formatHijriFull = (dateObj, dayOffset = 0) => {
    const h = getDynamicHijriDate(dateObj, dayOffset);
    return `${h.day} ${h.monthName} ${h.year} AH`;
  };

  /* ================= DAY ADJUSTMENT POPUP MODAL ================= */
  const openDayAdjustModal = (country) => {
    const isPK = country === "PK";
    const currentVal = isPK ? pkOffset : ksaOffset;
    const title = isPK ? "🇵🇰 Pakistan Hijri Adjustment" : "🇸🇦 Saudi Arabia Hijri Adjustment";
    const color = isPK ? "#0284c7" : "#16a34a";

    Swal.fire({
      width: "360px",
      padding: "1rem",
      title: `<span style="font-size:16px; font-weight:800; color:${color};">${title}</span>`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif; text-align:center; padding-top:5px;">
          <p style="margin:0 0 15px 0; font-size:13px; color:#475569; font-weight:600;">
            Current Offset: <b style="font-size:16px; color:#0f172a;">${currentVal > 0 ? `+${currentVal}` : currentVal} Day(s)</b>
          </p>

          <div style="display:flex; justify-content:center; gap:8px; margin-bottom:15px;">
            <button id="offset-minus" style="flex:1; background:#ef4444; color:#fff; border:none; padding:8px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer;">-1 Day</button>
            <button id="offset-zero" style="flex:1; background:#64748b; color:#fff; border:none; padding:8px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer;">Reset (0)</button>
            <button id="offset-plus" style="flex:1; background:#22c55e; color:#fff; border:none; padding:8px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer;">+1 Day</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document.getElementById("offset-minus").onclick = () => {
          if (isPK) updatePkOffset(-1); else updateKsaOffset(-1);
          Swal.close();
        };
        document.getElementById("offset-zero").onclick = () => {
          if (isPK) setPkOffsetDirect(0); else setKsaOffsetDirect(0);
          Swal.close();
        };
        document.getElementById("offset-plus").onclick = () => {
          if (isPK) updatePkOffset(1); else updateKsaOffset(1);
          Swal.close();
        };
      }
    });
  };

  /* ================= DUAL-DATE CALENDAR POPUP ================= */
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
        daysHtml += `<div style="padding:8px;"></div>`;
      }

      for (let day = 1; day <= lastDate; day++) {
        const currentDateObj = new Date(year, month, day);
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const bg = isToday ? "linear-gradient(135deg, #16a34a, #15803d)" : "#f8fafc";
        const color = isToday ? "#ffffff" : "#0f172a";
        const border = isToday ? "none" : "1px solid #e2e8f0";
        const shadow = isToday ? "0 4px 12px rgba(22,163,74,0.4)" : "none";

        const hijriPK = getDynamicHijriDate(currentDateObj, pkOffset);

        daysHtml += `
          <div style="
            background: ${bg}; 
            color: ${color}; 
            border: ${border}; 
            box-shadow: ${shadow};
            border-radius: 12px; 
            padding: 8px 2px; 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <span style="font-weight: 800; font-size: 15px; line-height: 1;">${day}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${isToday ? "#dcfce7" : "#0284c7"}; margin-top: 3px;">
              🌙 ${hijriPK.day}
            </span>
          </div>
        `;
      }

      const startHijri = getDynamicHijriDate(new Date(year, month, 1), pkOffset);
      const endHijri = getDynamicHijriDate(new Date(year, month, lastDate), pkOffset);

      return `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <button id="cal-prev" style="background:#f1f5f9; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold; color:#334155;">◀</button>
            <div style="text-align:center;">
              <h3 style="margin:0; font-weight:800; color:#0f172a; font-size:18px;">${monthNames[month]} ${year}</h3>
              <div style="font-size:11px; font-weight:700; color:#16a34a; margin-top:2px;">
                🌙 ${startHijri.monthName} ${startHijri.year} - ${endHijri.monthName} ${endHijri.year}
              </div>
            </div>
            <button id="cal-next" style="background:#f1f5f9; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold; color:#334155;">▶</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; font-weight: 800; color: #64748b; font-size: 12px; margin-bottom: 8px; text-align: center;">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
            ${daysHtml}
          </div>
        </div>
      `;
    };

    const showModal = () => {
      Swal.fire({
        width: "500px",
        html: renderCalendarHTML(currYear, currMonth),
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
          const btnPrev = document.getElementById("cal-prev");
          const btnNext = document.getElementById("cal-next");
          if (btnPrev) {
            btnPrev.onclick = () => {
              currMonth--;
              if (currMonth < 0) { currMonth = 11; currYear--; }
              showModal();
            };
          }
          if (btnNext) {
            btnNext.onclick = () => {
              currMonth++;
              if (currMonth > 11) { currMonth = 0; currYear++; }
              showModal();
            };
          }
        }
      });
    };

    showModal();
  };

  // SYSTEM PASSWORD VERIFICATION
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
        if (input) input.focus();
        let visible = false;
        if (toggle && input) {
          toggle.addEventListener("click", () => {
            visible = !visible;
            input.type = visible ? "text" : "password";
            toggle.textContent = visible ? "🙈" : "👁";
          });
          input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
              const confirmBtn = document.querySelector(".swal-btn-confirm");
              if (confirmBtn) confirmBtn.click();
            }
          });
        }
      },
      preConfirm: async () => {
        const input = document.getElementById("swal-pass");
        const errorBox = document.getElementById("swal-error");
        const popup = document.querySelector(".swal-backup-popup");

        if (!input || !input.value) {
          if (errorBox) errorBox.textContent = "Password required";
          if (popup) {
            popup.classList.add("shake");
            setTimeout(() => popup.classList.remove("shake"), 500);
          }
          return false;
        }
        return input.value;
      }
    });
  };

  // 1. CLOUD BACKUP
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

  // 2. DOWNLOAD ZIP TO PC
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
      
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
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
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
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
      <div style={{ position: "relative", zIndex: 2, padding: "15px", width: "100%", boxSizing: "border-box" }}>
        
        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 5, position: "relative", zIndex: 10, width: "100%" }}>
          
          {/* ULTRA GLASSMORPHIC DUAL TIME CARD WITH HIJRI DATES */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.8))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: "16px 22px",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minWidth: "320px"
            }}>
              
              {/* PAKISTAN TIME */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "24px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>🇵🇰</span>
                  <span style={{
                    position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px",
                    borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8"
                  }}></span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", letterSpacing: "1px", textTransform: "uppercase" }}>Pakistan</span>
                      <span style={{ fontSize: "9px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", padding: "1px 5px", borderRadius: "4px", fontWeight: "700" }}>PKT</span>
                    </div>

                    {/* POPUP TRIGGER BUTTON FOR PK */}
                    <button 
                      onClick={() => openDayAdjustModal("PK")} 
                      style={{ 
                        border: "1px solid rgba(56, 189, 248, 0.5)", 
                        background: "rgba(2, 132, 199, 0.3)", 
                        color: "#e0f2fe", 
                        padding: "2px 8px", 
                        borderRadius: "6px", 
                        fontSize: "11px", 
                        fontWeight: "700", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      ⚙️ Day ({pkOffset > 0 ? `+${pkOffset}` : pkOffset})
                    </button>
                  </div>

                  <div style={{ fontSize: "20px", fontWeight: "800", fontFamily: "'Courier New', Courier, monospace", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.3)", marginTop: "2px" }}>
                    {currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                  </div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600", display: "flex", gap: "4px", marginTop: "2px" }}>
                    <span>{currentTime.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", weekday: "short", day: "2-digit", month: "short" })}</span>
                    <span style={{ color: "#38bdf8", fontWeight: "700" }}>• 🌙 {formatHijriFull(currentTime, pkOffset)}</span>
                  </div>
                </div>
              </div>

              {/* SEPARATOR GRADIENT LINE */}
              <div style={{ height: "1px", width: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}></div>

              {/* SAUDI ARABIA TIME */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "24px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>🇸🇦</span>
                  <span style={{
                    position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px",
                    borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80"
                  }}></span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#4ade80", letterSpacing: "1px", textTransform: "uppercase" }}>Saudi Arabia</span>
                      <span style={{ fontSize: "9px", background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", padding: "1px 5px", borderRadius: "4px", fontWeight: "700" }}>KSA</span>
                    </div>

                    {/* POPUP TRIGGER BUTTON FOR KSA */}
                    <button 
                      onClick={() => openDayAdjustModal("KSA")} 
                      style={{ 
                        border: "1px solid rgba(74, 222, 128, 0.5)", 
                        background: "rgba(22, 163, 74, 0.3)", 
                        color: "#dcfce7", 
                        padding: "2px 8px", 
                        borderRadius: "6px", 
                        fontSize: "11px", 
                        fontWeight: "700", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      ⚙️ Day ({ksaOffset > 0 ? `+${ksaOffset}` : ksaOffset})
                    </button>
                  </div>

                  <div style={{ fontSize: "20px", fontWeight: "800", fontFamily: "'Courier New', Courier, monospace", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.3)", marginTop: "2px" }}>
                    {currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                  </div>
                  <div style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600", display: "flex", gap: "4px", marginTop: "2px" }}>
                    <span>{currentTime.toLocaleDateString("en-US", { timeZone: "Asia/Riyadh", weekday: "short", day: "2-digit", month: "short" })}</span>
                    <span style={{ color: "#4ade80", fontWeight: "700" }}>• 🌙 {formatHijriFull(currentTime, ksaOffset)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH GLOSS CALENDAR BUTTON */}
            <button 
              onClick={openCalendarModal}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
                backdropFilter: "blur(12px)",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              📅 Dual Calendar (English & Hijri)
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
          <h2 style={{ fontSize: "24px", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>Makki Madni Travel & Tours</h2>
          <i style={{ opacity: 0.9, fontSize: "13px" }}>Live Travel Management Dashboard</i>
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