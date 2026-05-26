const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Expense = require('../models/Expense');
const Manpower = require('../models/Manpower');
const Equipment = require('../models/Equipment');
const Material = require('../models/Material');
const Issue = require('../models/Issue');
const DailyReport = require('../models/DailyReport');

dotenv.config();

async function seed() {
  await connectDB();
  await Promise.all([User.deleteMany(), Project.deleteMany(), Expense.deleteMany(), Manpower.deleteMany(), Equipment.deleteMany(), Material.deleteMany(), Issue.deleteMany(), DailyReport.deleteMany()]);

  const admin = await User.create({ name: 'Project Manager', email: 'admin@construction.com', password: '123456', role: 'admin' });
  const staff = await User.create({ name: 'Site Engineer', email: 'staff@construction.com', password: '123456', role: 'staff' });

  const project = await Project.create({
    name: 'Two-Storey Residential Building', clientName: 'Juan Dela Cruz', location: 'Davao City',
    startDate: new Date(), targetCompletionDate: new Date(Date.now() + 90*24*60*60*1000), budget: 2500000,
    status: 'Ongoing', progress: 35, assignedStaff: [staff._id], description: 'Residential construction monitoring demo project.'
  });

  await Expense.create({ project: project._id, date: new Date(), laborCost: 50000, materialCost: 150000, equipmentCost: 30000, otherExpenses: 10000 });
  await Manpower.create({ project: project._id, date: new Date(), skilledWorkers: 8, helpers: 12, engineers: 1, operators: 2 });
  await Equipment.create({ project: project._id, equipmentName: 'Concrete Mixer', status: 'In Use', usageDate: new Date(), remarks: 'Operational' });
  await Material.create({ project: project._id, materialName: 'Cement', quantityDelivered: 300, quantityUsed: 120, unit: 'bags', supplier: 'ABC Construction Supply', deliveryDate: new Date() });
  await Issue.create({ project: project._id, title: 'Delayed steel delivery', description: 'Supplier delivery moved to next week.', priority: 'High', status: 'Open', reportedBy: staff._id });
  await DailyReport.create({ project: project._id, reportDate: new Date(), weatherCondition: 'Sunny', workAccomplished: 'Column formworks and rebar installation completed.', manpowerCount: 23, submittedBy: staff._id });

  console.log('Seed completed. Admin: admin@construction.com / 123456 | Staff: staff@construction.com / 123456');
  process.exit();
}
seed();
