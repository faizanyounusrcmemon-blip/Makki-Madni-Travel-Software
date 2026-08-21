import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

/* ================= HELPER FUNCTIONS ================= */

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${day}/${monthNames[dt.getMonth()]}/${dt.getFullYear()}`;
};

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "0" : Number(v).toLocaleString("en-US");

export default function useLedgerExport() {

  /* ================= EXPORT PDF ================= */
  const exportPDF = async ({
    code = "",
    name = "",
    fromDate = "",
    toDate = "",
    ledgerData = [],
    companyName = "MAKKI MADNI TRAVEL & TOURS",
    title = "LEDGER STATEMENT",
    filePrefix = "Ledger_Statement",
  } = {}) => {
    if (!ledgerData || ledgerData.length === 0) {
      return Swal.fire({ icon: "warning", text: "No ledger data to export!" });
    }

    const activeCompany = companyName ? companyName.toUpperCase() : "LEDGER STATEMENT";

    Swal.fire({
      width: "260px",
      title: "Generating PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setTimeout(() => {
      try {
        const doc = new jsPDF("p", "mm", "a4");
        const printDate = formatDate(new Date());

        const renderHeader = () => {
          doc.setFillColor(13, 71, 161);
          doc.rect(0, 0, 210, 28, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(15);
          doc.text(activeCompany, 105, 12, { align: "center" });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(title.toUpperCase(), 105, 20, { align: "center" });

          doc.setFillColor(245, 247, 250);
          doc.rect(10, 32, 190, 22, "F");

          doc.setTextColor(40, 40, 40);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(`NAME: ${name.toUpperCase() || "N/A"}`, 14, 40);
          doc.text(`CODE: ${code || "-"}`, 14, 48);

          doc.setFont("helvetica", "normal");
          const periodStr =
            fromDate || toDate
              ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
              : "All Records";
          doc.text(`Period: ${periodStr}`, 130, 40);
          doc.text(`Printed On: ${printDate}`, 130, 48);
        };

        const renderTableHeader = (startY) => {
          doc.setFillColor(33, 37, 41);
          doc.rect(10, startY, 190, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);

          doc.text("Date", 14, startY + 5.5);
          doc.text("Description", 42, startY + 5.5);
          doc.text("Method", 108, startY + 5.5);
          doc.text("Debit (-)", 140, startY + 5.5, { align: "right" });
          doc.text("Credit (+)", 170, startY + 5.5, { align: "right" });
          doc.text("Balance", 195, startY + 5.5, { align: "right" });
        };

        renderHeader();
        let y = 60;
        renderTableHeader(y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);

        ledgerData.forEach((row) => {
          const itemDetail = row.detail || row.description || row.type || "-";

          // Text Wrapping for Description (Width 60mm)
          const descLines = doc.splitTextToSize(String(itemDetail), 60);

          // Payment Method Text & Wrapping (Width 25mm)
          let methodText = "-";
          if (row.payment_method) {
            const pm = String(row.payment_method).toUpperCase();
            methodText = pm === "BANK" && row.bank_name ? `BANK (${row.bank_name})` : pm;
          }
          const methodLines = doc.splitTextToSize(methodText, 25);

          // Dynamic row height based on max lines
          const maxLines = Math.max(descLines.length, methodLines.length);
          const rowHeight = Math.max(8, maxLines * 4 + 3);

          if (y + rowHeight > 275) {
            doc.addPage();
            renderHeader();
            y = 60;
            renderTableHeader(y);
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 30, 30);
          }

          // Render Date
          doc.text(formatDate(row.date || row.payment_date || row.created_at), 14, y + 5);
          
          // Render Description
          doc.text(descLines, 42, y + 5);

          // Render Method (Singly and Cleanly)
          doc.setFontSize(7.5);
          doc.text(methodLines, 108, y + 5);
          doc.setFontSize(8);

          // Render Debit, Credit, Balance
          const debVal = Number(row.debit || 0) > 0 ? fmtAmt(row.debit) : "-";
          const credVal = Number(row.credit || 0) > 0 ? fmtAmt(row.credit) : "-";

          doc.text(debVal, 140, y + 5, { align: "right" });
          doc.text(credVal, 170, y + 5, { align: "right" });

          doc.setFont("helvetica", "bold");
          doc.text(fmtAmt(row.balance), 195, y + 5, { align: "right" });
          doc.setFont("helvetica", "normal");

          // Line separator
          doc.setDrawColor(230, 230, 230);
          doc.line(10, y + rowHeight - 1, 200, y + rowHeight - 1);

          y += rowHeight;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${i} of ${totalPages}${companyName ? ` — ${companyName}` : ""}`,
            105,
            290,
            { align: "center" }
          );
        }

        const safeCode = (code || "STATEMENT").replace(/[^a-zA-Z0-9_-]/g, "_");
        doc.save(`${filePrefix}_${safeCode}.pdf`);
        Swal.close();
      } catch (err) {
        console.error("PDF Export Error:", err);
        Swal.close();
        Swal.fire({ icon: "error", text: "PDF Generation Failed" });
      }
    }, 100);
  };

  /* ================= EXPORT EXCEL ================= */
  const exportExcel = ({
    code = "",
    name = "",
    fromDate = "",
    toDate = "",
    ledgerData = [],
    companyName = "MAKKI MADNI TRAVEL & TOURS",
    title = "LEDGER STATEMENT",
    filePrefix = "Ledger_Statement",
  } = {}) => {
    if (!ledgerData || ledgerData.length === 0) {
      return Swal.fire({ icon: "warning", text: "No ledger data to export!" });
    }

    try {
      const periodStr =
        fromDate || toDate
          ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
          : "All Records";

      const excelRows = [];

      if (companyName) {
        excelRows.push([companyName.toUpperCase()]);
      }
      excelRows.push([title.toUpperCase()]);
      excelRows.push([]);
      excelRows.push([`NAME: ${name}`, "", "", `Printed On: ${formatDate(new Date())}`]);
      excelRows.push([`CODE: ${code || "-"}`, "", "", `Period: ${periodStr}`]);
      excelRows.push([]);
      excelRows.push(["Date", "Type", "Ref No", "Description", "Payment Method", "Debit (-)", "Credit (+)", "Balance"]);

      ledgerData.forEach((r) => {
        excelRows.push([
          formatDate(r.date || r.payment_date || r.created_at),
          r.type || "-",
          r.ref_no || r.id || "-",
          r.detail || r.description || "-",
          r.payment_method || "-",
          Number(r.debit || 0),
          Number(r.credit || 0),
          Number(r.balance || 0),
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

      worksheet["!cols"] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 45 },
        { wch: 16 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
      ];

      const safeCode = (code || "STATEMENT").replace(/[^a-zA-Z0-9_-]/g, "_");
      XLSX.writeFile(workbook, `${filePrefix}_${safeCode}.xlsx`);
    } catch (err) {
      console.error("Excel Export Error:", err);
      Swal.fire({ icon: "error", text: "Excel Export Failed" });
    }
  };

  return { exportPDF, exportExcel };
}