import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./dashboard.css";

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

  // RUN BACKUP FUNCTION
const runBackup = async () => {
  const { value: pass, isDismissed } = await Swal.fire({
    width: "360px",
    padding: "1em",
    html: `
      <div style="text-align:center;font-size:14px;line-height:1.5">
        <b style="color:#198754;font-size:16px">💾 Backup</b><br>
        <span style="font-size:13px;color:#555">Enter password to start backup</span>
        <div style="position:relative; margin-top:10px">
          <input 
  type="password" 
  id="swal-pass" 
  class="swal2-input" 
  placeholder="Enter password"
  style="height:32px;font-size:15px;padding:6px 10px;"
>
          <span id="toggle-pass" style="
            position:absolute;
            right:8px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            font-size:14px;
          ">👁</span>
        </div>
        <div id="swal-error" style="color:#dc3545;font-size:12px;min-height:18px;margin-top:4px"></div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Start",
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

      // Show/Hide password
      let visible = false;
      toggle.addEventListener("click", () => {
        visible = !visible;
        input.type = visible ? "text" : "password";
        toggle.textContent = visible ? "🙈" : "👁";
      });

      // Press Enter to confirm
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") document.querySelector(".swal-btn-confirm").click();
      });
    },
    preConfirm: () => {
      const input = document.getElementById("swal-pass");
      const errorBox = document.getElementById("swal-error");
      const popup = document.querySelector(".swal-backup-popup");

      if (!input.value) {
        errorBox.textContent = "Password required";
        popup.classList.add("shake");
        setTimeout(() => popup.classList.remove("shake"), 500);
        return false;
      }

      if (input.value !== "8515") {
        errorBox.textContent = "Wrong password 😎";
        popup.classList.add("shake");
        setTimeout(() => popup.classList.remove("shake"), 500);
        return false;
      }

      return input.value;
    }
  });

  if (isDismissed || !pass) return;

  // Backup loader
  Swal.fire({
    title: "Backing up...",
    html: `<div class="vip-progress"><div class="vip-progress-bar" style="width:0%">0%</div></div>`,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      const bar = document.querySelector(".vip-progress-bar");
      let prog = 0;
      const interval = setInterval(() => {
        if (prog < 90) { prog += 10; bar.style.width = prog + "%"; bar.textContent = prog + "%"; }
        else clearInterval(interval);
      }, 400);
    }
  });

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    const data = await res.json();
    const bar = document.querySelector(".vip-progress-bar");
    bar.style.width = "100%";
    bar.textContent = "100%";

    if (data.success) {
      Swal.fire("Backup Completed ✅", "Your backup was successful.", "success");
      loadLastBackup();
    } else {
      Swal.fire("Error ❌", data.error || "Backup failed", "error");
    }
  } catch {
    Swal.fire("Error ❌", "Server error during backup", "error");
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
          <div className="backup-side-box">
            <button className="vip-backup-btn" onClick={runBackup} disabled={loading}>
              {loading ? (<><span className="btn-loader"></span> Backing up...</>) : "Backup Now"}
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