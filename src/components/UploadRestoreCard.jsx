import React, { useState } from "react";
import Swal from "sweetalert2";

export default function UploadRestoreCard() {
  const [zipFile, setZipFile] = useState(null);
  const [zipSingleFile, setZipSingleFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [zipTable, setZipTable] = useState("");
  const [csvTable, setCsvTable] = useState("");

  const TABLES = [
    "bookings",
    "expense_ledger",
    "hotels",
    "ticketing",
    "visa",
    "card",
    "transport",
    "purchase_entries",
    "users",
    "bank_transactions",
    "cash_transactions",
    "customer_payments",
    "purchase_payments",
    "supplier_payments",
    "suppliers",
    "ziyarat",
  ];

  const askPassword = async (title, fileObj) => {
    let show = false;

    const { value: password } = await Swal.fire({
      width: "380px",
      title,
      html: `
        <div style="text-align:left;font-size:13px">

          <div style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:10px;
            padding:10px;
            margin-bottom:12px;
          ">
            <div style="font-weight:700;color:#2563eb">
              📁 Selected File
            </div>

            <div style="
              margin-top:5px;
              font-size:12px;
              word-break:break-all;
            ">
              ${fileObj?.name || "-"}
            </div>

            <div style="
              margin-top:5px;
              color:#64748b;
              font-size:11px;
            ">
              ${
                fileObj?.size
                  ? (fileObj.size / 1024 / 1024).toFixed(2) + " MB"
                  : "-"
              }
            </div>
          </div>

          <div style="position:relative">

            <input
              id="swal-pass"
              type="password"
              class="swal2-input"
              placeholder="Enter Password"
              style="
                width:100%;
                margin:0;
                height:42px;
                font-size:13px;
              "
            />

            <span
              id="toggle-pass"
              style="
                position:absolute;
                right:12px;
                top:50%;
                transform:translateY(-50%);
                cursor:pointer;
                font-size:16px;
              "
            >
              👁
            </span>

          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      focusConfirm: false,

      preConfirm: () => {
        const val =
          document.getElementById("swal-pass").value;

        if (!val || !val.trim()) {
          Swal.showValidationMessage(
            "Password required"
          );
          return false;
        }

        return val.trim();
      },

      didOpen: () => {
        const input =
          document.getElementById("swal-pass");

        const toggle =
          document.getElementById("toggle-pass");

        toggle.addEventListener("click", () => {
          show = !show;

          input.type = show
            ? "text"
            : "password";

          toggle.textContent = show
            ? "🙈"
            : "👁";
        });
      },
    });

    return password;
  };

  const uploadRequest = async (
    url,
    fileField,
    file,
    table = null,
    title = "Restore"
  ) => {
    if (!file) {
      return Swal.fire(
        "Error",
        "Please select a file",
        "error"
      );
    }

    const password = await askPassword(
      title,
      file
    );

    if (!password) return;

    const fd = new FormData();

    fd.append(fileField, file);
    fd.append("password", password);

    if (table) {
      fd.append("table", table);
    }

    try {
      Swal.fire({
        title: "Processing...",
        html: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${url}`,
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await res.json();

      Swal.close();

      if (!data.success) {
        return Swal.fire(
          "Error",
          data.error || "Restore failed",
          "error"
        );
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Restore completed successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();

      Swal.fire(
        "Error",
        err.message,
        "error"
      );
    }
  };

  return (
    <div className="upload-card">
      <h4 className="mb-4 fw-bold text-primary">
        📤 External Backup Restore
      </h4>

      {/* ZIP FULL RESTORE */}
      <div className="upload-section">
        <div className="upload-title">
          🔄 ZIP Full Restore
        </div>

        <input
          type="file"
          accept=".zip"
          className="form-control mb-3"
          onChange={(e) =>
            setZipFile(e.target.files[0])
          }
        />

        <button
          className="vip-btn vip-success"
          onClick={() =>
            uploadRequest(
              "/api/backup/restore/upload/full",
              "backup",
              zipFile,
              null,
              "ZIP Full Restore"
            )
          }
        >
          📦 Restore Complete Backup
        </button>
      </div>

      {/* ZIP SINGLE TABLE */}
      <div className="upload-section">
        <div className="upload-title">
          📁 ZIP Single Table Restore
        </div>

        <input
          type="file"
          accept=".zip"
          className="form-control mb-3"
          onChange={(e) =>
            setZipSingleFile(
              e.target.files[0]
            )
          }
        />

        <select
          className="form-select mb-3"
          value={zipTable}
          onChange={(e) =>
            setZipTable(e.target.value)
          }
        >
          <option value="">
            Select Table
          </option>

          {TABLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          className="vip-btn vip-primary"
          onClick={() => {
            if (!zipTable) {
              return Swal.fire(
                "Error",
                "Select a table",
                "error"
              );
            }

            uploadRequest(
              "/api/backup/restore/upload/table",
              "backup",
              zipSingleFile,
              zipTable,
              "ZIP Single Table Restore"
            );
          }}
        >
          📂 Restore Selected Table
        </button>
      </div>

      {/* CSV RESTORE */}
      <div className="upload-section">
        <div className="upload-title">
          📄 CSV Single Table Restore
        </div>

        <input
          type="file"
          accept=".csv"
          className="form-control mb-3"
          onChange={(e) =>
            setCsvFile(e.target.files[0])
          }
        />

        <select
          className="form-select mb-3"
          value={csvTable}
          onChange={(e) =>
            setCsvTable(e.target.value)
          }
        >
          <option value="">
            Select Table
          </option>

          {TABLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          className="vip-btn vip-danger"
          onClick={() => {
            if (!csvTable) {
              return Swal.fire(
                "Error",
                "Select a table",
                "error"
              );
            }

            uploadRequest(
              "/api/backup/restore/csv",
              "csv",
              csvFile,
              csvTable,
              "CSV Restore"
            );
          }}
        >
          📄 Restore CSV
        </button>
      </div>
    </div>
  );
}