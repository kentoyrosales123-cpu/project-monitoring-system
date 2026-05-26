const API = "";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const money = (n) => `₱${Number(n || 0).toLocaleString()}`;
const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const qs = (s) => document.querySelector(s);
const page = location.pathname.split("/").pop() || "index.html";

function requireAuth() {
  if (!token) location.href = "/login.html";
}

function logout() {
  localStorage.clear();
  location.href = "/login.html";
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: opts.headers || headers(),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(e.message);
  }

  return res.headers.get("content-type")?.includes("application/json")
    ? res.json()
    : res.text();
}

function statusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function percent(n) {
  return Math.min(100, Math.max(0, Number(n || 0)));
}

function layout(title) {
  requireAuth();

  const navItems = [
    ["🏠", "Dashboard", "/dashboard.html"],
    ["📁", "Projects", "/projects.html"],
    ["📝", "Daily Reports", "/reports.html"],
    ["🧱", "Materials", "/materials.html"],
    ["💰", "Expenses", "/expenses.html"],
    ["👷", "Manpower", "/manpower.html"],
    ["🚜", "Equipment", "/equipment.html"],
    ["⚠️", "Issues/Risks", "/issues.html"],
  ];

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">🏗️</div>
          <div>
            <h2>Construction PMS</h2>
            <span>Project Monitoring</span>
          </div>
        </div>

        <nav class="nav">
          ${navItems
            .map(
              ([icon, label, href]) => `
              <a href="${href}" class="${href.includes(page) ? "active" : ""}">
                <span>${icon}</span>
                ${label}
              </a>
            `,
            )
            .join("")}
        </nav>
      </aside>

      <main class="main">
        <header class="topbar">
          <div>
            <p class="eyebrow">Construction Project Monitoring System</p>
            <h1>${title}</h1>
            <span class="welcome">
              Welcome back, ${user?.name || "User"} • ${user?.role || "Staff"}
            </span>
          </div>

          <div class="topbar-actions">
            <button class="icon-btn" title="Notifications">🔔</button>
            <div class="user-pill">
              <span>${(user?.name || "U").charAt(0).toUpperCase()}</span>
              <div>
                <b>${user?.name || "User"}</b>
                <small>${user?.role || "Staff"}</small>
              </div>
            </div>
            <button class="btn secondary" onclick="logout()">Logout</button>
          </div>
        </header>

        <div id="content"></div>
      </main>
    </div>
  `;
}

async function login(e) {
  e.preventDefault();

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    location.href = "/dashboard.html";
  } catch (err) {
    alert(err.message);
  }
}

async function register(e) {
  e.preventDefault();

  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    location.href = "/dashboard.html";
  } catch (err) {
    alert(err.message);
  }
}

async function loadProjectsSelect() {
  const projects = await api("/api/projects");

  return projects
    .map((p) => `<option value="${p._id}">${p.name}</option>`)
    .join("");
}

function modal(html) {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal show" id="appModal">
      <div class="modal-card">
        ${html}
        <button
          type="button"
          class="btn secondary"
          onclick="closeModal()"
        >
          Close
        </button>
      </div>
    </div>
    `,
  );
}

function closeModal() {
  const modal = document.getElementById("appModal");

  if (modal) {
    modal.remove();
  }
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    closeModal();
  }
});

async function del(path, id) {
  if (confirm("Delete this record?")) {
    await api(`${path}/${id}`, { method: "DELETE" });
    location.reload();
  }
}

