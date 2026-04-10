const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateReceipt = (donation, donor, project) => {
  return new Promise((resolve, reject) => {
    try {
      const receiptsDir = path.join(__dirname, "../uploads/receipts");
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const fileName = `receipt-${donation._id}.pdf`;
      const filePath = path.join(receiptsDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleString();
      };

      const donorName =
        donor?.fullName ||
        donor?.name ||
        donation?.donorName ||
        donation?.receiptName ||
        "Donor";

      const donorEmail = donor?.email || donation?.email || "N/A";
      const transactionId =
        donation?.khaltiTransactionId ||
        donation?.providerReference ||
        donation?.transactionId ||
        "N/A";

      const paymentStatus = donation?.paymentStatus || "SUCCESS";

      const amount = Number(donation?.amount || 0).toLocaleString();

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc
        .rect(0, 0, doc.page.width, 110)
        .fill("#1e5631");

      doc
        .fillColor("#ffffff")
        .fontSize(26)
        .font("Helvetica-Bold")
        .text("AidFlow", 50, 30);

      doc
        .fontSize(14)
        .font("Helvetica")
        .text("Donation Receipt", 50, 65);

      doc
        .fillColor("#1a1a1a")
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("Receipt Summary", 50, 140);

      doc
        .moveTo(50, 168)
        .lineTo(545, 168)
        .lineWidth(1)
        .strokeColor("#d9e2dc")
        .stroke();

      const leftX = 50;
      const rightX = 320;
      let y = 190;

      const labelStyle = () => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#666666");
      };

      const valueStyle = () => {
        doc.font("Helvetica").fontSize(12).fillColor("#1a1a1a");
      };

      const drawField = (label, value, x, currentY) => {
        labelStyle();
        doc.text(label, x, currentY);
        valueStyle();
        doc.text(value, x, currentY + 16, {
          width: 200,
        });
      };

      drawField("Receipt ID", String(donation._id), leftX, y);
      drawField("Transaction ID", String(transactionId), rightX, y);

      y += 55;
      drawField("Donor Name", donorName, leftX, y);
      drawField("Donor Email", donorEmail, rightX, y);

      y += 55;
      drawField("Project", project?.title || "N/A", leftX, y);
      drawField("Payment Method", "Khalti", rightX, y);

      y += 55;
      drawField("Date", formatDate(donation?.createdAt), leftX, y);
      drawField("Status", paymentStatus, rightX, y);

      y += 85;

      doc
        .roundedRect(50, y, pageWidth, 90, 12)
        .fillAndStroke("#f6fbf7", "#d9e2dc");

      doc
        .fillColor("#666666")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Donation Amount", 70, y + 20);

      doc
        .fillColor("#1e5631")
        .font("Helvetica-Bold")
        .fontSize(28)
        .text(`NPR ${amount}`, 70, y + 42);

      y += 125;

      doc
        .fillColor("#1a1a1a")
        .font("Helvetica-Bold")
        .fontSize(15)
        .text("Thank you", 50, y);

      doc
        .fillColor("#555555")
        .font("Helvetica")
        .fontSize(11)
        .text(
          "Thank you for supporting AidFlow. Your contribution helps bring more transparency, trust, and impact to charitable giving.",
          50,
          y + 24,
          {
            width: pageWidth,
            align: "left",
            lineGap: 4,
          }
        );

      doc
        .moveTo(50, 710)
        .lineTo(545, 710)
        .lineWidth(1)
        .strokeColor("#d9e2dc")
        .stroke();

      doc
        .fillColor("#7a7a7a")
        .font("Helvetica")
        .fontSize(10)
        .text(
          "This is a system-generated receipt from AidFlow.",
          50,
          722,
          { align: "center", width: pageWidth }
        );

      doc.end();

      stream.on("finish", () => {
        resolve({
          fileName,
          filePath,
          relativePath: `/uploads/receipts/${fileName}`,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateReceipt;