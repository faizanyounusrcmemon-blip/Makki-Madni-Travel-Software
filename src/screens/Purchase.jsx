import React, { useEffect, useState } from "react";

/* ===============================
   HELPERS (DOT + COMMA SAFE)
=============================== */
const formatInput = (v) => {
  if (v === "") return "";
  let clean = v.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  const [int, dec] = clean.split(".");
  const intFmt = int ? Number(int).toLocaleString("en-US") : "";
  return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
};

const parseNumber = (v) =>
  parseFloat(String(v || 0).replace(/,/g, "")) || 0;

/* ===============================
   ITEM CATEGORY COLOR
   same category = same color
=============================== */
const itemCategoryColor = (text = "") => {
  const t = text.toLowerCase();

  if (t.includes("transport")) return "#0d6efd"; // blue
  if (t.includes("hotel")) return "#198754"; // green
  if (t.includes("visa")) return "#6f42c1"; // purple
  if (t.includes("ticket")) return "#fd7e14"; // orange
  if (t.includes("food")) return "#dc3545"; // red

  return "#212529"; // default dark
};

export default function Purchase({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  /* ================= LOAD SUPPLIERS ================= */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier/list`)
      .then((r) => r.json())
      .then((d) => d.success && setSuppliers(d.rows || []));
  }, []);

  /* ================= LOAD PENDING ================= */
  const loadPending = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
    );
    const d = await r.json();
    if (d.success) setPending(d.rows || []);
  };

  useEffect(() => {
    loadPending();
  }, []);

  /* ================= LOAD PACKAGE ================= */
  const loadPackage = async (r = refNo) => {
    if (!r) return alert("Ref No required");
    setRefNo(r);
    setLoading(true);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/load/${r}`
    );
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.error || "Not found");
      setRows([]);
      return;
    }

    setIsEdit(data.is_edit === true);

    setRows(
      data.rows.map((x) => ({
        item: x.item,
        item_label: x.item_label,
        sale_sar: Number(x.sale_sar) || 0,
        sale_rate: Number(x.sale_rate) || 0,
        sale_pkr: Number(x.sale_pkr) || 0,
        purchase_sar: x.purchase_sar
          ? formatInput(String(x.purchase_sar))
          : "",
        purchase_rate: x.purchase_rate
          ? formatInput(String(x.purchase_rate))
          : "",
        purchase_pkr: Number(x.purchase_pkr) || 0,
        profit: Number(x.profit) || 0,
        supplier_code: x.supplier_code || "",
        supplier_name: x.supplier_name || "",
      }))
    );
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
    r.purchase_pkr = sar * rate;
    r.profit = r.sale_pkr - r.purchase_pkr;

    setRows(copy);
  };

  /* ================= SAVE ================= */
  const savePurchase = async () => {
    if (!rows.length) return alert("No data");

    const cleanRows = rows.map((r) => ({
      ...r,
      purchase_sar: parseNumber(r.purchase_sar),
      purchase_rate: parseNumber(r.purchase_rate),
    }));

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_no: refNo, items: cleanRows }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert(isEdit ? "Purchase Updated" : "Purchase Saved");
      setRows([]);
      setRefNo("");
      setIsEdit(false);
      loadPending();
      onNavigate("dashboard");
    } else {
      alert(data.error || "Save failed");
    }
  };

  const isPartial =
    rows.length > 0 &&
    rows.some(
      (r) =>
        !parseNumber(r.purchase_sar) ||
        !parseNumber(r.purchase_rate)
    );

  /* ================= UI ================= */
  return (
    <div className="container p-3">
      <div className="card shadow">
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-dark sticky-top">
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
              {rows.map((r, i) => (
                <tr key={i}>
                  <td
                    className="fw-bold"
                    style={{
                      fontSize: "13px",
                      color: itemCategoryColor(
                        r.item_label || r.item
                      ),
                    }}
                  >
                    {r.item_label || r.item}
                  </td>

                  <td>{r.sale_sar}</td>
                  <td>{r.sale_rate}</td>
                  <td>{r.sale_pkr.toLocaleString()}</td>
                  <td>{r.purchase_sar}</td>
                  <td>{r.purchase_rate}</td>
                  <td>{r.purchase_pkr.toLocaleString()}</td>
                  <td>{r.profit.toLocaleString()}</td>
                  <td>{r.supplier_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