function table(rows, cols) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${cols.map((c) => `<th>${c.label}</th>`).join("")}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
              <tr>
                ${cols
                  .map(
                    (c) =>
                      `<td>${c.render ? c.render(r) : (r[c.key] ?? "")}</td>`,
                  )
                  .join("")}
                <td>${r.actions || ""}</td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function dashboard() {
  layout("Dashboard");

  const s = await api("/api/projects/dashboard-stats");

  const totalBudget = Number(s.totalBudget || 0);
  const totalExpenses = Number(s.totalExpenses || 0);
  const budgetUsage = Number(s.budgetUsage || 0);
  const overBudgetProjects = Number(s.overBudgetProjects || 0);

  qs("#content").innerHTML = `
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">Live Project Overview</p>
        <h2>Monitor progress, budget, manpower, and site activity in one place.</h2>
        <p>
          Track construction performance across all assigned projects and identify delays before they become critical.
        </p>
      </div>

      <div class="quick-actions-card">
        <h3>Quick Actions</h3>
        <div class="quick-actions">
          <a href="/projects.html" class="btn">+ Add Project</a>
          <a href="/reports.html" class="btn secondary">Daily Report</a>
          <a href="/expenses.html" class="btn secondary">Record Expense</a>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">📁</span>
        <small>Total Projects</small>
        <h3>${s.totalProjects || 0}</h3>
        <p>All monitored projects</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">🟢</span>
        <small>Ongoing</small>
        <h3>${s.ongoingProjects || 0}</h3>
        <p>Active construction sites</p>
      </div>

      <div class="kpi-card emerald">
        <span class="kpi-icon">✅</span>
        <small>Completed</small>
        <h3>${s.completedProjects || 0}</h3>
        <p>Finished projects</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">⚠️</span>
        <small>Delayed</small>
        <h3>${s.delayedProjects || 0}</h3>
        <p>Needs attention</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">💰</span>
        <small>Total Expenses</small>
        <h3>${money(s.totalExpenses)}</h3>
        <p>Recorded cost</p>
      </div>
      <div class="kpi-card red">
  <span class="kpi-icon">🚨</span>
  <small>Over Budget</small>
  <h3>${overBudgetProjects}</h3>
  <p>Projects exceeding budget</p>
</div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Budget Monitoring</p>
            <h3>Budget Utilization</h3>
          </div>
          <span class="badge">${budgetUsage}% Used</span>
        </div>

        <div class="budget-stack">
          <div>
            <span>Total Budget</span>
            <b>${money(s.totalBudget)}</b>
          </div>
          <div>
            <span>Used</span>
            <b>${money(s.totalExpenses)}</b>
          </div>
          <div>
            <span>Remaining</span>
            <b>${money(s.budgetRemaining)}</b>
          </div>
        </div>

        <div class="progress large">
          <span style="width:${percent(budgetUsage)}%"></span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Operations</p>
            <h3>Site Resources</h3>
          </div>
        </div>

        <div class="resource-grid">
  <div>
    <span>👷</span>
    <b>${Number(s.totalManpower || 0)}</b>
    <small>Total Manpower</small>
  </div>

  <div>
    <span>🧰</span>
    <b>${Number(s.totalSkilledWorkers || 0)}</b>
    <small>Skilled Workers</small>
  </div>

  <div>
    <span>🤝</span>
    <b>${Number(s.totalHelpers || 0)}</b>
    <small>Helpers</small>
  </div>

  <div>
    <span>👷‍♂️</span>
    <b>${Number(s.totalEngineers || 0)}</b>
    <small>Engineers</small>
  </div>

  <div>
    <span>🏗️</span>
    <b>${Number(s.totalOperators || 0)}</b>
    <small>Operators</small>
  </div>

  <div>
    <span>🚜</span>
    <b>${Number(s.totalEquipment || 0)}</b>
    <small>Equipment Records</small>
  </div>
</div>
      </div>
    </section>

    <section class="panel">
  <div class="panel-header">
    <div>
      <p class="eyebrow">Financial Control</p>
      <h3>Per-Project Budget Monitoring</h3>
    </div>
  </div>

  <div class="budget-monitoring-list">
    ${
      s.budgetMonitoring?.length
        ? s.budgetMonitoring
            .map(
              (p) => `
              <div class="budget-monitoring-card">
                <div class="budget-monitoring-top">
                  <div>
                    <h4>${p.name}</h4>
                    <p>${money(p.expenses)} used out of ${money(p.budget)}</p>
                  </div>
                  <span class="budget-status ${statusClass(p.status)}">
                    ${p.status}
                  </span>
                </div>

                <div class="progress large">
                  <span style="width:${percent(p.usage)}%"></span>
                </div>

                <div class="budget-monitoring-meta">
                  <span>Usage: ${p.usage}%</span>
                  <span>Remaining: ${money(p.remaining)}</span>
                </div>
              </div>
            `,
            )
            .join("")
        : `<div class="empty-state">No budget monitoring data yet.</div>`
    }
  </div>
</section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Project Tracking</p>
          <h3>Project Progress Summary</h3>
        </div>
      </div>

      <div class="project-progress-list">
        ${
          s.progressSummary?.length
            ? s.progressSummary
                .map(
                  (p) => `
                  <div class="project-progress-card">
                    <div class="project-progress-top">
                      <div>
                        <h4>${p.name}</h4>
                        <p>${p.clientName || "No client"} • ${p.location || "No location"}</p>
                      </div>
                      <span class="status-badge ${statusClass(p.status)}">${p.status}</span>
                    </div>

                    <div class="progress">
                      <span style="width:${percent(p.progress)}%"></span>
                    </div>

                    <div class="project-progress-meta">
                      <span>${p.progress || 0}% completed</span>
                      <span>Budget: ${money(p.budget)}</span>
                      <span>Due: ${date(p.targetCompletionDate)}</span>
                    </div>
                  </div>
                `,
                )
                .join("")
            : `<div class="empty-state">No project progress data yet.</div>`
        }
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Site Updates</p>
            <h3>Recent Reports</h3>
          </div>
        </div>

        <div class="activity-list">
          ${
            s.recentReports?.length
              ? s.recentReports
                  .map(
                    (r) => `
                    <div class="activity-item">
                      <div class="activity-dot"></div>
                      <div>
                        <b>${r.project?.name || "Project"}</b>
                        <p>${r.workAccomplished || "Daily report submitted"}</p>
                        <small>Submitted by ${r.submittedBy?.name || "Staff"}</small>
                      </div>
                    </div>
                  `,
                  )
                  .join("")
              : `<div class="empty-state">No recent reports yet.</div>`
          }
        </div>
      </div>

      <div class="panel danger-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Attention Needed</p>
            <h3>Delayed Projects</h3>
          </div>
          <span class="badge danger">${s.delayedProjects || 0}</span>
        </div>

        <div class="alert-list">
          ${
            s.delayedProjectList?.length
              ? s.delayedProjectList
                  .map(
                    (p) => `
                    <div class="alert-item">
                      <b>${p.name}</b>
                      <p>${p.progress || 0}% completed</p>
                      <small>Due date: ${date(p.dueDate)}</small>
                    </div>
                  `,
                  )
                  .join("")
              : `<div class="empty-state">No delayed projects detected.</div>`
          }
        </div>
      </div>
    </section>
    <section class="dashboard-grid two">
  <div class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Analytics</p>
        <h3>Project Status Overview</h3>
      </div>
    </div>
    <canvas id="projectStatusChart"></canvas>
  </div>

  <div class="panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Financial Monitoring</p>
        <h3>Budget vs Expenses</h3>
      </div>
    </div>
    <canvas id="budgetChart"></canvas>
  </div>
</section>

<section class="panel">
  <div class="panel-header">
    <div>
      <p class="eyebrow">Project Monitoring</p>
      <h3>Project Progress</h3>
    </div>
  </div>
  <canvas id="projectProgressChart"></canvas>
</section>
    `;

  setTimeout(() => {
    new Chart(document.getElementById("projectStatusChart"), {
      type: "doughnut",
      data: {
        labels: ["Planned", "Ongoing", "Completed", "Delayed"],
        datasets: [
          {
            data: [
              s.plannedProjects || 0,
              s.ongoingProjects || 0,
              s.completedProjects || 0,
              s.delayedProjects || 0,
            ],
            backgroundColor: ["#3b82f6", "#22c55e", "#10b981", "#ef4444"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    new Chart(document.getElementById("budgetChart"), {
      type: "bar",
      data: {
        labels: s.budgetMonitoring?.map((p) => p.name) || [],
        datasets: [
          {
            label: "Budget",
            data: s.budgetMonitoring?.map((p) => p.budget || 0) || [],
            backgroundColor: "#2563eb",
            borderRadius: 10,
          },
          {
            label: "Expenses",
            data: s.budgetMonitoring?.map((p) => p.expenses || 0) || [],
            backgroundColor: "#f97316",
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    new Chart(document.getElementById("projectProgressChart"), {
      type: "bar",
      data: {
        labels: s.progressSummary.map((p) => p.name),
        datasets: [
          {
            label: "Progress %",
            data: s.progressSummary.map((p) => p.progress || 0),
            backgroundColor: "#c87919",
            borderRadius: 8,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }, 100);
}

async function projects() {
  layout("Projects");

  const users = await api("/api/auth/users").catch(() => []);
  const rows = await api("/api/projects");

  qs("#content").innerHTML =
    `${user.role === "admin" ? '<button class="btn" onclick="projectForm()">Add Project</button>' : ""}
    <br><br>` +
    table(
      rows.map((p) => ({
        ...p,
        actions:
          user.role === "admin"
            ? `<button class="btn" onclick='projectForm(${JSON.stringify(p)})'>Edit</button>
               <button class="btn danger" onclick="del('/api/projects','${p._id}')">Delete</button>`
            : "",
      })),
      [
        { label: "Project", key: "name" },
        { label: "Client", key: "clientName" },
        { label: "Location", key: "location" },
        { label: "Budget", render: (p) => money(p.budget) },
        { label: "Status", key: "status" },
        {
          label: "Progress",
          render: (p) =>
            `<div class="progress"><span style="width:${percent(p.progress)}%"></span></div>${p.progress}%`,
        },
      ],
    );

  window.staffOptions = users
    .filter((u) => u.role === "staff")
    .map((u) => `<option value="${u._id}">${u.name}</option>`)
    .join("");
}

function projectForm(p = {}) {
  modal(`
    <h3>${p._id ? "Edit" : "Add"} Project</h3>
    <form onsubmit="saveProject(event,'${p._id || ""}')">
      <div class="form-grid">
        <input name="name" placeholder="Project name" value="${p.name || ""}" required>
        <input name="clientName" placeholder="Client name" value="${p.clientName || ""}" required>
        <input name="location" placeholder="Location" value="${p.location || ""}" required>
        <input name="startDate" type="date" value="${date(p.startDate)}" required>
        <input name="targetCompletionDate" type="date" value="${date(p.targetCompletionDate)}" required>
        <input name="budget" type="number" placeholder="Budget" value="${p.budget || ""}" required>
        <input name="progress" type="number" min="0" max="100" placeholder="Progress %" value="${p.progress || 0}">

        <select name="status">
          <option ${p.status === "Planned" ? "selected" : ""}>Planned</option>
          <option ${p.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
          <option ${p.status === "Delayed" ? "selected" : ""}>Delayed</option>
          <option ${p.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>

        <select name="assignedStaff" multiple>
          ${window.staffOptions || ""}
        </select>
      </div>

      <textarea name="description" placeholder="Description">${p.description || ""}</textarea>
      <button class="btn">Save</button>
    </form>
  `);
}

async function saveProject(e, id) {
  e.preventDefault();

  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  data.assignedStaff = fd.getAll("assignedStaff");

  await api("/api/projects" + (id ? `/${id}` : ""), {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  });

  location.reload();
}

async function simplePage(title, path, fields, cols) {
  layout(title);

  const rows = await api(path);

  let exportButton = "";

  if (path.includes("expenses")) {
    exportButton = `
      <button class="btn secondary" onclick="downloadExpensesExcel()">
        Export Excel
      </button>
    `;
  }

  if (path.includes("manpower")) {
    exportButton = `
      <button class="btn secondary" onclick="downloadManpowerExcel()">
        Export Excel
      </button>
    `;
  }

  qs("#content").innerHTML =
    `
    <button class="btn" onclick="simpleForm('${title}','${path}','${encodeURIComponent(
      JSON.stringify(fields),
    )}')">
      Add Record
    </button>
    ${exportButton}
    <br><br>
    ` +
    table(
      rows.map((r) => ({
        ...r,
        actions: `<button class="btn danger" onclick="del('${path}','${r._id}')">Delete</button>`,
      })),
      cols,
    );
}

async function simpleForm(title, path, encoded) {
  const fields = JSON.parse(decodeURIComponent(encoded));
  const projectOptions = await loadProjectsSelect();

  modal(`
    <h3>Add ${title}</h3>
    <form onsubmit="saveSimple(event,'${path}')">
      <div class="form-grid">
        ${fields
          .map((f) =>
            f.name === "project"
              ? `<select name="project" required>${projectOptions}</select>`
              : f.type === "select"
                ? `<select name="${f.name}">
                    ${f.options.map((o) => `<option>${o}</option>`).join("")}
                  </select>`
                : f.type === "textarea"
                  ? `<textarea name="${f.name}" placeholder="${f.label}"></textarea>`
                  : `<input name="${f.name}" type="${f.type || "text"}" placeholder="${f.label}" ${f.required ? "required" : ""}>`,
          )
          .join("")}
      </div>
      <button class="btn">Save</button>
    </form>
  `);
}

async function downloadExpensesExcel() {
  try {
    const res = await fetch("/api/export/expenses-excel", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Failed to export expenses.");
  }
}

async function downloadManpowerExcel() {
  try {
    const res = await fetch("/api/export/manpower-excel", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "manpower.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Failed to export manpower.");
  }
}

async function saveSimple(e, path) {
  e.preventDefault();

  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);

  Object.keys(data).forEach((key) => {
    if (data[key] === "") data[key] = 0;
  });

  await api(path, {
    method: "POST",
    body: JSON.stringify(data),
  });

  location.reload();
}

async function reports() {
  layout("Daily Reports");

  const projectOptions = await loadProjectsSelect();
  const rows = await api("/api/reports");

  qs("#content").innerHTML =
    `<button class="btn" onclick="reportForm()">Add Daily Report</button>
     <button class="btn secondary" onclick="downloadReportsExcel()">Export Excel</button>
     <br><br>` +
    table(
      rows.map((r) => ({
        ...r,
        actions:
          user.role === "admin"
            ? `<button class="btn danger" onclick="del('/api/reports','${r._id}')">Delete</button>`
            : "",
      })),
      [
        { label: "Project", render: (r) => r.project?.name },
        { label: "Date", render: (r) => date(r.reportDate) },
        { label: "Weather", key: "weatherCondition" },
        { label: "Work Accomplished", key: "workAccomplished" },
        { label: "Manpower", key: "manpowerCount" },
        { label: "Submitted By", render: (r) => r.submittedBy?.name },
        {
          label: "Photos",
          render: (r) =>
            `<div class="photos">${(r.photos || [])
              .map((p) => `<img src="${p}">`)
              .join("")}</div>`,
        },
      ],
    );

  window.projectOptions = projectOptions;
}

async function downloadReportsExcel() {
  try {
    const res = await fetch("/api/export/reports-excel", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "Failed to export Excel file",
      }));
      throw new Error(error.message);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-reports.xlsx";
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
}

function reportForm() {
  modal(`
    <h3>Add Daily Report</h3>
    <form onsubmit="saveReport(event)" enctype="multipart/form-data">
      <select name="project" required>${window.projectOptions}</select>

      <div class="form-grid">
        <input name="reportDate" type="date" required>
        <input name="weatherCondition" placeholder="Weather condition" required>
        <input name="manpowerCount" type="number" placeholder="Manpower count">
        <input name="equipmentUsed" placeholder="Equipment used">
        <input name="materialsUsed" placeholder="Materials used">
        <input name="photos" type="file" multiple accept="image/*">
      </div>

      <textarea name="workAccomplished" placeholder="Work accomplished" required></textarea>
      <textarea name="issuesEncountered" placeholder="Issues encountered"></textarea>
      <textarea name="safetyIncidents" placeholder="Safety incidents"></textarea>
      <textarea name="remarks" placeholder="Remarks"></textarea>

      <button class="btn">Submit</button>
    </form>
  `);
}

async function saveReport(e) {
  e.preventDefault();

  await fetch("/api/reports", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: new FormData(e.target),
  });

  location.reload();
}

const projectCol = {
  label: "Project",
  render: (r) => r.project?.name || "",
};

if (page === "dashboard.html") dashboard();
if (page === "projects.html") projects();
if (page === "reports.html") reports();

if (page === "materials.html")
  simplePage(
    "Materials",
    "/api/materials",
    [
      { name: "project" },
      { name: "materialName", label: "Material name", required: true },
      {
        name: "quantityDelivered",
        label: "Quantity delivered",
        type: "number",
      },
      { name: "quantityUsed", label: "Quantity used", type: "number" },
      { name: "unit", label: "Unit", required: true },
      { name: "supplier", label: "Supplier" },
      {
        name: "deliveryDate",
        label: "Delivery date",
        type: "date",
        required: true,
      },
    ],
    [
      projectCol,
      { label: "Material", key: "materialName" },
      { label: "Delivered", key: "quantityDelivered" },
      { label: "Used", key: "quantityUsed" },
      { label: "Remaining", key: "remainingQuantity" },
      { label: "Unit", key: "unit" },
      { label: "Supplier", key: "supplier" },
    ],
  );

if (page === "expenses.html")
  simplePage(
    "Expenses",
    "/api/expenses",
    [
      { name: "project" },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "laborCost", label: "Labor cost", type: "number" },
      { name: "materialCost", label: "Material cost", type: "number" },
      { name: "equipmentCost", label: "Equipment cost", type: "number" },
      { name: "otherExpenses", label: "Other expenses", type: "number" },
      { name: "remarks", label: "Remarks" },
    ],
    [
      projectCol,
      { label: "Date", render: (r) => date(r.date) },
      { label: "Labor", render: (r) => money(r.laborCost) },
      { label: "Materials", render: (r) => money(r.materialCost) },
      { label: "Equipment", render: (r) => money(r.equipmentCost) },
      { label: "Other", render: (r) => money(r.otherExpenses) },
      { label: "Total", render: (r) => money(r.totalExpense) },
    ],
  );

if (page === "manpower.html")
  simplePage(
    "Manpower",
    "/api/manpower",
    [
      { name: "project" },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "skilledWorkers", label: "Skilled workers", type: "number" },
      { name: "helpers", label: "Helpers", type: "number" },
      { name: "engineers", label: "Engineers", type: "number" },
      { name: "operators", label: "Operators", type: "number" },
    ],
    [
      projectCol,
      { label: "Date", render: (r) => date(r.date) },
      { label: "Skilled", render: (r) => r.skilledWorkers ?? 0 },
      { label: "Helpers", render: (r) => r.helpers ?? 0 },
      { label: "Engineers", render: (r) => r.engineers ?? 0 },
      { label: "Operators", render: (r) => r.operators ?? 0 },
      {
        label: "Total",
        render: (r) =>
          Number(r.skilledWorkers || 0) +
          Number(r.helpers || 0) +
          Number(r.engineers || 0) +
          Number(r.operators || 0),
      },
    ],
  );

if (page === "equipment.html")
  simplePage(
    "Equipment",
    "/api/equipment",
    [
      { name: "project" },
      { name: "equipmentName", label: "Equipment name", required: true },
      {
        name: "status",
        type: "select",
        options: ["Available", "In Use", "Maintenance"],
      },
      { name: "usageDate", label: "Usage date", type: "date" },
      { name: "remarks", label: "Remarks" },
    ],
    [
      projectCol,
      { label: "Equipment", key: "equipmentName" },
      { label: "Status", key: "status" },
      { label: "Usage Date", render: (r) => date(r.usageDate) },
      { label: "Remarks", key: "remarks" },
    ],
  );

if (page === "issues.html")
  simplePage(
    "Issues/Risks",
    "/api/issues",
    [
      { name: "project" },
      { name: "title", label: "Issue title", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "priority",
        type: "select",
        options: ["Low", "Medium", "High", "Critical"],
      },
      {
        name: "status",
        type: "select",
        options: ["Open", "In Progress", "Resolved"],
      },
    ],
    [
      projectCol,
      { label: "Title", key: "title" },
      { label: "Priority", key: "priority" },
      { label: "Status", key: "status" },
      { label: "Reported By", render: (r) => r.reportedBy?.name || "" },
      { label: "Date", render: (r) => date(r.dateReported) },
    ],
  );
