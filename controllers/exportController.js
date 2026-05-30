const ExcelJS = require("exceljs");

const DailyReport = require("../models/DailyReport");
const Expense = require("../models/Expense");
const ManpowerPlan = require("../models/ManpowerPlan");
const ManpowerAttendance = require("../models/ManpowerAttendance");
const Manpower = require("../models/Manpower");
const MaterialRequest = require("../models/MaterialRequest");
const PDFDocument = require("pdfkit");
const ExpenseRequest = require("../models/ExpenseRequest");
const Productivity = require("../models/Productivity");
const https = require("https");
const http = require("http");
const path = require("path");

// =====================
// DAILY REPORT EXCEL
// =====================
exports.exportReportsExcel = async (req, res) => {
  try {
    const reports = await DailyReport.find()
      .populate("project", "name")
      .populate("submittedBy", "name");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily Reports");

    worksheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Weather", key: "weather", width: 20 },
      { header: "Work Accomplished", key: "work", width: 40 },
      { header: "Manpower", key: "manpower", width: 15 },
      { header: "Submitted By", key: "submittedBy", width: 25 },
      { header: "Issues", key: "issues", width: 35 },
      { header: "Remarks", key: "remarks", width: 35 },
    ];

    reports.forEach((r) => {
      worksheet.addRow({
        project: r.project?.name || "",
        date: r.reportDate
          ? new Date(r.reportDate).toISOString().slice(0, 10)
          : "",
        weather: r.weatherCondition || "",
        work: r.workAccomplished || "",
        manpower: r.manpowerCount || 0,
        submittedBy: r.submittedBy?.name || "",
        issues: r.issuesEncountered || "",
        remarks: r.remarks || "",
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=daily-reports.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// EXPENSES EXCEL
// =====================
exports.exportExpensesExcel = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("project", "name");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenses");

    worksheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Labor", key: "labor", width: 15 },
      { header: "Materials", key: "materials", width: 15 },
      { header: "Equipment", key: "equipment", width: 15 },
      { header: "Others", key: "others", width: 15 },
      { header: "Total", key: "total", width: 15 },
    ];

    expenses.forEach((e) => {
      const total =
        Number(e.laborCost || 0) +
        Number(e.materialCost || 0) +
        Number(e.equipmentCost || 0) +
        Number(e.otherExpenses || 0);

      worksheet.addRow({
        project: e.project?.name || "",
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
        labor: e.laborCost || 0,
        materials: e.materialCost || 0,
        equipment: e.equipmentCost || 0,
        others: e.otherExpenses || 0,
        total,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// MANPOWER EXCEL
// =====================
exports.exportManpowerExcel = async (req, res) => {
  try {
    const manpower = await Manpower.find().populate("project", "name");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Manpower");

    worksheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Skilled", key: "skilled", width: 15 },
      { header: "Helpers", key: "helpers", width: 15 },
      { header: "Engineers", key: "engineers", width: 15 },
      { header: "Operators", key: "operators", width: 15 },
      { header: "Total", key: "total", width: 15 },
    ];

    manpower.forEach((m) => {
      const total =
        Number(m.skilledWorkers || 0) +
        Number(m.helpers || 0) +
        Number(m.engineers || 0) +
        Number(m.operators || 0);

      worksheet.addRow({
        project: m.project?.name || "",
        date: m.date ? new Date(m.date).toISOString().slice(0, 10) : "",
        skilled: m.skilledWorkers || 0,
        helpers: m.helpers || 0,
        engineers: m.engineers || 0,
        operators: m.operators || 0,
        total,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", "attachment; filename=manpower.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================
// MATERIAL REQUESTS EXCEL
// =====================
exports.exportMaterialRequestsExcel = async (req, res) => {
  try {
    const requests = await MaterialRequest.find()
      .populate("project", "name")
      .populate("requestedBy", "name");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Material Requests");

    worksheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Material", key: "material", width: 25 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Purpose", key: "purpose", width: 30 },
      { header: "Status", key: "status", width: 20 },
      { header: "Requested By", key: "requestedBy", width: 25 },
      { header: "Requested Date", key: "date", width: 20 },
    ];

    requests.forEach((r) => {
      worksheet.addRow({
        project: r.project?.name || "",
        material: r.materialName || "",
        quantity: r.quantity || 0,
        unit: r.unit || "",
        purpose: r.purpose || "",
        status: r.status || "",
        requestedBy: r.requestedBy?.name || "",
        date: r.createdAt
          ? new Date(r.createdAt).toISOString().slice(0, 10)
          : "",
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=material-requests.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error("Failed to load image."));
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function formatDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "-";
}

function formatDateTime(value) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "-";
}

function addFooter(doc) {
  const range = doc.bufferedPageRange();

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    doc.save();

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        `Construction Project Monitoring System   •   Page ${i + 1} of ${range.count}`,
        40,
        805,
        {
          width: 515,
          align: "center",
          lineBreak: false,
        },
      );

    doc.restore();
  }
}

function ensureSpace(doc, needed = 100) {
  if (doc.y + needed > 760) {
    doc.addPage();
    doc.y = 45;
  }
}

function sectionHeader(doc, number, title) {
  ensureSpace(doc, 45);

  const y = doc.y + 8;

  doc.roundedRect(40, y, 24, 22, 3).fill("#0f2f57");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(String(number), 47, y + 6);

  doc
    .fillColor("#0f2f57")
    .fontSize(13)
    .text(title.toUpperCase(), 72, y + 5);

  doc
    .moveTo(72, y + 24)
    .lineTo(555, y + 24)
    .strokeColor("#0f2f57")
    .lineWidth(1)
    .stroke();

  doc.fillColor("#111827").strokeColor("#000000");
  doc.y = y + 36;
}

function infoLabelValue(doc, label, value, x, y, width = 180) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f2f57").text(label, x, y);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#111827")
    .text(value || "-", x + 92, y, {
      width,
    });
}

function drawBoxText(doc, text, height = 70) {
  ensureSpace(doc, height + 20);

  const y = doc.y;

  doc.roundedRect(40, y, 515, height, 5).strokeColor("#cbd5e1").stroke();

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(text || "-", 52, y + 12, {
      width: 490,
      height: height - 18,
      align: "justify",
    });

  doc.y = y + height + 12;
}

function drawTable(doc, headers, rows, widths) {
  const startX = 40;
  const rowHeight = 26;
  const tableWidth = 515;
  const colWidths = widths || headers.map(() => tableWidth / headers.length);

  ensureSpace(doc, rowHeight * 2 + 20);

  let x = startX;
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");

  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowHeight).fillAndStroke("#0f2f57", "#94a3b8");
    doc.text(h.toUpperCase(), x + 6, y + 8, {
      width: colWidths[i] - 12,
      align: "center",
    });
    x += colWidths[i];
  });

  y += rowHeight;

  doc.font("Helvetica").fontSize(9).fillColor("#111827");

  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, rowHeight + 20);

    x = startX;
    y = doc.y;

    const bg = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";

    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).fillAndStroke(bg, "#cbd5e1");
      doc.fillColor("#111827").text(String(cell ?? "-"), x + 6, y + 8, {
        width: colWidths[i] - 12,
        align: i === 0 ? "left" : "center",
      });
      x += colWidths[i];
    });

    doc.y = y + rowHeight;
  });

  doc.moveDown(0.8);
}

function drawStatusBadge(doc, status, x, y) {
  let color = "#f59e0b";

  if (status === "Confirmed") color = "#16a34a";
  if (status === "Needs Revision") color = "#dc2626";

  doc.roundedRect(x, y, 88, 18, 4).fill(color);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(status || "Pending", x, y + 5, {
      width: 88,
      align: "center",
    });

  doc.fillColor("#111827");
}

function drawHeader(doc, report) {
  const logoPath = path.join(__dirname, "../public/logo.png");
  const reportDate = formatDate(report.reportDate);

  try {
    doc.image(logoPath, 42, 28, { fit: [72, 72] });
  } catch {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#0f2f57")
      .text("CONSTRUCTION PMS", 40, 45, { width: 90 });
  }

  doc
    .fillColor("#0f2f57")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("CONSTRUCTION DAILY", 135, 32, {
      width: 315,
      align: "center",
      lineBreak: false,
    });

  doc.fontSize(18).text("PROGRESS REPORT", 135, 55, {
    width: 315,
    align: "center",
    lineBreak: false,
  });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#475569")
    .text(
      "Accurate Reporting • Better Management • Successful Projects",
      135,
      80,
      {
        width: 315,
        align: "center",
        lineBreak: false,
      },
    );

  doc.moveTo(155, 98).lineTo(430, 98).strokeColor("#0f2f57").stroke();

  doc.roundedRect(462, 32, 92, 50, 4).fill("#0f2f57");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("REPORT DATE", 475, 43);

  doc.fontSize(11).text(reportDate, 475, 58);

  doc.fillColor("#111827").strokeColor("#000000");
  doc.y = 125;
}

function drawInfoCard(doc, report) {
  const y = doc.y;

  doc.roundedRect(40, y, 515, 100, 6).strokeColor("#cbd5e1").stroke();

  infoLabelValue(doc, "PROJECT", report.project?.name || "-", 60, y + 18, 210);
  infoLabelValue(doc, "REPORT DATE", formatDate(report.reportDate), 60, y + 43);
  infoLabelValue(doc, "WEATHER", report.weatherCondition || "-", 60, y + 68);

  doc
    .moveTo(305, y + 15)
    .lineTo(305, y + 85)
    .strokeColor("#cbd5e1")
    .stroke();

  infoLabelValue(
    doc,
    "SUBMITTED BY",
    report.submittedBy?.name || "-",
    325,
    y + 18,
    115,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#0f2f57")
    .text("STATUS", 325, y + 43);
  drawStatusBadge(
    doc,
    report.status || (report.isConfirmed ? "Confirmed" : "Pending"),
    417,
    y + 39,
  );

  infoLabelValue(
    doc,
    "REVIEWED BY",
    report.reviewedBy?.name || "-",
    325,
    y + 68,
    115,
  );

  doc.fillColor("#111827");
  doc.y = y + 118;
}

function drawThreeCards(doc, report) {
  const y = doc.y;
  const cardWidth = 163;
  const gap = 13;

  const cards = [
    ["ISSUES ENCOUNTERED", report.issuesEncountered || "None"],
    ["SAFETY INCIDENTS", report.safetyIncidents || "None"],
    ["REMARKS", report.remarks || "None"],
  ];

  cards.forEach((card, i) => {
    const x = 40 + i * (cardWidth + gap);

    doc.roundedRect(x, y, cardWidth, 78, 5).strokeColor("#cbd5e1").stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#0f2f57")
      .text(card[0], x + 10, y + 12, { width: cardWidth - 20 });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#111827")
      .text(card[1], x + 10, y + 35, {
        width: cardWidth - 20,
        height: 35,
      });
  });

  doc.y = y + 92;
}

async function drawPhotos(doc, photos) {
  sectionHeader(doc, 8, "Site Photos");

  if (!photos.length) {
    drawBoxText(doc, "No site photos uploaded.", 45);
    return;
  }

  const imgW = 240;
  const imgH = 145;
  let x = 40;
  let y = doc.y;

  for (let i = 0; i < photos.length; i++) {
    const photoUrl = photos[i].url || photos[i];

    if (y + imgH + 35 > 780) {
      doc.addPage();
      y = 45;
      x = 40;
    }

    try {
      const buffer = await fetchImageBuffer(photoUrl);

      doc.roundedRect(x, y, imgW, imgH, 5).strokeColor("#cbd5e1").stroke();

      doc.image(buffer, x + 4, y + 4, {
        fit: [imgW - 8, imgH - 8],
        align: "center",
        valign: "center",
      });

      doc.roundedRect(x + 8, y + 8, 20, 18, 3).fill("#0f2f57");

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(String(i + 1), x + 8, y + 13, {
          width: 20,
          align: "center",
        });

      doc.fillColor("#111827");
    } catch {
      doc.roundedRect(x, y, imgW, imgH, 5).strokeColor("#cbd5e1").stroke();
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#64748b")
        .text(`Photo ${i + 1} could not be loaded.`, x + 20, y + 60, {
          width: imgW - 40,
          align: "center",
        });
    }

    if (x === 40) {
      x = 315;
    } else {
      x = 40;
      y += imgH + 20;
    }
  }

  doc.y = x === 40 ? y + 20 : y + imgH + 25;
}

exports.exportReportPdf = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate("project", "name")
      .populate("submittedBy", "name")
      .populate("confirmedBy", "name")
      .populate("reviewedBy", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=daily-report-${report._id}.pdf`,
    );

    doc.pipe(res);

    drawHeader(doc, report);
    drawInfoCard(doc, report);

    sectionHeader(doc, 1, "Work Accomplished");
    drawBoxText(doc, report.workAccomplished || "-", 85);

    sectionHeader(doc, 2, "Manpower");
    const manpowerRows = (report.manpower || []).length
      ? report.manpower.map((m) => [m.position || "-", m.quantity || 0])
      : [["None", "0"]];

    const manpowerTotal = (report.manpower || []).reduce(
      (sum, m) => sum + Number(m.quantity || 0),
      0,
    );

    drawTable(
      doc,
      ["Position", "Quantity"],
      [...manpowerRows, ["TOTAL", manpowerTotal]],
      [360, 155],
    );

    sectionHeader(doc, 3, "Equipment Used");
    const equipmentRows = (report.equipmentUsed || []).length
      ? report.equipmentUsed.map((e) => [
          e.equipmentName || "-",
          e.quantity || 0,
          e.remarks || "-",
        ])
      : [["None", "0", "-"]];

    const equipmentTotal = (report.equipmentUsed || []).reduce(
      (sum, e) => sum + Number(e.quantity || 0),
      0,
    );

    drawTable(
      doc,
      ["Equipment", "Quantity", "Remarks"],
      [...equipmentRows, ["TOTAL", equipmentTotal, "-"]],
      [220, 90, 205],
    );

    sectionHeader(doc, 4, "Materials Used");
    const materialRows = (report.materialsUsed || []).length
      ? report.materialsUsed.map((m) => [
          m.materialName || "-",
          m.quantity || 0,
          m.unit || "-",
        ])
      : [["None", "0", "-"]];

    const materialTotal = (report.materialsUsed || []).reduce(
      (sum, m) => sum + Number(m.quantity || 0),
      0,
    );

    drawTable(
      doc,
      ["Material", "Quantity", "Unit"],
      [...materialRows, ["TOTAL", materialTotal, "-"]],
      [255, 110, 150],
    );

    sectionHeader(doc, 5, "Issues / Safety / Remarks");
    drawThreeCards(doc, report);

    sectionHeader(doc, 6, "Admin Comments");
    drawBoxText(doc, report.adminComments || "None", 60);

    sectionHeader(doc, 7, "Review Information");
    drawTable(
      doc,
      ["Field", "Details"],
      [
        ["Reviewed By", report.reviewedBy?.name || "-"],
        ["Reviewed At", formatDateTime(report.reviewedAt)],
        ["Confirmed By", report.confirmedBy?.name || "-"],
        ["Confirmed At", formatDateTime(report.confirmedAt)],
      ],
      [180, 335],
    );

    await drawPhotos(doc, report.photos || []);

    sectionHeader(doc, 9, "Signatures");

    ensureSpace(doc, 90);

    const sigY = doc.y + 38;

    doc.moveTo(75, sigY).lineTo(245, sigY).strokeColor("#111827").stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#111827")
      .text("PREPARED BY / STAFF", 75, sigY + 8, {
        width: 170,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(report.submittedBy?.name || "-", 75, sigY + 25, {
        width: 170,
        align: "center",
      });

    doc.moveTo(340, sigY).lineTo(510, sigY).strokeColor("#111827").stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("REVIEWED / APPROVED BY", 340, sigY + 8, {
        width: 170,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(report.reviewedBy?.name || "-", 340, sigY + 25, {
        width: 170,
        align: "center",
      });

    addFooter(doc);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportExpenseRequestsExcel = async (req, res) => {
  try {
    const filter = {};

    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};

      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from);
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};

      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from);
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const rows = await ExpenseRequest.find(filter)
      .populate("project", "name")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expense Requests");

    sheet.columns = [
      { header: "Date Requested", key: "dateRequested", width: 20 },
      { header: "Project", key: "project", width: 25 },
      { header: "Category", key: "category", width: 18 },
      { header: "Description", key: "description", width: 35 },
      { header: "Reason", key: "reason", width: 35 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Requested By", key: "requestedBy", width: 22 },
      { header: "Reviewed By", key: "reviewedBy", width: 22 },
      { header: "Admin Remarks", key: "adminRemarks", width: 35 },
    ];

    sheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      sheet.addRow({
        dateRequested: r.createdAt
          ? new Date(r.createdAt).toLocaleString("en-PH")
          : "",
        project: r.project?.name || "",
        category: r.category || "",
        description: r.description || "",
        reason: r.reason || "",
        amount: Number(r.amount || 0),
        status: r.status || "",
        requestedBy: r.requestedBy?.name || "",
        reviewedBy: r.reviewedBy?.name || "",
        adminRemarks: r.adminRemarks || "",
      });
    });

    sheet.addRow([]);
    sheet.addRow([
      "Total Amount",
      "",
      "",
      "",
      "",
      rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=expense-requests.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      message: "Failed to export expense requests.",
      error: error.message,
    });
  }
};

// =====================
// EXPENSE REQUESTS EXCEL
// =====================
exports.exportExpenseRequestsExcel = async (req, res) => {
  try {
    const filter = {};

    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};

      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from);
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const rows = await ExpenseRequest.find(filter)
      .populate("project", "name")
      .populate("requestedBy", "name")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expense Requests");

    sheet.columns = [
      { header: "Date Requested", key: "dateRequested", width: 20 },
      { header: "Project", key: "project", width: 25 },
      { header: "Category", key: "category", width: 18 },
      { header: "Description", key: "description", width: 35 },
      { header: "Reason", key: "reason", width: 35 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Requested By", key: "requestedBy", width: 22 },
      { header: "Reviewed By", key: "reviewedBy", width: 22 },
      { header: "Admin Remarks", key: "adminRemarks", width: 35 },
    ];

    sheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      sheet.addRow({
        dateRequested: r.createdAt
          ? new Date(r.createdAt).toLocaleString("en-PH")
          : "",
        project: r.project?.name || "",
        category: r.category || "",
        description: r.description || "",
        reason: r.reason || "",
        amount: Number(r.amount || 0),
        status: r.status || "",
        requestedBy: r.requestedBy?.name || "",
        reviewedBy: r.reviewedBy?.name || "",
        adminRemarks: r.adminRemarks || "",
      });
    });

    sheet.addRow([]);

    sheet.addRow([
      "TOTAL",
      "",
      "",
      "",
      "",
      rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    ]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=expense-requests.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      message: "Failed to export expense requests.",
      error: error.message,
    });
  }
};

// =====================
// PLANNED VS ACTUAL MANPOWER EXCEL
// =====================
exports.exportManpowerPlansExcel = async (req, res) => {
  try {
    const filter = {};

    if (req.query.project) {
      filter.project = req.query.project;
    }

    const plans = await ManpowerPlan.find(filter)
      .populate("project", "name")
      .sort({ date: -1 });

    const attendance = await ManpowerAttendance.find(filter)
      .populate("project", "name")
      .sort({ date: -1 });

    const attendanceMap = {};

    attendance.forEach((a) => {
      const key = `${String(a.project?._id || a.project)}-${new Date(a.date)
        .toISOString()
        .slice(0, 10)}`;

      if (!attendanceMap[key]) {
        attendanceMap[key] = {
          skilledWorkers: 0,
          helpers: 0,
          engineers: 0,
          operators: 0,
        };
      }

      (a.workers || []).forEach((w) => {
        if (!["Present", "Late", "Half Day"].includes(w.status)) return;

        if (w.position === "Skilled") {
          attendanceMap[key].skilledWorkers += 1;
        }

        if (w.position === "Helper") {
          attendanceMap[key].helpers += 1;
        }

        if (w.position === "Engineer") {
          attendanceMap[key].engineers += 1;
        }

        if (w.position === "Operator") {
          attendanceMap[key].operators += 1;
        }
      });
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planned vs Actual Manpower");

    worksheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Activity", key: "activity", width: 30 },

      { header: "Planned Skilled", key: "plannedSkilled", width: 18 },
      { header: "Actual Skilled", key: "actualSkilled", width: 18 },
      { header: "Skilled Shortage", key: "shortageSkilled", width: 18 },

      { header: "Planned Helpers", key: "plannedHelpers", width: 18 },
      { header: "Actual Helpers", key: "actualHelpers", width: 18 },
      { header: "Helpers Shortage", key: "shortageHelpers", width: 18 },

      { header: "Planned Engineers", key: "plannedEngineers", width: 18 },
      { header: "Actual Engineers", key: "actualEngineers", width: 18 },
      { header: "Engineers Shortage", key: "shortageEngineers", width: 18 },

      { header: "Planned Operators", key: "plannedOperators", width: 18 },
      { header: "Actual Operators", key: "actualOperators", width: 18 },
      { header: "Operators Shortage", key: "shortageOperators", width: 18 },

      { header: "Total Planned", key: "plannedTotal", width: 18 },
      { header: "Total Actual", key: "actualTotal", width: 18 },
      { header: "Total Shortage", key: "shortage", width: 18 },
      { header: "Delay Risk", key: "delayRisk", width: 18 },
      { header: "Status", key: "status", width: 18 },
      { header: "Remarks", key: "remarks", width: 35 },
    ];

    plans.forEach((p) => {
      const key = `${String(p.project?._id || p.project)}-${new Date(p.date)
        .toISOString()
        .slice(0, 10)}`;

      const actual = attendanceMap[key] || {
        skilledWorkers: 0,
        helpers: 0,
        engineers: 0,
        operators: 0,
      };

      const shortages = {
        skilledWorkers: Math.max(
          0,
          Number(p.skilledWorkers || 0) - Number(actual.skilledWorkers || 0),
        ),
        helpers: Math.max(
          0,
          Number(p.helpers || 0) - Number(actual.helpers || 0),
        ),
        engineers: Math.max(
          0,
          Number(p.engineers || 0) - Number(actual.engineers || 0),
        ),
        operators: Math.max(
          0,
          Number(p.operators || 0) - Number(actual.operators || 0),
        ),
      };

      const plannedTotal =
        Number(p.skilledWorkers || 0) +
        Number(p.helpers || 0) +
        Number(p.engineers || 0) +
        Number(p.operators || 0);

      const actualTotal =
        Number(actual.skilledWorkers || 0) +
        Number(actual.helpers || 0) +
        Number(actual.engineers || 0) +
        Number(actual.operators || 0);

      const shortage =
        shortages.skilledWorkers +
        shortages.helpers +
        shortages.engineers +
        shortages.operators;

      let delayRisk = "Low";

      if (plannedTotal > 0) {
        const shortageRate = shortage / plannedTotal;

        if (shortageRate >= 0.5) {
          delayRisk = "High";
        } else if (shortageRate >= 0.25) {
          delayRisk = "Medium";
        }
      }

      worksheet.addRow({
        project: p.project?.name || "",
        date: p.date ? new Date(p.date).toISOString().slice(0, 10) : "",
        activity: p.activity || "",

        plannedSkilled: p.skilledWorkers || 0,
        actualSkilled: actual.skilledWorkers || 0,
        shortageSkilled: shortages.skilledWorkers,

        plannedHelpers: p.helpers || 0,
        actualHelpers: actual.helpers || 0,
        shortageHelpers: shortages.helpers,

        plannedEngineers: p.engineers || 0,
        actualEngineers: actual.engineers || 0,
        shortageEngineers: shortages.engineers,

        plannedOperators: p.operators || 0,
        actualOperators: actual.operators || 0,
        shortageOperators: shortages.operators,

        plannedTotal,
        actualTotal,
        shortage,
        delayRisk,

        status:
          shortage > 0
            ? "Shortage"
            : actualTotal > plannedTotal
              ? "Overstaffed"
              : "Balanced",

        remarks: p.remarks || "",
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=planned-vs-actual-manpower.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      message: "Failed to export manpower comparison.",
      error: error.message,
    });
  }
};

exports.exportProductivityExcel = async (req, res) => {
  try {
    const filter = {};

    if (req.query.project) {
      filter.project = req.query.project;
    }

    const rows = await Productivity.find(filter)
      .populate("project", "name")
      .populate("createdBy", "name")
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productivity");

    sheet.columns = [
      { header: "Project", key: "project", width: 25 },
      { header: "Date", key: "date", width: 15 },
      { header: "Work Item", key: "workItem", width: 30 },
      { header: "Workers", key: "workers", width: 12 },
      { header: "Planned Output", key: "plannedOutput", width: 18 },
      { header: "Actual Output", key: "actualOutput", width: 18 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Productivity Rate", key: "rate", width: 18 },
      { header: "Remarks", key: "remarks", width: 35 },
      { header: "Encoded By", key: "encodedBy", width: 22 },
    ];

    sheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      const rate =
        Number(r.plannedOutput || 0) > 0
          ? Math.round(
              (Number(r.actualOutput || 0) / Number(r.plannedOutput || 0)) *
                100,
            )
          : 0;

      sheet.addRow({
        project: r.project?.name || "",
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
        workItem: r.workItem || "",
        workers: r.workers || 0,
        plannedOutput: r.plannedOutput || 0,
        actualOutput: r.actualOutput || 0,
        unit: r.unit || "",
        rate: `${rate}%`,
        remarks: r.remarks || "",
        encodedBy: r.createdBy?.name || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=productivity-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
