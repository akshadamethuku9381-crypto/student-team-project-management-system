
const STORAGE_KEY = "teamflow_student_projects_v1";

const defaultData = {
    projects: [
        {
            id: 1,
            name: "Data Center Layout Design",
            description: "Design a server room layout for our college project.",
            deadline: "2026-11-15"
        },
        {
            id: 2,
            name: "Student Management System",
            description: "Create a system to organize student information.",
            deadline: "2026-11-20"
        },
        {
            id: 3,
            name: "Image Compression",
            description: "Study image compression using matrix rank reduction.",
            deadline: "2026-11-25"
        }
    ],
    tasks: [
        {
            id: 1,
            name: "Prepare project report",
            projectId: 1,
            assignee: "Ananya",
            deadline: "2026-11-05",
            status: "Completed"
        },
        {
            id: 2,
            name: "Create layout drawing",
            projectId: 1,
            assignee: "Priya",
            deadline: "2026-11-08",
            status: "In Progress"
        },
        {
            id: 3,
            name: "Design database tables",
            projectId: 2,
            assignee: "Sneha",
            deadline: "2026-11-12",
            status: "To Do"
        },
        {
            id: 4,
            name: "Research matrix methods",
            projectId: 3,
            assignee: "Ananya",
            deadline: "2026-11-14",
            status: "In Progress"
        }
    ]
};

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return structuredClone(defaultData);

        const data = JSON.parse(saved);

        if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
            throw new Error("Invalid saved data");
        }

        return data;
    } catch (error) {
        console.error("Could not load saved data:", error);
        return structuredClone(defaultData);
    }
}

let data = loadData();

const $ = (selector) => document.querySelector(selector);

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);
        showToast("Unable to save data in this browser.");
        return false;
    }
}

// Escape user-entered text before displaying it in HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getProject(projectId) {
    return data.projects.find(project => project.id === projectId);
}

function getProjectProgress(projectId) {
    const tasks = data.tasks.filter(task => task.projectId === projectId);

    if (tasks.length === 0) return 0;

    const completed = tasks.filter(
        task => task.status === "Completed"
    ).length;

    return Math.round((completed / tasks.length) * 100);
}

