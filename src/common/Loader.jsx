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
      gap: "14px",
      padding: "16px 28px",
      background: "rgba(255, 255, 255, 0.96)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid rgba(13, 110, 253, 0.25)",
      borderRadius: "99px",
      boxShadow: "0 20px 50px rgba(13, 110, 253, 0.2), 0 8px 20px rgba(0, 0, 0, 0.1)",
      animation: "centerPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      pointerEvents: "none",
    }}
  >
    <style>{`
      @keyframes centerPopIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes spinCustom {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes sandFlow {
        0%, 100% { opacity: 0.4; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.1); }
      }
    `}</style>

    {/* Live Animated Hourglass/Spinner Icon Container */}
    <div style={{ position: "relative", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Outer Rotating Ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid #e9ecef",
          borderTopColor: "#0d6efd",
          animation: "spinCustom 0.75s linear infinite",
        }}
      />
      {/* Center Live Hourglass Emoji with Sand Flow Animation */}
      <span
        style={{
          fontSize: "12px",
          animation: "sandFlow 1s ease-in-out infinite",
        }}
      >
        ⏳
      </span>
    </div>

    {/* Message Text */}
    <span
      style={{
        fontSize: "15px",
        fontWeight: "600",
        color: "#212529",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        letterSpacing: "-0.2px",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </span>
  </div>
);