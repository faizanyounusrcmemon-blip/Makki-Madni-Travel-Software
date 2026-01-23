import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SupplierPurchasedetailreport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState(["ALL"]);
  const [supplier, setSupplier] = useState("ALL");
  const [itemType, setItemType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSale, setShowSale] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  const boxRef = useRef(null);

  /* ================= LOAD SUPPLIERS ================= */
  const loadSuppliers = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
    );
    const data = await res.json();
    if (data.success) setSuppliers(["ALL", ...(data.suppliers || [])]);
  };

  /* ================= LOAD REPORT ================= */
  const loadReport = async () => {
    setLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reports/supplier-purchase`
    );
    const data = await res.json();
    if (data.success) setRows(data.rows || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  /* ================= FILTER ================= */
  const filtered = rows.filter((r) => {
    if (supplier !== "ALL" && r.supplier_name?.trim() !== supplier.trim()) return false;

    if (
      itemType !== "ALL" &&
      !r.item?.toLowerCase().includes(itemType.toLowerCase())
    )
      return false;

    const d = r.booking_date ? new Date(r.booking_date) : null;
    if (from && d && d < new Date(from)) return false;
    if (to && d && d > new Date(to)) return false;

    if (search) {
      const s = search.toLowerCase();
      return (
        r.ref_no?.toLowerCase().includes(s) ||
        r.item?.toLowerCase().includes(s) ||
        r.supplier_name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  /* ================= TOTALS ================= */
  const totals = filtered.reduce(
    (a, b) => {
      if (showSale) a.sale += Number(b.sale_pkr || 0);
      a.purchase += Number(b.purchase_pkr || 0);
      if (showProfit) a.profit += Number(b.profit || 0);
      return a;
    },
    { sale: 0, purchase: 0, profit: 0 }
  );

  /* ================= PDF (MULTI PAGE) ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(boxRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("supplier-purchase-report.pdf");
  };

  return (
    <div className="container-fluid p-2 bg-light" style={{ fontSize: 12 }}>
      {/* HEADER */}
      <div className="card shadow-sm mb-2">
        <div className="card-body py-2 d-flex justify-content-between align-items-center bg-primary text-white rounded">
          <b>📦 Supplier Purchase Detail Report</b>
          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm" onClick={() => onNavigate("dashboard")}>
              ⬅ Back
            </button>
            <button className="btn btn-success btn-sm" onClick={exportPDF}>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-2">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                {suppliers.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <select className="form-select form-select-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                <option value="ALL">All Items</option>
                <option value="Ticket">Ticket</option>
                <option value="Hotel">Hotel</option>
                <option value="Visa">Visa</option>
                <option value="Transport">Transport</option>
                <option value="Ziyarat">Ziyarat</option>
              </select>
            </div>

            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>

            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div className="col-md-2">
              <input className="form-control form-control-sm" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="col-md-2 d-grid">
              <button className="btn btn-primary btn-sm" onClick={loadReport}>
                {loading ? "Loading..." : "Load"}
              </button>
            </div>
          </div>

          {/* CHECKBOXES */}
          <div className="d-flex gap-4 mt-2">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" checked={showSale} onChange={(e) => setShowSale(e.target.checked)} />
              <label className="form-check-label">Show Sale</label>
            </div>

            <div className="form-check">
              <input className="form-check-input" type="checkbox" checked={showProfit} onChange={(e) => setShowProfit(e.target.checked)} />
              <label className="form-check-label">Show Profit</label>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE + TOTALS */}
      <div ref={boxRef} className="card shadow-sm">
        <div className="card-body py-2">
          <div className="fw-bold mb-2 text-end">
            {showSale && <>Sale PKR: {fmt(totals.sale)} | </>}
            Purchase PKR: {fmt(totals.purchase)}
            {showProfit && <> | Profit: {fmt(totals.profit)}</>}
          </div>

          <table className="table table-sm table-bordered table-striped text-center align-middle">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Ref</th>
                <th>Item</th>
                {showSale && <>
                  <th>Sale SAR</th>
                  <th>Sale Rate</th>
                  <th>Sale PKR</th>
                </>}
                <th>Purchase SAR</th>
                <th>Purchase Rate</th>
                <th>Purchase PKR</th>
                {showProfit && <th>Profit</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r.booking_date)}</td>
                  <td>{r.supplier_name}</td>
                  <td>{r.ref_no}</td>
                  <td>{r.item}</td>

                  {showSale && <>
                    <td className="text-end">{fmt(r.sale_sar)}</td>
                    <td className="text-end">{fmt(r.sale_rate)}</td>
                    <td className="text-end">{fmt(r.sale_pkr)}</td>
                  </>}

                  <td className="text-end">{fmt(r.purchase_sar)}</td>
                  <td className="text-end">{fmt(r.purchase_rate)}</td>
                  <td className="text-end">{fmt(r.purchase_pkr)}</td>

                  {showProfit && (
                    <td className={`text-end fw-bold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>
                      {fmt(r.profit)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
