const API = "";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const money = (n) => `₱${Number(n || 0).toLocaleString()}`;
const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const dateTime = (d) => {
  if (!d) return "-";

  return new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
const qs = (s) => document.querySelector(s);
const page = location.pathname.split("/").pop() || "index.html";
let globalEscHandlerAttached = false;

function attachGlobalEscHandler() {
  if (globalEscHandlerAttached) return;

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    const imageViewer = document.getElementById("imageViewer");
    const appModal = document.getElementById("appModal");

    if (imageViewer) {
      closeImageSlider();
      return;
    }

    if (appModal) {
      closeModal();
    }
  });

  globalEscHandlerAttached = true;
}

attachGlobalEscHandler();

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

  const initials = (user?.name || "U").charAt(0).toUpperCase();

  const isActive = (href) => href.includes(page) || href.endsWith(page);

  let navGroups = [];

  if (user?.role === "client") {
    navGroups = [
      {
        title: "MAIN",
        items: [
          ["📊", "Client Dashboard", "/client-dashboard.html"],
          ["📅", "Project Timeline", "/client-dashboard.html"],
        ],
      },
    ];
  } else if (user?.role === "inventory") {
    navGroups = [
      {
        title: "MAIN",
        items: [["📊", "Inventory Dashboard", "/inventory-dashboard.html"]],
      },
      {
        title: "WAREHOUSE",
        items: [
          ["🧱", "Materials", "/materials.html"],
          ["🚜", "Equipment", "/equipment.html"],
        ],
      },
      {
        title: "REQUESTS",
        items: [
          ["📦", "Material Requests", "/material-requests.html"],
          ["🚚", "Equipment Requests", "/equipment-requests.html"],
        ],
      },
    ];
  } else if (user?.role === "worker") {
    navGroups = [
      {
        title: "WORKER",
        items: [
          ["🏠", "My Dashboard", "/worker-dashboard.html"],
          ["📅", "My Attendance", "/worker-attendance.html"],
          ["📋", "My Tasks", "/worker-tasks.html"],
          ["🏗️", "My Project", "/worker-project.html"],
          ["🔔", "Notifications", "/worker-notifications.html"],
          ["⚠️", "Report Issue", "/worker-issues.html"],
        ],
      },
    ];
  } else {
    navGroups = [
      {
        title: "MAIN",
        items: [
          ["🏠", "Dashboard", "/dashboard.html"],
          ["📁", "Projects", "/projects.html"],
        ],
      },
      {
        title: "PROJECT OPERATIONS",
        items: [
          ["✅", "Tasks", "/tasks.html"],
          ["📅", "Gantt Chart", "/gantt.html"],
          ["📝", "Daily Reports", "/reports.html"],
          ["⚠️", "Issues/Risks", "/issues.html"],
        ],
      },
      {
        title: "RESOURCES",
        items: [
          ["🧱", "Materials", "/materials.html"],
          ["📦", "Material Requests", "/material-requests.html"],
          ["🚜", "Equipment", "/equipment.html"],
          ["🚚", "Equipment Requests", "/equipment-requests.html"],
        ],
      },
      {
        title: "MANPOWER",
        items: [
          ["👷", "Manpower", "/manpower.html"],
          ["👥", "Workers", "/workers.html"],
          ["📨", "Manpower Requests", "/manpower-requests.html"],
          ["📊", "Planned vs Actual", "/manpower-plans.html"],
          ["🧾", "Attendance", "/manpower-attendance.html"],
          ["📈", "Productivity", "/productivity.html"],
        ],
      },
      {
        title: "FINANCE",
        items: [
          ["💰", "Expenses", "/expenses.html"],
          ["💸", "Expense Requests", "/expense-requests.html"],
          ...(user.role === "admin"
            ? [["📊", "Expense Analytics", "/expense-analytics.html"]]
            : []),
        ],
      },
    ];
  }

  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <div class="brand">
            <div class="brand-icon">🏗️</div>
            <div>
              <h2>Construction PMS</h2>
              <span>Project Monitoring</span>
            </div>
          </div>

          <nav class="nav">
            ${navGroups
              .map(
                (group) => `
                  <div class="nav-group">
                    <p class="nav-title">${group.title}</p>

                    ${group.items
                      .map(
                        ([icon, label, href]) => `
                          <a href="${href}" class="${isActive(href) ? "active" : ""}">
                            <span class="nav-icon">${icon}</span>
                            <span class="nav-label">${label}</span>
                            <span class="nav-arrow">›</span>
                          </a>
                        `,
                      )
                      .join("")}
                  </div>
                `,
              )
              .join("")}
          </nav>

          <div class="sidebar-footer">
            <div class="sidebar-user">
              <span>${initials}</span>
              <div>
                <b>${user?.name || "User"}</b>
                <small>${user?.role || "Staff"}</small>
              </div>
            </div>

            <button class="sidebar-logout" onclick="logout()">
              ⏻ Logout
            </button>
          </div>
        </div>
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
            <div class="notification-wrapper">
              <button
                id="notificationBell"
                class="icon-btn"
                title="Notifications"
                onclick="toggleNotifications()"
              >
                🔔
              </button>

              <div id="notificationDropdown" class="notification-dropdown">
                <div id="notificationList">
                  <p class="empty-notif">Loading notifications...</p>
                </div>

                <button class="btn secondary" onclick="markNotificationsRead()">
                  Mark all as read
                </button>

                <button class="btn danger" onclick="deleteAllNotifications()">
                  Delete All
                </button>
              </div>
            </div>

            <div class="user-pill">
              <span>${initials}</span>
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

  setTimeout(() => {
    loadNotifications();

    if (window.notificationInterval) {
      clearInterval(window.notificationInterval);
    }

    window.notificationInterval = setInterval(loadNotifications, 3000);
  }, 100);
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
    if (data.user.role === "inventory") {
      location.href = "/inventory-dashboard.html";
    } else if (data.user.role === "client") {
      location.href = "/client-dashboard.html";
    } else if (data.user.role === "worker") {
      location.href = "/worker-dashboard.html";
    } else {
      location.href = "/dashboard.html";
    }
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
    if (data.user.role === "worker") {
      location.href = "/worker-dashboard.html";
    } else if (data.user.role === "inventory") {
      location.href = "/inventory-dashboard.html";
    } else if (data.user.role === "client") {
      location.href = "/client-dashboard.html";
    } else {
      if (data.user.role === "worker") {
        location.href = "/worker-dashboard.html";
      } else if (data.user.role === "inventory") {
        location.href = "/inventory-dashboard.html";
      } else if (data.user.role === "client") {
        location.href = "/client-dashboard.html";
      } else {
        location.href = "/dashboard.html";
      }
    }
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
  closeModal();

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
            ? `
      <button class="btn" onclick='projectForm(${JSON.stringify(p)})'>Edit</button>
      <button class="btn danger" onclick="del('/api/projects','${p._id}')">Delete</button>
    `
            : user.role === "staff"
              ? `
        
      `
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

  window.clientOptions = users
    .filter((u) => u.role === "client")
    .map((u) => `<option value="${u._id}">${u.name}</option>`)
    .join("");
}

function progressForm(p = {}) {
  modal(`
    <h3>Update Project Progress</h3>

    <form onsubmit="saveProjectProgress(event, '${p._id}')">
      <label>Project</label>
      <input value="${p.name || ""}" readonly>

      <label>Progress Percentage</label>
      <input 
        name="progress" 
        type="number" 
        min="0" 
        max="100" 
        value="${p.progress || 0}" 
        required
      >

      <label>Status</label>
      <select name="status">
        <option ${p.status === "Planned" ? "selected" : ""}>Planned</option>
        <option ${p.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
        <option ${p.status === "Delayed" ? "selected" : ""}>Delayed</option>
        <option ${p.status === "Completed" ? "selected" : ""}>Completed</option>
      </select>

      <button class="btn success">Save Progress</button>
    </form>
  `);
}

async function saveProjectProgress(e, id) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  await api(`/api/projects/${id}/progress`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  alert("Project progress updated.");
  location.reload();
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
        

        <select name="status">
          <option ${p.status === "Planned" ? "selected" : ""}>Planned</option>
          <option ${p.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
          <option ${p.status === "Delayed" ? "selected" : ""}>Delayed</option>
          <option ${p.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>

        <label>Assigned Staff</label>
<select name="assignedStaff" multiple>
  ${window.staffOptions || ""}
</select>
        <select name="clientUser">
  <option value="">No client linked</option>
  ${window.clientOptions || ""}
</select>
      </div>

      <textarea name="description" placeholder="Description">${p.description || ""}</textarea>
      <button class="btn">Save</button>
    </form>
  `);
  setTimeout(() => {
    const form = document.querySelector("#appModal form");

    if (form && Array.isArray(p.assignedStaff)) {
      [...form.assignedStaff.options].forEach((option) => {
        option.selected = p.assignedStaff.some((staff) => {
          return String(staff._id || staff) === String(option.value);
        });
      });
    }

    if (form && p.clientUser?._id) {
      form.clientUser.value = p.clientUser._id;
    }
  }, 50);
}

async function saveProject(e, id) {
  e.preventDefault();

  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  data.assignedStaff = fd.getAll("assignedStaff");
  if (!data.clientUser) {
    data.clientUser = null;
  }

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

async function workerDashboardPage() {
  layout("Worker Dashboard");

  const workers = await api("/api/workers").catch(() => []);
  const myWorkerProfile = workers[0];

  if (!myWorkerProfile || !myWorkerProfile.assignedProject) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Assigned Project Yet</h3>
        <p class="empty-state">
          You are not yet assigned to any project. Please wait for admin assignment.
        </p>
      </section>

      <section class="kpi-grid">
        <div class="kpi-card green">
          <span class="kpi-icon">📅</span>
          <small>My Attendance</small>
          <h3>View</h3>
          <p>Check your attendance records</p>
        </div>

        <div class="kpi-card blue">
          <span class="kpi-icon">📋</span>
          <small>My Tasks</small>
          <h3>View</h3>
          <p>Assigned task updates only</p>
        </div>

        <div class="kpi-card orange">
          <span class="kpi-icon">🏗️</span>
          <small>My Project</small>
          <h3>Pending</h3>
          <p>No project assigned yet</p>
        </div>
      </section>
    `;
    return;
  }

  const project = myWorkerProfile.assignedProject;

  qs("#content").innerHTML = `
    <section class="staff-hero">
      <div>
        <p class="eyebrow">My Assigned Project</p>
        <h2>${project.name || "Project"}</h2>
        <p>${project.location || "No location"}</p>

        <div class="staff-project-meta">
          <span>Status: <b>${project.status || "-"}</b></span>
          <span>Progress: <b>${project.progress || 0}%</b></span>
          <span>Target: <b>${date(project.targetCompletionDate)}</b></span>
        </div>
      </div>

      <div class="staff-progress-card">
        <span>${project.progress || 0}%</span>
        <p>Project Progress</p>
        <div class="progress large">
          <span style="width:${percent(project.progress || 0)}%"></span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card green">
        <span class="kpi-icon">📅</span>
        <small>My Attendance</small>
        <h3>View</h3>
        <p>Check your attendance records</p>
      </div>

      <div class="kpi-card blue">
        <span class="kpi-icon">📋</span>
        <small>My Tasks</small>
        <h3>View</h3>
        <p>Assigned task updates only</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">🏗️</span>
        <small>My Project</small>
        <h3>${project.name || "Assigned"}</h3>
        <p>${project.location || "No location"}</p>
      </div>
    </section>
  `;
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

  window.dailyReportsData = rows;
  window.projectOptions = projectOptions;

  qs("#content").innerHTML = `
    <div class="reports-toolbar panel">
      <div class="reports-actions">
        <button class="btn" onclick="reportForm()">Add Daily Report</button>
        <button class="btn secondary" onclick="downloadReportsExcel()">Export Excel</button>
      </div>

      <div class="report-filters">
        <input id="reportSearch" placeholder="Search project / submitted by..." oninput="filterReports()">

        <select id="reportStatusFilter" onchange="filterReports()">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Needs Revision">Needs Revision</option>
        </select>

        <input id="reportFromDate" type="date" onchange="filterReports()">
        <input id="reportToDate" type="date" onchange="filterReports()">

        <button class="btn secondary" onclick="clearReportFilters()">Clear</button>
      </div>
    </div>

    <div id="reportsTable"></div>
  `;

  renderReportsTable(rows);
}

function getReportStatus(r) {
  if (r.status) return r.status;
  return r.isConfirmed ? "Confirmed" : "Pending";
}

function reportStatusBadge(status) {
  return `<span class="report-status ${statusClass(status)}">${status}</span>`;
}

function countReportItems(items) {
  return Array.isArray(items)
    ? items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    : 0;
}

function renderReportsTable(rows) {
  qs("#reportsTable").innerHTML = table(
    rows.map((r) => {
      const status = getReportStatus(r);

      return {
        ...r,
        actions: `
          <button class="btn secondary" onclick="viewReportById('${r._id}')">
            View
          </button>

          <button class="btn secondary" onclick="downloadReportPdf('${r._id}')">
            PDF
          </button>

          ${
            user.role === "staff" && status !== "Confirmed"
              ? `<button class="btn" onclick="editReportById('${r._id}')">Edit</button>`
              : ""
          }

          ${
            user.role === "admin" && status !== "Confirmed"
              ? `
                <button class="btn success" onclick="confirmReport('${r._id}')">
                  Confirm
                </button>

                <button class="btn warning" onclick="needsRevisionReport('${r._id}')">
                  Needs Revision
                </button>
              `
              : ""
          }

          ${
            user.role === "admin"
              ? `<button class="btn danger" onclick="deleteReport('${r._id}')">Delete</button>`
              : ""
          }
        `,
      };
    }),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Date", render: (r) => date(r.reportDate) || "-" },
      {
        label: "Status",
        render: (r) => reportStatusBadge(getReportStatus(r)),
      },
      { label: "Submitted By", render: (r) => r.submittedBy?.name || "-" },
      {
        label: "Manpower",
        render: (r) => countReportItems(r.manpower),
      },
      {
        label: "Equipment",
        render: (r) => countReportItems(r.equipmentUsed),
      },
      {
        label: "Materials",
        render: (r) => countReportItems(r.materialsUsed),
      },
      {
        label: "Photos",
        render: (r) => `${(r.photos || []).length} photo(s)`,
      },
    ],
  );
}

function filterReports() {
  const keyword = qs("#reportSearch")?.value.toLowerCase() || "";
  const status = qs("#reportStatusFilter")?.value || "";
  const fromDate = qs("#reportFromDate")?.value || "";
  const toDate = qs("#reportToDate")?.value || "";

  let filtered = [...(window.dailyReportsData || [])];

  if (keyword) {
    filtered = filtered.filter((r) => {
      return (
        (r.project?.name || "").toLowerCase().includes(keyword) ||
        (r.submittedBy?.name || "").toLowerCase().includes(keyword) ||
        (r.workAccomplished || "").toLowerCase().includes(keyword)
      );
    });
  }

  if (status) {
    filtered = filtered.filter((r) => getReportStatus(r) === status);
  }

  if (fromDate) {
    filtered = filtered.filter((r) => date(r.reportDate) >= fromDate);
  }

  if (toDate) {
    filtered = filtered.filter((r) => date(r.reportDate) <= toDate);
  }

  renderReportsTable(filtered);
}

function clearReportFilters() {
  qs("#reportSearch").value = "";
  qs("#reportStatusFilter").value = "";
  qs("#reportFromDate").value = "";
  qs("#reportToDate").value = "";

  renderReportsTable(window.dailyReportsData || []);
}

