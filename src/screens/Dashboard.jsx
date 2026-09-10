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

/* ================= DYNAMIC HIJRI CONVERSION ================= */
  // Auto-calibrated offsets for PK (27th) and KSA (28th)
  const [pkOffset, setPkOffset] = useState(() => {
    const saved = localStorage.getItem("pk_hijri_offset_v2");
    return saved !== null ? parseInt(saved, 10) : 1; 
  });

  const [ksaOffset, setKsaOffset] = useState(() => {
    const saved = localStorage.getItem("ksa_hijri_offset_v2");
    return saved !== null ? parseInt(saved, 10) : 2;
  });

  const updatePkOffset = (delta) => {
    const newOffset = pkOffset + delta;
    setPkOffset(newOffset);
    localStorage.setItem("pk_hijri_offset_v2", newOffset.toString());
  };

  const setPkOffsetDirect = (val) => {
    setPkOffset(val);
    localStorage.setItem("pk_hijri_offset_v2", val.toString());
  };

  const updateKsaOffset = (delta) => {
    const newOffset = ksaOffset + delta;
    setKsaOffset(newOffset);
    localStorage.setItem("ksa_hijri_offset_v2", newOffset.toString());
  };

  const setKsaOffsetDirect = (val) => {
    setKsaOffset(val);
    localStorage.setItem("ksa_hijri_offset_v2", val.toString());
  };

  /* EXACT HIJRI CALCULATION WITH ISLAMIC MONTH NAMES */
  const getDynamicHijriDate = (dateObj, dayOffset = 0) => {
    const islamicMonths = [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];

    try {
      const date = new Date(dateObj);
      date.setDate(date.getDate() + dayOffset);

      // Julian Day Calculation
      let day = date.getDate();
      let month = date.getMonth(); // 0-indexed
      let year = date.getFullYear();

      if (month < 2) {
        year -= 1;
        month += 12;
      }

      const a = Math.floor(year / 100);
      const b = 2 - a + Math.floor(a / 4);

      const jd = Math.floor(365.25 * (year + 4716)) +
                 Math.floor(30.6001 * (month + 2)) +
                 day + b - 1524.5;

      // Hijri Calculation from Julian Day
      const l = jd - 1948440 + 10632;
      const n = Math.floor((l - 1) / 10631);
      const l1 = l - 10631 * n + 354;
      const j = (Math.floor((10985 - l1) / 5316)) * (Math.floor((50 * l1) / 17719)) +
                (Math.floor(l1 / 5670)) * (Math.floor((43 * l1) / 15238));
      const l2 = l1 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
                 (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;

      const hijriMonth = Math.floor((24 * l2) / 709);
      const hijriDay = Math.floor(l2 - Math.floor((709 * hijriMonth) / 24));
      const hijriYear = Math.floor(30 * n + j - 30);

      const monthName = islamicMonths[hijriMonth - 1] || "Rabi' al-Awwal";

      return {
        day: hijriDay.toString(),
        monthName: monthName,
        year: hijriYear.toString()
      };
    } catch (err) {
      return { day: "27", monthName: "Rabi' al-Awwal", year: "1448" };
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
      width: "300px",
      padding: "0.8rem",
      title: `<span style="font-size:14px; font-weight:800; color:${color};">${title}</span>`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif; text-align:center; padding-top:2px;">
          <p style="margin:0 0 10px 0; font-size:12px; color:#475569; font-weight:600;">
            Offset: <b style="font-size:14px; color:#0f172a;">${currentVal > 0 ? `+${currentVal}` : currentVal} Day(s)</b>
          </p>
          <div style="display:flex; justify-content:center; gap:4px; margin-bottom:5px;">
            <button id="offset-minus" style="flex:1; background:#ef4444; color:#fff; border:none; padding:6px; border-radius:6px; font-weight:800; font-size:12px; cursor:pointer;">-1 Day</button>
            <button id="offset-zero" style="flex:1; background:#64748b; color:#fff; border:none; padding:6px; border-radius:6px; font-weight:800; font-size:12px; cursor:pointer;">Reset</button>
            <button id="offset-plus" style="flex:1; background:#22c55e; color:#fff; border:none; padding:6px; border-radius:6px; font-weight:800; font-size:12px; cursor:pointer;">+1 Day</button>
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
          if (isPK) setPkOffsetDirect(1); else setKsaOffsetDirect(2);
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
        daysHtml += `<div style="padding:4px;"></div>`;
      }

      for (let day = 1; day <= lastDate; day++) {
        const currentDateObj = new Date(year, month, day);
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        const bg = isToday ? "linear-gradient(135deg, #16a34a, #15803d)" : "#f8fafc";
        const color = isToday ? "#ffffff" : "#0f172a";
        const border = isToday ? "none" : "1px solid #e2e8f0";

        const hijriPK = getDynamicHijriDate(currentDateObj, pkOffset);

        daysHtml += `
          <div style="
            background: ${bg}; 
            color: ${color}; 
            border: ${border}; 
            border-radius: 6px; 
            padding: 4px 2px; 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          ">
            <span style="font-weight: 800; font-size: 11px; line-height: 1;">${day}</span>
            <span style="font-size: 8px; font-weight: 700; color: ${isToday ? "#dcfce7" : "#0284c7"}; margin-top: 1px;">
              🌙 ${hijriPK.day}
            </span>
          </div>
        `;
      }

      const startHijri = getDynamicHijriDate(new Date(year, month, 1), pkOffset);
      const endHijri = getDynamicHijriDate(new Date(year, month, lastDate), pkOffset);

      return `
        <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <button id="cal-prev" style="background:#f1f5f9; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; color:#334155;">◀</button>
            <div style="text-align:center;">
              <h3 style="margin:0; font-weight:800; color:#0f172a; font-size:14px;">${monthNames[month]} ${year}</h3>
              <div style="font-size:9px; font-weight:700; color:#16a34a; margin-top:1px;">
                🌙 ${startHijri.monthName} ${startHijri.year} - ${endHijri.monthName} ${endHijri.year}
              </div>
            </div>
            <button id="cal-next" style="background:#f1f5f9; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; color:#334155;">▶</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-weight: 800; color: #64748b; font-size: 10px; margin-bottom: 4px; text-align: center;">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;">
            ${daysHtml}
          </div>
        </div>
      `;
    };

    const showModal = () => {
      Swal.fire({
        width: "360px",
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
      width: "300px",
      padding: "0.8em",
      html: `
        <div style="text-align:center;font-size:12px;line-height:1.3">
          <b style="color:#198754;font-size:14px">${titleText}</b><br>
          <span style="font-size:11px;color:#555">${subText}</span>
          <div style="position:relative; margin-top:8px">
            <input type="password" id="swal-pass" class="swal2-input" placeholder="Enter password" style="height:28px; font-size:12px; padding:2px 6px; margin:0;">
            <span id="toggle-pass" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:12px;">👁</span>
          </div>
          <div id="swal-error" style="color:#dc3545; font-size:10px; min-height:14px; margin-top:2px"></div>
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
        <div style="margin-top:10px">
          <div style="width:100%; height:16px; background:#e5e7eb; border-radius:50px; overflow:hidden;">
            <div id="backupBar" style="width:0%; height:100%; background:linear-gradient(90deg, #22c55e, #16a34a); transition:width .35s ease;"></div>
          </div>
          <div id="backupPercent" style="margin-top:6px; font-size:14px; font-weight:800; color:#0f172a;">0%</div>
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
    const { value: pass, isDismissed } = await askPassword("📥 Download ZIP", "Enter password to download backup");
    if (isDismissed || !pass) return;

    Swal.fire({
      title: "📦 Generating PC ZIP Backup...",
      html: `
        <div style="margin-top:10px">
          <div style="width:100%; height:16px; background:#e5e7eb; border-radius:50px; overflow:hidden;">
            <div id="pcBackupBar" style="width:0%; height:100%; background:linear-gradient(90deg, #0284c7, #0369a1); transition:width .2s ease;"></div>
          </div>
          <div id="pcBackupPercent" style="margin-top:6px; font-size:14px; font-weight:800; color:#0f172a;">0%</div>
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

      Swal.fire({ icon: "success", title: "Success ✅", text: "ZIP downloaded successfully!", confirmButtonColor: "#0284c7" });
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
        maxWidth: "100vw",
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

      {/* CONTENT CONTAINER */}
      <div style={{ position: "relative", zIndex: 2, padding: "8px 12px", width: "100%", boxSizing: "border-box" }}>
        
        {/* TOP BAR */}
        <div className="dashboard-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 2, position: "relative", zIndex: 10, width: "100%", boxSizing: "border-box" }}>
          
          {/* DUAL TIME CARD WITH VERTICALLY STACKED DATE & HIJRI */}
          <div className="time-card-box" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", width: "100%", maxWidth: "260px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.82))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "100%",
              boxSizing: "border-box"
            }}>
              
              {/* PAKISTAN TIME */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", width: "100%" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
                  <span style={{ fontSize: "15px" }}>🇵🇰</span>
                  <span style={{
                    position: "absolute", top: "-1px", right: "-1px", width: "4px", height: "4px",
                    borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 4px #38bdf8"
                  }}></span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#38bdf8" }}>Pakistan</span>
                      <span style={{ fontSize: "7px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", padding: "0px 3px", borderRadius: "2px", fontWeight: "700" }}>PKT</span>
                    </div>

                    <button 
                      onClick={() => openDayAdjustModal("PK")} 
                      style={{ 
                        border: "1px solid rgba(56, 189, 248, 0.4)", 
                        background: "rgba(2, 132, 199, 0.25)", 
                        color: "#e0f2fe", 
                        padding: "1px 4px", 
                        borderRadius: "3px", 
                        fontSize: "8px", 
                        fontWeight: "700", 
                        cursor: "pointer"
                      }}
                    >
                      ⚙️ Day ({pkOffset > 0 ? `+${pkOffset}` : pkOffset})
                    </button>
                  </div>

                  {/* LINE 1: TIME */}
                  <div style={{ fontSize: "13px", fontWeight: "800", fontFamily: "'Courier New', Courier, monospace", color: "#ffffff", marginTop: "2px", lineHeight: "1.1" }}>
                    {currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                  </div>
                  {/* LINE 2: ENGLISH DATE */}
                  <div style={{ fontSize: "9px", color: "#e2e8f0", fontWeight: "600", marginTop: "1px", lineHeight: "1.1" }}>
                    {currentTime.toLocaleDateString("en-US", { timeZone: "Asia/Karachi", weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  {/* LINE 3: HIJRI DATE */}
                  <div style={{ fontSize: "9px", color: "#38bdf8", fontWeight: "700", marginTop: "1px", lineHeight: "1.1" }}>
                    🌙 {formatHijriFull(currentTime, pkOffset)}
                  </div>
                </div>
              </div>

              {/* SEPARATOR GRADIENT LINE */}
              <div style={{ height: "1px", width: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}></div>

              {/* SAUDI ARABIA TIME */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", width: "100%" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
                  <span style={{ fontSize: "15px" }}>🇸🇦</span>
                  <span style={{
                    position: "absolute", top: "-1px", right: "-1px", width: "4px", height: "4px",
                    borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 4px #4ade80"
                  }}></span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#4ade80" }}>Saudi Arabia</span>
                      <span style={{ fontSize: "7px", background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", padding: "0px 3px", borderRadius: "2px", fontWeight: "700" }}>KSA</span>
                    </div>

                    <button 
                      onClick={() => openDayAdjustModal("KSA")} 
                      style={{ 
                        border: "1px solid rgba(74, 222, 128, 0.4)", 
                        background: "rgba(22, 163, 74, 0.25)", 
                        color: "#dcfce7", 
                        padding: "1px 4px", 
                        borderRadius: "3px", 
                        fontSize: "8px", 
                        fontWeight: "700", 
                        cursor: "pointer"
                      }}
                    >
                      ⚙️ Day ({ksaOffset > 0 ? `+${ksaOffset}` : ksaOffset})
                    </button>
                  </div>

                  {/* LINE 1: TIME */}
                  <div style={{ fontSize: "13px", fontWeight: "800", fontFamily: "'Courier New', Courier, monospace", color: "#ffffff", marginTop: "2px", lineHeight: "1.1" }}>
                    {currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                  </div>
                  {/* LINE 2: ENGLISH DATE */}
                  <div style={{ fontSize: "9px", color: "#e2e8f0", fontWeight: "600", marginTop: "1px", lineHeight: "1.1" }}>
                    {currentTime.toLocaleDateString("en-US", { timeZone: "Asia/Riyadh", weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  {/* LINE 3: HIJRI DATE */}
                  <div style={{ fontSize: "9px", color: "#4ade80", fontWeight: "700", marginTop: "1px", lineHeight: "1.1" }}>
                    🌙 {formatHijriFull(currentTime, ksaOffset)}
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH GLOSS CALENDAR BUTTON */}
            <button 
              onClick={openCalendarModal}
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: "10px",
                fontWeight: "700",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              📅 Dual Calendar (English & Hijri)
            </button>
          </div>

          {/* STANDARD NORMAL BACKUP BUTTONS */}
          <div className="backup-side-box" style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "250px" }}>
            <button className="vip-backup-btn" onClick={runBackup} disabled={loading} style={{ padding: "8px 12px", fontSize: "11px", borderRadius: "8px" }}>
              {loading ? (<><span className="btn-loader"></span> Backing up...</>) : "Cloud Backup Now"}
            </button>

            <button className="vip-backup-btn" onClick={downloadPCBackup} style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", padding: "8px 12px", fontSize: "11px", borderRadius: "8px" }}>
              📥 Download ZIP to PC
            </button>

            <div className="last-backup-box" style={{ padding: "6px 10px", fontSize: "9px" }}>
              <span>Last Backup</span>
              <b style={{ fontSize: "9px" }}>{lastBackup ? `${lastBackup.name} · ${formatDate(lastBackup.created_at)}` : "Not yet"}</b>
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
          <h2 style={{ fontSize: "18px", margin: 0, textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>Makki Madni Travel & Tours</h2>
          <i style={{ opacity: 0.9, fontSize: "11px" }}>Live Travel Management Dashboard</i>
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
