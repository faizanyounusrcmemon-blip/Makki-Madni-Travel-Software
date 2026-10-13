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

const sanitizeText = (str) => {
  if (!str) return "-";
  return String(str)
    .replace(/[^x00-x7F]/g, "")
    .trim();
};

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
        const pageWidth = 297; 

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
          doc.text(`SELECTION / NAME: ${sanitizeText(name || "ALL").toUpperCase()}`, 14, 40);
          doc.text(`CODE: ${code || "-"}`, 14, 48);

          doc.setFont("helvetica", "normal");
          const periodStr =
            fromDate || toDate
              ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
              : "All Records";
          doc.text(`Period: ${periodStr}`, pageWidth - 70, 40);
          doc.text(`Printed On: ${printDate}`, pageWidth - 70, 48);
        };

        let columns = [];
        if (reportType === "customer_sale_ledger") {
          columns = [
            { header: "Date", x: 12, width: 22, align: "left" },
            { header: "Customer", x: 35, width: 45, align: "left" },
            { header: "Ref No", x: 81, width: 24, align: "left" },
            { header: "Item Details", x: 106, width: 72, align: "left" },
            { header: "Sale SAR", x: 179, width: 20, align: "right" },
            { header: "Rate", x: 200, width: 15, align: "right" },
            { header: "Sale PKR", x: 216, width: 22, align: "right" },
            { header: "Paid PKR", x: 239, width: 22, align: "right" },
            { header: "Running Balance", x: 262, width: 24, align: "right" },
          ];
        } else if (reportType === "customer_sale") {
          columns = [
            { header: "Date", x: 12, width: 26, align: "left" },
            { header: "Customer", x: 40, width: 75, align: "left" },
            { header: "Ref", x: 117, width: 32, align: "left" },
            { header: "Item", x: 151, width: 84, align: "left" },
            { header: "Sale SAR", x: 237, width: 18, align: "right" },
            { header: "Rate", x: 257, width: 14, align: "right" },
            { header: "Sale PKR", x: 273, width: 14, align: "right" },
          ];
        } else if (reportType === "supplier_purchase") {
          const baseCols = [
            { header: "Date", x: 10, width: 20, align: "left" },
            { header: "Supplier", x: 30, width: showSale ? 38 : 52, align: "left" },
            { header: "Ref", x: showSale ? 68 : 82, width: 20, align: "left" },
            { header: "Item", x: showSale ? 88 : 102, width: showSale ? 38 : 52, align: "left" },
          ];
          if (showSale) {
            baseCols.push(
              { header: "Sale/U", x: 126, width: 16, align: "right" },
              { header: "Sale SAR", x: 142, width: 16, align: "right" },
              { header: "Rate", x: 158, width: 13, align: "right" },
              { header: "Sale PKR", x: 171, width: 18, align: "right" }
            );
          }
          baseCols.push(
            { header: "Pur/U", x: showSale ? 189 : 154, width: 16, align: "right" },
            { header: "Purch SAR", x: showSale ? 205 : 170, width: 16, align: "right" },
            { header: "Rate", x: showSale ? 221 : 186, width: 13, align: "right" },
            { header: "Purch PKR", x: showSale ? 234 : 199, width: 18, align: "right" }
          );
          if (showProfit) {
            baseCols.push({ header: "Profit", x: showSale ? 252 : 217, width: 15, align: "right" });
          }
          columns = baseCols;
        }

        const renderTableHeader = (startY) => {
          doc.setFillColor(33, 37, 41);
          doc.rect(10, startY, pageWidth - 20, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);

          columns.forEach((col) => {
            if (col.align === "right") {
              doc.text(col.header, col.x + col.width, startY + 5.5, { align: "right" });
            } else {
              doc.text(col.header, col.x, startY + 5.5);
            }
          });
        };

        renderHeader();
        let y = 60;
        renderTableHeader(y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);

        ledgerData.forEach((r) => {
          let dateStr = "";
          let nameField = "";
          let refNo = "";
          let itemDesc = "";
          let v1 = "", v2 = "", v3 = "", v4 = "", v5 = "", v6 = "", v7 = "", v8 = "", v9 = "";

          if (reportType === "customer_sale_ledger") {
            dateStr = formatDate(r.date);
            nameField = sanitizeText(r.customer_name);
            refNo = sanitizeText(r.ref_no);
            itemDesc = sanitizeText(r.item);
            v1 = fmtAmt(r.sale_sar);
            v2 = Number(r.sale_rate || 0) % 1 !== 0 ? Number(r.sale_rate).toFixed(2) : fmtAmt(r.sale_rate);
            v3 = fmtAmt(r.sale_pkr);
            v4 = fmtAmt(r.payment_pkr);
            v5 = fmtAmt(r.running_balance);
          } else if (reportType === "customer_sale") {
            dateStr = formatDate(r.booking_date);
            nameField = sanitizeText(r.customer_name);
            refNo = sanitizeText(r.ref_no);
            itemDesc = sanitizeText(r.item);
            v1 = fmtAmt(r.sale_sar);
            v2 = fmtAmt(r.sale_rate);
            v3 = fmtAmt(r.sale_pkr);
          } else if (reportType === "supplier_purchase") {
            dateStr = formatDate(r.booking_date);
            nameField = sanitizeText(r.supplier_name);
            refNo = sanitizeText(r.ref_no);
            itemDesc = sanitizeText(r.item);
            v1 = fmtAmt(r.sale_per_unit);
            v2 = fmtAmt(r.sale_sar);
            v3 = fmtAmt(r.sale_rate);
            v4 = fmtAmt(r.sale_pkr);
            v5 = fmtAmt(r.purch_per_unit);
            v6 = fmtAmt(r.purchase_sar);
            v7 = fmtAmt(r.purchase_rate);
            v8 = fmtAmt(r.purchase_pkr);
            v9 = fmtAmt(r.profit);
          }

          const descLines = doc.splitTextToSize(String(itemDesc), columns[3].width);
          const nameLines = doc.splitTextToSize(String(nameField), columns[1].width);

          const maxLines = Math.max(descLines.length, nameLines.length);
          const rowHeight = Math.max(7, maxLines * 4 + 2);

          if (y + rowHeight > 185) {
            doc.addPage();
            renderHeader();
            y = 60;
            renderTableHeader(y);
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 30, 30);
          }

          doc.setFontSize(7.5);
          doc.text(dateStr, columns[0].x, y + 4.5);
          doc.text(nameLines, columns[1].x, y + 4.5);
          doc.text(refNo, columns[2].x, y + 4.5);
          doc.text(descLines, columns[3].x, y + 4.5);

          if (reportType === "customer_sale_ledger") {
            doc.text(v1, columns[4].x + columns[4].width, y + 4.5, { align: "right" });
            doc.text(v2, columns[5].x + columns[5].width, y + 4.5, { align: "right" });
            doc.text(v3, columns[6].x + columns[6].width, y + 4.5, { align: "right" });
            doc.text(v4, columns[7].x + columns[7].width, y + 4.5, { align: "right" });
            doc.setFont("helvetica", "bold");
            doc.text(v5, columns[8].x + columns[8].width, y + 4.5, { align: "right" });
            doc.setFont("helvetica", "normal");
          } else if (reportType === "customer_sale") {
            doc.text(v1, columns[4].x + columns[4].width, y + 4.5, { align: "right" });
            doc.text(v2, columns[5].x + columns[5].width, y + 4.5, { align: "right" });
            doc.setFont("helvetica", "bold");
            doc.text(v3, columns[6].x + columns[6].width, y + 4.5, { align: "right" });
            doc.setFont("helvetica", "normal");
          } else if (reportType === "supplier_purchase") {
            let colIdx = 4;
            if (showSale) {
              doc.text(v1, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
              doc.text(v2, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
              doc.text(v3, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
              doc.text(v4, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
            }
            doc.text(v5, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
            doc.text(v6, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
            doc.text(v7, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
            doc.setFont("helvetica", "bold");
            doc.text(v8, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" }); colIdx++;
            if (showProfit) {
              doc.text(v9, columns[colIdx].x + columns[colIdx].width, y + 4.5, { align: "right" });
            }
            doc.setFont("helvetica", "normal");
          }

          doc.setDrawColor(235, 235, 235);
          doc.line(10, y + rowHeight - 0.5, pageWidth - 10, y + rowHeight - 0.5);

          y += rowHeight;
        });

        // Totals Footer Box
        let totalsText = "";
        if (reportType === "customer_sale_ledger") {
          totalsText = `Total Sale: PKR ${fmtAmt(totals.sale_pkr)}  |  Total Paid: PKR ${fmtAmt(totals.payment_pkr)}  |  Net Balance: PKR ${fmtAmt(totals.running_balance)}`;
        } else if (reportType === "customer_sale") {
          totalsText = `Total Sale SAR: ${fmtAmt(totals.sale_sar)}  |  Total Sale PKR: ${fmtAmt(totals.sale_pkr)}`;
        } else if (reportType === "supplier_purchase") {
          if (showSale) totalsText += `Sale PKR: ${fmtAmt(totals.sale_pkr)}  |  `;
          totalsText += `Purchase PKR: ${fmtAmt(totals.purchase_pkr)}`;
          if (showProfit) totalsText += `  |  Profit: ${fmtAmt(totals.profit)}`;
        }

        if (totalsText && y < 185) {
          y += 3;
          doc.setFillColor(240, 244, 248);
          doc.rect(10, y, pageWidth - 20, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 35, 65);
          doc.text(totalsText, pageWidth - 14, y + 5, { align: "right" });
        }

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${i} of ${totalPages}${companyName ? ` - ${companyName}` : ""}`,
            pageWidth / 2,
            202,
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
            sanitizeText(r.customer_name),
            sanitizeText(r.ref_no),
            sanitizeText(r.item),
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
            sanitizeText(r.customer_name),
            sanitizeText(r.ref_no),
            sanitizeText(r.item),
            Number(r.sale_sar || 0),
            Number(r.sale_rate || 0),
            Number(r.sale_pkr || 0),
          ]);
        });
        excelRows.push(["TOTALS", "", "", "", totals.sale_sar, "", totals.sale_pkr]);
      } else if (reportType === "supplier_purchase") {
        const headerRow = ["Date", "Supplier", "Ref No", "Item"];
        if (showSale) headerRow.push("Sale Per Unit", "Sale SAR", "Sale Rate", "Sale PKR");
        headerRow.push("Purchase Per Unit", "Purchase SAR", "Purchase Rate", "Purchase PKR");
        if (showProfit) headerRow.push("Profit");
        excelRows.push(headerRow);

        ledgerData.forEach((r) => {
          const rowArr = [formatDate(r.booking_date), sanitizeText(r.supplier_name), sanitizeText(r.ref_no), sanitizeText(r.item)];
          if (showSale) rowArr.push(Number(r.sale_per_unit || 0), Number(r.sale_sar || 0), Number(r.sale_rate || 0), Number(r.sale_pkr || 0));
          rowArr.push(Number(r.purch_per_unit || 0), Number(r.purchase_sar || 0), Number(r.purchase_rate || 0), Number(r.purchase_pkr || 0));
          if (showProfit) rowArr.push(Number(r.profit || 0));
          excelRows.push(rowArr);
        });

        const totalRow = ["TOTALS", "", "", ""];
        if (showSale) totalRow.push("", totals.sale_sar, "", totals.sale_pkr);
        totalRow.push("", totals.purchase_sar, "", totals.purchase_pkr);
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