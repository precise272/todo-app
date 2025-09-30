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

let dragSourceId = null;

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  renderTasks(getStoredTasks());
});

// Add new task
addTaskBtn.addEventListener("click", () => {
  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) return;
  const tasks = getStoredTasks();
  tasks.push({ id: Date.now(), text, completed: false, category });
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";
});

// Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

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

  // Group by category in stored order
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // Sort categories: Urgent first, Uncategorized last, then alphabetically
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  sortedCats.forEach(category => {
    // Category header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    // List container (allows drop to change category)
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

    // Render each task in stored order
    grouped[category].forEach((task, idx) => {
      const li = document.createElement("li");
      li.draggable        = true;
      li.dataset.id       = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // Drag-and-drop for reorder within list
      li.addEventListener("dragstart", e => {
        dragSourceId = task.id;
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
      });
      li.addEventListener("dragenter", e => {
        e.preventDefault();
        if (task.id !== dragSourceId) li.classList.add("drag-over");
      });
      li.addEventListener("dragleave", () => {
        li.classList.remove("drag-over");
      });
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

      // First row: checkbox + text/category
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

      // Second row: action buttons
      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Expand/collapse button
      const expandBtn = document.createElement("button");
      expandBtn.className   = "expand-btn";
      expandBtn.textContent = "▾";
      expandBtn.setAttribute("aria-label", "Expand text");
      expandBtn.addEventListener("click", () => {
        const expanded = detail.classList.toggle("expanded");
        expandBtn.textContent = expanded ? "▴" : "▾";
      });

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className   = "edit-btn";
      editBtn.textContent = "✏️";
      editBtn.setAttribute("aria-label", "Edit task");
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

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className   = "delete-btn";
      deleteBtn.textContent = "❌";
      deleteBtn.setAttribute("aria-label", "Delete task");
      deleteBtn.addEventListener("click", () => {
        const updated = tasks.filter(t => t.id !== task.id);
        saveTasks(updated);
        renderTasks(updated);
      });

      actions.append(expandBtn, editBtn, deleteBtn);
      li.append(actions);

      // Completed styling
      if (task.completed) li.classList.add("completed");
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });

  const footer = document.querySelector('.task-footer');
const toggle = document.querySelector('.task-footer-toggle');

toggle.addEventListener('click', () => {
  footer.classList.toggle('expanded');
  toggle.textContent = footer.classList.contains('expanded')
    ? '✖ Close'
    : '➕ Add Task';
});

}