async function confirmReport(id) {
  const report = window.dailyReportsData?.find((r) => r._id === id);
  const comments = prompt(
    "Optional admin comments before confirming:",
    report?.adminComments || "",
  );

  if (comments === null) return;

  if (!confirm("Are you sure you want to confirm this daily report?")) return;

  try {
    await api(`/api/reports/${id}/confirm`, {
      method: "PUT",
      body: JSON.stringify({ adminComments: comments }),
    });

    alert("Daily report confirmed.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

async function needsRevisionReport(id) {
  const report = window.dailyReportsData?.find((r) => r._id === id);

  const comments = prompt(
    "Enter revision comments for staff:",
    report?.adminComments || "Please revise this daily report.",
  );

  if (!comments) return;

  if (!confirm("Mark this daily report as Needs Revision?")) return;

  try {
    await api(`/api/reports/${id}/needs-revision`, {
      method: "PUT",
      body: JSON.stringify({ adminComments: comments }),
    });

    alert("Report marked as Needs Revision.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteReport(id) {
  if (!confirm("Are you sure you want to delete this daily report?")) return;

  try {
    await api(`/api/reports/${id}`, {
      method: "DELETE",
    });

    alert("Daily report deleted.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

async function downloadReportPdf(id) {
  try {
    const res = await fetch(`/api/export/report-pdf/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "Failed to export PDF.",
      }));
      throw new Error(error.message);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  }
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

function reportForm(r = {}) {
  const isEdit = !!r._id;

  modal(`
    <h3>${isEdit ? "Edit Daily Report" : "Add Daily Report"}</h3>

    <form onsubmit="saveReport(event, '${r._id || ""}')" enctype="multipart/form-data">
      <label>Project</label>
      <select name="project" required>
        ${window.projectOptions}
      </select>

      <div class="form-grid">
        <div>
          <label>Report Date</label>
          <input name="reportDate" type="date" value="${date(r.reportDate)}" required>
        </div>

        <div>
          <label>Weather Condition</label>
          <input name="weatherCondition" value="${r.weatherCondition || ""}" placeholder="Sunny / Rainy" required>
        </div>
      </div>

      <label>Work Accomplished</label>
      <textarea name="workAccomplished" placeholder="Describe work accomplished" required>${r.workAccomplished || ""}</textarea>

      <div class="report-section">
        <div class="section-header">
          <h4>👷 Manpower</h4>
          <button type="button" class="btn secondary" onclick="addManpowerRow()">+ Add</button>
        </div>
        <div id="manpowerList">
          ${
            r.manpower?.length
              ? r.manpower
                  .map(
                    (m) => `
                <div class="dynamic-row manpower-row">
                  <input placeholder="Position" class="position" value="${m.position || ""}">
                  <input type="number" placeholder="Qty" class="quantity" value="${m.quantity || 0}">
                </div>
              `,
                  )
                  .join("")
              : `
                <div class="dynamic-row manpower-row">
                  <input placeholder="Position" class="position">
                  <input type="number" placeholder="Qty" class="quantity">
                </div>
              `
          }
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <h4>🚜 Equipment Used</h4>
          <button type="button" class="btn secondary" onclick="addEquipmentRow()">+ Add</button>
        </div>
        <div id="equipmentList">
          ${
            r.equipmentUsed?.length
              ? r.equipmentUsed
                  .map(
                    (e) => `
                <div class="dynamic-row equipment-row">
                  <input placeholder="Equipment Name" class="equipmentName" value="${e.equipmentName || ""}">
                  <input type="number" placeholder="Qty" class="quantity" value="${e.quantity || 0}">
                  <input placeholder="Remarks" class="remarks" value="${e.remarks || ""}">
                </div>
              `,
                  )
                  .join("")
              : `
                <div class="dynamic-row equipment-row">
                  <input placeholder="Equipment Name" class="equipmentName">
                  <input type="number" placeholder="Qty" class="quantity">
                  <input placeholder="Remarks" class="remarks">
                </div>
              `
          }
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <h4>🧱 Materials Used</h4>
          <button type="button" class="btn secondary" onclick="addMaterialRow()">+ Add</button>
        </div>
        <div id="materialsList">
          ${
            r.materialsUsed?.length
              ? r.materialsUsed
                  .map(
                    (m) => `
                <div class="dynamic-row material-row">
                  <input placeholder="Material Name" class="materialName" value="${m.materialName || ""}">
                  <input type="number" placeholder="Qty" class="quantity" value="${m.quantity || 0}">
                  <input placeholder="Unit" class="unit" value="${m.unit || ""}">
                </div>
              `,
                  )
                  .join("")
              : `
                <div class="dynamic-row material-row">
                  <input placeholder="Material Name" class="materialName">
                  <input type="number" placeholder="Qty" class="quantity">
                  <input placeholder="Unit" class="unit">
                </div>
              `
          }
        </div>
      </div>

      <label>Issues Encountered</label>
      <textarea name="issuesEncountered">${r.issuesEncountered || ""}</textarea>

      <label>Safety Incidents</label>
      <textarea name="safetyIncidents">${r.safetyIncidents || ""}</textarea>

      <label>Remarks</label>
      <textarea name="remarks">${r.remarks || ""}</textarea>

      <label>${isEdit ? "Add More Site Photos" : "Upload Site Photos"}</label>
      <input name="photos" type="file" multiple accept="image/*">

      <br><br>
      <button class="btn">${isEdit ? "Update Report" : "Submit Daily Report"}</button>
    </form>
  `);
}

let currentSlideIndex = 0;
let currentReportPhotos = [];

function viewReportById(id) {
  const report = window.dailyReportsData?.find((r) => r._id === id);

  if (!report) {
    alert("Report not found.");
    return;
  }

  viewReport(report);
}

function viewReport(r) {
  currentSlideIndex = 0;
  currentReportPhotos = r.photos || [];

  const status = getReportStatus(r);
  const manpowerTotal = countReportItems(r.manpower);
  const equipmentTotal = countReportItems(r.equipmentUsed);
  const materialsTotal = countReportItems(r.materialsUsed);

  const manpowerList = Array.isArray(r.manpower)
    ? r.manpower.map((m) => `<li>${m.position}: ${m.quantity}</li>`).join("")
    : "";

  const equipmentList = Array.isArray(r.equipmentUsed)
    ? r.equipmentUsed
        .map(
          (e) =>
            `<li>${e.equipmentName} - Qty: ${e.quantity || 0} ${
              e.remarks ? `(${e.remarks})` : ""
            }</li>`,
        )
        .join("")
    : "";

  const materialList = Array.isArray(r.materialsUsed)
    ? r.materialsUsed
        .map(
          (m) =>
            `<li>${m.materialName} - ${m.quantity || 0} ${m.unit || ""}</li>`,
        )
        .join("")
    : "";

  modal(`
    <div class="report-modal-header">
      <div>
        <p class="eyebrow">Daily Report Review</p>
        <h2>${r.project?.name || "Project Report"}</h2>
        <p>${date(r.reportDate)} • Submitted by ${r.submittedBy?.name || "-"}</p>
      </div>

      ${reportStatusBadge(status)}
    </div>

    <div class="report-summary-cards">
      <div>
        <span>👷</span>
        <b>${manpowerTotal}</b>
        <small>Total Manpower</small>
      </div>

      <div>
        <span>🚜</span>
        <b>${equipmentTotal}</b>
        <small>Equipment Used</small>
      </div>

      <div>
        <span>🧱</span>
        <b>${materialsTotal}</b>
        <small>Materials Used</small>
      </div>

      <div>
        <span>📷</span>
        <b>${currentReportPhotos.length}</b>
        <small>Site Photos</small>
      </div>
    </div>

    ${
      r.adminComments
        ? `
          <div class="admin-comment-box">
            <b>Admin Comments</b>
            <p>${r.adminComments}</p>
          </div>
        `
        : ""
    }

    <div class="report-view-grid">
      <div>
        <b>Weather</b>
        <p>${r.weatherCondition || "-"}</p>
      </div>

      <div>
        <b>Status</b>
        <p>${status}</p>
      </div>

      <div>
        <b>Reviewed By</b>
        <p>${r.reviewedBy?.name || "-"}</p>
      </div>

      <div>
        <b>Reviewed At</b>
        <p>${dateTime(r.reviewedAt)}</p>
      </div>
    </div>

    <div class="report-view-section">
      <b>Work Accomplished</b>
      <p>${r.workAccomplished || "-"}</p>
    </div>

    <div class="report-view-grid">
      <div>
        <b>Manpower</b>
        <ul>${manpowerList || "<li>None</li>"}</ul>
      </div>

      <div>
        <b>Equipment Used</b>
        <ul>${equipmentList || "<li>None</li>"}</ul>
      </div>

      <div>
        <b>Materials Used</b>
        <ul>${materialList || "<li>None</li>"}</ul>
      </div>
    </div>

    <div class="report-view-section">
      <b>Issues Encountered</b>
      <p>${r.issuesEncountered || "None"}</p>
    </div>

    <div class="report-view-section">
      <b>Safety Incidents</b>
      <p>${r.safetyIncidents || "None"}</p>
    </div>

    <div class="report-view-section">
      <b>Remarks</b>
      <p>${r.remarks || "None"}</p>
    </div>

    ${
      user.role === "admin" && status !== "Confirmed"
        ? `
          <div class="report-view-section">
            <b>Admin Review Notes</b>
            <textarea id="modalAdminComments" placeholder="Write comments for staff...">${r.adminComments || ""}</textarea>
          </div>
        `
        : ""
    }

    <div class="report-view-section">
      <b>Site Photos</b>
      <div class="report-photo-gallery">
        ${
          currentReportPhotos.length
            ? currentReportPhotos
                .map(
                  (p, i) => `
                  <img src="${p.url || p}" onclick="openImageSlider(${i})">
                `,
                )
                .join("")
            : `<p>No photos uploaded.</p>`
        }
      </div>
    </div>

    <div class="report-modal-actions">
      <button class="btn secondary" onclick="downloadReportPdf('${r._id}')">
        Export PDF
      </button>

      ${
        user.role === "admin" && status !== "Confirmed"
          ? `
            <button class="btn success" onclick="confirmReportFromModal('${r._id}')">
              Confirm Report
            </button>

            <button class="btn warning" onclick="needsRevisionFromModal('${r._id}')">
              Needs Revision
            </button>
          `
          : ""
      }

      ${
        user.role === "staff" && status !== "Confirmed"
          ? `
            <button class="btn" onclick="closeModal(); editReportById('${r._id}')">
              Edit Report
            </button>
          `
          : ""
      }
    </div>
  `);
}

async function confirmReportFromModal(id) {
  const comments = document.getElementById("modalAdminComments")?.value || "";

  if (!confirm("Are you sure you want to confirm this daily report?")) return;

  try {
    await api(`/api/reports/${id}/confirm`, {
      method: "PUT",
      body: JSON.stringify({ adminComments: comments }),
    });

    alert("Daily report confirmed.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

async function needsRevisionFromModal(id) {
  const comments = document.getElementById("modalAdminComments")?.value || "";

  if (!comments.trim()) {
    alert("Please write admin comments before requesting revision.");
    return;
  }

  if (!confirm("Mark this report as Needs Revision?")) return;

  try {
    await api(`/api/reports/${id}/needs-revision`, {
      method: "PUT",
      body: JSON.stringify({ adminComments: comments }),
    });

    alert("Report marked as Needs Revision.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

function openImageSlider(index) {
  currentSlideIndex = index;

  document.getElementById("imageViewer")?.remove();

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="image-viewer" id="imageViewer">
      <button class="image-close" onclick="closeImageSlider()">×</button>

      <button class="image-nav left" onclick="prevImage()">‹</button>

      <img id="sliderImage" src="${
        currentReportPhotos[currentSlideIndex]?.url ||
        currentReportPhotos[currentSlideIndex]
      }">

      <button class="image-nav right" onclick="nextImage()">›</button>

      <div class="image-counter">
        ${currentSlideIndex + 1} / ${currentReportPhotos.length}
      </div>
    </div>
    `,
  );
}

function updateSliderImage() {
  const img = document.getElementById("sliderImage");
  const counter = document.querySelector(".image-counter");

  if (img) {
    const photo = currentReportPhotos[currentSlideIndex];
    img.src = photo?.url || photo;
  }

  if (counter) {
    counter.textContent = `${currentSlideIndex + 1} / ${
      currentReportPhotos.length
    }`;
  }
}

function nextImage() {
  if (!currentReportPhotos.length) return;

  currentSlideIndex = (currentSlideIndex + 1) % currentReportPhotos.length;

  updateSliderImage();
}

function prevImage() {
  if (!currentReportPhotos.length) return;

  currentSlideIndex =
    (currentSlideIndex - 1 + currentReportPhotos.length) %
    currentReportPhotos.length;

  updateSliderImage();
}

function closeImageSlider() {
  document.getElementById("imageViewer")?.remove();
}

function addManpowerRow() {
  document.getElementById("manpowerList").insertAdjacentHTML(
    "beforeend",
    `
      <div class="dynamic-row manpower-row">
        <input placeholder="Position" class="position">
        <input type="number" placeholder="Qty" class="quantity">
      </div>
    `,
  );
}

function addEquipmentRow() {
  document.getElementById("equipmentList").insertAdjacentHTML(
    "beforeend",
    `
      <div class="dynamic-row equipment-row">
        <input placeholder="Equipment Name" class="equipmentName">
        <input type="number" placeholder="Qty" class="quantity">
        <input placeholder="Remarks" class="remarks">
      </div>
    `,
  );
}

function addMaterialRow() {
  document.getElementById("materialsList").insertAdjacentHTML(
    "beforeend",
    `
      <div class="dynamic-row material-row">
        <input placeholder="Material Name" class="materialName">
        <input type="number" placeholder="Qty" class="quantity">
        <input placeholder="Unit" class="unit">
      </div>
    `,
  );
}

async function saveReport(e, id = "") {
  e.preventDefault();

  const form = e.target;
  const fd = new FormData(form);

  // MANPOWER
  const manpower = [...document.querySelectorAll(".manpower-row")]
    .map((row) => ({
      position: row.querySelector(".position")?.value,
      quantity: Number(row.querySelector(".quantity")?.value || 0),
    }))
    .filter((m) => m.position);

  // EQUIPMENT
  const equipmentUsed = [...document.querySelectorAll(".equipment-row")]
    .map((row) => ({
      equipmentName: row.querySelector(".equipmentName")?.value,
      quantity: Number(row.querySelector(".quantity")?.value || 0),
      remarks: row.querySelector(".remarks")?.value || "",
    }))
    .filter((e) => e.equipmentName);

  // MATERIALS
  const materialsUsed = [...document.querySelectorAll(".material-row")]
    .map((row) => ({
      materialName: row.querySelector(".materialName")?.value,
      quantity: Number(row.querySelector(".quantity")?.value || 0),
      unit: row.querySelector(".unit")?.value || "",
    }))
    .filter((m) => m.materialName);

  fd.append("manpower", JSON.stringify(manpower));
  fd.append("equipmentUsed", JSON.stringify(equipmentUsed));
  fd.append("materialsUsed", JSON.stringify(materialsUsed));

  try {
    const res = await fetch(id ? `/api/reports/${id}` : "/api/reports", {
      method: id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "Failed to submit report",
      }));

      throw new Error(error.message);
    }

    alert("Daily report submitted successfully.");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

const projectCol = {
  label: "Project",
  render: (r) => r.project?.name || "",
};

async function staffDashboard() {
  layout("Project Staff Dashboard");

  const s = await api("/api/projects/dashboard-stats");
  const materials = await api("/api/materials").catch(() => []);
  const materialRequests = await api("/api/material-requests").catch(() => []);

  const project = s.progressSummary?.[0];

  if (!project) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Assigned Project</h3>
        <p class="empty-state">
          You are not yet assigned to any project. Please contact the admin or project manager.
        </p>
      </section>
    `;
    return;
  }

  const dueDate = project.targetCompletionDate
    ? new Date(project.targetCompletionDate)
    : null;

  const today = new Date();

  const remainingDays = dueDate
    ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
    : 0;

  const projectMaterials = materials.filter(
    (m) => String(m.project?._id || m.project) === String(project.id),
  );

  const projectRequests = materialRequests.filter(
    (r) => String(r.project?._id || r.project) === String(project.id),
  );

  const pendingMaterials = projectRequests.filter(
    (r) => r.status === "Pending",
  ).length;

  const outForDeliveryMaterials = projectRequests.filter(
    (r) => r.status === "Out for Delivery",
  ).length;

  const deliveredMaterials = projectRequests.filter((r) =>
    ["Delivered", "Received"].includes(r.status),
  ).length;

  const latestMaterialRequests = projectRequests.slice(0, 5);

  qs("#content").innerHTML = `
    <section class="staff-hero">
      <div>
        <p class="eyebrow">Assigned Project</p>
        <h2>${project.name}</h2>
        <p>${project.clientName || "No client"} • ${project.location || "No location"}</p>

        <div class="staff-project-meta">
          <span>Status: <b>${project.status}</b></span>
          <span>Due: <b>${date(project.targetCompletionDate)}</b></span>
          <span>Remaining: <b>${
            remainingDays >= 0 ? remainingDays + " days" : "Overdue"
          }</b></span>
        </div>
      </div>

      <div class="staff-progress-card">
        <span>${project.progress || 0}%</span>
        <p>Project Completion</p>
        <div class="progress large">
          <span style="width:${percent(project.progress)}%"></span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">📝</span>
        <small>Recent Reports</small>
        <h3>${s.recentReports?.length || 0}</h3>
        <p>Latest daily submissions</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">👷</span>
        <small>Total Manpower</small>
        <h3>${s.totalManpower || 0}</h3>
        <p>Recorded manpower</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">📦</span>
        <small>Pending Materials</small>
        <h3>${pendingMaterials}</h3>
        <p>Waiting for approval</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">⚠️</span>
        <small>Project Status</small>
        <h3>${project.status}</h3>
        <p>${remainingDays < 0 ? "Project is overdue" : "Timeline monitoring"}</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Project Progress</p>
            <h3>Current Completion</h3>
          </div>
          <span class="status-badge ${statusClass(project.status)}">
            ${project.status}
          </span>
        </div>

        <div class="staff-big-progress">
          <h2>${project.progress || 0}% Complete</h2>
          <div class="progress large">
            <span style="width:${percent(project.progress)}%"></span>
          </div>
          <p>Target Completion: ${date(project.targetCompletionDate)}</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Quick Actions</p>
            <h3>Today’s Site Tasks</h3>
          </div>
        </div>

        <div class="staff-actions">
          <a href="/reports.html" class="btn">📝 Submit Daily Report</a>
          <a href="/material-requests.html" class="btn secondary">📦 Request Material</a>
          <a href="/equipment-requests.html" class="btn secondary">🚜 Request Equipment</a>
          <a href="/issues.html" class="btn secondary">⚠️ Report Issue</a>
        </div>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Site Updates</p>
            <h3>Recent Daily Reports</h3>
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

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Manpower Summary</p>
            <h3>Recorded Workforce</h3>
          </div>
        </div>

        <div class="resource-grid">
          <div><span>🧰</span><b>${s.totalSkilledWorkers || 0}</b><small>Skilled Workers</small></div>
          <div><span>🤝</span><b>${s.totalHelpers || 0}</b><small>Helpers</small></div>
          <div><span>👷‍♂️</span><b>${s.totalEngineers || 0}</b><small>Engineers</small></div>
          <div><span>🏗️</span><b>${s.totalOperators || 0}</b><small>Operators</small></div>
        </div>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Project Materials</p>
            <h3>Materials Delivered to Site</h3>
          </div>
          <span class="badge">${projectMaterials.length} items</span>
        </div>

        <div class="staff-material-list">
          ${
            projectMaterials.length
              ? projectMaterials
                  .map((m) => {
                    const remaining =
                      Number(m.quantityDelivered || 0) -
                      Number(m.quantityUsed || 0);

                    return `
                      <div class="staff-material-card">
                        <div>
                          <h4>${m.materialName}</h4>
                          <p>
                            Delivered: ${m.quantityDelivered || 0} ${m.unit || ""}
                            • Used: ${m.quantityUsed || 0} ${m.unit || ""}
                          </p>
                        </div>

                        <span class="${
                          remaining <= 5 ? "material-low" : "material-ok"
                        }">
                          ${remaining} ${m.unit || ""} left
                        </span>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state">No materials delivered to this project yet.</div>`
          }
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Delivery Tracking</p>
            <h3>Material Request Timeline</h3>
          </div>
        </div>

        <div class="delivery-summary">
          <div>
            <b>${pendingMaterials}</b>
            <span>Pending</span>
          </div>
          <div>
            <b>${outForDeliveryMaterials}</b>
            <span>Out for Delivery</span>
          </div>
          <div>
            <b>${deliveredMaterials}</b>
            <span>Delivered</span>
          </div>
        </div>

        <div class="staff-timeline">
          ${
            latestMaterialRequests.length
              ? latestMaterialRequests
                  .map(
                    (r) => `
                    <div class="timeline-item">
                      <div class="timeline-dot ${statusClass(r.status)}"></div>
                      <div>
                        <b>${r.materialName}</b>
                        <p>${r.quantity || 0} ${r.unit || ""} • ${r.status}</p>
                        <small>${dateTime(r.createdAt)}</small>
                      </div>
                    </div>
                  `,
                  )
                  .join("")
              : `<div class="empty-state">No material requests yet.</div>`
          }
        </div>
      </div>
    </section>
  `;
}

if (page === "dashboard.html") {
  if (user?.role === "worker") {
    location.href = "/worker-dashboard.html";
  } else if (user?.role === "staff") {
    staffDashboard();
  } else {
    dashboard();
  }
}
if (page === "projects.html") projects();
if (page === "tasks.html") tasksPage();
if (page === "reports.html") reports();
if (page === "inventory-dashboard.html") inventoryDashboard();
if (page === "material-requests.html") materialRequestsPage();
if (page === "materials.html") materialsPage();
if (page === "equipment-requests.html") equipmentRequestsPage();
if (page === "gantt.html") ganttPage();
if (page === "client-dashboard.html") clientDashboard();
if (page === "expense-analytics.html") expenseAnalyticsPage();
if (page === "workers.html") workersPage();
if (page === "manpower-requests.html") manpowerRequestsPage();
if (page === "manpower-plans.html") manpowerPlansPage();
if (page === "productivity.html") productivityPage();
if (page === "worker-dashboard.html") workerDashboardPage();
if (page === "worker-project.html") workerProjectPage();
if (page === "worker-attendance.html") workerAttendancePage();
if (page === "worker-tasks.html") workerTasksPage();

async function workerTasksPage() {
  layout("My Tasks");

  const workers = await api("/api/workers").catch(() => []);

  const myWorkerProfile = workers.find((w) => {
    return String(w.user?._id || w.user || "") === String(user.id || user._id);
  });

  if (!myWorkerProfile) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Worker Profile Found</h3>
        <p class="empty-state">Your account is not linked to a worker profile yet.</p>
      </section>
    `;
    return;
  }

  const tasks = await api("/api/tasks");

  const myTasks = tasks.filter((t) => {
    return (t.assignedWorkers || []).some((w) => {
      return String(w._id || w) === String(myWorkerProfile._id);
    });
  });

  qs("#content").innerHTML = `
    <section class="panel">
      <div id="workerTasksTable"></div>
    </section>
  `;

  qs("#workerTasksTable").innerHTML = table(
    myTasks.map((t) => {
      const confirmations = t.workerConfirmations || [];

      const myConfirmation = confirmations.find((c) => {
        return (
          String(c.worker?._id || c.worker) === String(myWorkerProfile._id)
        );
      });

      const totalWorkers = confirmations.length;

      const verifiedWorkers = confirmations.filter(
        (c) => c.status === "Verified",
      ).length;

      const submittedWorkers = confirmations.filter(
        (c) => c.status === "Submitted",
      ).length;

      const pendingWorkers = confirmations.filter(
        (c) => c.status === "Pending",
      ).length;

      let taskDisplayStatus = t.status || "-";

      if (totalWorkers > 0) {
        if (verifiedWorkers === totalWorkers) {
          taskDisplayStatus = "Completed";
        } else if (submittedWorkers > 0 || verifiedWorkers > 0) {
          taskDisplayStatus = "Ongoing Verification";
        } else {
          taskDisplayStatus = "Ongoing";
        }
      }

      const workerProgress =
        totalWorkers > 0
          ? `
            <b>${verifiedWorkers}/${totalWorkers} Verified</b>
            <br>
            <small>
              ${submittedWorkers} Submitted • ${pendingWorkers} Pending
            </small>
          `
          : "-";

      return {
        ...t,

        myStatus: myConfirmation?.status || "Pending",
        taskDisplayStatus,
        workerProgress,

        actions: ["Submitted", "Verified"].includes(myConfirmation?.status)
          ? `<span class="status-badge ${statusClass(myConfirmation?.status)}">${myConfirmation?.status}</span>`
          : `
            <button class="btn success" onclick="confirmWorkerTaskDone('${t._id}', '${myWorkerProfile._id}')">
              Confirm My Work Done
            </button>
          `,
      };
    }),
    [
      { label: "Project", render: (t) => t.project?.name || "-" },
      { label: "Task", key: "title" },

      {
        label: "My Status",
        render: (t) =>
          `<span class="status-badge ${statusClass(t.myStatus)}">${t.myStatus}</span>`,
      },

      { label: "Start", render: (t) => date(t.startDate) },
      { label: "Due", render: (t) => date(t.dueDate) },

      {
        label: "Task Status",
        key: "taskDisplayStatus",
      },

      {
        label: "Worker Progress",
        key: "workerProgress",
      },

      { label: "Remarks", key: "remarks" },
    ],
  );
}

async function confirmWorkerTaskDone(taskId, workerId) {
  if (!confirm("Confirm that your assigned work is done?")) return;

  try {
    const result = await api(`/api/tasks/${taskId}/confirm-done`, {
      method: "PUT",
      body: JSON.stringify({ workerId }),
    });

    console.log("Confirm result:", result);

    alert("Your work was submitted for staff verification.");
    workerTasksPage();
  } catch (error) {
    console.error("Confirm task error:", error);
    alert(error.message);
  }
}

async function workerProjectPage() {
  layout("My Assigned Project");

  const workers = await api("/api/workers").catch(() => []);

  const myWorkerProfile = workers.find((w) => {
    return String(w.user?._id || w.user || "") === String(user.id);
  });

  if (!myWorkerProfile || !myWorkerProfile.assignedProject) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Assigned Project Yet</h3>
        <p class="empty-state">
          You are not yet assigned to any project. Please wait for admin assignment.
        </p>
      </section>
    `;
    return;
  }

  const project = myWorkerProfile.assignedProject;

  qs("#content").innerHTML = `
    <section class="staff-hero">
      <div>
        <p class="eyebrow">My Assigned Project</p>
        <h2>${project.name || "Project"}</h2>
        <p>${project.location || "No location"}</p>

        <div class="staff-project-meta">
          <span>Status: <b>${project.status || "-"}</b></span>
          <span>Progress: <b>${project.progress || 0}%</b></span>
          <span>Target: <b>${date(project.targetCompletionDate)}</b></span>
        </div>
      </div>

      <div class="staff-progress-card">
        <span>${project.progress || 0}%</span>
        <p>Project Progress</p>
        <div class="progress large">
          <span style="width:${percent(project.progress || 0)}%"></span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Project Details</p>
          <h3>Safe Worker View</h3>
        </div>
      </div>

      <div class="report-view-grid">
        <div>
          <b>Project Name</b>
          <p>${project.name || "-"}</p>
        </div>

        <div>
          <b>Location</b>
          <p>${project.location || "-"}</p>
        </div>

        <div>
          <b>Status</b>
          <p>${project.status || "-"}</p>
        </div>

        <div>
          <b>Target Completion</b>
          <p>${date(project.targetCompletionDate)}</p>
        </div>
      </div>
    </section>
  `;
}

async function workerAttendancePage() {
  layout("My Attendance");

  const workers = await api("/api/workers").catch(() => []);

  const myWorkerProfile = workers.find((w) => {
    return String(w.user?._id || w.user || "") === String(user.id);
  });

  if (!myWorkerProfile) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Worker Profile Found</h3>
        <p class="empty-state">
          Your account is not yet linked to a worker profile.
        </p>
      </section>
    `;
    return;
  }

  const attendance = myWorkerProfile.attendanceHistory || [];

  const present = attendance.filter((a) => a.status === "Present").length;
  const absent = attendance.filter((a) => a.status === "Absent").length;
  const late = attendance.filter((a) => a.status === "Late").length;
  const halfDay = attendance.filter((a) => a.status === "Half Day").length;
  const leave = attendance.filter((a) => a.status === "Leave").length;

  qs("#content").innerHTML = `
    <section class="staff-hero">
      <div>
        <p class="eyebrow">Worker Attendance Monitoring</p>
        <h2>${myWorkerProfile.fullName}</h2>
        <p>${myWorkerProfile.position} • ${myWorkerProfile.assignedProject?.name || "No assigned project"}</p>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card green">
        <span class="kpi-icon">✅</span>
        <small>Present</small>
        <h3>${present}</h3>
        <p>Total present records</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">❌</span>
        <small>Absent</small>
        <h3>${absent}</h3>
        <p>Total absent records</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">⏱️</span>
        <small>Late</small>
        <h3>${late}</h3>
        <p>Total late records</p>
      </div>

      <div class="kpi-card blue">
        <span class="kpi-icon">📅</span>
        <small>Total Records</small>
        <h3>${attendance.length}</h3>
        <p>Attendance history</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Attendance Chart</p>
            <h3>Status Summary</h3>
          </div>
        </div>

        <canvas id="workerAttendanceChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Attendance Details</p>
            <h3>My Attendance Records</h3>
          </div>
        </div>

        <div id="workerAttendanceTable"></div>
      </div>
    </section>
  `;

  qs("#workerAttendanceTable").innerHTML = table(
    attendance.map((a) => ({
      ...a,
      actions: "",
    })),
    [
      { label: "Project", render: (a) => a.project?.name || "-" },
      { label: "Date", render: (a) => date(a.date) },
      { label: "Status", key: "status" },
      { label: "OT Hours", render: (a) => a.overtimeHours || 0 },
      { label: "Remarks", render: (a) => a.remarks || "-" },
    ],
  );

  setTimeout(() => {
    new Chart(document.getElementById("workerAttendanceChart"), {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent", "Late", "Half Day", "Leave"],
        datasets: [
          {
            data: [present, absent, late, halfDay, leave],
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }, 100);
}

async function ganttPage() {
  layout("Project Gantt Chart");

  const projects = await api("/api/projects/my-projects");

  const selectedProject =
    localStorage.getItem("selectedGanttProject") || projects?.[0]?._id || "";

  const tasks = await api(
    selectedProject ? `/api/tasks?project=${selectedProject}` : "/api/tasks",
  );

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate),
  );

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  if (!sortedTasks.length) {
    qs("#content").innerHTML = `
      <section class="panel">
        <div class="form-grid">
          <div>
            <label>Select Project</label>
            <select onchange="changeGanttProject(this.value)">
              ${projectOptions}
            </select>
          </div>
        </div>
      </section>

      <br>

      <section class="panel">
        <h3>No Tasks Yet</h3>
        <p class="empty-state">No tasks found for the selected project.</p>
      </section>
    `;
    return;
  }

  const minDate = new Date(
    Math.min(...sortedTasks.map((t) => new Date(t.startDate))),
  );

  const maxDate = new Date(
    Math.max(...sortedTasks.map((t) => new Date(t.dueDate))),
  );

  const totalDays =
    Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))) + 1;

  const doneCount = sortedTasks.filter((t) => t.status === "Done").length;

  const delayedCount = sortedTasks.filter(
    (t) =>
      t.status === "Delayed" ||
      (t.status !== "Done" && new Date(t.dueDate) < new Date()),
  ).length;

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select onchange="changeGanttProject(this.value)">
            ${projectOptions}
          </select>
        </div>
      </div>
    </section>

    <br>

    <section class="gantt-hero">
      <div>
        <p class="eyebrow">Construction Timeline</p>
        <h2>Project Schedule Overview</h2>
        <p>Track task duration, deadlines, delays, and site progress in a professional timeline view.</p>
      </div>

      <div class="gantt-stats">
        <div>
          <b>${sortedTasks.length}</b>
          <span>Total Tasks</span>
        </div>
        <div>
          <b>${doneCount}</b>
          <span>Completed</span>
        </div>
        <div>
          <b>${delayedCount}</b>
          <span>Delayed</span>
        </div>
      </div>
    </section>

    <section class="panel gantt-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Timeline View</p>
          <h3>${date(minDate)} to ${date(maxDate)}</h3>
        </div>
        <span class="badge">${totalDays} days</span>
      </div>

      <div class="gantt-legend">
        <span><i class="legend-dot pending"></i> Pending</span>
        <span><i class="legend-dot ongoing"></i> Ongoing</span>
        <span><i class="legend-dot done"></i> Done</span>
        <span><i class="legend-dot delayed"></i> Delayed / Overdue</span>
      </div>

      <div class="gantt-modern">
        ${sortedTasks
          .map((t) => {
            const start = new Date(t.startDate);
            const end = new Date(t.dueDate);

            const offsetDays = Math.max(
              0,
              Math.ceil((start - minDate) / (1000 * 60 * 60 * 24)),
            );

            const durationDays =
              Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) + 1;

            const left = (offsetDays / totalDays) * 100;
            const width = Math.max(8, (durationDays / totalDays) * 100);

            const overdue =
              t.status !== "Done" && new Date(t.dueDate) < new Date();

            const status = overdue ? "Delayed" : t.status;

            return `
              <div class="gantt-modern-row">
                <div class="gantt-task-card">
                  <div>
                    <h4>${t.title}</h4>
                    <p>${t.project?.name || "No project"}</p>
                  </div>

                  <span class="status-badge ${statusClass(status)}">
                    ${status}
                  </span>

                  <small>${date(t.startDate)} → ${date(t.dueDate)}</small>
                </div>

                <div class="gantt-modern-track">
                  <div
                    class="gantt-modern-bar ${statusClass(status)}"
                    style="left:${left}%; width:${width}%"
                  >
                    <span>${durationDays} days</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function changeGanttProject(projectId) {
  localStorage.setItem("selectedGanttProject", projectId);
  ganttPage();
}

async function materialRequestsPage() {
  layout("Material Requests");

  const rows = await api("/api/material-requests");
  const projectOptions = await loadProjectsSelect();

  window.materialRequestsData = rows;
  window.materialRequestProjectOptions = projectOptions;

  qs("#content").innerHTML = `
    ${
      user.role === "staff"
        ? `
          <button class="btn" onclick="materialRequestForm()">
            Request Material
          </button>
          <br><br>
        `
        : ""
    }

    <button class="btn secondary" onclick="downloadMaterialRequestsExcel()">
      Download Excel
    </button>

    <br><br>

    <div class="panel">
      <input
        id="materialRequestSearch"
        placeholder="Search requested material..."
        oninput="filterMaterialRequests()"
      >
    </div>

    <br>

    <div id="materialRequestsTable"></div>
  `;

  renderMaterialRequestsTable(rows);
}

async function equipmentRequestsPage() {
  layout("Equipment Requests");

  const rows = await api("/api/equipment-requests");
  const projects = await api("/api/projects");
  const equipment = await api("/api/equipment");

  window.equipmentRequestsData = rows;

  window.equipmentRequestProjectOptions = projects
    .map((p) => `<option value="${p._id}">${p.name}</option>`)
    .join("");

  window.equipmentRequestEquipmentOptions = equipment
    .filter((e) => {
      if (e.equipmentType === "Small") {
        return Number(e.availableQuantity || 0) > 0 && e.condition === "Good";
      }

      if (e.equipmentType === "Heavy") {
        return e.status === "Available" && e.condition === "Good";
      }

      return false;
    })
    .map((e) => {
      const label =
        e.equipmentType === "Heavy"
          ? `${e.equipmentName} | ${e.assetCode || "No Asset Code"} | Plate: ${e.plateNumber || "N/A"}`
          : `${e.equipmentName} | Available: ${e.availableQuantity}`;

      return `
      <option 
        value="${e._id}"
        data-type="${e.equipmentType}"
        data-available="${e.availableQuantity || 1}"
        data-asset="${e.assetCode || ""}"
        data-plate="${e.plateNumber || ""}"
      >
        ${label}
      </option>
    `;
    })
    .join("");

  qs("#content").innerHTML = `
    ${
      user.role === "staff"
        ? `
          <button class="btn" onclick="equipmentRequestForm()">
            Request Equipment
          </button>
          <br><br>
        `
        : ""
    }

    <div id="equipmentRequestsTable"></div>
  `;

  renderEquipmentRequestsTable(rows);
}

function renderEquipmentRequestsTable(rows) {
  qs("#equipmentRequestsTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: `
        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Pending"
            ? `
              <button class="btn success" onclick="reviewEquipmentRequest('${r._id}', 'approve')">
                Approve
              </button>
              <button class="btn danger" onclick="reviewEquipmentRequest('${r._id}', 'reject')">
                Reject
              </button>
            `
            : ""
        }

        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Approved"
            ? `
              <button class="btn" onclick="equipmentOutForDelivery('${r._id}')">
                Out for Delivery
              </button>
            `
            : ""
        }

        ${
          user.role === "staff" && r.status === "Out for Delivery"
            ? `
              <button class="btn success" onclick="confirmEquipmentReceived('${r._id}')">
                Confirm Received
              </button>
            `
            : ""
        }

        ${
          user.role === "staff" && r.status === "In Use"
            ? `
              <button class="btn secondary" onclick="requestEquipmentReturn('${r._id}')">
                Return Equipment
              </button>
            `
            : ""
        }

        ${
          ["admin", "inventory"].includes(user.role) &&
          r.status === "Return Requested"
            ? `
              <button class="btn success" onclick="confirmEquipmentReturned('${r._id}')">
                Confirm Returned
              </button>
            `
            : ""
        }
      `,
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "" },

      {
        label: "Location",
        render: (r) => r.projectLocation || "-",
      },

      {
        label: "Equipment",
        render: (r) => r.equipment?.equipmentName || "",
      },

      { label: "Qty", key: "quantity" },
      { label: "Purpose", key: "purpose" },
      { label: "Expected Return", render: (r) => date(r.expectedReturnDate) },
      { label: "Return Condition", key: "returnCondition" },
      { label: "Status", key: "status" },
      { label: "Requested By", render: (r) => r.requestedBy?.name || "" },
      { label: "Requested Date", render: (r) => dateTime(r.createdAt) },
    ],
  );
}

function equipmentRequestForm() {
  modal(`
    <h3>Request Equipment</h3>

    <form onsubmit="saveEquipmentRequest(event)">
      <label>Project</label>
      <select name="project" required>
        ${window.equipmentRequestProjectOptions}
      </select>

      <label>Equipment</label>
      <select 
        name="equipment" 
        id="requestEquipmentSelect" 
        onchange="updateEquipmentRequestFields()" 
        required
      >
        ${window.equipmentRequestEquipmentOptions}
      </select>

      <div id="selectedEquipmentInfo" class="panel" style="margin:12px 0;">
        Select equipment to view details.
      </div>

      <div class="form-grid">
        <input 
          name="quantity" 
          id="requestEquipmentQuantity"
          type="number" 
          min="1" 
          placeholder="Quantity" 
          required
        >

        <input 
          name="expectedReturnDate" 
          type="date" 
          required
        >

        <input 
  name="projectLocation" 
  placeholder="Project location / site location"
  required
>
      </div>

      <textarea 
        name="purpose" 
        placeholder="Purpose / reason for borrowing"
      ></textarea>

      <button class="btn">Submit Request</button>
    </form>
  `);

  updateEquipmentRequestFields();
}

function updateEquipmentRequestFields() {
  const select = document.getElementById("requestEquipmentSelect");
  const qtyInput = document.getElementById("requestEquipmentQuantity");
  const info = document.getElementById("selectedEquipmentInfo");

  if (!select || !qtyInput || !info) return;

  const selected = select.options[select.selectedIndex];

  const type = selected.dataset.type;
  const available = Number(selected.dataset.available || 1);
  const asset = selected.dataset.asset || "-";
  const plate = selected.dataset.plate || "-";

  if (type === "Heavy") {
    qtyInput.value = 1;
    qtyInput.readOnly = true;
    qtyInput.max = 1;

    info.innerHTML = `
      <b>Heavy Equipment</b>
      <p>Asset Code: ${asset}</p>
      <p>Plate Number: ${plate}</p>
      <p>Quantity is fixed to 1 because heavy equipment is borrowed per unit.</p>
    `;
  } else {
    qtyInput.value = "";
    qtyInput.readOnly = false;
    qtyInput.max = available;

    info.innerHTML = `
      <b>Small Equipment</b>
      <p>Available Quantity: ${available}</p>
      <p>Enter the quantity needed for the project.</p>
    `;
  }
}

async function saveEquipmentRequest(e) {
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const select = document.getElementById("requestEquipmentSelect");
  const selected = select.options[select.selectedIndex];

  const type = selected.dataset.type;
  const available = Number(selected.dataset.available || 1);

  data.quantity = Number(data.quantity || 0);

  if (type === "Heavy") {
    data.quantity = 1;
  }

  if (type === "Small" && data.quantity > available) {
    alert(`Only ${available} available.`);
    return;
  }

  await api("/api/equipment-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Equipment request submitted.");
  location.reload();
}

async function reviewEquipmentRequest(id, action) {
  try {
    if (
      !confirm(
        `${action === "approve" ? "Approve" : "Reject"} this equipment request?`,
      )
    ) {
      return;
    }

    await api(`/api/equipment-requests/${id}/${action}`, {
      method: "PUT",
    });

    alert(`Equipment request ${action}d.`);
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

async function equipmentOutForDelivery(id) {
  if (!confirm("Mark this equipment as out for delivery?")) return;

  await api(`/api/equipment-requests/${id}/out-for-delivery`, {
    method: "PUT",
  });

  alert("Equipment marked as out for delivery.");
  location.reload();
}

async function confirmEquipmentReceived(id) {
  if (!confirm("Confirm that you received this equipment?")) return;

  await api(`/api/equipment-requests/${id}/received`, {
    method: "PUT",
  });

  alert("Equipment received and now in use.");
  location.reload();
}

async function requestEquipmentReturn(id) {
  const returnCondition = prompt(
    "Return condition: Good, Minor Damage, Damaged, or Lost",
    "Good",
  );

  if (!returnCondition) return;

  await api(`/api/equipment-requests/${id}/request-return`, {
    method: "PUT",
    body: JSON.stringify({ returnCondition }),
  });

  alert("Equipment return requested.");
  location.reload();
}

async function confirmEquipmentReturned(id) {
  if (!confirm("Confirm equipment has been returned to warehouse?")) return;

  await api(`/api/equipment-requests/${id}/confirm-returned`, {
    method: "PUT",
  });

  alert("Equipment return confirmed.");
  location.reload();
}

function renderMaterialRequestsTable(rows) {
  qs("#materialRequestsTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: `
  ${
    ["admin", "inventory"].includes(user.role)
      ? `
        <button class="btn secondary"
          onclick="viewMaterialRequest('${r._id}')">
          View
        </button>
      `
      : ""
  }

  ${
    ["admin", "inventory"].includes(user.role) && r.status === "Pending"
      ? `
        <button class="btn success"
          onclick="reviewMaterialRequest('${r._id}', 'approve')">
          Approve
        </button>

        <button class="btn danger"
          onclick="reviewMaterialRequest('${r._id}', 'reject')">
          Reject
        </button>
      `
      : ""
  }

  ${
    ["admin", "inventory"].includes(user.role) && r.status === "Approved"
      ? `
        <button class="btn"
          onclick="markOutForDelivery('${r._id}')">
          Out for Delivery
        </button>
      `
      : ""
  }

  ${
    user.role === "staff" && r.status === "Out for Delivery"
      ? `
        <button class="btn success"
          onclick="confirmMaterialReceived('${r._id}')">
          Confirm Received
        </button>
      `
      : ""
  }
`,
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "" },
      { label: "Material", key: "materialName" },
      {
        label: "Quantity",
        render: (r) => `${r.quantity} ${r.unit || ""}`,
      },
      { label: "Status", key: "status" },
      {
        label: "Requested By",
        render: (r) => r.requestedBy?.name || "",
      },
      {
        label: "Requested Date/Time",
        render: (r) => dateTime(r.createdAt),
      },
      {
        label: "Approved Date/Time",
        render: (r) =>
          ["Approved", "Out for Delivery", "Delivered"].includes(r.status)
            ? dateTime(r.reviewedAt)
            : "-",
      },
      {
        label: "Out for Delivery",
        render: (r) =>
          ["Out for Delivery", "Delivered"].includes(r.status)
            ? dateTime(r.deliveredAt)
            : "-",
      },
      {
        label: "Delivered Date/Time",
        render: (r) =>
          r.status === "Delivered" ? dateTime(r.receivedAt) : "-",
      },
    ],
  );
}

function viewMaterialRequest(id) {
  const request = window.materialRequestsData?.find((r) => r._id === id);

  if (!request) {
    alert("Material request not found.");
    return;
  }

  modal(`
    <h3>📦 Material Request Details</h3>

    <div class="report-view-grid">
      <div>
        <b>Project</b>
        <p>${request.project?.name || "-"}</p>
      </div>

      <div>
        <b>Material</b>
        <p>${request.materialName || "-"}</p>
      </div>

      <div>
        <b>Quantity</b>
        <p>${request.quantity || 0} ${request.unit || ""}</p>
      </div>

      <div>
        <b>Status</b>
        <p>${request.status || "-"}</p>
      </div>

      <div>
        <b>Requested By</b>
        <p>${request.requestedBy?.name || "-"}</p>
      </div>

      <div>
        <b>Purpose of Request</b>
        <p>${request.purpose || "No purpose provided."}</p>
      </div>

      <div>
        <b>Requested Date/Time</b>
        <p>${dateTime(request.createdAt)}</p>
      </div>

      <div>
        <b>Approved Date/Time</b>
        <p>${dateTime(request.reviewedAt)}</p>
      </div>

      <div>
        <b>Out for Delivery Date/Time</b>
        <p>${dateTime(request.deliveredAt)}</p>
      </div>

      <div>
        <b>Delivered Date/Time</b>
        <p>${dateTime(request.receivedAt)}</p>
      </div>
    </div>
  `);
}
window.viewMaterialRequest = viewMaterialRequest;
window.reviewMaterialRequest = reviewMaterialRequest;
window.markOutForDelivery = markOutForDelivery;
window.confirmMaterialReceived = confirmMaterialReceived;
window.materialRequestForm = materialRequestForm;
window.filterMaterialRequests = filterMaterialRequests;
window.downloadMaterialRequestsExcel = downloadMaterialRequestsExcel;

function filterMaterialRequests() {
  const keyword = qs("#materialRequestSearch").value.toLowerCase();

  const filtered = (window.materialRequestsData || []).filter((r) => {
    return (
      (r.materialName || "").toLowerCase().includes(keyword) ||
      (r.project?.name || "").toLowerCase().includes(keyword) ||
      (r.purpose || "").toLowerCase().includes(keyword) ||
      (r.status || "").toLowerCase().includes(keyword) ||
      (r.requestedBy?.name || "").toLowerCase().includes(keyword)
    );
  });

  renderMaterialRequestsTable(filtered);
}

async function downloadMaterialRequestsExcel() {
  try {
    const res = await fetch("/api/export/material-requests-excel", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(errorText);
      throw new Error("Failed to download Excel file.");
    }

    const blob = await res.blob();

    if (
      !blob.type.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    ) {
      throw new Error("Downloaded file is not a valid Excel file.");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "material-requests.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
}

async function materialRequestForm() {
  const warehouseMaterials = await api(
    "/api/materials/warehouse/request-options",
  );

  const materialOptions = warehouseMaterials
    .filter((m) => {
      const remaining =
        Number(m.quantityDelivered || 0) - Number(m.quantityUsed || 0);

      return !m.project && remaining > 0;
    })
    .map((m) => {
      const remaining =
        Number(m.quantityDelivered || 0) - Number(m.quantityUsed || 0);

      return `
        <option 
          value="${m.materialName}"
          data-unit="${m.unit || ""}"
          data-available="${remaining}"
        >
          ${m.materialName} - Available: ${remaining} ${m.unit || ""}
        </option>
      `;
    })
    .join("");

  modal(`
    <h3>Request Material</h3>

    <form onsubmit="saveMaterialRequest(event)">
      <label>Project</label>
      <select name="project" required>
        ${window.materialRequestProjectOptions}
      </select>

      <label>Material</label>
      <select 
        name="materialName" 
        id="requestMaterialSelect"
        onchange="updateMaterialRequestInfo()"
        required
      >
        <option value="">Select warehouse material</option>
        ${materialOptions}
      </select>

      <div id="selectedMaterialInfo" class="panel" style="margin:12px 0;">
        Select a material to view available stock.
      </div>

      <div class="form-grid">
        <input 
          name="quantity" 
          id="requestMaterialQuantity"
          type="number" 
          min="1" 
          placeholder="Quantity" 
          required
        >

        <input 
          name="unit" 
          id="requestMaterialUnit"
          placeholder="Unit"
          readonly
        >
      </div>

      <textarea name="purpose" placeholder="Purpose / reason for request"></textarea>

      <button class="btn">Submit Request</button>
    </form>
  `);
}

function updateMaterialRequestInfo() {
  const select = document.getElementById("requestMaterialSelect");
  const qtyInput = document.getElementById("requestMaterialQuantity");
  const unitInput = document.getElementById("requestMaterialUnit");
  const info = document.getElementById("selectedMaterialInfo");

  if (!select || !qtyInput || !unitInput || !info) return;

  const selected = select.options[select.selectedIndex];

  const unit = selected.dataset.unit || "";
  const available = Number(selected.dataset.available || 0);

  unitInput.value = unit;
  qtyInput.max = available;

  info.innerHTML = `
    <b>${selected.value || "No material selected"}</b>
    <p>Available warehouse stock: ${available} ${unit}</p>
  `;
}

async function saveMaterialRequest(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  const select = document.getElementById("requestMaterialSelect");
  const selected = select.options[select.selectedIndex];
  const available = Number(selected.dataset.available || 0);

  data.quantity = Number(data.quantity || 0);

  if (data.quantity > available) {
    alert(`Only ${available} ${data.unit} available in warehouse.`);
    return;
  }

  await api("/api/material-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Material request submitted.");
  location.reload();
}

async function reviewMaterialRequest(id, action) {
  const ok = confirm(
    action === "approve"
      ? "Approve this material request?"
      : "Reject this material request?",
  );

  if (!ok) return;

  await api(`/api/material-requests/${id}/${action}`, {
    method: "PUT",
  });

  alert(`Material request ${action}d.`);
  location.reload();
}

async function markOutForDelivery(id) {
  if (!confirm("Mark this request as out for delivery?")) return;

  await api(`/api/material-requests/${id}/out-for-delivery`, {
    method: "PUT",
  });

  alert("Marked as out for delivery.");
  location.reload();
}

async function confirmMaterialReceived(id) {
  if (!confirm("Confirm that you received this material?")) return;

  await api(`/api/material-requests/${id}/received`, {
    method: "PUT",
  });

  alert("Material received successfully.");
  location.reload();
}

async function materialsPage() {
  layout(
    user.role === "inventory" ? "Warehouse Materials" : "Project Materials",
  );

  const projects = await api("/api/projects/my-projects").catch(() => []);
  const selectedProject =
    localStorage.getItem("selectedMaterialProject") || projects?.[0]?._id || "";

  const rows = await api("/api/materials");

  const filteredRows =
    user.role === "staff" && selectedProject
      ? rows.filter(
          (m) =>
            String(m.project?._id || m.project) === String(selectedProject),
        )
      : rows;

  window.materialsData = filteredRows;

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  qs("#content").innerHTML = `
    <div class="panel">
      <div class="form-grid">
        ${
          user.role === "staff"
            ? `
              <div>
                <label>Select Project</label>
                <select onchange="changeMaterialProject(this.value)">
                  ${projectOptions}
                </select>
              </div>
            `
            : ""
        }

        <div>
          <label>Search Material</label>
          <input
            id="materialSearch"
            placeholder="${
              user.role === "inventory"
                ? "Search warehouse material..."
                : "Search project material..."
            }"
            oninput="filterMaterials()"
          >
        </div>
      </div>

      ${
        ["admin", "inventory"].includes(user.role)
          ? `
            <br>
            <button class="btn" onclick="simpleForm('Warehouse Materials','/api/materials','${encodeURIComponent(
              JSON.stringify([
                {
                  name: "materialName",
                  label: "Material name",
                  required: true,
                },
                {
                  name: "quantityDelivered",
                  label: "Available Warehouse Stock",
                  type: "number",
                  required: true,
                },
                { name: "unit", label: "Unit", required: true },
                {
                  name: "deliveryDate",
                  label: "Stock Date",
                  type: "date",
                  required: true,
                },
              ]),
            )}')">
              Add Warehouse Material
            </button>
          `
          : ""
      }
    </div>

    <br>

    <div id="materialsTable"></div>
  `;

  renderMaterialsTable(filteredRows);
}

function changeMaterialProject(projectId) {
  localStorage.setItem("selectedMaterialProject", projectId);
  materialsPage();
}

function filterMaterials() {
  const keyword = qs("#materialSearch").value.toLowerCase();

  let filtered = [...(window.materialsData || [])];

  if (keyword) {
    filtered = filtered.filter((m) =>
      (m.materialName || "").toLowerCase().includes(keyword),
    );
  }

  renderMaterialsTable(filtered);
}

function renderMaterialsTable(rows) {
  const columns =
    user.role === "inventory"
      ? [
          { label: "Material", key: "materialName" },
          { label: "Warehouse Stock", key: "quantityDelivered" },
          { label: "Released", key: "quantityUsed" },
          {
            label: "Remaining",
            render: (r) => {
              const remaining =
                Number(r.quantityDelivered || 0) - Number(r.quantityUsed || 0);

              return `
                <span style="
                  font-weight:600;
                  color:${remaining <= 5 ? "#dc2626" : "#16a34a"};
                ">
                  ${remaining}
                </span>
              `;
            },
          },
          { label: "Unit", key: "unit" },
        ]
      : [
          projectCol,
          { label: "Material", key: "materialName" },
          { label: "Delivered to Project", key: "quantityDelivered" },
          {
            label: "Used by Project",
            render: (r) => `
              <div style="display:flex; gap:8px; align-items:center;">
                <input
                  id="used-${r._id}"
                  type="number"
                  min="0"
                  max="${r.quantityDelivered || 0}"
                  value="${r.quantityUsed || 0}"
                  style="width:100px"
                  ${user.role !== "staff" ? "disabled" : ""}
                >

                ${
                  user.role === "staff"
                    ? `
                      <button
                        class="btn success"
                        onclick="updateUsedQuantity('${r._id}')"
                      >
                        Update
                      </button>
                    `
                    : ""
                }
              </div>
            `,
          },
          {
            label: "Remaining in Project",
            render: (r) => {
              const remaining =
                Number(r.quantityDelivered || 0) - Number(r.quantityUsed || 0);

              return `
                <span style="
                  font-weight:600;
                  color:${remaining <= 5 ? "#dc2626" : "#16a34a"};
                ">
                  ${remaining}
                </span>
              `;
            },
          },
          { label: "Unit", key: "unit" },
        ];

  qs("#materialsTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions:
        user.role === "admin" || user.role === "inventory"
          ? `<button class="btn danger" onclick="del('/api/materials','${r._id}')">Delete</button>`
          : "",
    })),
    columns,
  );
}

async function updateUsedQuantity(id) {
  try {
    const input = document.getElementById(`used-${id}`);
    const value = Number(input.value || 0);

    await api(`/api/materials/${id}/used`, {
      method: "PUT",
      body: JSON.stringify({
        quantityUsed: value,
      }),
    });

    const rows = await api("/api/materials");
    window.materialsData = rows;
    filterMaterials();

    alert("Used quantity updated.");
  } catch (error) {
    alert(error.message);
  }
}

async function saveInventoryOnHand(id) {
  try {
    const input = document.getElementById(`inventoryOnHand-${id}`);
    const value = Number(input.value || 0);

    await api(`/api/materials/${id}/inventory-on-hand`, {
      method: "PUT",
      body: JSON.stringify({
        inventoryOnHand: value,
      }),
    });

    alert("Inventory on hand updated.");
    materialsPage();
  } catch (error) {
    alert(error.message);
  }
}

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

if (page === "manpower.html") manpowerPage();

async function manpowerPage() {
  layout("Manpower Monitoring");

  const projects = await api("/api/projects/my-projects");

  const selectedProject =
    localStorage.getItem("selectedManpowerProject") || projects?.[0]?._id || "";

  const query = selectedProject ? `?project=${selectedProject}` : "";

  const workers = await api("/api/workers").catch(() => []);
  const attendanceRows = await api(`/api/manpower-attendance${query}`).catch(
    () => [],
  );
  const analytics = await api(
    `/api/manpower-attendance/analytics/summary${query}`,
  );

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  const totalWorkers = workers.filter((w) =>
    selectedProject
      ? String(w.assignedProject?._id || w.assignedProject) ===
        String(selectedProject)
      : true,
  ).length;

  const presentToday = Number(analytics.summary?.present || 0);
  const absentToday = Number(analytics.summary?.absent || 0);
  const attendanceRate =
    totalWorkers > 0 ? Math.round((presentToday / totalWorkers) * 100) : 0;

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select id="manpowerProjectSelect" onchange="changeManpowerProject(this.value)">
            ${projectOptions}
          </select>
        </div>
      </div>
    </section>

    <br>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">👥</span>
        <small>Total Registered Workers</small>
        <h3>${totalWorkers}</h3>
        <p>From worker master list</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">👷</span>
        <small>Present</small>
        <h3>${presentToday}</h3>
        <p>Based on attendance</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">❌</span>
        <small>Absent</small>
        <h3>${absentToday}</h3>
        <p>Based on attendance</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">📊</span>
        <small>Attendance Rate</small>
        <h3>${attendanceRate}%</h3>
        <p>Present / registered workers</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Attendance Analytics</p>
            <h3>Present vs Absent</h3>
          </div>
        </div>
        <canvas id="manpowerDistributionChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Daily Trend</p>
            <h3>Attendance-Based Manpower</h3>
          </div>
        </div>
        <canvas id="manpowerTrendChart"></canvas>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Records</p>
          <h3>Attendance Logs</h3>
        </div>
      </div>

      <div id="manpowerTable"></div>
    </section>
  `;

  window.manpowerRows = attendanceRows;

  renderManpowerTable(attendanceRows);
  renderAttendanceBasedManpowerCharts(analytics.trend || []);
}

function renderAttendanceBasedManpowerCharts(trend = []) {
  new Chart(document.getElementById("manpowerDistributionChart"), {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [
            trend.reduce((sum, x) => sum + Number(x.present || 0), 0),
            trend.reduce((sum, x) => sum + Number(x.absent || 0), 0),
          ],
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

  new Chart(document.getElementById("manpowerTrendChart"), {
    type: "line",
    data: {
      labels: trend.map((x) => date(x.date)),
      datasets: [
        {
          label: "Present",
          data: trend.map((x) => x.present || 0),
          fill: true,
          tension: 0.4,
        },
        {
          label: "Absent",
          data: trend.map((x) => x.absent || 0),
          fill: true,
          tension: 0.4,
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
}

async function manpowerPlansPage() {
  layout("Planned vs Actual Manpower");

  const projects = await api("/api/projects/my-projects");

  const selectedProject =
    localStorage.getItem("selectedManpowerPlanProject") ||
    projects?.[0]?._id ||
    "";

  const plans = await api(
    selectedProject
      ? `/api/manpower-plans?project=${selectedProject}`
      : "/api/manpower-plans",
  );

  const comparison = await api(
    selectedProject
      ? `/api/manpower-plans/comparison/summary?project=${selectedProject}`
      : "/api/manpower-plans/comparison/summary",
  );

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  const totalPlanned = comparison.reduce(
    (sum, r) => sum + Number(r.planned?.total || 0),
    0,
  );

  const totalActual = comparison.reduce(
    (sum, r) => sum + Number(r.actual?.total || 0),
    0,
  );

  const totalShortage = comparison.reduce(
    (sum, r) => sum + Number(r.shortage || 0),
    0,
  );

  const shortageDays = comparison.filter((r) => r.status === "Shortage").length;

  window.manpowerPlansData = plans;
  window.manpowerComparisonData = comparison;

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select
  id="manpowerPlanProjectSelect"
  onchange="changeManpowerPlanProject(this.value)"
>
            ${projectOptions}
          </select>
        </div>

        <div>
          <label>Search</label>
          <input
            id="manpowerPlanSearch"
            placeholder="Search activity / project / status..."
            oninput="filterManpowerPlans()"
          >
        </div>
      </div>

      <br>

      <button class="btn" onclick="manpowerPlanForm()">Add Manpower Plan</button>

      <button class="btn secondary" onclick="downloadManpowerPlanExcel()">
        Export Excel
      </button>
    </section>

    <br>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">📋</span>
        <small>Planned Workers</small>
        <h3>${totalPlanned}</h3>
        <p>Total required workforce</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">👷</span>
        <small>Actual Workers</small>
        <h3>${totalActual}</h3>
        <p>Actual present workforce</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">⚠️</span>
        <small>Total Shortage</small>
        <h3>${totalShortage}</h3>
        <p>Missing workers</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">📉</span>
        <small>Shortage Days</small>
        <h3>${shortageDays}</h3>
        <p>Days below manpower plan</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Comparison</p>
            <h3>Planned vs Actual Workers</h3>
          </div>
        </div>

        <canvas id="plannedActualChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Summary</p>
            <h3>Manpower Variance Status</h3>
          </div>
        </div>

        <div class="resource-grid">
          <div>
            <span>📋</span>
            <b>${comparison.length}</b>
            <small>Total Plan Records</small>
          </div>

          <div>
            <span>⚠️</span>
            <b>${shortageDays}</b>
            <small>Shortage Records</small>
          </div>

          <div>
            <span>✅</span>
            <b>${comparison.filter((r) => r.status === "Balanced").length}</b>
            <small>Balanced Records</small>
          </div>

          <div>
            <span>👥</span>
            <b>${comparison.filter((r) => r.status === "Overstaffed").length}</b>
            <small>Overstaffed Records</small>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Records</p>
          <h3>Planned vs Actual Table</h3>
        </div>
      </div>

      <div id="manpowerComparisonTable"></div>
    </section>
  `;

  renderManpowerComparisonTable(comparison);
  renderPlannedActualChart(comparison);
}

function changeManpowerPlanProject(projectId) {
  localStorage.setItem("selectedManpowerPlanProject", projectId);
  manpowerPlansPage();
}

function manpowerPlanForm() {
  const selectedProject =
    document.getElementById("manpowerPlanProjectSelect")?.value ||
    localStorage.getItem("selectedManpowerPlanProject") ||
    "";

  if (!selectedProject) {
    alert("Please select a project first.");
    return;
  }

  modal(`
    <h3>Add Manpower Plan</h3>

    <form onsubmit="saveManpowerPlan(event)">
      <input type="hidden" name="project" value="${selectedProject}">

      <label>Date</label>
      <input name="date" type="date" value="${date(new Date())}" required>

      <label>Activity</label>
      <input name="activity" placeholder="Example: Concrete pouring / masonry works" required>

      <div class="form-grid">
        <input name="foreman" type="number" min="0" placeholder="Planned Foreman">
        <input name="mason" type="number" min="0" placeholder="Planned Mason">
        <input name="carpenter" type="number" min="0" placeholder="Planned Carpenter">
        <input name="steelman" type="number" min="0" placeholder="Planned Steelman">
        <input name="electrician" type="number" min="0" placeholder="Planned Electrician">
        <input name="plumber" type="number" min="0" placeholder="Planned Plumber">
        <input name="helpers" type="number" min="0" placeholder="Planned Helper">
        <input name="engineers" type="number" min="0" placeholder="Planned Engineer">
        <input name="operators" type="number" min="0" placeholder="Planned Operator">
      </div>

      <label>Remarks</label>
      <textarea name="remarks" placeholder="Planning notes"></textarea>

      <button class="btn">Save Plan</button>
    </form>
  `);
}

async function saveManpowerPlan(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  await api("/api/manpower-plans", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Manpower plan saved.");
  location.reload();
}

function renderManpowerComparisonTable(rows) {
  qs("#manpowerComparisonTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: `
        ${
          r.status === "Shortage"
            ? `<button class="btn warning" onclick='createRequestFromShortage(${JSON.stringify(r)})'>
                Request Shortage
              </button>`
            : ""
        }

        ${
          user.role === "admin"
            ? `<button class="btn danger" onclick="del('/api/manpower-plans','${r._id}')">Delete</button>`
            : ""
        }
      `,
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Date", render: (r) => date(r.date) },
      { label: "Activity", key: "activity" },
      { label: "Planned", render: (r) => r.planned?.total || 0 },
      { label: "Actual", render: (r) => r.actual?.total || 0 },
      { label: "Total Shortage", render: (r) => r.shortage || 0 },
      {
        label: "Status",
        render: (r) =>
          `<span class="status-badge ${statusClass(r.status)}">${r.status}</span>`,
      },
      { label: "Remarks", render: (r) => r.remarks || "-" },
    ],
  );
}

async function downloadManpowerPlanExcel() {
  try {
    const projectId = localStorage.getItem("selectedManpowerPlanProject") || "";

    const url = projectId
      ? `/api/export/manpower-plans-excel?project=${projectId}`
      : "/api/export/manpower-plans-excel";

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to export manpower plan report.");
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "planned-vs-actual-manpower.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    alert(error.message);
  }
}

function createRequestFromShortage(row) {
  const shortageOptions = [];

  if (row.shortages?.skilledWorkers > 0) {
    shortageOptions.push({
      position: "Skilled",
      qty: row.shortages.skilledWorkers,
    });
  }

  if (row.shortages?.helpers > 0) {
    shortageOptions.push({
      position: "Helper",
      qty: row.shortages.helpers,
    });
  }

  if (row.shortages?.engineers > 0) {
    shortageOptions.push({
      position: "Engineer",
      qty: row.shortages.engineers,
    });
  }

  if (row.shortages?.operators > 0) {
    shortageOptions.push({
      position: "Operator",
      qty: row.shortages.operators,
    });
  }

  if (!shortageOptions.length) {
    alert("No shortage found.");
    return;
  }

  modal(`
    <h3>Create Manpower Request from Shortage</h3>

    <form onsubmit="saveShortageRequest(event)">
      <input type="hidden" name="project" value="${row.project?._id || row.project}">
      <input type="hidden" name="activity" value="${row.activity || ""}">

      <label>Position Needed</label>
      <select name="position" id="shortagePositionSelect" onchange="updateShortageQuantity()" required>
        ${shortageOptions
          .map(
            (s) => `
              <option value="${s.position}" data-qty="${s.qty}">
                ${s.position} - shortage ${s.qty}
              </option>
            `,
          )
          .join("")}
      </select>

      <label>Quantity Needed</label>
      <input id="shortageQtyInput" name="quantityNeeded" type="number" min="1" required>

      <div class="form-grid">
        <div>
          <label>Start Date</label>
          <input name="assignmentStartDate" type="date" value="${date(row.date)}" required>
        </div>

        <div>
          <label>End Date</label>
          <input name="assignmentEndDate" type="date" value="${date(row.date)}" required>
        </div>
      </div>

      <label>Reason</label>
      <textarea name="reason">Shortage detected for ${row.activity}. Planned ${row.planned?.total || 0}, actual ${row.actual?.total || 0}.</textarea>

      <button class="btn success">Submit Manpower Request</button>
    </form>
  `);

  updateShortageQuantity();
}

function updateShortageQuantity() {
  const select = document.getElementById("shortagePositionSelect");
  const input = document.getElementById("shortageQtyInput");

  if (!select || !input) return;

  const selected = select.options[select.selectedIndex];
  input.value = selected.dataset.qty || 1;
}

async function saveShortageRequest(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  await api("/api/manpower-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Manpower request created from shortage.");
  location.href = "/manpower-requests.html";
}

function filterManpowerPlans() {
  const keyword = qs("#manpowerPlanSearch").value.toLowerCase();

  const filtered = (window.manpowerComparisonData || []).filter((r) =>
    `${r.project?.name || ""} ${r.activity || ""} ${r.status || ""}`
      .toLowerCase()
      .includes(keyword),
  );

  renderManpowerComparisonTable(filtered);
}

function renderPlannedActualChart(rows) {
  new Chart(document.getElementById("plannedActualChart"), {
    type: "bar",
    data: {
      labels: rows.map((r) => `${date(r.date)} - ${r.activity}`),
      datasets: [
        {
          label: "Planned",
          data: rows.map((r) => r.planned?.total || 0),
          backgroundColor: "#2563eb",
          borderRadius: 10,
        },
        {
          label: "Actual",
          data: rows.map((r) => r.actual?.total || 0),
          backgroundColor: "#16a34a",
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
}

if (page === "manpower-attendance.html") manpowerAttendancePage();

async function manpowerAttendancePage() {
  layout("Manpower Attendance");

  const projects = await api("/api/projects/my-projects");

  const workers = await api("/api/workers").catch(() => []);

  const selectedProject =
    localStorage.getItem("selectedAttendanceProject") ||
    projects?.[0]?._id ||
    "";

  const projectWorkers = workers.filter((w) => {
    const assignedProject = String(
      w.assignedProject?._id || w.assignedProject || "",
    );
    return selectedProject ? assignedProject === String(selectedProject) : true;
  });

  window.attendanceWorkers = projectWorkers;

  window.attendanceWorkerOptions = projectWorkers
    .filter((w) => ["Assigned", "Available"].includes(w.status))
    .map(
      (w) => `
      <option
        value="${w._id}"
        data-name="${w.fullName}"
        data-position="${w.position}"
        data-rate="${w.ratePerDay || 0}"
      >
        ${w.fullName} - ${w.position}
      </option>
    `,
    )
    .join("");

  const rows = await api(
    selectedProject
      ? `/api/manpower-attendance?project=${selectedProject}`
      : "/api/manpower-attendance",
  );

  const analytics = await api(
    selectedProject
      ? `/api/manpower-attendance/analytics/summary?project=${selectedProject}`
      : "/api/manpower-attendance/analytics/summary",
  );

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select id="attendanceProjectSelect" onchange="changeAttendanceProject(this.value)">
            ${projectOptions}
          </select>
        </div>

        <div>
          <label>Search</label>
          <input id="attendanceSearch" placeholder="Search project / remarks..." oninput="filterAttendance()">
        </div>
      </div>

      <br>

      <button class="btn" onclick="attendanceForm()">Add Attendance</button>
    </section>

    <br>

    <section class="kpi-grid">
      <div class="kpi-card green">
        <span class="kpi-icon">👷</span>
        <small>Present</small>
        <h3>${analytics.summary.present}</h3>
        <p>Total present workers</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">❌</span>
        <small>Absent</small>
        <h3>${analytics.summary.absent}</h3>
        <p>Total absent workers</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">⏱️</span>
        <small>Overtime Hours</small>
        <h3>${analytics.summary.overtime}</h3>
        <p>Total OT hours</p>
      </div>

      <div class="kpi-card blue">
        <span class="kpi-icon">💰</span>
        <small>Labor Cost</small>
        <h3>${money(analytics.summary.laborCost)}</h3>
        <p>Auto-computed labor cost</p>
      </div>
    </section>

    ${
      analytics.shortageAlerts.length
        ? `
          <section class="panel danger-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Attention Needed</p>
                <h3>Manpower Shortage Alerts</h3>
              </div>
            </div>

            ${analytics.shortageAlerts
              .map(
                (a) => `
                  <div class="alert-item">
                    <b>${a.project}</b>
                    <p>${a.message}</p>
                    <small>${date(a.date)} • Present workers: ${a.present}</small>
                  </div>
                `,
              )
              .join("")}
          </section>
          <br>
        `
        : ""
    }

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Attendance Trend</p>
            <h3>Present vs Absent</h3>
          </div>
        </div>
        <canvas id="attendanceTrendChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Labor Analytics</p>
            <h3>Labor Cost Trend</h3>
          </div>
        </div>
        <canvas id="laborCostTrendChart"></canvas>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Attendance Logs</p>
          <h3>Daily Workforce Attendance</h3>
        </div>
      </div>

      <div id="attendanceTable"></div>
    </section>
  `;

  window.attendanceRows = rows;

  renderAttendanceTable(rows);
  renderAttendanceCharts(analytics.trend);
}

function changeAttendanceProject(projectId) {
  localStorage.setItem("selectedAttendanceProject", projectId);
  manpowerAttendancePage();
}

function renderAttendanceTable(rows) {
  qs("#attendanceTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions:
        user.role === "admin"
          ? `<button class="btn danger" onclick="del('/api/manpower-attendance','${r._id}')">Delete</button>`
          : "",
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Date", render: (r) => date(r.date) },
      { label: "Present", key: "totalPresent" },
      { label: "Absent", key: "totalAbsent" },
      { label: "Late", key: "totalLate" },
      { label: "OT Hours", key: "totalOvertimeHours" },
      { label: "Labor Cost", render: (r) => money(r.totalLaborCost) },
      { label: "Remarks", render: (r) => r.remarks || "-" },
      { label: "Encoded By", render: (r) => r.encodedBy?.name || "-" },
    ],
  );
}

function filterAttendance() {
  const keyword = qs("#attendanceSearch").value.toLowerCase();

  const filtered = (window.attendanceRows || []).filter((r) => {
    return (
      (r.project?.name || "").toLowerCase().includes(keyword) ||
      (r.remarks || "").toLowerCase().includes(keyword)
    );
  });

  renderAttendanceTable(filtered);
}

function attendanceForm() {
  const selectedProject =
    qs("#attendanceProjectSelect")?.value ||
    localStorage.getItem("selectedAttendanceProject") ||
    "";

  if (!selectedProject) {
    alert("Please select a project first.");
    return;
  }

  const workers = window.attendanceWorkers || [];

  if (!workers.length) {
    alert("No workers assigned to this project.");
    return;
  }

  const workerRows = workers
    .filter((w) => ["Assigned", "Available"].includes(w.status))
    .map(
      (w) => `
        <tr class="attendance-bulk-row">
          <td>
            <input type="checkbox" class="att-include" checked>
          </td>

          <td>
            <b>${w.fullName}</b>
            <input type="hidden" class="att-worker" value="${w._id}">
            <input type="hidden" class="att-worker-name" value="${w.fullName}">
          </td>

          <td>
            ${w.position}
            <input type="hidden" class="att-position" value="${w.position}">
          </td>

          <td>
            <select class="att-status">
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
              <option>Half Day</option>
              <option>Leave</option>
            </select>
          </td>

          <td>
            ₱${Number(w.ratePerDay || 0).toLocaleString()}
            <input type="hidden" class="att-rate" value="${w.ratePerDay || 0}">
          </td>

          <td>
            <input class="att-ot" type="number" min="0" step="0.5" value="0">
          </td>

          <td>
            <input class="att-remarks" placeholder="Remarks">
          </td>
        </tr>
      `,
    )
    .join("");

  modal(`
    <h3>Add Manpower Attendance</h3>

    <form onsubmit="saveAttendance(event)">
      <input type="hidden" name="project" value="${selectedProject}">

      <label>Date</label>
      <input name="date" type="date" value="${date(new Date())}" required>

      <div class="attendance-actions">
        <button type="button" class="btn success" onclick="setAllAttendanceStatus('Present')">
          Mark All Present
        </button>

        <button type="button" class="btn danger" onclick="setAllAttendanceStatus('Absent')">
          Mark All Absent
        </button>

        <button type="button" class="btn warning" onclick="setAllAttendanceStatus('Late')">
          Mark All Late
        </button>

        <button type="button" class="btn secondary" onclick="toggleAllAttendanceWorkers(false)">
          Uncheck All
        </button>

        <button type="button" class="btn secondary" onclick="toggleAllAttendanceWorkers(true)">
          Check All
        </button>
      </div>

      <div class="attendance-table-wrap">
        <table class="attendance-bulk-table">
          <thead>
            <tr>
              <th>Use</th>
              <th>Worker</th>
              <th>Position</th>
              <th>Status</th>
              <th>Rate/Day</th>
              <th>OT Hrs</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${workerRows}
          </tbody>
        </table>
      </div>

      <label>General Remarks</label>
      <textarea name="remarks" placeholder="Example: 2 workers absent due to rain"></textarea>

      <br><br>
      <button class="btn">Save Attendance</button>
    </form>
  `);
}

function setAllAttendanceStatus(status) {
  document.querySelectorAll(".att-status").forEach((select) => {
    select.value = status;
  });
}

function toggleAllAttendanceWorkers(checked) {
  document.querySelectorAll(".att-include").forEach((box) => {
    box.checked = checked;
  });
}

async function saveAttendance(e) {
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const workers = [...document.querySelectorAll(".attendance-bulk-row")]
    .filter((row) => row.querySelector(".att-include")?.checked)
    .map((row) => ({
      worker: row.querySelector(".att-worker")?.value,
      workerName: row.querySelector(".att-worker-name")?.value,
      position: row.querySelector(".att-position")?.value,
      status: row.querySelector(".att-status")?.value,
      ratePerDay: Number(row.querySelector(".att-rate")?.value || 0),
      overtimeHours: Number(row.querySelector(".att-ot")?.value || 0),
      remarks: row.querySelector(".att-remarks")?.value || "",
    }))
    .filter((w) => w.worker && w.workerName);

  if (!workers.length) {
    alert("Please select at least one worker.");
    return;
  }

  data.workers = workers;

  await api("/api/manpower-attendance", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Attendance saved. Labor cost was automatically computed.");
  location.reload();
}

function renderAttendanceCharts(trend) {
  new Chart(document.getElementById("attendanceTrendChart"), {
    type: "line",
    data: {
      labels: trend.map((x) => date(x.date)),
      datasets: [
        {
          label: "Present",
          data: trend.map((x) => x.present),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.12)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Absent",
          data: trend.map((x) => x.absent),
          borderColor: "#dc2626",
          backgroundColor: "rgba(220,38,38,0.12)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: "bottom" } },
    },
  });

  new Chart(document.getElementById("laborCostTrendChart"), {
    type: "bar",
    data: {
      labels: trend.map((x) => date(x.date)),
      datasets: [
        {
          label: "Labor Cost",
          data: trend.map((x) => x.laborCost),
          backgroundColor: "#c87919",
          borderRadius: 10,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function changeManpowerProject(projectId) {
  localStorage.setItem("selectedManpowerProject", projectId);
  manpowerPage();
}

function renderManpowerTable(rows) {
  const activeStatuses = ["Present", "Late", "Half Day"];

  qs("#manpowerTable").innerHTML = table(
    rows.map((r) => {
      const workers = r.workers || [];

      const countPosition = (position) =>
        workers.filter(
          (w) => w.position === position && activeStatuses.includes(w.status),
        ).length;

      const foreman = countPosition("Foreman");
      const mason = countPosition("Mason");
      const carpenter = countPosition("Carpenter");
      const steelman = countPosition("Steelman");
      const electrician = countPosition("Electrician");
      const plumber = countPosition("Plumber");
      const helpers = countPosition("Helper");
      const engineers = countPosition("Engineer");
      const operators = countPosition("Operator");

      return {
        ...r,
        foreman,
        mason,
        carpenter,
        steelman,
        electrician,
        plumber,
        helpers,
        engineers,
        operators,
        total:
          foreman +
          mason +
          carpenter +
          steelman +
          electrician +
          plumber +
          helpers +
          engineers +
          operators,
        actions:
          user.role === "admin"
            ? `<button class="btn danger" onclick="del('/api/manpower-attendance','${r._id}')">Delete</button>`
            : "",
      };
    }),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Date", render: (r) => date(r.date) },
      { label: "Foreman", key: "foreman" },
      { label: "Mason", key: "mason" },
      { label: "Carpenter", key: "carpenter" },
      { label: "Steelman", key: "steelman" },
      { label: "Electrician", key: "electrician" },
      { label: "Plumber", key: "plumber" },
      { label: "Helper", key: "helpers" },
      { label: "Engineer", key: "engineers" },
      { label: "Operator", key: "operators" },
      { label: "Total Present", key: "total" },
      { label: "Absent", render: (r) => r.totalAbsent || 0 },
      { label: "Late", render: (r) => r.totalLate || 0 },
      { label: "Remarks", render: (r) => r.remarks || "-" },
      { label: "Encoded By", render: (r) => r.encodedBy?.name || "-" },
    ],
  );
}

function filterManpower() {
  const keyword = qs("#manpowerSearch").value.toLowerCase();

  const filtered = (window.manpowerRows || []).filter((r) => {
    return (
      (r.project?.name || "").toLowerCase().includes(keyword) ||
      (r.remarks || "").toLowerCase().includes(keyword)
    );
  });

  renderManpowerTable(filtered);
}

function manpowerForm() {
  const selectedProject =
    qs("#manpowerProjectSelect")?.value ||
    localStorage.getItem("selectedManpowerProject") ||
    "";

  if (!selectedProject) {
    alert("Please select a project first.");
    return;
  }

  modal(`
    <h3>Add Manpower Record</h3>

    <form onsubmit="saveManpower(event)">
      <input
        type="hidden"
        name="project"
        value="${selectedProject}"
      >

      <label>Date</label>
      <input
        name="date"
        type="date"
        value="${date(new Date())}"
        required
      >

      <div class="form-grid">
        <input
          name="skilledWorkers"
          type="number"
          min="0"
          placeholder="Skilled Workers"
        >

        <input
          name="helpers"
          type="number"
          min="0"
          placeholder="Helpers"
        >

        <input
          name="engineers"
          type="number"
          min="0"
          placeholder="Engineers"
        >

        <input
          name="operators"
          type="number"
          min="0"
          placeholder="Operators"
        >
      </div>

      <label>Remarks</label>
      <textarea
        name="remarks"
        placeholder="Example: All workers present"
      ></textarea>

      <br>

      <button class="btn">
        Save Manpower
      </button>
    </form>
  `);
}

async function saveManpower(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  if (!data.project) {
    alert("Please select a project first.");
    return;
  }

  await api("/api/manpower", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Manpower record saved.");
  location.reload();
}

function renderManpowerCharts(rows, totals) {
  new Chart(document.getElementById("manpowerDistributionChart"), {
    type: "doughnut",
    data: {
      labels: ["Skilled", "Helpers", "Engineers", "Operators"],
      datasets: [
        {
          data: [
            totals.totalSkilled,
            totals.totalHelpers,
            totals.totalEngineers,
            totals.totalOperators,
          ],
          backgroundColor: ["#2563eb", "#f97316", "#16a34a", "#dc2626"],
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

  new Chart(document.getElementById("manpowerTrendChart"), {
    type: "line",
    data: {
      labels: rows.map((r) => date(r.date)).reverse(),
      datasets: [
        {
          label: "Total Workers",
          data: rows
            .map(
              (r) =>
                Number(r.skilledWorkers || 0) +
                Number(r.helpers || 0) +
                Number(r.engineers || 0) +
                Number(r.operators || 0),
            )
            .reverse(),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.12)",
          fill: true,
          tension: 0.4,
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
}

if (page === "equipment.html") equipmentPage();

async function equipmentPage() {
  layout("Equipment Inventory");

  const rows = await api("/api/equipment");
  window.equipmentData = rows;

  qs("#content").innerHTML = `
    <div class="panel">
      <input
        id="equipmentSearch"
        placeholder="🔍 Search equipment, asset code, plate no., operator, location..."
        oninput="filterEquipment()"
      >
    </div>

    <br>

    ${
      ["admin", "inventory"].includes(user.role)
        ? `
          <button class="btn" onclick="equipmentForm()">
            Add Equipment
          </button>
          <br><br>
        `
        : ""
    }

    <div id="equipmentTable"></div>
  `;

  renderEquipmentTable(rows);
}

function filterEquipment() {
  const keyword = qs("#equipmentSearch").value.toLowerCase();

  const filtered = (window.equipmentData || []).filter((e) => {
    return (
      (e.equipmentType || "").toLowerCase().includes(keyword) ||
      (e.equipmentName || "").toLowerCase().includes(keyword) ||
      (e.assetCode || "").toLowerCase().includes(keyword) ||
      (e.plateNumber || "").toLowerCase().includes(keyword) ||
      (e.operatorName || "").toLowerCase().includes(keyword) ||
      (e.condition || "").toLowerCase().includes(keyword) ||
      (e.currentLocation || "").toLowerCase().includes(keyword) ||
      (e.warehouseLocation || "").toLowerCase().includes(keyword)
    );
  });

  renderEquipmentTable(filtered);
}

function renderEquipmentTable(rows) {
  qs("#equipmentTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: ["admin", "inventory"].includes(user.role)
        ? `
          <button class="btn warning" onclick="editEquipment('${r._id}')">
            Edit
          </button>

          <button class="btn danger" onclick="del('/api/equipment','${r._id}')">
            Delete
          </button>
        `
        : "",
    })),
    [
      { label: "Type", key: "equipmentType" },
      { label: "Equipment", key: "equipmentName" },
      { label: "Asset Code", render: (r) => r.assetCode || "-" },
      { label: "Plate No.", render: (r) => r.plateNumber || "-" },
      {
        label: "Total Qty",
        render: (r) =>
          r.equipmentType === "Heavy" ? 1 : Number(r.totalQuantity || 0),
      },
      {
        label: "Available",
        render: (r) => Number(r.availableQuantity || 0),
      },
      {
        label: "Borrowed",
        render: (r) => Number(r.borrowedQuantity || 0),
      },
      { label: "Project", render: (r) => r.assignedProject?.name || "-" },
      { label: "Operator", render: (r) => r.operatorName || "-" },
      { label: "Condition", render: (r) => r.condition || "Good" },
      {
        label: "Location",
        render: (r) => r.currentLocation || r.warehouseLocation || "-",
      },
      { label: "Remarks", render: (r) => r.remarks || "-" },
    ],
  );
}

function equipmentForm() {
  modal(`
    <h3>Add Equipment</h3>

    <form onsubmit="saveEquipment(event)">
      <label>Equipment Type</label>
      <select name="equipmentType" id="equipmentType" onchange="toggleEquipmentFields()" required>
        <option value="Small">Small Equipment</option>
        <option value="Heavy">Heavy Equipment</option>
      </select>

      <div class="form-grid">
        <input name="equipmentName" placeholder="Equipment name" required>

        <div class="small-equipment-field">
          <input name="totalQuantity" type="number" min="1" placeholder="Total quantity">
        </div>

        <div class="heavy-equipment-field" style="display:none">
          <input name="assetCode" placeholder="Asset code e.g. DT-001">
        </div>

        <div class="heavy-equipment-field" style="display:none">
          <input name="plateNumber" placeholder="Plate number">
        </div>

        <div class="heavy-equipment-field" style="display:none">
          <input name="operatorName" placeholder="Operator / Driver name">
        </div>

        <select name="condition">
          <option value="Good">Good</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Damaged">Damaged</option>
        </select>

        <input name="warehouseLocation" placeholder="Warehouse location">
        <input name="currentLocation" placeholder="Current location">
      </div>

      <textarea name="remarks" placeholder="Remarks"></textarea>

      <button class="btn">Save Equipment</button>
    </form>
  `);
}

function toggleEquipmentFields() {
  const type = document.getElementById("equipmentType").value;

  document.querySelectorAll(".small-equipment-field").forEach((el) => {
    el.style.display = type === "Small" ? "block" : "none";
  });

  document.querySelectorAll(".heavy-equipment-field").forEach((el) => {
    el.style.display = type === "Heavy" ? "block" : "none";
  });
}

async function saveEquipment(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  if (data.equipmentType === "Small") {
    data.totalQuantity = Number(data.totalQuantity || 0);
    data.availableQuantity = data.totalQuantity;
    data.borrowedQuantity = 0;
    data.status = "Available";
    data.assetCode = "";
    data.plateNumber = "";
  }

  if (data.equipmentType === "Heavy") {
    data.totalQuantity = 1;
    data.availableQuantity = 1;
    data.borrowedQuantity = 0;
    data.status = "Available";
  }

  await api("/api/equipment", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Equipment added successfully.");
  location.reload();
}

async function editEquipment(id) {
  try {
    const equipment = await api(`/api/equipment/${id}`);

    modal(`
      <h3>Edit Equipment</h3>

      <form onsubmit="updateEquipment(event, '${id}')">
        <label>Equipment Type</label>
        <select 
          name="equipmentType" 
          id="editEquipmentType"
          onchange="toggleEditEquipmentFields()"
          required
        >
          <option value="Small" ${equipment.equipmentType === "Small" ? "selected" : ""}>
            Small Equipment
          </option>
          <option value="Heavy" ${equipment.equipmentType === "Heavy" ? "selected" : ""}>
            Heavy Equipment
          </option>
        </select>

        <div class="form-grid">
          <input name="equipmentName" value="${equipment.equipmentName || ""}" placeholder="Equipment name" required>

          <div class="edit-small-equipment-field">
            <input name="totalQuantity" type="number" min="1" value="${equipment.totalQuantity || 1}" placeholder="Total quantity">
          </div>

          <div class="edit-heavy-equipment-field">
            <input name="assetCode" value="${equipment.assetCode || ""}" placeholder="Asset code">
          </div>

          <div class="edit-heavy-equipment-field">
            <input name="plateNumber" value="${equipment.plateNumber || ""}" placeholder="Plate number">
          </div>

          <div class="edit-heavy-equipment-field">
            <input name="operatorName" value="${equipment.operatorName || ""}" placeholder="Operator">
          </div>

          <select name="condition">
            <option value="Good" ${equipment.condition === "Good" ? "selected" : ""}>Good</option>
            <option value="Maintenance" ${equipment.condition === "Maintenance" ? "selected" : ""}>Maintenance</option>
            <option value="Damaged" ${equipment.condition === "Damaged" ? "selected" : ""}>Damaged</option>
          </select>

          <input name="warehouseLocation" value="${equipment.warehouseLocation || ""}" placeholder="Warehouse location">
          <input name="currentLocation" value="${equipment.currentLocation || ""}" placeholder="Current location">
        </div>

        <textarea name="remarks" placeholder="Remarks">${equipment.remarks || ""}</textarea>

        <button class="btn success">Update Equipment</button>
      </form>
    `);

    toggleEditEquipmentFields();
  } catch (error) {
    alert(error.message);
  }
}

function toggleEditEquipmentFields() {
  const type = document.getElementById("editEquipmentType")?.value;

  document.querySelectorAll(".edit-small-equipment-field").forEach((el) => {
    el.style.display = type === "Small" ? "block" : "none";
  });

  document.querySelectorAll(".edit-heavy-equipment-field").forEach((el) => {
    el.style.display = type === "Heavy" ? "block" : "none";
  });
}

async function updateEquipment(e, id) {
  e.preventDefault();

  try {
    const data = Object.fromEntries(new FormData(e.target));

    if (data.equipmentType === "Heavy") {
      data.totalQuantity = 1;
      data.availableQuantity = 1;
      data.borrowedQuantity = 0;
    }

    if (data.equipmentType === "Small") {
      data.totalQuantity = Number(data.totalQuantity || 0);
    }

    await api(`/api/equipment/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    alert("Equipment updated successfully.");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

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

async function inventoryDashboard() {
  layout("Inventory Dashboard");

  const materials = await api("/api/materials");
  const equipment = await api("/api/equipment");
  const requests = await api("/api/material-requests");

  const totalDelivered = materials.reduce(
    (sum, m) => sum + Number(m.quantityDelivered || 0),
    0,
  );

  const totalUsed = materials.reduce(
    (sum, m) => sum + Number(m.quantityUsed || 0),
    0,
  );

  const totalRemaining = materials.reduce(
    (sum, m) =>
      sum +
      (Number(m.remainingQuantity || 0) ||
        Number(m.quantityDelivered || 0) - Number(m.quantityUsed || 0)),
    0,
  );

  const totalWarehouseStock = materials.reduce(
    (sum, m) =>
      sum + (Number(m.quantityDelivered || 0) - Number(m.quantityUsed || 0)),
    0,
  );

  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  const approvedRequests = requests.filter(
    (r) => r.status === "Approved",
  ).length;
  const outForDelivery = requests.filter(
    (r) => r.status === "Out for Delivery",
  ).length;
  const receivedRequests = requests.filter(
    (r) => r.status === "Received" || r.status === "Delivered",
  ).length;

  const totalEquipmentQty = equipment.reduce(
    (sum, e) => sum + Number(e.totalQuantity || 0),
    0,
  );

  const availableEquipmentQty = equipment.reduce(
    (sum, e) => sum + Number(e.availableQuantity || 0),
    0,
  );

  const borrowedEquipmentQty = equipment.reduce(
    (sum, e) => sum + Number(e.borrowedQuantity || 0),
    0,
  );

  const maintenanceEquipmentQty = equipment
    .filter((e) => e.condition === "Maintenance" || e.condition === "Damaged")
    .reduce((sum, e) => sum + Number(e.totalQuantity || 0), 0);

  const monthlyMap = {};

  materials.forEach((m) => {
    const rawDate = m.deliveryDate || m.createdAt || m.updatedAt;
    const month = rawDate
      ? new Date(rawDate).toLocaleString("default", {
          month: "short",
          year: "numeric",
        })
      : "No Date";

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        delivered: 0,
        used: 0,
      };
    }

    monthlyMap[month].delivered += Number(m.quantityDelivered || 0);
    monthlyMap[month].used += Number(m.quantityUsed || 0);
  });

  const monthlyLabels = Object.keys(monthlyMap);
  const monthlyDelivered = monthlyLabels.map((m) => monthlyMap[m].delivered);
  const monthlyUsed = monthlyLabels.map((m) => monthlyMap[m].used);

  const topUsedMaterials = [...materials]
    .sort((a, b) => Number(b.quantityUsed || 0) - Number(a.quantityUsed || 0))
    .slice(0, 5);

  const topUsedLabels = topUsedMaterials.map((m) => m.materialName);
  const topUsedValues = topUsedMaterials.map((m) =>
    Number(m.quantityUsed || 0),
  );

  qs("#content").innerHTML = `
    <section class="kpi-grid">
      

      <div class="kpi-card orange">
        <span class="kpi-icon">🧾</span>
        <small>Pending Requests</small>
        <h3>${pendingRequests}</h3>
        <p>Waiting for approval</p>
      </div>

      <div class="kpi-card blue">
        <span class="kpi-icon">✅</span>
        <small>Approved Requests</small>
        <h3>${approvedRequests}</h3>
        <p>Ready for delivery</p>
      </div>

      <div class="kpi-card emerald">
        <span class="kpi-icon">🚚</span>
        <small>Out for Delivery</small>
        <h3>${outForDelivery}</h3>
        <p>Currently delivering</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">📦</span>
        <small>Received</small>
        <h3>${receivedRequests}</h3>
        <p>Confirmed by staff</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Materials Data</p>
            <h3>Delivered, Released, and Remaining Materials</h3>
          </div>
        </div>
        <canvas id="materialChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Equipment Data</p>
            <h3>Equipment Status</h3>
          </div>
        </div>
        <canvas id="equipmentChart"></canvas>
      </div>
    </section>
        <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Monthly Trend</p>
            <h3>Monthly Material Movement</h3>
          </div>
        </div>
        <canvas id="monthlyMaterialChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Usage Analytics</p>
            <h3>Top Used Materials</h3>
          </div>
        </div>
        <canvas id="topUsedMaterialsChart"></canvas>
      </div>
    </section>
  
  `;

  setTimeout(() => {
    new Chart(document.getElementById("materialChart"), {
      type: "bar",

      data: {
        labels: ["Delivered", "Used", "Remaining"],

        datasets: [
          {
            label: "Delivered Materials",
            data: [totalDelivered],
            backgroundColor: "#2563eb",
            borderRadius: 16,
          },

          {
            label: "Used Materials",
            data: [null, totalUsed],
            backgroundColor: "#f97316",
            borderRadius: 16,
          },

          {
            label: "Remaining Stock",
            data: [null, null, totalWarehouseStock],
            backgroundColor: "#16a34a",
            borderRadius: 16,
          },

          {
            type: "line",
            label: "Inventory Flow",
            data: [totalDelivered, totalUsed, totalWarehouseStock],
            borderColor: "#c87919",
            backgroundColor: "rgba(200,121,25,0.15)",
            fill: true,
            tension: 0.45,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 4,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: "bottom",
          },
        },

        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    new Chart(document.getElementById("equipmentChart"), {
      type: "doughnut",
      data: {
        labels: ["Available", "Borrowed", "Maintenance/Damaged"],
        datasets: [
          {
            data: [
              availableEquipmentQty,
              borrowedEquipmentQty,
              maintenanceEquipmentQty,
            ],
            backgroundColor: ["#16a34a", "#2563eb", "#f97316"],
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
  }, 100);
  new Chart(document.getElementById("monthlyMaterialChart"), {
    type: "line",
    data: {
      labels: monthlyLabels,
      datasets: [
        {
          label: "Delivered",
          data: monthlyDelivered,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.12)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
        {
          label: "Used",
          data: monthlyUsed,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.12)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  new Chart(document.getElementById("topUsedMaterialsChart"), {
    type: "bar",
    data: {
      labels: topUsedLabels,
      datasets: [
        {
          label: "Used Quantity",
          data: topUsedValues,
          backgroundColor: "#c87919",
          borderRadius: 12,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true },
      },
    },
  });
}

async function loadNotifications() {
  try {
    const notifications = await api("/api/notifications");

    const unread = notifications.filter((n) => !n.isRead).length;

    const bell = document.querySelector("#notificationBell");
    if (bell) {
      bell.innerHTML = `
        🔔
        ${unread > 0 ? `<span class="notif-count">${unread}</span>` : ""}
      `;
    }

    const list = document.querySelector("#notificationList");
    if (!list) return;

    list.innerHTML =
      notifications.length === 0
        ? `<p class="empty-notif">No notifications</p>`
        : notifications
            .map(
              (n) => `
    <div class="notif-item ${n.isRead ? "" : "unread"}">
      <div class="notif-top">
        <strong>${n.title}</strong>
        <button class="notif-delete" onclick="deleteNotification('${n._id}')">
          ×
        </button>
      </div>
      <p>${n.message}</p>
      <small>${dateTime(n.createdAt)}</small>
    </div>
  `,
            )
            .join("");
  } catch (error) {
    console.error("Notification error:", error.message);
  }
}

function toggleNotifications() {
  document.querySelector("#notificationDropdown")?.classList.toggle("show");
}

async function markNotificationsRead() {
  try {
    await api("/api/notifications/read", {
      method: "PUT",
    });

    loadNotifications();
  } catch (error) {
    console.error(error.message);
  }
}

async function clientDashboard() {
  layout("Client Project Portal");

  const projects = await api("/api/projects");
  const tasks = await api("/api/tasks");
  const reports = await api("/api/reports").catch(() => []);
  const materials = await api("/api/materials").catch(() => []);

  const project = projects[0];

  if (!project) {
    qs("#content").innerHTML = `
      <section class="panel">
        <h3>No Project Assigned</h3>
        <p class="empty-state">
          No project has been linked to your client account yet.
        </p>
      </section>
    `;
    return;
  }

  const projectTasks = tasks.filter(
    (t) => String(t.project?._id || t.project) === String(project._id),
  );

  const projectReports = reports.filter(
    (r) => String(r.project?._id || r.project) === String(project._id),
  );

  const projectMaterials = materials.filter(
    (m) => String(m.project?._id || m.project) === String(project._id),
  );

  const doneTasks = projectTasks.filter((t) => t.status === "Done").length;
  const delayedTasks = projectTasks.filter(
    (t) =>
      t.status === "Delayed" ||
      (t.status !== "Done" && new Date(t.dueDate) < new Date()),
  ).length;

  qs("#content").innerHTML = `
    <section class="staff-hero">
      <div>
        <p class="eyebrow">Client Project Portal</p>
        <h2>${project.name}</h2>
        <p>${project.clientName || "Client"} • ${project.location || "No location"}</p>

        <div class="staff-project-meta">
          <span>Status: <b>${project.status}</b></span>
          <span>Progress: <b>${project.progress || 0}%</b></span>
          <span>Target: <b>${date(project.targetCompletionDate)}</b></span>
        </div>
      </div>

      <div class="staff-progress-card">
        <span>${project.progress || 0}%</span>
        <p>Project Completion</p>
        <div class="progress large">
          <span style="width:${percent(project.progress)}%"></span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">✅</span>
        <small>Completed Tasks</small>
        <h3>${doneTasks}</h3>
        <p>Finished work items</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">📋</span>
        <small>Total Tasks</small>
        <h3>${projectTasks.length}</h3>
        <p>Project work breakdown</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">⚠️</span>
        <small>Delayed Tasks</small>
        <h3>${delayedTasks}</h3>
        <p>Needs attention</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">📝</span>
        <small>Daily Reports</small>
        <h3>${projectReports.length}</h3>
        <p>Site activity records</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Timeline</p>
            <h3>Project Tasks</h3>
          </div>
        </div>

        <div class="staff-timeline">
          ${
            projectTasks.length
              ? projectTasks
                  .map(
                    (t) => `
                    <div class="timeline-item">
                      <div class="timeline-dot ${statusClass(t.status)}"></div>
                      <div>
                        <b>${t.title}</b>
                        <p>${date(t.startDate)} → ${date(t.dueDate)}</p>
                        <small>${t.status}</small>
                      </div>
                    </div>
                  `,
                  )
                  .join("")
              : `<div class="empty-state">No tasks added yet.</div>`
          }
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Materials</p>
            <h3>Delivered Materials</h3>
          </div>
        </div>

        <div class="staff-material-list">
          ${
            projectMaterials.length
              ? projectMaterials
                  .map((m) => {
                    const remaining =
                      Number(m.quantityDelivered || 0) -
                      Number(m.quantityUsed || 0);

                    return `
                      <div class="staff-material-card">
                        <div>
                          <h4>${m.materialName}</h4>
                          <p>
                            Delivered: ${m.quantityDelivered || 0} ${m.unit || ""}
                            • Used: ${m.quantityUsed || 0} ${m.unit || ""}
                          </p>
                        </div>

                        <span class="${remaining <= 5 ? "material-low" : "material-ok"}">
                          ${remaining} ${m.unit || ""} left
                        </span>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state">No project materials delivered yet.</div>`
          }
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Site Documentation</p>
          <h3>Recent Site Photos</h3>
        </div>
      </div>

      <div class="report-photo-gallery">
        ${
          projectReports.flatMap((r) => r.photos || []).length
            ? projectReports
                .flatMap((r) => r.photos || [])
                .slice(0, 12)
                .map((p) => `<img src="${p.url || p}">`)
                .join("")
            : `<p class="empty-state">No site photos uploaded yet.</p>`
        }
      </div>
    </section>
  `;
}

async function deleteNotification(id) {
  try {
    if (!id) {
      alert("Notification ID missing.");
      return;
    }

    if (!confirm("Delete this notification?")) return;

    await api(`/api/notifications/${id}`, {
      method: "DELETE",
    });

    await loadNotifications();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteAllNotifications() {
  try {
    if (!confirm("Delete all notifications?")) return;

    await api("/api/notifications/delete-all", {
      method: "DELETE",
    });

    await loadNotifications();
  } catch (error) {
    alert(error.message);
  }
}

async function tasksPage() {
  layout("Project Tasks");

  const projects = await api("/api/projects/my-projects");
  const users = await api("/api/auth/users").catch(() => []);
  const workers = await api("/api/workers").catch(() => []);

  const selectedProject =
    localStorage.getItem("selectedTaskProject") || projects?.[0]?._id || "";

  const tasks = await api(
    selectedProject ? `/api/tasks?project=${selectedProject}` : "/api/tasks",
  );

  window.tasksData = tasks;

  window.taskProjectOptions = projects
    .map(
      (p) => `
      <option 
        value="${p._id}"
        ${selectedProject === p._id ? "selected" : ""}
      >
        ${p.name}
      </option>
    `,
    )
    .join("");

  window.taskWorkerOptions = workers
    .filter(
      (w) =>
        String(w.assignedProject?._id || w.assignedProject) ===
        String(selectedProject),
    )
    .map(
      (w) => `<option value="${w._id}">${w.fullName} - ${w.position}</option>`,
    )
    .join("");

  window.taskStaffOptions = users
    .filter((u) => u.role === "staff")
    .map((u) => `<option value="${u._id}">${u.name}</option>`)
    .join("");

  qs("#content").innerHTML = `
    <div class="panel">
      <div class="form-grid">

        <div>
          <label>Select Project</label>
          <select onchange="changeTaskProject(this.value)">
            ${window.taskProjectOptions}
          </select>
        </div>

        <div>
          <label>Search Task</label>
          <input
            id="taskSearch"
            placeholder="Search task..."
            oninput="filterTasks()"
          >
        </div>

      </div>
    </div>

    <br>

    ${
      user.role === "admin"
        ? `
          <button class="btn" onclick="taskForm()">
            Add Task
          </button>
          <br><br>
        `
        : ""
    }

    <div id="tasksTable"></div>
  `;

  renderTasksTable(tasks);
}

function changeTaskProject(projectId) {
  localStorage.setItem("selectedTaskProject", projectId);

  tasksPage();
}

function renderTasksTable(rows) {
  qs("#tasksTable").innerHTML = table(
    rows.map((t) => {
      const confirmations = t.workerConfirmations || [];
      const totalWorkers = confirmations.length;
      const submittedWorkers = confirmations.filter(
        (c) => c.status === "Submitted",
      ).length;

      const verifiedWorkers = confirmations.filter(
        (c) => c.status === "Verified",
      ).length;

      const computedWorkerStatus =
        totalWorkers > 0
          ? verifiedWorkers === totalWorkers
            ? "Verified"
            : submittedWorkers > 0
              ? `${submittedWorkers}/${totalWorkers} Submitted`
              : `${verifiedWorkers}/${totalWorkers} Verified`
          : t.workerStatus || "-";

      return {
        ...t,
        actions: `
          ${
            user.role === "admin"
              ? `
                <button class="btn" onclick='taskForm(${JSON.stringify(t)})'>
                  Edit
                </button>
                <button class="btn danger" onclick="del('/api/tasks','${t._id}')">
                  Delete
                </button>
              `
              : ""
          }

          ${
            user.role === "staff"
              ? `
                <button class="btn" onclick='assignWorkerForm(${JSON.stringify(t)})'>
                  Assign Worker
                </button>

                <button class="btn success" onclick='taskStatusForm(${JSON.stringify(t)})'>
                  Update Status
                </button>
                <button class="btn warning" onclick='verifyWorkerForm(${JSON.stringify(t)})'>
  Verify Worker Work
</button>
              `
              : ""
          }
        `,
        computedWorkerStatus,
      };
    }),
    [
      { label: "Project", render: (t) => t.project?.name || "" },
      { label: "Task", key: "title" },
      { label: "Assigned To", render: (t) => t.assignedTo?.name || "-" },

      {
        label: "Workers",
        render: (t) =>
          t.assignedWorkers?.length
            ? t.assignedWorkers.map((w) => w.fullName || w).join(", ")
            : "-",
      },

      {
        label: "Worker Status",
        render: (t) => t.computedWorkerStatus || t.workerStatus || "-",
      },

      { label: "Start", render: (t) => date(t.startDate) },
      { label: "Due", render: (t) => date(t.dueDate) },
      { label: "Priority", key: "priority" },
      { label: "Status", key: "status" },
      { label: "Remarks", key: "remarks" },
    ],
  );
}

function taskForm(t = {}) {
  modal(`
    <h3>${t._id ? "Edit" : "Add"} Task</h3>

    <form onsubmit="saveTask(event, '${t._id || ""}')">
      <label>Project</label>
      <select name="project" required>
        ${window.taskProjectOptions || ""}
      </select>

      <label>Task Title</label>
      <input name="title" value="${t.title || ""}" placeholder="Task title" required>

      <label>Description</label>
      <textarea name="description" placeholder="Task description">${t.description || ""}</textarea>

      <div class="form-grid">
        <div>
          <label>Assigned Staff</label>
          <select name="assignedTo">
            <option value="">Unassigned</option>
            ${window.taskStaffOptions || ""}
          </select>
        </div>

        <div>
          <label>Start Date</label>
          <input name="startDate" type="date" value="${date(t.startDate)}" required>
        </div>

        <div>
          <label>Due Date</label>
          <input name="dueDate" type="date" value="${date(t.dueDate)}" required>
        </div>

        <div>
          <label>Priority</label>
          <select name="priority">
            <option ${t.priority === "Low" ? "selected" : ""}>Low</option>
            <option ${t.priority === "Medium" ? "selected" : ""}>Medium</option>
            <option ${t.priority === "High" ? "selected" : ""}>High</option>
            <option ${t.priority === "Critical" ? "selected" : ""}>Critical</option>
          </select>
        </div>

        <div>
          <label>Status</label>
          <select name="status">
            <option ${t.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${t.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
            <option ${t.status === "Done" ? "selected" : ""}>Done</option>
            <option ${t.status === "Delayed" ? "selected" : ""}>Delayed</option>
          </select>
        </div>
      </div>

      <label>Remarks</label>
      <textarea name="remarks" placeholder="Remarks">${t.remarks || ""}</textarea>

      <button class="btn">Save Task</button>
    </form>
  `);

  setTimeout(() => {
    const form = document.querySelector("#appModal form");

    if (form && t.project?._id) {
      form.project.value = t.project._id;
    }

    if (form && t.assignedTo?._id) {
      form.assignedTo.value = t.assignedTo._id;
    }
  }, 50);
}

function taskStatusForm(t = {}) {
  modal(`
    <h3>Update Task Status</h3>

    <form onsubmit="saveTask(event, '${t._id}')">
      <label>Task</label>
      <input name="title" value="${t.title || ""}" readonly>

      <input type="hidden" name="project" value="${t.project?._id || t.project}">
      <input type="hidden" name="assignedTo" value="${t.assignedTo?._id || t.assignedTo}">
      <input type="hidden" name="startDate" value="${date(t.startDate)}">
      <input type="hidden" name="dueDate" value="${date(t.dueDate)}">
      <input type="hidden" name="priority" value="${t.priority || "Medium"}">

      <label>Status</label>
      <select name="status">
        <option ${t.status === "Pending" ? "selected" : ""}>Pending</option>
        <option ${t.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
        <option ${t.status === "Done" ? "selected" : ""}>Done</option>
        <option ${t.status === "Delayed" ? "selected" : ""}>Delayed</option>
      </select>

      <label>Remarks</label>
      <textarea name="remarks">${t.remarks || ""}</textarea>

      <button class="btn success">Update Task</button>
    </form>
  `);
}

function assignWorkerForm(t = {}) {
  modal(`
    <h3>Assign Task to Workers</h3>

    <form onsubmit="saveAssignedWorker(event, '${t._id}')">
      <label>Task</label>
      <input value="${t.title || ""}" readonly>

      <label>Workers</label>
      <select name="assignedWorkers" multiple required size="6">
        ${window.taskWorkerOptions || ""}
      </select>

      <small>Hold CTRL to select multiple workers.</small>

      <br><br>

      <button class="btn success">Assign Workers</button>
    </form>
  `);
}

function verifyWorkerForm(t = {}) {
  const submittedWorkers = (t.workerConfirmations || [])
    .filter((c) => c.status === "Submitted")
    .map((c) => {
      const worker = (t.assignedWorkers || []).find((w) => {
        return String(w._id || w) === String(c.worker?._id || c.worker);
      });

      return `
        <option value="${c.worker?._id || c.worker}">
          ${worker?.fullName || "Worker"} - Submitted
        </option>
      `;
    })
    .join("");

  if (!submittedWorkers) {
    alert("No submitted worker work for verification.");
    return;
  }

  modal(`
    <h3>Verify Worker Work</h3>

    <form onsubmit="saveWorkerVerification(event, '${t._id}')">
      <label>Task</label>
      <input value="${t.title || ""}" readonly>

      <label>Submitted Worker</label>
      <select name="workerId" required>
        ${submittedWorkers}
      </select>

      <div class="form-grid">
        <input name="plannedOutput" type="number" min="0" step="0.01" placeholder="Planned Output" required>
        <input name="actualOutput" type="number" min="0" step="0.01" placeholder="Actual Output" required>
        <input name="unit" placeholder="Unit e.g. sqm, m3, task" value="task" required>
      </div>

      <label>Verification Remarks</label>
      <textarea name="remarks" placeholder="Example: Checked and completed properly."></textarea>

      <button class="btn success">Confirm & Record Productivity</button>
    </form>
  `);
}

async function saveWorkerVerification(e, taskId) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  await api(`/api/tasks/${taskId}/verify-worker`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  alert(
    "Work verified. Productivity will be recorded once all workers are verified.",
  );
  location.reload();
}

async function saveAssignedWorker(e, taskId) {
  e.preventDefault();

  const fd = new FormData(e.target);

  const data = {
    assignedWorkers: fd.getAll("assignedWorkers"),
  };

  await api(`/api/tasks/${taskId}/assign-worker`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  alert("Task assigned to workers.");
  location.reload();
}

async function saveTask(e, id = "") {
  e.preventDefault();

  try {
    const data = Object.fromEntries(new FormData(e.target));

    if (!data.assignedTo) {
      data.assignedTo = null;
    }

    await api("/api/tasks" + (id ? `/${id}` : ""), {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });

    alert("Task saved successfully.");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

function filterTasks() {
  const keyword = qs("#taskSearch").value.toLowerCase();

  const filtered = (window.tasksData || []).filter((t) => {
    return (
      (t.title || "").toLowerCase().includes(keyword) ||
      (t.project?.name || "").toLowerCase().includes(keyword) ||
      (t.assignedTo?.name || "").toLowerCase().includes(keyword) ||
      (t.status || "").toLowerCase().includes(keyword) ||
      (t.priority || "").toLowerCase().includes(keyword)
    );
  });

  renderTasksTable(filtered);
}

if (page === "expense-requests.html") expenseRequestsPage();

async function expenseRequestsPage() {
  layout("Expense Requests");

  const projects = await api("/api/projects/my-projects");
  const selectedProject =
    localStorage.getItem("selectedExpenseRequestProject") ||
    projects?.[0]?._id ||
    "";

  const rows = await api(
    selectedProject
      ? `/api/expense-requests?project=${selectedProject}`
      : "/api/expense-requests",
  );

  const budgetSummary = selectedProject
    ? await api(`/api/expense-requests/budget-summary/${selectedProject}`)
    : null;

  window.expenseRequestsData = rows;

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  qs("#content").innerHTML = `
    <div class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select onchange="changeExpenseRequestProject(this.value)">
            ${projectOptions}
          </select>
        </div>

        <div>
  <label>Search</label>
  <input
    id="expenseRequestSearch"
    placeholder="Search description, category, status..."
    oninput="filterExpenseRequests()"
  >
</div>

<div>
  <label>Status</label>
  <select id="expenseRequestStatusFilter" onchange="filterExpenseRequests()">
    <option value="">All Status</option>
    <option value="Pending">Pending</option>
    <option value="Approved">Approved</option>
    <option value="Rejected">Rejected</option>
    <option value="Paid">Paid</option>
  </select>
</div>

<div>
  <label>Category</label>
  <select id="expenseRequestCategoryFilter" onchange="filterExpenseRequests()">
    <option value="">All Category</option>
    <option value="Labor">Labor</option>
    <option value="Materials">Materials</option>
    <option value="Equipment">Equipment</option>
    <option value="Fuel">Fuel</option>
    <option value="Permit">Permit</option>
    <option value="Other">Other</option>
  </select>
</div>

<div>
  <label>From Date</label>
  <input id="expenseRequestFromDate" type="date" onchange="filterExpenseRequests()">
</div>

<div>
  <label>To Date</label>
  <input id="expenseRequestToDate" type="date" onchange="filterExpenseRequests()">
</div>
<br>
<button class="btn secondary" onclick="clearExpenseRequestFilters()">
  Clear Filters
</button>
      </div>

      ${
        user.role === "staff"
          ? `
            <br>
            <button class="btn" onclick="expenseRequestForm()">
              Request Expense
            </button>
          `
          : ""
      }
      <br>
<button class="btn secondary" onclick="downloadExpenseRequestsExcel()">
  Download Excel
</button>
    </div>

    <br>

${
  budgetSummary
    ? `
      <section class="kpi-grid">
        <div class="kpi-card blue">
          <span class="kpi-icon">💰</span>
          <small>Project Budget</small>
          <h3>${money(budgetSummary.budget)}</h3>
          <p>Approved project budget</p>
        </div>

        <div class="kpi-card orange">
          <span class="kpi-icon">📉</span>
          <small>Spent</small>
          <h3>${money(budgetSummary.spent)}</h3>
          <p>Approved/Paid expenses</p>
        </div>

        <div class="kpi-card emerald">
          <span class="kpi-icon">🧾</span>
          <small>Pending Requests</small>
          <h3>${money(budgetSummary.pending)}</h3>
          <p>Waiting for approval</p>
        </div>

        <div class="kpi-card red">
          <span class="kpi-icon">📊</span>
          <small>Remaining</small>
          <h3>${money(budgetSummary.remaining)}</h3>
          <p>${budgetSummary.usage}% used • ${budgetSummary.status}</p>
        </div>
      </section>

      <br>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Budget Usage</p>
            <h3>${budgetSummary.status}</h3>
          </div>
          <span class="badge">${budgetSummary.usage}% Used</span>
        </div>

        <div class="progress large">
          <span style="width:${percent(budgetSummary.usage)}%"></span>
        </div>
      </section>

      <br>
    `
    : ""
}

<div id="expenseRequestsTable"></div>
  `;

  renderExpenseRequestsTable(rows);
}

function changeExpenseRequestProject(projectId) {
  localStorage.setItem("selectedExpenseRequestProject", projectId);
  expenseRequestsPage();
}

function renderExpenseRequestsTable(rows) {
  qs("#expenseRequestsTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: `
      <button class="btn secondary" onclick="viewExpenseRequestTimeline('${r._id}')">
  Timeline
</button>
        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Pending"
            ? `
              <button class="btn success" onclick="approveExpenseRequest('${r._id}')">
                Approve
              </button>

              <button class="btn danger" onclick="rejectExpenseRequest('${r._id}')">
                Reject
              </button>
            `
            : ""
        }

        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Approved"
            ? `
              <button class="btn success" onclick="markExpenseRequestPaid('${r._id}')">
                Mark Paid
              </button>
            `
            : ""
        }
      `,
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Category", key: "category" },
      { label: "Description", key: "description" },
      { label: "Amount", render: (r) => money(r.amount) },
      { label: "Reason", key: "reason" },
      {
        label: "Proof",
        render: (r) =>
          r.receipt
            ? `<a class="btn secondary" href="${r.receipt}" target="_blank">View</a>`
            : "-",
      },
      {
        label: "Status",
        render: (r) =>
          `<span class="status-badge ${statusClass(r.status)}">${r.status}</span>`,
      },
      { label: "Admin Remarks", key: "adminRemarks" },
      { label: "Requested By", render: (r) => r.requestedBy?.name || "-" },
      { label: "Reviewed By", render: (r) => r.reviewedBy?.name || "-" },
      { label: "Requested Date", render: (r) => dateTime(r.createdAt) },
      { label: "Reviewed Date", render: (r) => dateTime(r.reviewedAt) },
    ],
  );
}

function viewExpenseRequestTimeline(id) {
  const request = window.expenseRequestsData?.find((r) => r._id === id);

  if (!request) {
    alert("Expense request not found.");
    return;
  }

  const submittedStep = `
    <div class="timeline-card done">
      <div class="timeline-dot done"></div>
      <div>
        <h4>Submitted</h4>
        <p>
          ${request.requestedBy?.name || "Staff"} submitted an expense request
          worth ${money(request.amount)} for ${request.category}.
        </p>
        <small>${dateTime(request.createdAt)}</small>
      </div>
    </div>
  `;

  let reviewStep = `
    <div class="timeline-card pending">
      <div class="timeline-dot pending"></div>
      <div>
        <h4>Pending Review</h4>
        <p>Waiting for admin review.</p>
        <small>Not yet reviewed</small>
      </div>
    </div>
  `;

  if (request.status === "Approved" || request.status === "Paid") {
    reviewStep = `
      <div class="timeline-card done">
        <div class="timeline-dot done"></div>
        <div>
          <h4>Approved</h4>
          <p>
            Approved by ${request.reviewedBy?.name || "Admin"}.
            ${request.adminRemarks ? `Remarks: ${request.adminRemarks}` : ""}
          </p>
          <small>${dateTime(request.reviewedAt)}</small>
        </div>
      </div>
    `;
  }

  if (request.status === "Rejected") {
    reviewStep = `
      <div class="timeline-card rejected">
        <div class="timeline-dot rejected"></div>
        <div>
          <h4>Rejected</h4>
          <p>
            Rejected by ${request.reviewedBy?.name || "Admin"}.
            ${request.adminRemarks ? `Remarks: ${request.adminRemarks}` : ""}
          </p>
          <small>${dateTime(request.reviewedAt)}</small>
        </div>
      </div>
    `;
  }

  let paidStep = "";

  if (request.status === "Approved") {
    paidStep = `
      <div class="timeline-card pending">
        <div class="timeline-dot pending"></div>
        <div>
          <h4>Payment Pending</h4>
          <p>Expense was approved but not yet marked as paid.</p>
          <small>Waiting for payment confirmation</small>
        </div>
      </div>
    `;
  }

  if (request.status === "Paid") {
    paidStep = `
      <div class="timeline-card done">
        <div class="timeline-dot done"></div>
        <div>
          <h4>Paid</h4>
          <p>
            This expense request has been marked as paid.
            ${request.adminRemarks ? `Remarks: ${request.adminRemarks}` : ""}
          </p>
          <small>${dateTime(request.reviewedAt)}</small>
        </div>
      </div>
    `;
  }

  modal(`
    <div class="report-modal-header">
      <div>
        <p class="eyebrow">Expense Request Workflow</p>
        <h2>${request.description}</h2>
        <p>
          ${request.project?.name || "No project"} • ${request.category}
          • ${money(request.amount)}
        </p>
      </div>

      <span class="status-badge ${statusClass(request.status)}">
        ${request.status}
      </span>
    </div>

    <div class="report-view-grid">
      <div>
        <b>Project</b>
        <p>${request.project?.name || "-"}</p>
      </div>

      <div>
        <b>Requested By</b>
        <p>${request.requestedBy?.name || "-"}</p>
      </div>

      <div>
        <b>Amount</b>
        <p>${money(request.amount)}</p>
      </div>

      <div>
        <b>Status</b>
        <p>${request.status}</p>
      </div>

      <div>
        <b>Reason</b>
        <p>${request.reason || "No reason provided."}</p>
      </div>

      <div>
        <b>Proof</b>
        <p>
          ${
            request.receipt
              ? `<a class="btn secondary" href="${request.receipt}" target="_blank">View Proof</a>`
              : "No proof uploaded."
          }
        </p>
      </div>
    </div>

    <div class="expense-timeline">
      ${submittedStep}
      ${reviewStep}
      ${paidStep}
    </div>
  `);
}

async function approveExpenseRequest(id) {
  const adminRemarks = prompt("Optional remarks before approving:", "Approved");

  if (adminRemarks === null) return;

  if (
    !confirm(
      "Approve this expense request? This will create an official expense record.",
    )
  ) {
    return;
  }

  await api(`/api/expense-requests/${id}/approve`, {
    method: "PUT",
    body: JSON.stringify({ adminRemarks }),
  });

  alert("Expense request approved and recorded.");
  location.reload();
}

async function markExpenseRequestPaid(id) {
  const adminRemarks = prompt("Optional payment remarks:", "Paid");

  if (adminRemarks === null) return;

  if (!confirm("Mark this expense request as paid?")) {
    return;
  }

  await api(`/api/expense-requests/${id}/paid`, {
    method: "PUT",
    body: JSON.stringify({ adminRemarks }),
  });

  alert("Expense request marked as paid.");
  location.reload();
}

async function rejectExpenseRequest(id) {
  const adminRemarks = prompt("Reason for rejection:", "Rejected");

  if (!adminRemarks) {
    alert("Rejection reason is required.");
    return;
  }

  if (!confirm("Reject this expense request?")) {
    return;
  }

  await api(`/api/expense-requests/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ adminRemarks }),
  });

  alert("Expense request rejected.");
  location.reload();
}

function filterExpenseRequests() {
  const keyword = qs("#expenseRequestSearch")?.value.toLowerCase() || "";
  const status = qs("#expenseRequestStatusFilter")?.value || "";
  const category = qs("#expenseRequestCategoryFilter")?.value || "";
  const fromDate = qs("#expenseRequestFromDate")?.value || "";
  const toDate = qs("#expenseRequestToDate")?.value || "";

  const filtered = (window.expenseRequestsData || []).filter((r) => {
    const createdDate = date(r.createdAt);

    const matchesKeyword =
      !keyword ||
      (r.project?.name || "").toLowerCase().includes(keyword) ||
      (r.category || "").toLowerCase().includes(keyword) ||
      (r.description || "").toLowerCase().includes(keyword) ||
      (r.reason || "").toLowerCase().includes(keyword) ||
      (r.status || "").toLowerCase().includes(keyword) ||
      (r.requestedBy?.name || "").toLowerCase().includes(keyword);

    const matchesStatus = !status || r.status === status;
    const matchesCategory = !category || r.category === category;
    const matchesFrom = !fromDate || createdDate >= fromDate;
    const matchesTo = !toDate || createdDate <= toDate;

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesCategory &&
      matchesFrom &&
      matchesTo
    );
  });

  renderExpenseRequestsTable(filtered);
}

function clearExpenseRequestFilters() {
  qs("#expenseRequestSearch").value = "";
  qs("#expenseRequestStatusFilter").value = "";
  qs("#expenseRequestCategoryFilter").value = "";
  qs("#expenseRequestFromDate").value = "";
  qs("#expenseRequestToDate").value = "";

  renderExpenseRequestsTable(window.expenseRequestsData || []);
}

function expenseRequestForm() {
  const projectOptions = document.querySelector("select")?.innerHTML || "";

  modal(`
    <h3>Request Expense</h3>

    <form onsubmit="saveExpenseRequest(event)" enctype="multipart/form-data">
      <label>Project</label>
      <select name="project" required>
        ${projectOptions}
      </select>

      <label>Category</label>
      <select name="category" required>
        <option>Labor</option>
        <option>Materials</option>
        <option>Equipment</option>
        <option>Fuel</option>
        <option>Permit</option>
        <option>Other</option>
      </select>

      <label>Description</label>
      <input
        name="description"
        placeholder="Example: Cement purchase / labor allowance"
        required
      >

      <label>Amount</label>
      <input
        name="amount"
        type="number"
        min="1"
        placeholder="Requested amount"
        required
      >

      <label>Reason</label>
      <textarea
        name="reason"
        placeholder="Explain why this expense is needed"
      ></textarea>

      <label>Receipt / Proof</label>
      <input
        name="receipt"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
      >

      <button class="btn">Submit Request</button>
    </form>
  `);
}

async function saveExpenseRequest(e) {
  e.preventDefault();

  const form = e.target;
  const fd = new FormData(form);

  try {
    const res = await fetch("/api/expense-requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "Failed to submit expense request.",
      }));

      throw new Error(error.message);
    }

    alert("Expense request submitted.");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

async function downloadExpenseRequestsExcel() {
  try {
    const params = new URLSearchParams();

    const projectId =
      localStorage.getItem("selectedExpenseRequestProject") || "";

    const status = qs("#expenseRequestStatusFilter")?.value || "";
    const category = qs("#expenseRequestCategoryFilter")?.value || "";
    const from = qs("#expenseRequestFromDate")?.value || "";
    const to = qs("#expenseRequestToDate")?.value || "";

    if (projectId) params.append("project", projectId);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const query = params.toString();

    const url = query
      ? `/api/export/expense-requests-excel?${query}`
      : "/api/export/expense-requests-excel";

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        message: "Failed to download Excel file.",
      }));

      throw new Error(error.message);
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "expense-requests.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    alert(error.message);
  }
}

async function expenseAnalyticsPage() {
  if (user.role !== "admin") {
    alert("Access denied.");
    location.href = "/dashboard.html";
    return;
  }

  layout("Expense Analytics");
  layout("Expense Analytics");

  const projects = await api("/api/projects/my-projects").catch(() => []);

  const selectedProject =
    localStorage.getItem("selectedExpenseAnalyticsProject") ||
    projects?.[0]?._id ||
    "";

  const analytics = await api(
    selectedProject
      ? `/api/expense-requests/analytics/summary?project=${selectedProject}`
      : "/api/expense-requests/analytics/summary",
  );

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select onchange="changeExpenseAnalyticsProject(this.value)">
            ${projectOptions}
          </select>
        </div>
      </div>
    </section>

    <br>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">💰</span>
        <small>Approved Expenses</small>
        <h3>${money(analytics.totalApproved)}</h3>
        <p>Total approved/paid cost</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">✅</span>
        <small>Paid Expenses</small>
        <h3>${money(analytics.totalPaid)}</h3>
        <p>Released/settled amount</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">🧾</span>
        <small>Pending Requests</small>
        <h3>${money(analytics.totalPending)}</h3>
        <p>Waiting for approval</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">📊</span>
        <small>Budget Used</small>
        <h3>${analytics.usage || 0}%</h3>
        <p>${money(analytics.remainingBudget)} remaining</p>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Category Breakdown</p>
            <h3>Expense by Category</h3>
          </div>
        </div>
        <canvas id="expenseCategoryChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Request Status</p>
            <h3>Pending / Approved / Paid / Rejected</h3>
          </div>
        </div>
        <canvas id="expenseStatusChart"></canvas>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Monthly Trend</p>
            <h3>Approved Expense Trend</h3>
          </div>
        </div>
        <canvas id="expenseMonthlyChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Project Comparison</p>
            <h3>Expense by Project</h3>
          </div>
        </div>
        <canvas id="expenseProjectChart"></canvas>
      </div>
    </section>
  `;

  setTimeout(() => {
    new Chart(document.getElementById("expenseCategoryChart"), {
      type: "doughnut",
      data: {
        labels: analytics.byCategory.map((x) => x.name),
        datasets: [
          {
            data: analytics.byCategory.map((x) => x.value),
            backgroundColor: [
              "#2563eb",
              "#f97316",
              "#16a34a",
              "#dc2626",
              "#7c3aed",
              "#c87919",
            ],
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    new Chart(document.getElementById("expenseStatusChart"), {
      type: "doughnut",
      data: {
        labels: analytics.byStatus.map((x) => x.name),
        datasets: [
          {
            data: analytics.byStatus.map((x) => x.value),
            backgroundColor: ["#f97316", "#2563eb", "#16a34a", "#dc2626"],
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    new Chart(document.getElementById("expenseMonthlyChart"), {
      type: "line",
      data: {
        labels: analytics.monthly.map((x) => x.name),
        datasets: [
          {
            label: "Approved Expenses",
            data: analytics.monthly.map((x) => x.value),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.12)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    new Chart(document.getElementById("expenseProjectChart"), {
      type: "bar",
      data: {
        labels: analytics.byProject.map((x) => x.name),
        datasets: [
          {
            label: "Expenses",
            data: analytics.byProject.map((x) => x.value),
            backgroundColor: "#c87919",
            borderRadius: 10,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true },
        },
      },
    });
  }, 100);
}

function changeExpenseAnalyticsProject(projectId) {
  localStorage.setItem("selectedExpenseAnalyticsProject", projectId);
  expenseAnalyticsPage();
}

async function workersPage() {
  layout("Worker Master List");

  const workers = await api("/api/workers");
  const projects = await api("/api/projects/my-projects");

  window.workersData = workers;
  window.workerProjectOptions = projects
    .map((p) => `<option value="${p._id}">${p.name}</option>`)
    .join("");

  qs("#content").innerHTML = `
    ${
      ["admin", "inventory"].includes(user.role)
        ? `<button class="btn" onclick="workerForm()">Add Worker</button><br><br>`
        : ""
    }

    <section class="panel">
      <input id="workerSearch" placeholder="Search worker..." oninput="filterWorkers()">
    </section>

    <br>

    <div id="workersTable"></div>
  `;

  renderWorkersTable(workers);
}

function renderWorkersTable(rows) {
  qs("#workersTable").innerHTML = table(
    rows.map((w) => ({
      ...w,
      actions: ["admin", "inventory"].includes(user.role)
        ? `
          <button class="btn" onclick='workerForm(${JSON.stringify(w)})'>Edit</button>
          ${
            user.role === "admin"
              ? `<button class="btn danger" onclick="del('/api/workers','${w._id}')">Delete</button>`
              : ""
          }
        `
        : "",
    })),
    [
      { label: "Name", key: "fullName" },
      { label: "Position", key: "position" },
      { label: "Contact", key: "contactNumber" },
      { label: "Rate/Day", render: (w) => money(w.ratePerDay) },
      { label: "Status", key: "status" },
      { label: "Project", render: (w) => w.assignedProject?.name || "-" },
      { label: "Remarks", key: "remarks" },
    ],
  );
}

function filterWorkers() {
  const keyword = qs("#workerSearch").value.toLowerCase();

  const filtered = (window.workersData || []).filter((w) =>
    `${w.fullName} ${w.position} ${w.status} ${w.assignedProject?.name || ""}`
      .toLowerCase()
      .includes(keyword),
  );

  renderWorkersTable(filtered);
}

function workerForm(w = {}) {
  modal(`
    <h3>${w._id ? "Edit" : "Add"} Worker</h3>

    <form onsubmit="saveWorker(event, '${w._id || ""}')">
      <div class="form-grid">
        <input name="fullName" placeholder="Full name" value="${w.fullName || ""}" required>

        <select name="position" required>
  <option ${w.position === "Foreman" ? "selected" : ""}>Foreman</option>
  <option ${w.position === "Mason" ? "selected" : ""}>Mason</option>
  <option ${w.position === "Carpenter" ? "selected" : ""}>Carpenter</option>
  <option ${w.position === "Steelman" ? "selected" : ""}>Steelman</option>
  <option ${w.position === "Electrician" ? "selected" : ""}>Electrician</option>
  <option ${w.position === "Plumber" ? "selected" : ""}>Plumber</option>
  <option ${w.position === "Helper" ? "selected" : ""}>Helper</option>
  <option ${w.position === "Engineer" ? "selected" : ""}>Engineer</option>
  <option ${w.position === "Operator" ? "selected" : ""}>Operator</option>
</select>

        <input name="contactNumber" placeholder="Contact number" value="${w.contactNumber || ""}">

        <input name="ratePerDay" type="number" placeholder="Rate per day" value="${w.ratePerDay || 0}">

        <select name="status">
  <option ${w.status === "Available" ? "selected" : ""}>Available</option>
  <option ${w.status === "Assigned" ? "selected" : ""}>Assigned</option>
  <option ${w.status === "Inactive" ? "selected" : ""}>Inactive</option>
  <option ${w.status === "On Leave" ? "selected" : ""}>On Leave</option>
</select>

        <select name="assignedProject">
          <option value="">No project assigned</option>
          ${window.workerProjectOptions || ""}
        </select>
      </div>

      <textarea name="remarks" placeholder="Remarks">${w.remarks || ""}</textarea>

      <button class="btn">Save Worker</button>
    </form>
  `);

  setTimeout(() => {
    const form = document.querySelector("#appModal form");
    if (form && w.assignedProject?._id)
      form.assignedProject.value = w.assignedProject._id;
  }, 50);
}

async function saveWorker(e, id = "") {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  if (!data.assignedProject) data.assignedProject = null;

  if (data.status === "Assigned" && !data.assignedProject) {
    alert("Please select assigned project if worker status is Assigned.");
    return;
  }

  if (data.status === "Available") {
    data.assignedProject = null;
  }

  await api("/api/workers" + (id ? `/${id}` : ""), {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  });

  alert("Worker saved.");
  location.reload();
}

async function manpowerRequestsPage() {
  layout("Manpower Requests");

  const rows = await api("/api/manpower-requests");
  const projects = await api("/api/projects/my-projects");

  window.manpowerRequestsData = rows;
  window.manpowerRequestProjectOptions = projects
    .map((p) => `<option value="${p._id}">${p.name}</option>`)
    .join("");

  qs("#content").innerHTML = `
    ${
      user.role === "staff"
        ? `<button class="btn" onclick="manpowerRequestForm()">Request Manpower</button><br><br>`
        : ""
    }

    <section class="panel">
      <input id="manpowerRequestSearch" placeholder="Search manpower request..." oninput="filterManpowerRequests()">
    </section>

    <br>

    <div id="manpowerRequestsTable"></div>
  `;

  renderManpowerRequestsTable(rows);
}

function renderManpowerRequestsTable(rows) {
  qs("#manpowerRequestsTable").innerHTML = table(
    rows.map((r) => ({
      ...r,
      actions: `
        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Pending"
            ? `
              <button class="btn success" onclick="reviewManpowerRequest('${r._id}', 'approve')">Approve</button>
              <button class="btn danger" onclick="reviewManpowerRequest('${r._id}', 'reject')">Reject</button>
            `
            : ""
        }

        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Approved"
            ? `<button class="btn" onclick="assignWorkersForm('${r._id}')">
  Assign Workers
</button>`
            : ""
        }
        ${
          ["admin", "inventory"].includes(user.role) && r.status === "Assigned"
            ? `<button class="btn warning" onclick="unassignWorkers('${r._id}')">Unassign</button>`
            : ""
        }
      `,
    })),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Position", key: "position" },
      { label: "Qty Needed", key: "quantityNeeded" },
      {
        label: "Duration",
        render: (r) =>
          `${date(r.assignmentStartDate || r.neededDate)} → ${date(r.assignmentEndDate)}`,
      },
      { label: "Reason", key: "reason" },
      { label: "Status", key: "status" },
      { label: "Requested By", render: (r) => r.requestedBy?.name || "-" },
      { label: "Reviewed By", render: (r) => r.reviewedBy?.name || "-" },
      {
        label: "Assigned Workers",
        render: (r) =>
          r.assignedWorkers?.length
            ? r.assignedWorkers.map((w) => w.fullName || w).join(", ")
            : "-",
      },
      { label: "Admin Remarks", key: "adminRemarks" },
    ],
  );
}

async function unassignWorkers(id) {
  const adminRemarks = prompt("Reason for unassigning:", "Workers unassigned.");

  if (adminRemarks === null) return;

  if (!confirm("Unassign workers from this request?")) return;

  await api(`/api/manpower-requests/${id}/unassign`, {
    method: "PUT",
    body: JSON.stringify({ adminRemarks }),
  });

  alert("Workers unassigned successfully.");
  location.reload();
}

async function assignWorkersForm(requestId) {
  const request = window.manpowerRequestsData.find((r) => r._id === requestId);

  if (!request) {
    alert("Request not found.");
    return;
  }

  const workers = await api("/api/workers");

  const matchingWorkers = workers.filter(
    (w) =>
      w.position === request.position &&
      w.status === "Available" &&
      !w.assignedProject,
  );

  modal(`
    <h3>Assign Workers</h3>

    <p>
      Project: <b>${request.project?.name || "-"}</b><br>
      Needed: <b>${request.quantityNeeded}</b> ${request.position} worker(s)
    </p>

    <form onsubmit="saveAssignedWorkers(event, '${requestId}')">
      <div class="worker-assign-list">
        ${
          matchingWorkers.length
            ? matchingWorkers
                .map(
                  (w) => `
                    <label class="worker-assign-item">
                      <input
                        type="checkbox"
                        name="workerIds"
                        value="${w._id}"
                      >

                      <span>
                        <b>${w.fullName}</b>
                        <small>
                          ${w.position} • ${money(w.ratePerDay)} / day
                          ${
                            w.assignedProject
                              ? ` • Currently assigned to ${w.assignedProject?.name || "another project"}`
                              : " • Available"
                          }
                        </small>
                      </span>
                    </label>
                  `,
                )
                .join("")
            : `<p class="empty-state">No available ${request.position} workers found.</p>`
        }
      </div>

      <label>Admin Remarks</label>
      <textarea
        name="adminRemarks"
        placeholder="Example: Assigned selected workers to requested project."
      >Workers manually assigned.</textarea>

      <button class="btn success">
        Confirm Assignment
      </button>
    </form>
  `);
}

async function saveAssignedWorkers(e, requestId) {
  e.preventDefault();

  const fd = new FormData(e.target);

  const workerIds = fd.getAll("workerIds");

  const request = window.manpowerRequestsData.find((r) => r._id === requestId);

  if (workerIds.length !== Number(request.quantityNeeded || 0)) {
    alert(`Please select exactly ${request.quantityNeeded} worker(s).`);
    return;
  }

  await api(`/api/manpower-requests/${requestId}/mark-assigned`, {
    method: "PUT",
    body: JSON.stringify({
      workerIds,
      adminRemarks: fd.get("adminRemarks"),
    }),
  });

  alert("Workers assigned successfully.");
  location.reload();
}

function filterManpowerRequests() {
  const keyword = qs("#manpowerRequestSearch").value.toLowerCase();

  const filtered = (window.manpowerRequestsData || []).filter((r) =>
    `${r.project?.name || ""} ${r.position} ${r.status} ${r.reason}`
      .toLowerCase()
      .includes(keyword),
  );

  renderManpowerRequestsTable(filtered);
}

function manpowerRequestForm() {
  modal(`
    <h3>Request Additional Manpower</h3>

    <form onsubmit="saveManpowerRequest(event)">
      <label>Project</label>
      <select name="project" required>
        ${window.manpowerRequestProjectOptions}
      </select>

      <div class="form-grid">
        <select name="position" required>
  <option value="Foreman">Foreman</option>
  <option value="Mason">Mason</option>
  <option value="Carpenter">Carpenter</option>
  <option value="Steelman">Steelman</option>
  <option value="Electrician">Electrician</option>
  <option value="Plumber">Plumber</option>
  <option value="Helper">Helper</option>
  <option value="Engineer">Engineer</option>
  <option value="Operator">Operator</option>
</select>

        <input name="quantityNeeded" type="number" min="1" placeholder="Quantity needed" required>

        <div>
  <label>Start Date</label>
  <input name="assignmentStartDate" type="date" required>
</div>

<div>
  <label>End Date</label>
  <input name="assignmentEndDate" type="date" required>
</div>
      </div>

      <textarea name="reason" placeholder="Reason / activity, e.g. concrete pouring tomorrow"></textarea>

      <button class="btn">Submit Request</button>
    </form>
  `);
}

async function saveManpowerRequest(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  await api("/api/manpower-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Manpower request submitted.");
  location.reload();
}

async function reviewManpowerRequest(id, action) {
  const adminRemarks = prompt(
    "Admin remarks:",
    action === "approve" ? "Approved" : "Rejected",
  );

  if (adminRemarks === null) return;

  await api(`/api/manpower-requests/${id}/${action}`, {
    method: "PUT",
    body: JSON.stringify({ adminRemarks }),
  });

  alert(`Request ${action}d.`);
  location.reload();
}

async function productivityPage() {
  layout("Productivity Analytics");

  const projects = await api("/api/projects/my-projects").catch(() => []);
  let selectedProject =
    localStorage.getItem("selectedProductivityProject") || "";

  const projectExists = projects.some((p) => {
    return String(p._id) === String(selectedProject);
  });

  if (!projectExists) {
    selectedProject = projects?.[0]?._id || "";
    localStorage.setItem("selectedProductivityProject", selectedProject);
  }

  const query = selectedProject ? `?project=${selectedProject}` : "";
  const rows = await api(`/api/productivity${query}`);
  const summary = await api(`/api/productivity/summary${query}`);

  const lowRecords = rows.filter((r) => {
    const rate =
      Number(r.plannedOutput || 0) > 0
        ? Math.round(
            (Number(r.actualOutput || 0) / Number(r.plannedOutput || 0)) * 100,
          )
        : 0;

    return rate < 60;
  });

  window.productivityRows = rows;

  const groupedAlerts = groupLowProductivityAlerts(rows);
  const ranked = getWorkItemRanking(rows);
  const topRecord = ranked[0];

  const projectOptions = projects
    .map(
      (p) => `
        <option value="${p._id}" ${selectedProject === p._id ? "selected" : ""}>
          ${p.name}
        </option>
      `,
    )
    .join("");

  const averageRate = Number(summary.averageRate || 0);

  qs("#content").innerHTML = `
    <section class="panel">
      <div class="form-grid">
        <div>
          <label>Select Project</label>
          <select onchange="changeProductivityProject(this.value)">
            ${projectOptions}
          </select>
        </div>
      </div>
    </section>

    <section class="productivity-hero">
      <div class="productivity-banner">
        <p class="eyebrow">Phase 3D-B</p>
        <h2>Productivity Analytics & Performance Monitoring</h2>
        <p>
          Monitor planned output, actual output, productivity rate,
          worker performance, and low productivity alerts.
        </p>
      </div>

      <div class="productivity-summary">
        <div class="productivity-stat">
          <span>Average Productivity</span>
          <b>${averageRate}%</b>
        </div>

        <div class="productivity-stat">
          <span>Total Actual Output</span>
          <b>${summary.totalActual || 0}</b>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <div class="kpi-card blue">
        <span class="kpi-icon">📋</span>
        <small>Total Records</small>
        <h3>${summary.totalRecords || 0}</h3>
        <p>Productivity logs</p>
      </div>

      <div class="kpi-card green">
        <span class="kpi-icon">🎯</span>
        <small>Planned Output</small>
        <h3>${summary.totalPlanned || 0}</h3>
        <p>Target output</p>
      </div>

      <div class="kpi-card orange">
        <span class="kpi-icon">🏗️</span>
        <small>Actual Output</small>
        <h3>${summary.totalActual || 0}</h3>
        <p>Completed output</p>
      </div>

      <div class="kpi-card red">
        <span class="kpi-icon">⚠️</span>
        <small>Low Productivity</small>
        <h3>${lowRecords.length}</h3>
        <p>Below 60%</p>
      </div>
    </section>

    <section class="productivity-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Trend</p>
            <h3>Planned vs Actual Output</h3>
          </div>
        </div>
        <canvas id="productivityChart"></canvas>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ranking</p>
            <h3>Work Item Performance</h3>
          </div>
        </div>

        <div class="worker-rank-list">
          ${
            ranked.length
              ? ranked
                  .slice(0, 5)
                  .map((r, i) => {
                    const rate =
                      Number(r.plannedOutput || 0) > 0
                        ? Math.round(
                            (Number(r.actualOutput || 0) /
                              Number(r.plannedOutput || 0)) *
                              100,
                          )
                        : 0;

                    return `
                      <div class="worker-rank-card">
                        <div>
                          <h4>#${i + 1} ${r.workItem || "Work Item"}</h4>
                          <p>${r.project?.name || "Project"} • ${date(r.date)}</p>
                        </div>
                        <span class="worker-score">${rate}%</span>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty-state">No productivity records yet.</div>`
          }
        </div>
      </div>
    </section>

    <section class="dashboard-grid two">
      <div class="panel danger-panel">
  <div class="panel-header">
    <div>
      <p class="eyebrow">Alerts</p>
      <h3>Low Productivity Summary</h3>
    </div>

    <span class="alert-count-badge">
      ${summary.lowPerformance || 0}
    </span>
  </div>

  <div class="productivity-alert-scroll">
    ${
      groupedAlerts.length
        ? groupedAlerts
            .map(
              (g) => `
                <div class="productivity-alert-item ${g.lowestRate < 40 ? "critical" : "high"}">
                  <div class="productivity-alert-top">
                    <span class="severity-pill ${g.lowestRate < 40 ? "critical" : "high"}">
                      ${g.lowestRate < 40 ? "CRITICAL" : "HIGH"}
                    </span>

                    <strong>${g.workItem}</strong>
                    <b>${g.count} alert(s)</b>
                  </div>

                  <p>${g.project} • Lowest Rate: ${g.lowestRate}%</p>

                  <button
                    class="btn secondary"
                    onclick="showGroupedProductivityAlert('${safeJsString(g.key)}')"
                  >
                    View Details
                  </button>
                </div>
              `,
            )
            .join("")
        : `<div class="empty-state">No low productivity alerts detected.</div>`
    }
  </div>
</div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Top Performer</p>
            <h3>Highest Output Record</h3>
          </div>
        </div>

        ${
          topRecord
            ? `
              <div class="productivity-stat">
                <span>${topRecord.workItem || "Work Item"}</span>
                <b>
                  ${
                    Number(topRecord.plannedOutput || 0) > 0
                      ? Math.round(
                          (Number(topRecord.actualOutput || 0) /
                            Number(topRecord.plannedOutput || 0)) *
                            100,
                        )
                      : 0
                  }%
                </b>
                <p>
                  Planned: ${topRecord.plannedOutput || 0}
                  • Actual: ${topRecord.actualOutput || 0}
                  ${topRecord.unit || ""}
                </p>
              </div>
            `
            : `<div class="empty-state">No top performer yet.</div>`
        }
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Records</p>
          <h3>Productivity Logs</h3>
        </div>

        ${
          user.role === "admin"
            ? `<button class="btn" onclick="productivityForm()">Add Productivity</button>`
            : ""
        }

<button class="btn secondary" onclick="downloadProductivityExcel()">
  Export Excel
</button>
      </div>

      <div id="productivityTable"></div>
    </section>
  `;

  renderProductivityTable(rows);
  renderProductivityChart(rows);
}

function getWorkItemRanking(rows = []) {
  const grouped = {};

  rows.forEach((r) => {
    const projectName = r.project?.name || "No Project";
    const workItem = r.workItem || "Work Item";
    const key = `${projectName}-${workItem}`;

    if (!grouped[key]) {
      grouped[key] = {
        workItem,
        project: projectName,
        planned: 0,
        actual: 0,
        count: 0,
      };
    }

    grouped[key].planned += Number(r.plannedOutput || 0);
    grouped[key].actual += Number(r.actualOutput || 0);
    grouped[key].count += 1;
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      rate: g.planned > 0 ? Math.round((g.actual / g.planned) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}

function showAllProductivityAlerts() {
  const rows = window.productivityRows || [];

  const lowRecords = rows.filter((r) => {
    const rate =
      Number(r.plannedOutput || 0) > 0
        ? Math.round(
            (Number(r.actualOutput || 0) / Number(r.plannedOutput || 0)) * 100,
          )
        : 0;

    return rate < 60;
  });

  modal(`
    <h3>All Low Productivity Alerts</h3>

    <div class="productivity-alert-scroll modal-alert-scroll">
      ${
        lowRecords.length
          ? lowRecords
              .map((r) => {
                const rate =
                  Number(r.plannedOutput || 0) > 0
                    ? Math.round(
                        (Number(r.actualOutput || 0) /
                          Number(r.plannedOutput || 0)) *
                          100,
                      )
                    : 0;

                const severity =
                  rate < 40 ? "critical" : rate < 60 ? "high" : "medium";

                return `
                  <div class="productivity-alert-item ${severity}">
                    <div class="productivity-alert-top">
                      <span class="severity-pill ${severity}">
                        ${severity.toUpperCase()}
                      </span>

                      <strong>${r.workItem || "Work Item"}</strong>

                      <b>${rate}%</b>
                    </div>

                    <p>${r.project?.name || "Project"} • ${date(r.date)}</p>

                    <small>
                      ${
                        r.aiRecommendation ||
                        "Review manpower allocation and work execution."
                      }
                    </small>
                  </div>
                `;
              })
              .join("")
          : `<div class="empty-state">No low productivity alerts detected.</div>`
      }
    </div>
  `);
}

function safeJsString(value = "") {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function downloadProductivityExcel() {
  try {
    const projectId = localStorage.getItem("selectedProductivityProject") || "";

    const url = projectId
      ? `/api/export/productivity-excel?project=${projectId}`
      : "/api/export/productivity-excel";

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to export productivity report.");
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "productivity-report.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    alert(error.message);
  }
}

function changeProductivityProject(projectId) {
  localStorage.setItem("selectedProductivityProject", projectId);
  productivityPage();
}

function renderProductivityTable(rows) {
  qs("#productivityTable").innerHTML = table(
    rows.map((r) => {
      const rate =
        Number(r.plannedOutput || 0) > 0
          ? Math.round(
              (Number(r.actualOutput || 0) / Number(r.plannedOutput || 0)) *
                100,
            )
          : 0;

      return {
        ...r,
        rate: `${rate}%`,
        actions:
          user.role === "admin"
            ? `<button class="btn danger" onclick="del('/api/productivity','${r._id}')">Delete</button>`
            : "",
      };
    }),
    [
      { label: "Project", render: (r) => r.project?.name || "-" },
      { label: "Date", render: (r) => date(r.date) },
      { label: "Work Item", key: "workItem" },
      { label: "Workers", key: "workers" },
      { label: "Attendance", render: (r) => r.attendance || 0 },
      { label: "Planned", key: "plannedOutput" },
      { label: "Actual", key: "actualOutput" },
      { label: "Unit", key: "unit" },
      { label: "Rate", key: "rate" },
      { label: "Health", render: (r) => r.productivityHealth || "-" },
      { label: "Risk", render: (r) => r.delayRisk || "-" },
      {
        label: "AI Recommendation",
        render: (r) => r.aiRecommendation || "-",
      },
      { label: "Remarks", render: (r) => r.remarks || "-" },
      { label: "Encoded By", render: (r) => r.createdBy?.name || "-" },
    ],
  );
}

function renderProductivityChart(rows = []) {
  const ctx = document.getElementById("productivityChart");
  if (!ctx) return;

  if (window.productivityChartInstance) {
    window.productivityChartInstance.destroy();
  }

  window.productivityChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: rows.map((r) =>
        new Date(r.date).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Planned Output",
          data: rows.map((r) => Number(r.plannedOutput || 0)),
          backgroundColor: "#2563eb",
          borderRadius: 10,
        },
        {
          label: "Actual Output",
          data: rows.map((r) => Number(r.actualOutput || 0)),
          backgroundColor: "#16a34a",
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
        tooltip: {
          callbacks: {
            title: function (items) {
              const r = rows[items[0].dataIndex];
              return `${date(r.date)} - ${r.workItem || "Work Item"}`;
            },
          },
        },
      },
    },
  });
}

function groupLowProductivityAlerts(rows = []) {
  const grouped = {};

  rows.forEach((r) => {
    const planned = Number(r.plannedOutput || 0);
    const actual = Number(r.actualOutput || 0);

    const rate = planned > 0 ? Math.round((actual / planned) * 100) : 0;

    if (rate >= 60) return;

    const projectName = r.project?.name || "No Project";
    const workItem = r.workItem || "Work Item";
    const key = `${projectName}-${workItem}`;

    if (!grouped[key]) {
      grouped[key] = {
        key,
        workItem,
        project: projectName,
        count: 0,
        lowestRate: rate,
        totalPlanned: 0,
        totalActual: 0,
        records: [],
      };
    }

    grouped[key].count += 1;
    grouped[key].lowestRate = Math.min(grouped[key].lowestRate, rate);
    grouped[key].totalPlanned += planned;
    grouped[key].totalActual += actual;
    grouped[key].records.push({
      ...r,
      rate,
      alertKey: key,
    });
  });

  return Object.values(grouped).sort(
    (a, b) => a.lowestRate - b.lowestRate || b.count - a.count,
  );
}

function showGroupedProductivityAlert(alertKey) {
  const grouped = groupLowProductivityAlerts(window.productivityRows || []);
  const group = grouped.find((g) => g.key === alertKey);

  if (!group) {
    alert("Alert group not found.");
    return;
  }

  modal(`
    <h3>${group.workItem} Alerts</h3>
    <p>${group.project} • ${group.count} alert(s)</p>

    <div class="productivity-alert-scroll modal-alert-scroll">
      ${group.records
        .map((r) => {
          const severity = r.rate < 40 ? "critical" : "high";

          return `
            <div class="productivity-alert-item ${severity}">
              <div class="productivity-alert-top">
                <span class="severity-pill ${severity}">
                  ${severity.toUpperCase()}
                </span>
                <strong>${r.workItem || "Work Item"}</strong>
                <b>${r.rate}%</b>
              </div>

              <p>${r.project?.name || "-"} • ${date(r.date)}</p>
              <small>${r.aiRecommendation || "Review manpower allocation and execution."}</small>
            </div>
          `;
        })
        .join("")}
    </div>
  `);
}

function changeProductivityProject(projectId) {
  localStorage.setItem("selectedProductivityProject", projectId);
  productivityPage();
}

function filterProductivity() {
  const keyword = qs("#productivitySearch").value.toLowerCase();

  const filtered = (window.productivityRows || []).filter((r) =>
    `${r.project?.name || ""} ${r.workItem || ""} ${r.unit || ""} ${r.remarks || ""}`
      .toLowerCase()
      .includes(keyword),
  );

  renderProductivityTable(filtered);
}

function productivityForm() {
  const selectedProject =
    localStorage.getItem("selectedProductivityProject") || "";

  if (!selectedProject) {
    alert("Please select a project first.");
    return;
  }

  modal(`
    <h3>Add Productivity Record</h3>

    <form onsubmit="saveProductivity(event)">
      <input type="hidden" name="project" value="${selectedProject}">

      <label>Date</label>
      <input name="date" type="date" value="${date(new Date())}" required>

      <label>Work Item</label>
      <input
        name="workItem"
        placeholder="Example: CHB Laying / Excavation / Concrete Pouring"
        required
      >

      <div class="form-grid">
        <input name="workers" type="number" min="1" placeholder="No. of Workers" required>
        <input
  name="attendance"
  type="number"
  min="0"
  placeholder="Attendance"
/>

        <input name="plannedOutput" type="number" min="0" placeholder="Planned Output" required>
        <input name="actualOutput" type="number" min="0" placeholder="Actual Output" required>
        <input name="unit" placeholder="Unit e.g. sqm, cu.m, pcs" required>
      </div>

      <label>Remarks</label>
      <textarea name="remarks" placeholder="Example: Slight delay due to material delivery"></textarea>

      <button class="btn">Save Productivity</button>
    </form>
  `);
}

async function saveProductivity(e) {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  data.task = null;
  data.workers = Number(data.workers || 0);
  data.plannedOutput = Number(data.plannedOutput || 0);
  data.actualOutput = Number(data.actualOutput || 0);

  await api("/api/productivity", {
    method: "POST",
    body: JSON.stringify(data),
  });

  alert("Productivity record saved.");
  location.reload();
}

function renderProductivityCharts(rows) {
  const labels = rows.map((r) => `${date(r.date)} - ${r.workItem}`);

  new Chart(document.getElementById("productivityChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Planned Output",
          data: rows.map((r) => Number(r.plannedOutput || 0)),
          backgroundColor: "#2563eb",
          borderRadius: 10,
        },
        {
          label: "Actual Output",
          data: rows.map((r) => Number(r.actualOutput || 0)),
          backgroundColor: "#16a34a",
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

  new Chart(document.getElementById("productivityRateChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Productivity Rate %",
          data: rows.map((r) => Number(r.productivityRate || 0)),
          borderColor: "#c87919",
          backgroundColor: "rgba(200,121,25,0.12)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 120,
        },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

function getWorkItemRanking(rows) {
  const grouped = {};

  rows.forEach((r) => {
    const key = r.workItem || "Work Item";

    if (!grouped[key]) {
      grouped[key] = {
        workItem: key,
        project: r.project?.name || "-",
        planned: 0,
        actual: 0,
        count: 0,
      };
    }

    grouped[key].planned += Number(r.plannedOutput || 0);
    grouped[key].actual += Number(r.actualOutput || 0);
    grouped[key].count += 1;
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      rate: g.planned > 0 ? Math.round((g.actual / g.planned) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}
