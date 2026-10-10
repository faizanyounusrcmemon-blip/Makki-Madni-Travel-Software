import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export default function useReportExport() {

  /* ================= EXPORT PDF ================= */
  const exportPDF = async ({
    code = "",
    name = "",
    fromDate = "",
    toDate = "",
    ledgerData = [],
    companyName = "MAKKI MADNI TRAVEL & TOURS",
    title = "REPORT STATEMENT",
    filePrefix = "Report_Export",
    reportType = "customer_sale", 
    totals = {},
    showSale = false,
    showProfit = false,
  } = {}) => {
    if (!ledgerData || ledgerData.length === 0) {
      return Swal.fire({ icon: "warning", text: "No data to export!" });
    }

    const activeCompany = companyName ? companyName.toUpperCase() : "MAKKI MADNI TRAVEL & TOURS";

    Swal.fire({
      width: "260px",
      title: "Generating PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setTimeout(() => {
      try {
        const doc = new jsPDF("l", "mm", "a4");
        const printDate = formatDate(new Date());
        const pageWidth = doc.internal.pageSize.getWidth();

        const renderHeader = () => {
          doc.setFillColor(13, 71, 161);
          doc.rect(0, 0, pageWidth, 28, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(15);
          doc.text(activeCompany, pageWidth / 2, 12, { align: "center" });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(title.toUpperCase(), pageWidth / 2, 20, { align: "center" });

          doc.setFillColor(245, 247, 250);
          doc.rect(10, 32, pageWidth - 20, 22, "F");

          doc.setTextColor(40, 40, 40);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(`SELECTION / NAME: ${String(name || "ALL").toUpperCase()}`, 14, 40);
          doc.text(`CODE: ${code || "-"}`, 14, 48);

          doc.setFont("helvetica", "normal");
          const periodStr =
            fromDate || toDate
              ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
              : "All Records";
          doc.text(`Period: ${periodStr}`, pageWidth - 70, 40);
          doc.text(`Printed On: ${printDate}`, pageWidth - 70, 48);
        };

        renderHeader();
        let head = [];
        let body = [];

        if (reportType === "customer_sale_ledger") {
          head = [["Date", "Customer", "Ref No", "Item Details", "Sale SAR", "Rate", "Sale PKR", "Paid PKR", "Balance"]];
          body = ledgerData.map((r) => [
            formatDate(r.date),
            r.customer_name,
            r.ref_no,
            r.item,
            fmtAmt(r.sale_sar),
            Number(r.sale_rate || 0) % 1 !== 0 ? Number(r.sale_rate).toFixed(2) : fmtAmt(r.sale_rate),
            fmtAmt(r.sale_pkr),
            fmtAmt(r.payment_pkr),
            fmtAmt(r.running_balance),
          ]);
        } else if (reportType === "customer_sale") {
          head = [["Date", "Customer", "Ref", "Item", "Sale SAR", "Sale Rate", "Sale PKR"]];
          body = ledgerData.map((r) => [
            formatDate(r.booking_date),
            r.customer_name,
            r.ref_no,
            r.item,
            fmtAmt(r.sale_sar),
            fmtAmt(r.sale_rate),
            fmtAmt(r.sale_pkr),
          ]);
        } else if (reportType === "supplier_purchase") {
          head = [[
            "Date", "Supplier", "Ref", "Item",
            ...(showSale ? ["Sale SAR", "Sale Rate", "Sale PKR"] : []),
            "Purchase SAR", "Purchase Rate", "Purchase PKR",
            ...(showProfit ? ["Profit"] : [])
          ]];
          body = ledgerData.map((r) => [
            formatDate(r.booking_date),
            r.supplier_name,
            r.ref_no,
            r.item,
            ...(showSale ? [fmtAmt(r.sale_sar), fmtAmt(r.sale_rate), fmtAmt(r.sale_pkr)] : []),
            fmtAmt(r.purchase_sar),
            fmtAmt(r.purchase_rate),
            fmtAmt(r.purchase_pkr),
            ...(showProfit ? [fmtAmt(r.profit)] : [])
          ]);
        }

        autoTable(doc, {
          head,
          body,
          startY: 58,
          theme: "grid",
          headStyles: { fillColor: [13, 110, 253], textColor: 255, halign: "center" },
          bodyStyles: { halign: "center", fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          didDrawPage: (data) => {
            const finalY = data.cursor.y + 5;
            let totalsText = "";
            if (reportType === "customer_sale_ledger") {
              totalsText = `Total Sale: PKR ${fmtAmt(totals.sale_pkr)} | Total Paid: PKR ${fmtAmt(totals.payment_pkr)} | Current Balance: PKR ${fmtAmt(totals.running_balance)}`;
            } else if (reportType === "customer_sale") {
              totalsText = `Total Sale SAR: ${fmtAmt(totals.sale_sar)} | Total Sale PKR: ${fmtAmt(totals.sale_pkr)}`;
            } else if (reportType === "supplier_purchase") {
              if (showSale) totalsText += `Sale SAR: ${fmtAmt(totals.sale_sar)} | Sale PKR: ${fmtAmt(totals.sale_pkr)}   `;
              totalsText += `Purchase SAR: ${fmtAmt(totals.purchase_sar)} | Purchase PKR: ${fmtAmt(totals.purchase_pkr)}`;
              if (showProfit) totalsText += `   | Profit: ${fmtAmt(totals.profit)}`;
            }
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text(totalsText, pageWidth - 10, finalY, { align: "right" });
          },
          margin: { top: 58, bottom: 15 },
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${i} of ${totalPages}${companyName ? ` — ${companyName}` : ""}`,
            pageWidth / 2,
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
    title = "REPORT STATEMENT",
    filePrefix = "Report_Export",
    reportType = "customer_sale",
    totals = {},
    showSale = false,
    showProfit = false,
  } = {}) => {
    if (!ledgerData || ledgerData.length === 0) {
      return Swal.fire({ icon: "warning", text: "No data to export!" });
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

      if (reportType === "customer_sale_ledger") {
        excelRows.push(["Date", "Customer", "Ref No", "Item Details", "Sale SAR", "Rate", "Sale PKR", "Paid PKR", "Running Balance"]);
        ledgerData.forEach((r) => {
          excelRows.push([
            formatDate(r.date),
            r.customer_name,
            r.ref_no,
            r.item,
            Number(r.sale_sar || 0),
            Number(r.sale_rate || 0),
            Number(r.sale_pkr || 0),
            Number(r.payment_pkr || 0),
            Number(r.running_balance || 0),
          ]);
        });
        excelRows.push(["TOTALS", "", "", "", totals.sale_sar, "", totals.sale_pkr, totals.payment_pkr, totals.running_balance]);
      } else if (reportType === "customer_sale") {
        excelRows.push(["Date", "Customer", "Ref No", "Item", "Sale SAR", "Sale Rate", "Sale PKR"]);
        ledgerData.forEach((r) => {
          excelRows.push([
            formatDate(r.booking_date),
            r.customer_name,
            r.ref_no,
            r.item,
            Number(r.sale_sar || 0),
            Number(r.sale_rate || 0),
            Number(r.sale_pkr || 0),
          ]);
        });
        excelRows.push(["TOTALS", "", "", "", totals.sale_sar, "", totals.sale_pkr]);
      } else if (reportType === "supplier_purchase") {
        const headerRow = ["Date", "Supplier", "Ref No", "Item"];
        if (showSale) headerRow.push("Sale SAR", "Sale Rate", "Sale PKR");
        headerRow.push("Purchase SAR", "Purchase Rate", "Purchase PKR");
        if (showProfit) headerRow.push("Profit");
        excelRows.push(headerRow);

        ledgerData.forEach((r) => {
          const rowArr = [formatDate(r.booking_date), r.supplier_name, r.ref_no, r.item];
          if (showSale) rowArr.push(Number(r.sale_sar || 0), Number(r.sale_rate || 0), Number(r.sale_pkr || 0));
          rowArr.push(Number(r.purchase_sar || 0), Number(r.purchase_rate || 0), Number(r.purchase_pkr || 0));
          if (showProfit) rowArr.push(Number(r.profit || 0));
          excelRows.push(rowArr);
        });

        const totalRow = ["TOTALS", "", "", ""];
        if (showSale) totalRow.push(totals.sale_sar, "", totals.sale_pkr);
        totalRow.push(totals.purchase_sar, "", totals.purchase_pkr);
        if (showProfit) totalRow.push(totals.profit);
        excelRows.push(totalRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      const safeCode = (code || "STATEMENT").replace(/[^a-zA-Z0-9_-]/g, "_");
      XLSX.writeFile(workbook, `${filePrefix}_${safeCode}.xlsx`);
    } catch (err) {
      console.error("Excel Export Error:", err);
      Swal.fire({ icon: "error", text: "Excel Export Failed" });
    }
  };

  return { exportPDF, exportExcel };
}