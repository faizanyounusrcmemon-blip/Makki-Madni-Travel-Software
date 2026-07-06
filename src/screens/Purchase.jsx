import React, { useEffect, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";

/* ===============================
   HELPERS (DECIMAL SAFE)
=============================== */
const formatInput = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  let clean = v.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) clean = parts[0] + "." + parts[1];
  return clean;
};

const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  return parseFloat(String(v).replace(/,/g, "")) || 0;
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "34px",
    fontSize: "12px",
    borderRadius: "10px",
    border: state.isFocused
      ? "1px solid #0d6efd"
      : "1px solid #ced4da",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(13,110,253,0.15)"
      : "none",
    background: "#f8f9ff",
    transition: "0.2s",
    "&:hover": {
      border: "1px solid #0d6efd",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: "2px 8px",
  }),

  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#0d6efd" : "#888",
    padding: "4px",
    "&:hover": {
      color: "#0d6efd",
    },
  }),

  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    animation: "fadeIn 0.2s ease",
  }),

  menuList: (base) => ({
    ...base,
    padding: "4px",
  }),

  option: (base, state) => ({
    ...base,
    fontSize: "12px",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    background: state.isSelected
      ? "linear-gradient(135deg,#0d6efd,#4dabf7)"
      : state.isFocused
      ? "#eef4ff"
      : "#fff",
    color: state.isSelected ? "#fff" : "#333",
    transition: "0.15s",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#888",
  }),
};

const customTheme = (theme) => ({
  ...theme,
  borderRadius: 10,
  colors: {
    ...theme.colors,
    primary: "#0d6efd",
    primary25: "#eef4ff",
  },
});


/* ===============================
   ITEM CATEGORY COLOR
=============================== */
const itemCategoryColor = (text = "") => {
  const t = text.toLowerCase();
  if (t.includes("transport")) return "#0d6efd";
  if (t.includes("hotel")) return "#198754";
  if (t.includes("visa")) return "#6f42c1";
  if (t.includes("card")) return "#0b3d91";
  if (t.includes("groups")) return "#212529";
  if (t.includes("ticket")) return "#fd7e14";
  if (t.includes("ziyarat")) return "#dc3545";
  return "#212529";
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [pendingMap, setPendingMap] = useState({});

  /* ================= LOAD SUPPLIERS ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`)
      .then((r) => r.json())
      .then((d) => d.success && setSuppliers(d.rows || []));
  }, []);

  /* ================= LOAD PENDING ================= */
const getCustomerName = (refNo, data) => {
  return (
    pendingMap[refNo] ||
    data.rows?.find(r => r.customer_name)?.customer_name ||
    data.rows?.[0]?.customer_name ||
    "N/A"
  );
};

const loadPending = async () => {
  const r = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
  );

  const d = await r.json();

  console.log("PENDING API:", d);

  if (d.success) {
    setPending(d.rows || []);
  }
};

useEffect(() => {
  loadPending();
}, []);

useEffect(() => {
  const map = {};

  pending.forEach((p) => {
    map[p.ref_no] = p.customer_name;
  });

  setPendingMap(map);
}, [pending]);

  /* ================= LOAD PACKAGE (MANUAL) ================= */