function formatDate(dateString) {
    if (!dateString) return "No deadline";

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function getStatusClass(status) {
    if (status === "Completed") return "status-completed";
    if (status === "In Progress") return "status-progress";
    return "status-todo";
}

// Update the four dashboard statistics.
function renderStats() {
    $("#totalProjects").textContent = data.projects.length;
    $("#totalTasks").textContent = data.tasks.length;

    $("#pendingTasks").textContent = data.tasks.filter(
        task => task.status !== "Completed"
    ).length;

    $("#completedTasks").textContent = data.tasks.filter(
        task => task.status === "Completed"
    ).length;
}

// Display all project cards.
function renderProjects() {
    const container = $("#projectList");

    if (data.projects.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No projects yet. Click "+ New Project" to create one.
            </p>`;
        return;
    }

    container.innerHTML = data.projects.map(project => {
        const progress = getProjectProgress(project.id);
        const taskCount = data.tasks.filter(
            task => task.projectId === project.id
        ).length;

        return `
            <article class="project-card">
                <div class="project-card-top">
                    <div class="project-icon">📘</div>
                    <span class="status status-progress">
                        ${progress}% Complete
                    </span>
                </div>

                <h3>${escapeHTML(project.name)}</h3>

                <p class="project-description">
                    ${escapeHTML(project.description || "No description provided.")}
                </p>

                <p class="project-meta">
                    📅 Deadline: ${formatDate(project.deadline)}
                </p>

                <div class="progress-label">
                    <span>Project Progress</span>
                    <span>${progress}%</span>
                </div>

                <div class="progress-track">
                    <div class="progress-fill"
                         style="width: ${progress}%"></div>
                </div>

                <div class="project-card-footer">
                    <small>📋 ${taskCount} task(s)</small>
                    <button class="text-btn"
                            data-project="${project.id}">
                        View Tasks →
                    </button>
                </div>
            </article>`;
    }).join("");
}

// Populate the project dropdown in the task form.
function renderProjectOptions() {
    const select = $("#taskProject");
    const previousValue = select.value;

    if (data.projects.length === 0) {
        select.innerHTML = `<option value="">Create a project first</option>`;
        select.disabled = true;
        $("#addTaskBtn").disabled = true;
        return;
    }

    select.disabled = false;
    $("#addTaskBtn").disabled = false;

    select.innerHTML = data.projects.map(project => `
        <option value="${project.id}">
            ${escapeHTML(project.name)}
        </option>
    `).join("");

    if (data.projects.some(
        project => String(project.id) === previousValue
    )) {
        select.value = previousValue;
    }
}

// Display tasks, applying search and status filters.
function renderTasks() {
    const search = $("#searchInput").value.trim().toLowerCase();
    const selectedStatus = $("#statusFilter").value;

    const filteredTasks = data.tasks.filter(task => {
        const project = getProject(task.projectId);
        const projectName = project ? project.name : "";

        const matchesSearch = [
            task.name,
            task.assignee,
            projectName
        ].some(value => String(value).toLowerCase().includes(search));

        const matchesStatus =
            selectedStatus === "All" || task.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    $("#emptyTasks").hidden = filteredTasks.length > 0;

    $("#taskList").innerHTML = filteredTasks.map(task => {
        const project = getProject(task.projectId);

        return `
            <tr>
                <td>
                    <span class="task-title">
                        ${escapeHTML(task.name)}
                    </span>
                    <span class="task-subtitle">Team task</span>
                </td>

                <td>${escapeHTML(project ? project.name : "Unknown project")}</td>

                <td>${escapeHTML(task.assignee)}</td>

                <td>${formatDate(task.deadline)}</td>

                <td>
                    <span class="status ${getStatusClass(task.status)}">
                        ${escapeHTML(task.status)}
                    </span>
                </td>

                <td>
                    <select class="action-select"
                            data-status-task="${task.id}"
                            aria-label="Change status for ${escapeHTML(task.name)}">
                        ${["To Do", "In Progress", "Completed"].map(status => `
                            <option value="${status}"
                                ${task.status === status ? "selected" : ""}>
                                ${status}
                            </option>
                        `).join("")}
                    </select>

                    <button class="delete-btn"
                            data-delete-task="${task.id}">
                        Delete
                    </button>
                </td>
            </tr>`;
    }).join("");
}

function renderAll() {
    renderStats();
    renderProjects();
    renderProjectOptions();
    renderTasks();
}

// Open and close forms.
$("#addProjectBtn").addEventListener("click", () => {
    $("#projectForm").reset();
    $("#projectDeadline").min = new Date().toLocaleDateString("en-CA");
    $("#projectDialog").showModal();
});

$("#addTaskBtn").addEventListener("click", () => {
    if (data.projects.length === 0) {
        showToast("Create a project before adding tasks.");
        return;
    }

    $("#taskForm").reset();
    $("#taskDeadline").min = new Date().toLocaleDateString("en-CA");
    $("#taskDialog").showModal();
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        const dialog = document.getElementById(button.dataset.close);
        if (dialog) dialog.close();
    });
});

// Create a new project.
$("#projectForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#projectName").value.trim();
    const description = $("#projectDescription").value.trim();
    const deadline = $("#projectDeadline").value;

    if (!name || !deadline) {
        showToast("Please fill in the required fields.");
        return;
    }

    const project = {
        id: Date.now(),
        name,
        description,
        deadline
    };

    data.projects.push(project);

    if (!saveData()) {
        data.projects.pop();
        return;
    }

    $("#projectDialog").close();
    renderAll();
    showToast("Project created successfully!");
});

// Create a task.
$("#taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#taskName").value.trim();
    const projectId = Number($("#taskProject").value);
    const assignee = $("#taskAssignee").value.trim();
    const deadline = $("#taskDeadline").value;
    const status = $("#taskStatus").value;

    if (!name || !assignee || !deadline || !getProject(projectId)) {
        showToast("Please complete all required fields.");
        return;
    }

    const task = {
        id: Date.now(),
        name,
        projectId,
        assignee,
        deadline,
        status
    };

    data.tasks.push(task);

    if (!saveData()) {
        data.tasks.pop();
        return;
    }

    $("#taskDialog").close();
    renderAll();
    showToast("Task added successfully!");
});

// Update a task's status.
$("#taskList").addEventListener("change", event => {
    const select = event.target.closest("[data-status-task]");
    if (!select) return;

    const task = data.tasks.find(
        item => item.id === Number(select.dataset.statusTask)
    );

    if (!task) return;

    const previousStatus = task.status;
    task.status = select.value;

    if (!saveData()) {
        task.status = previousStatus;
        renderAll();
        return;
    }

    renderAll();
    showToast("Task status updated!");
});

// Delete a task after confirmation.
$("#taskList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-task]");
    if (!button) return;

    const taskId = Number(button.dataset.deleteTask);
    const task = data.tasks.find(item => item.id === taskId);

    if (!task) return;

    if (!confirm(`Delete the task "${task.name}"?`)) return;

    const previousTasks = data.tasks;
    data.tasks = data.tasks.filter(item => item.id !== taskId);

    if (!saveData()) {
        data.tasks = previousTasks;
        renderAll();
        return;
    }

    renderAll();
    showToast("Task deleted successfully.");
});

// Search and filtering.
$("#searchInput").addEventListener("input", renderTasks);
$("#statusFilter").addEventListener("change", renderTasks);

// Show tasks belonging to a selected project.
$("#projectList").addEventListener("click", event => {
    const button = event.target.closest("[data-project]");
    if (!button) return;

    const projectId = Number(button.dataset.project);
    const project = getProject(projectId);

    if (!project) return;

    $("#searchInput").value = project.name;
    $("#statusFilter").value = "All";
    renderTasks();

    $("#tasks").scrollIntoView({ behavior: "smooth" });
});

// Reset the task search.
$("#viewAllBtn").addEventListener("click", () => {
    $("#searchInput").value = "";
    $("#statusFilter").value = "All";
    renderTasks();
});

// Highlight the navigation link for the current section.
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});

// Initial dashboard display.
renderAll();
