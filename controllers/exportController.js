const ExcelJS = require("exceljs");

const DailyReport = require("../models/DailyReport");
const Expense = require("../models/Expense");
const ManpowerPlan = require("../models/ManpowerPlan");
const ManpowerAttendance = require("../models/ManpowerAttendance");
const Manpower = require("../models/Manpower");
const MaterialRequest = require("../models/MaterialRequest");
const PDFDocument = require("pdfkit");
const ExpenseRequest = require("../models/ExpenseRequest");

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

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=daily-report-${report._id}.pdf`,
    );

    doc.pipe(res);

    doc.fontSize(20).text("Daily Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Project: ${report.project?.name || "-"}`);
    doc.text(`Date: ${new Date(report.reportDate).toISOString().slice(0, 10)}`);
    doc.text(
      `Status: ${report.status || (report.isConfirmed ? "Confirmed" : "Pending")}`,
    );
    doc.text(`Submitted By: ${report.submittedBy?.name || "-"}`);
    doc.text(`Weather: ${report.weatherCondition || "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Work Accomplished", { underline: true });
    doc.fontSize(11).text(report.workAccomplished || "-");
    doc.moveDown();

    doc.fontSize(14).text("Manpower", { underline: true });
    (report.manpower || []).forEach((m) => {
      doc.fontSize(11).text(`- ${m.position || "-"}: ${m.quantity || 0}`);
    });
    doc.moveDown();

    doc.fontSize(14).text("Equipment Used", { underline: true });
    (report.equipmentUsed || []).forEach((e) => {
      doc
        .fontSize(11)
        .text(
          `- ${e.equipmentName || "-"} | Qty: ${e.quantity || 0} | ${e.remarks || ""}`,
        );
    });
    doc.moveDown();

    doc.fontSize(14).text("Materials Used", { underline: true });
    (report.materialsUsed || []).forEach((m) => {
      doc
        .fontSize(11)
        .text(
          `- ${m.materialName || "-"} | ${m.quantity || 0} ${m.unit || ""}`,
        );
    });
    doc.moveDown();

    doc.fontSize(14).text("Issues Encountered", { underline: true });
    doc.fontSize(11).text(report.issuesEncountered || "None");
    doc.moveDown();

    doc.fontSize(14).text("Safety Incidents", { underline: true });
    doc.fontSize(11).text(report.safetyIncidents || "None");
    doc.moveDown();

    doc.fontSize(14).text("Remarks", { underline: true });
    doc.fontSize(11).text(report.remarks || "None");
    doc.moveDown();

    doc.fontSize(14).text("Admin Comments", { underline: true });
    doc.fontSize(11).text(report.adminComments || "None");
    doc.moveDown();

    doc.text(`Reviewed By: ${report.reviewedBy?.name || "-"}`);
    doc.text(
      `Reviewed At: ${
        report.reviewedAt ? new Date(report.reviewedAt).toLocaleString() : "-"
      }`,
    );

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
