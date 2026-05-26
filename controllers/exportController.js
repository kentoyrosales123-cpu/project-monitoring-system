const ExcelJS = require("exceljs");

const DailyReport = require("../models/DailyReport");
const Expense = require("../models/Expense");
const Manpower = require("../models/Manpower");

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