const loadPackage = async (r = refNo) => {

  if (!r) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Ref No required"
    });
  }

  setRefNo(r);
  setLoading(true);

  try {

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/load/${r}`
    );

    const data = await res.json(); // ✅ FIRST PARSE DATA

    console.log("API RESPONSE:", data); // ✅ FIXED POSITION

    setLoading(false);

    if (!data.success) {
      setRows([]);

      return Swal.fire({
        width: "300px",
        icon: "error",
        text: data.error || "Record not found"
      });
    }

    // ======================
    // EDIT MODE
    // ======================
    setIsEdit(data.is_edit === true);

    // ======================
    // ROWS SET
    // ======================
    setRows(
      (data.rows || []).map((x) => ({
        item: x.item,
        item_label: x.item_label,
        sale_sar: parseNumber(x.sale_sar),
        sale_rate: parseNumber(x.sale_rate),
        sale_pkr: parseNumber(x.sale_pkr),

        purchase_sar: x.purchase_sar ? formatInput(String(x.purchase_sar)) : "",
        purchase_rate: x.purchase_rate ? formatInput(String(x.purchase_rate)) : "",
        purchase_pkr: parseNumber(x.purchase_pkr),

        profit: parseNumber(x.profit),

        supplier_code: x.supplier_code || "",
        supplier_name: x.supplier_name || "",
      }))
    );

    // ======================
    // CUSTOMER NAME FIXED (SAFE)
    // ======================
const customerName =
  data.customer_name ||
  data.customer ||
  data.rows?.[0]?.customer_name ||
  data.rows?.[0]?.cust_name ||
  data.rows?.[0]?.client_name ||
  pendingMap[r] ||
  "N/A";

    // ======================
    // SUCCESS POPUP
    // ======================
    Swal.fire({
      width: "360px",
      icon: "success",
      html: `
        <div style="text-align:left; font-size:13px">
          <b>✅ Data Loaded Successfully</b><br/><br/>
          <b>Ref No:</b> ${r}<br/>
          <b>Customer:</b> ${customerName}<br/>
        </div>
      `
    });

  } catch (err) {
    setLoading(false);

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
  }
};

  /* ================= UPDATE ROW ================= */
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    const r = copy[i];

    if (field === "supplier_code") {
      r.supplier_code = value;
      const s = suppliers.find((x) => x.supplier_code === value);
      r.supplier_name = s ? s.supplier_name : "";
    } else {
      r[field] = formatInput(value);
    }

    const sar = parseNumber(r.purchase_sar);
    const rate = parseNumber(r.purchase_rate);
    const purchaseComplete = sar > 0 && rate > 0;

    r.purchase_pkr = purchaseComplete ? sar * rate : 0;
    r.profit = purchaseComplete ? r.sale_pkr - r.purchase_pkr : 0;

    setRows(copy);
  };

  /* ================= SAVE ================= */
const savePurchase = async () => {

  if (!rows.length) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "No data to save"
    });
  }

  const cleanRows = rows
    .filter(
      (r) =>
        parseNumber(r.sale_sar) !== 0 ||
        parseNumber(r.sale_rate) !== 0 ||
        parseNumber(r.sale_pkr) !== 0
    )
    .map((r) => ({
      ...r,
      purchase_sar: parseNumber(r.purchase_sar),
      purchase_rate: parseNumber(r.purchase_rate),
    }));

  if (!cleanRows.length) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "No valid rows to save"
    });
  }

  Swal.fire({
    width: "260px",
    title: "Saving...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_no: refNo, items: cleanRows }),
      }
    );

    const data = await res.json();

    Swal.close();

    if (data.success) {

      await Swal.fire({
        width: "280px",
        icon: "success",
        text: isEdit ? "Purchase Updated Successfully" : "Purchase Saved Successfully"
      });

      setRows([]);
      setRefNo("");
      setIsEdit(false);
      loadPending();
      onNavigate("purchase");

    } else {

      Swal.fire({
        width: "300px",
        icon: "error",
        text: data.error || "Save failed"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
  }
};

  /* ================= PARTIAL CHECK ================= */
  const isPartial = rows
    .filter(
      (r) =>
        parseNumber(r.sale_sar) !== 0 ||
        parseNumber(r.sale_rate) !== 0 ||
        parseNumber(r.sale_pkr) !== 0
    )
    .some(
      (r) =>
        !parseNumber(r.purchase_sar) || !parseNumber(r.purchase_rate)
    );

  const supplierOptions = suppliers.map((s) => ({
    value: s.supplier_code,
    label: s.supplier_name,
  }));

  /* ================= UI ================= */
  return (
    <div className="container py-3" style={{ fontSize: "13px" }}>
      {/* HEADER */}
      <div
        className="mb-3 p-3 rounded-4 text-white shadow"
        style={{ background: "linear-gradient(135deg,#1e3c72,#2a5298)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            🧾 Purchase Entry
            {isEdit && (
              <span className="badge bg-warning text-dark ms-2">EDIT MODE</span>
            )}
          </h5>

          <button
            className="btn btn-light btn-sm fw-bold"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* PARTIAL ALERT */}
      {isPartial && (
        <div className="alert alert-warning fw-bold shadow-sm rounded-3">
          ⚠️ Purchase PARTIAL hai
        </div>
      )}

      {/* PENDING */}
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-header bg-danger text-white fw-bold rounded-top-4">
          ⏳ Pending / Partial Purchases
        </div>

        <div className="card-body p-2">
          {pending.length === 0 ? (
            <p className="text-success mb-0">✅ No pending</p>
          ) : (
            <ul className="list-group list-group-flush">
              {pending.map((p, i) => (
                <li
                  key={i}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div className="fw-bold">
                    <span className="badge bg-dark me-2">{p.ref_no}</span>
                    <span className="text-primary">{p.customer_name}</span>
<span
  className={`badge ms-2 ${
    p.purchase_status === "PENDING"
      ? "bg-danger"
      : p.purchase_status === "PARTIAL"
      ? "bg-warning text-dark"
      : "bg-success"
  }`}
>
  {p.purchase_status}
</span>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => loadPackage(p.ref_no)}
                  >
                    Load
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* REF INPUT */}
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-header bg-info text-white fw-bold rounded-top-4">
          🔢 Enter Ref No
        </div>

        <div className="card-body d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="Enter Ref No..."
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
          />
          <button className="btn btn-primary btn-sm fw-bold" onClick={() => loadPackage()}>
            Load
          </button>
        </div>
      </div>

      {/* SAVE */}
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">
            💾 {isEdit ? "Update Purchase" : "Save Purchase"}
          </h6>

          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm fw-bold ${isEdit ? "btn-warning text-dark" : "btn-success"}`}
              onClick={savePurchase}
            >
              {isEdit ? "✏ Update Purchase" : "💾 Save Purchase"}
            </button>

            {isEdit && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRows([]);
                  setRefNo("");
                  setIsEdit(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead
              className="text-white"
              style={{ background: "linear-gradient(135deg,#000,#434343)", fontSize: "12px" }}
            >
              <tr>
                <th>Item</th>
                <th>Sale SAR</th>
                <th>Rate</th>
                <th>Sale PKR</th>
                <th>Purchase SAR</th>
                <th>Purchase Rate</th>
                <th>Purchase PKR</th>
                <th>Profit</th>
                <th>Supplier</th>
              </tr>
            </thead>

            <tbody>
              {rows
                .map((r, i) => ({ ...r, originalIndex: i }))
                .filter(
                  (r) =>
                    parseNumber(r.sale_sar) !== 0 ||
                    parseNumber(r.sale_rate) !== 0 ||
                    parseNumber(r.sale_pkr) !== 0
                )
                .map((r, i) => {
                  const isIncomplete =
                    (parseNumber(r.sale_sar) !== 0 ||
                      parseNumber(r.sale_rate) !== 0 ||
                      parseNumber(r.sale_pkr) !== 0) &&
                    (!parseNumber(r.purchase_sar) || !parseNumber(r.purchase_rate));

                  return (
                    <tr
                      key={i}
                      className={isIncomplete ? "table-danger" : ""}
                      style={{ transition: "0.2s", cursor: "pointer" }}
                    >
                      <td className="fw-bold" style={{ color: itemCategoryColor(r.item_label || r.item) }}>
                        {r.item_label || r.item}
                      </td>

                      <td>{r.sale_sar}</td>
                      <td>{r.sale_rate}</td>
                      <td className="fw-bold text-primary">{r.sale_pkr.toLocaleString()}</td>

                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={r.purchase_sar}
                          onChange={(e) => updateRow(r.originalIndex, "purchase_sar", e.target.value)}
                        />
                      </td>

                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={r.purchase_rate}
                          onChange={(e) => updateRow(r.originalIndex, "purchase_rate", e.target.value)}
                        />
                      </td>

                      <td className="fw-bold">{r.purchase_pkr.toLocaleString()}</td>

                      <td className={`fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>
                        {r.profit.toLocaleString()}
                      </td>

                      <td style={{ minWidth: "220px" }}>
<Select
  options={supplierOptions}
  value={supplierOptions.find((opt) => opt.value === r.supplier_code) || null}
  onChange={(selected) =>
    updateRow(
      r.originalIndex,
      "supplier_code",
      selected ? selected.value : ""
    )
  }
  placeholder="🔍 Select Supplier..."
  isClearable
  isSearchable
  menuPortalTarget={document.body}
  styles={{
    ...customSelectStyles,
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  }}
  theme={customTheme}
/>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}