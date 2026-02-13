import React from "react";

export const Loader = ({ message = "⏳ Loading..." }) => (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9999,
      fontSize: "16px",
      fontWeight: "600",
      color: "#0d6efd", // Bootstrap primary blue
      pointerEvents: "none",
    }}
  >
    {message}
  </div>
);

