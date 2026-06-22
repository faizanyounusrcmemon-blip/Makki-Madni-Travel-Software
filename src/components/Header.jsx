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
        overflow: "hidden",
      }}
    >
      {/* Header Top */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}

<div
  style={{
    width: 100,
    height: 100,
    borderRadius: "50%",
    border: "2px solid #d4af37",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    flexShrink: 0,
  }}
>
  <img
    src="/logo.png"
    alt="Makki Madni Travel"
    style={{
      width: "135%",
      height: "135%",
      objectFit: "contain",
      transform: "scale(1.4)",
      display: "block",
    }}
  />
</div>

        {/* Company Info */}
        <div
          style={{
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Company Name */}
          <div
            style={{
              fontSize: "clamp(18px, 4vw, 28px)",
              fontWeight: 700,
              letterSpacing: 0.5,
              lineHeight: 1.2,
              wordBreak: "break-word",
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

          {/* Golden Line */}
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

          {/* Address */}
          <div
            style={{
              fontSize: "clamp(9px, 2vw, 10px)",
              lineHeight: 1.4,
              color: "#0b3d91",
              fontWeight: 600,
              wordBreak: "break-word",
            }}
          >
            Shop #4 Diamond City Building,
            Near Zeenat-ul-Islam Masjid
            <br />
            Garden West, Karachi
          </div>

          {/* Contact */}
          <div
            style={{
              marginTop: 4,
              fontSize: "clamp(9px, 2vw, 10px)",
              fontWeight: 600,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
              wordBreak: "break-word",
            }}
          >
            <span style={{ color: "#003366" }}>
              📧 makkimadnitravel@gmail.com
            </span>

            <span
              style={{
                color: "#999",
                margin: "0 4px",
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
          wordBreak: "break-word",
        }}
      >
        {title}
      </div>
    </div>
  );
}
