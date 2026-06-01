import React from "react";

export default function Header({ title }) {
  return (
    <div
      className="pdf-header"
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        border: "2px solid #d4af37",
        boxShadow: "0 4px 10px rgba(0,0,0,.08)",
      }}
    >
      {/* Header Top */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  }}
>
  {/* Logo */}
  <img
    src="/logo.png"
    alt="Makki Madni Travel"
    style={{
      width: 90,
      height: 90,
      borderRadius: "50%",
      objectFit: "cover",
      border: "3px solid #d4af37",
      background: "#fff",
      flexShrink: 0,
    }}
  />

  {/* Company Info */}
  <div
    style={{
      textAlign: "center",
    }}
  >

<div
  style={{
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1,
    whiteSpace: "nowrap",
  }}
>
    <span style={{ color: "#0b3d91" }}>
      MAKKI MADNI
    </span>

    <span
      style={{
        color: "#d4af37",
        marginLeft: 8,
      }}
    >
      TRAVEL & TOURS
    </span>
</div>

    <div
      style={{
        width: 100,
        height: 3,
        margin: "8px auto",
        borderRadius: 20,
        background:
          "linear-gradient(to right,#d4af37,#ffd700,#d4af37)",
      }}
    />

    <div
      style={{
        fontSize: 10,
        lineHeight: 1.3,
        color: "#0b3d91",
        fontWeight: 600,
      }}
    >
      Shop #4 Diamond City Building,
      Near Zeenat-ul-Islam Masjid
      <br />
      Garden West, Karachi
    </div>

    <div
      style={{
        marginTop: 4,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      <span style={{ color: "#003366" }}>
        📧 makkimadnitravel@gmail.com
      </span>

      <span
        style={{
          color: "#999",
          margin: "0 6px",
        }}
      >
        |
      </span>

      <span style={{ color: "#198754" }}>
        ☎️ 0335-7476744
      </span>
    </div>
  </div>
</div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          marginTop: 8,
          marginBottom: 8,
          background:
            "linear-gradient(to right,transparent,#d4af37,transparent)",
        }}
      />

      {/* Report Title */}
      <div
        style={{
          background: "#0b3d91",
          color: "#fff",
          textAlign: "center",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>
    </div>
  );
}