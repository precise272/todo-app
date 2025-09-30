/**
 * To-Do App: premium UI polish with ripple effect on buttons,
 * inline editing, expand/collapse, and drag-and-drop across categories.
 */

// Ripple effect helper
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = e.clientX - rect.left - size / 2 + "px";
  ripple.style.top  = e.clientY - rect.top  - size / 2 + "px";
  ripple.className = "ripple";
  btn.appendChild(ripple);
  setTimeout(() => btn.removeChild(ripple), 600);
});

// DOM Elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

// Mobile footer elements
const footer             = document.querySelector(".task-footer");
const footerToggle       = document.querySelector(".task-footer-toggle");
const addTaskBtnMobile   = document.getElementById("addTaskBtnMobile");
const taskInputMobile    = document.getElementById("taskInputMobile");
const categorySelectMobile = document.getElementById("categorySelectMobile");

let dragSourceId = null;

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  renderTasks(getStoredTasks());
});

// Add new task (desktop)
addTaskBtn.addEventListener("click", () => {
  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) return;
  const tasks = getStoredTasks();
  const newTask = { id: Date.now(), text, completed: false, category };
  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";

  focusOnTask(newTask.id);
});

// Add new task (mobile footer)
if (addTaskBtnMobile) {
  addTaskBtnMobile.addEventListener("click", () => {
    const text     = taskInputMobile.value.trim();
    const category = categorySelectMobile.value;
    if (!text) return;
    const tasks = getStoredTasks();
    const newTask = { id: Date.now(), text, completed: false, category };
    tasks.push(newTask);
    saveTasks(tasks);
    renderTasks(tasks);
    taskInputMobile.value = "";
    taskInputMobile.blur();

    // Collapse footer
    footer.classList.remove("expanded");
    footerToggle.textContent = "➕ Add Task";

    focusOnTask(newTask.id);
  });
}

// Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Footer expand/collapse toggle
if (footerToggle) {
  footerToggle.addEventListener("click", () => {
    footer.classList.toggle("expanded");
    footerToggle.textContent = footer.classList.contains("expanded")
      ? "✖ Close"
      : "➕ Add Task";
  });
}

// Storage helpers
function getStoredTasks() {
  const raw = localStorage.getItem("tasks");
  return raw ? JSON.parse(raw) : [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Render tasks grouped by category
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // Group by category
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // Sort categories
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  sortedCats.forEach(category => {
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");
    ul.addEventListener("dragover", e => e.preventDefault());
    ul.addEventListener("drop", e => {
      e.preventDefault();
      const fromId = Number(e.dataTransfer.getData("text/plain"));
      if (!fromId) return;
      const original = tasks.find(t => t.id === fromId);
      if (original.category === category) return;
      const idx = tasks.findIndex(t => t.id === fromId);
      const [moved] = tasks.splice(idx, 1);
      moved.category = category;
      tasks.push(moved);
      saveTasks(tasks);
      renderTasks(tasks);
    });

    grouped[category].forEach((task, idx) => {
      const li = document.createElement("li");
      li.draggable        = true;
      li.dataset.id       = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // Drag-and-drop
      li.addEventListener("dragstart", e => {
        dragSourceId = task.id;
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("dragenter", e => {
        e.preventDefault();
        if (task.id !== dragSourceId) li.classList.add("drag-over");
      });
      li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
      li.addEventListener("dragover", e => e.preventDefault());
      li.addEventListener("drop", e => {
        e.preventDefault();
        li.classList.remove("drag-over");
        const fromId = Number(e.dataTransfer.getData("text/plain"));
        const toId   = task.id;
        if (fromId === toId) return;
        const all = getStoredTasks();
        const fromIdx = all.findIndex(t => t.id === fromId);
        const toIdx   = all.findIndex(t => t.id === toId);
        const [moved] = all.splice(fromIdx, 1);
        all.splice(toIdx, 0, moved);
        saveTasks(all);
        renderTasks(all);
      });

      // Main row
      const mainRow = document.createElement("div");
      mainRow.className = "task-main-row";

      const checkbox = document.createElement("input");
      checkbox.type    = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      const detail = document.createElement("div");
      detail.className = "task-detail";
      const span  = document.createElement("span");
      span.textContent = task.text;
      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;
      detail.append(span, small);

      mainRow.append(checkbox, detail);
      li.append(mainRow);

      // Actions
      const actions = document.createElement("div");
      actions.className = "task-actions";

      const expandBtn = document.createElement("button");
      expandBtn.className   = "expand-btn";
      expandBtn.textContent = "▾";
      expandBtn.addEventListener("click", () => {
        const expanded = detail.classList.toggle("expanded");
        expandBtn.textContent = expanded ? "▴" : "▾";
      });

      const editBtn = document.createElement("button");
      editBtn.className   = "edit-btn";
      editBtn.textContent = "✏️";
      editBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type      = "text";
        input.value     = task.text;
        input.className = "edit-input";
        detail.replaceChild(input, span);
        input.focus();
        input.addEventListener("blur", () => {
          task.text = input.value.trim() || task.text;
          saveTasks(tasks);
          renderTasks(tasks);
        });
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") input.blur();
        });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className   = "delete-btn";
      deleteBtn.textContent = "❌";
      deleteBtn.addEventListener("click", () => {
        const updated = tasks.filter(t => t.id !== task.id);
        saveTasks(updated);
        renderTasks(updated);
      });

      actions.append(expandBtn, editBtn, deleteBtn);
      li.append(actions);

      if (task.completed) li.classList.add("completed");
      ul.appendChild(li);
    });

        taskGroups.appendChild(ul);
  });
}

/*───────────────────────────────────────────────────────────────*
 * Helper: scroll to and highlight a newly added task
 *───────────────────────────────────────────────────────────────*/
function focusOnTask(taskId) {
  const el = document.querySelector(`li[data-id="${taskId}"]`);
  if (el) {
    el.classList.add("just-added");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.classList.remove("just-added"), 1200);
  }
}

/*───────────────────────────────────────────────────────────────*
 * Desktop footer visibility logic
 *───────────────────────────────────────────────────────────────*/
const desktopToolbar = document.querySelector(".task-controls.desktop-only");
const footerBar = document.querySelector(".task-footer");

if (desktopToolbar && footerBar) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Toolbar visible → hide footer
          footerBar.classList.remove("visible");
          setTimeout(() => {
            if (!footerBar.classList.contains("visible")) {
              footerBar.style.display = "none";
            }
          }, 300); // matches CSS transition
        } else {
          // Toolbar scrolled out → show footer
          footerBar.style.display = "block";
          requestAnimationFrame(() => footerBar.classList.add("visible"));
        }
      });
    },
    { root: null, threshold: 0 }
  );

  observer.observe(desktopToolbar);
}
