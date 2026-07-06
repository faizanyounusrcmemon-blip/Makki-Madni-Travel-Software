import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

const cleanName = (name) =>
  name ? name.replace(/[^a-zA-Z0-9]/g, "_") : "Document";

const formatDateForFile = (date) => {
  if (!date) return "";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", {
    month: "short",
  }).toUpperCase();

  const year = d.getFullYear();

  return `${day}-${mon}-${year}`;
};

export default function usePdf(
  ref,
  {
    filePrefix = "Document",
    customerName = "",
    bookingDate = "",
    orientation = "p", // p = portrait, l = landscape
    scale = 2,
  } = {}
) {
  const getFileName = () => {
    const customer = cleanName(customerName);
    const date = formatDateForFile(bookingDate);

    return `${filePrefix}_${customer}_${date}.pdf`;
  };

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    try {
      if (!ref.current) {
        return Swal.fire({
          icon: "warning",
          text: "No data found",
        });
      }

      Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

const canvas = await html2canvas(ref.current, {
  scale,
  useCORS: true,
  backgroundColor: "#fff",

  ignoreElements: (el) =>
    el.tagName === "CANVAS",

  onclone: (doc) => {
    doc.querySelectorAll("*").forEach((el) => {
      const bg = el.style.backgroundImage;

      if (
        bg &&
        bg.includes("gradient")
      ) {
        el.style.backgroundImage = "none";
      }
    });
  },
});


      const imgData = canvas.toDataURL(
        "image/jpeg",
        1.0
      );

      const pdf = new jsPDF(
        orientation,
        "mm",
        "a4"
      );

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;

      const imgHeight =
        (canvas.height * imgWidth) /
        canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let pageNo = 1;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      // footer page 1
      pdf.setFontSize(9);
      pdf.text(
        `Page ${pageNo}`,
        pageWidth - 20,
        pageHeight - 5
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pageNo++;

        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        pdf.setFontSize(9);
        pdf.text(
          `Page ${pageNo}`,
          pageWidth - 20,
          pageHeight - 5
        );

        heightLeft -= pageHeight;
      }

      pdf.save(getFileName());

      Swal.close();

      Swal.fire({
        icon: "success",
        text: "PDF Downloaded 😎",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();

      Swal.fire({
        icon: "error",
        text: "PDF Export Failed",
      });

      console.error(err);
    }
  };

  /* ================= PRINT ================= */
  const printPDF = async () => {
    try {
      if (!ref.current) {
        return Swal.fire({
          icon: "warning",
          text: "No data found",
        });
      }

      Swal.fire({
        title: "Preparing Print...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

const canvas = await html2canvas(ref.current, {
  scale,
  useCORS: true,
  backgroundColor: "#fff",

  ignoreElements: (el) =>
    el.tagName === "CANVAS",

  onclone: (doc) => {
    doc.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);

      if (
        style.backgroundImage &&
        style.backgroundImage !== "none"
      ) {
        el.style.backgroundImage = "none";
      }
    });
  },
});

      const imgData = canvas.toDataURL(
        "image/jpeg",
        1.0
      );

      const pdf = new jsPDF(
        orientation,
        "mm",
        "a4"
      );

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;

      const imgHeight =
        (canvas.height * imgWidth) /
        canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pageHeight;
      }

      Swal.close();

      const blobUrl =
        pdf.output("bloburl");

      const win = window.open(
        blobUrl,
        "_blank"
      );

      if (win) {
        win.onload = () => {
          win.focus();
          win.print();
        };
      }

      Swal.fire({
        icon: "success",
        text: "Print Ready 😎",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();

      Swal.fire({
        icon: "error",
        text: "Print Failed",
      });

      console.error(err);
    }
  };

  return {
    exportPDF,
    printPDF,
  };
}