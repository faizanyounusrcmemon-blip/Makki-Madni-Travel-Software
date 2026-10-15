import React from "react";

export const Loader = ({ message = "Please wait, loading data..." }) => (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: "18px",
      padding: "20px 32px",
      background: "rgba(255, 255, 255, 0.92)",
      backdropFilter: "blur(25px) saturate(210%)",
      WebkitBackdropFilter: "blur(25px) saturate(210%)",
      border: "1px solid rgba(13, 110, 253, 0.2)",
      borderRadius: "24px",
      boxShadow: "0 25px 60px rgba(0, 0, 0, 0.12), 0 10px 25px rgba(13, 110, 253, 0.15)",
      animation: "luxPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      pointerEvents: "none",
      overflow: "hidden",
    }}
  >
    <style>{`
      @keyframes luxPopIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8) translateY(10px); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); }
      }
      @keyframes spinSmooth {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes hourglassFlip {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.15) rotate(180deg); }
      }
      @keyframes progressSlide {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
    `}</style>

    {/* Bottom Glowing Progress Line */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "rgba(13, 110, 253, 0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "60%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, #0d6efd, #0dcaf0, transparent)",
          animation: "progressSlide 1.5s infinite ease-in-out",
        }}
      />
    </div>

    {/* Elegant Circular Icon Box */}
    <div
      style={{
        position: "relative",
        width: "38px",
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "14px",
        background: "rgba(13, 110, 253, 0.08)",
        border: "1px solid rgba(13, 110, 253, 0.15)",
        flexShrink: 0,
      }}
    >
      {/* Outer Spinning Border Ring */}
      <div
        style={{
          position: "absolute",
          inset: "-3px",
          borderRadius: "16px",
          border: "2px solid transparent",
          borderTopColor: "#0d6efd",
          borderRightColor: "#0dcaf0",
          animation: "spinSmooth 0.8s linear infinite",
        }}
      />
      {/* Animated Hourglass */}
      <span
        style={{
          fontSize: "15px",
          display: "inline-block",
          animation: "hourglassFlip 1.6s ease-in-out infinite",
        }}
      >
        ⏳
      </span>
    </div>

    {/* Text Details */}
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span
        style={{
          fontSize: "15px",
          fontWeight: "700",
          color: "#0f172a",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.3px",
          whiteSpace: "nowrap",
        }}
      >
        {message}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: "500",
          color: "#64748b",
          letterSpacing: "0.2px",
        }}
      >
        Please do not close or refresh the window
      </span>
    </div>
  </div>
);