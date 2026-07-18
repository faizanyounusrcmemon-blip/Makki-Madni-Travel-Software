import React from "react";

export default function Header({ title }) {
  return (
    <div
      className="pdf-header"
      style={{
        background: "#fff",
        border: "2px solid #d4af37",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 15,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ================= Header Top ================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {/* ================= Logo ================= */}

        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            border: "2px solid #d4af37",
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="Makki Madni Travel"
            crossOrigin="anonymous"
            loading="eager"
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: "135%",
              height: "135%",
              objectFit: "contain",
              transform: "scale(1.3)",
              display: "block",
            }}
          />
        </div>

        {/* ================= Company ================= */}

        <div
          style={{
            flex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 25,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: 0.5,
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

          {/* Gold Line */}

          <div
            style={{
              width: 130,
              height: 3,
              background: "#d4af37",
              margin: "10px auto",
              borderRadius: 20,
            }}
          />

          {/* Address */}

          <div
            style={{
              color: "#0b3d91",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            Shop #10 Diamond City Building
            <br />
            Near Zeenat-ul-Islam Masjid
            <br />
            Garden West, Karachi
          </div>

          {/* Contact */}

          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#003366" }}>
                📧 makkimadnitravel@gmail.com
            </span>

            <span style={{ color: "#999" }}>|</span>

            <span style={{ color: "#198754" }}>
                ☎ 0335-7476744
            </span>
          </div>
        </div>
      </div>

      {/* ================= Divider ================= */}

      <div
        style={{
          height: 1,
          background: "#d4af37",
          margin: "12px 0",
        }}
      />

      {/* ================= Title ================= */}

      <div
        style={{
          background: "#0b3d91",
          color: "#fff",
          textAlign: "center",
          padding: "8px",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </div>
    </div>
  );
}
