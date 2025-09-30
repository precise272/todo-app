/**
 * To-Do List App with Inline Editing & Working Drag-and-Drop
 * Author: Mike
 * Description: Create, edit, delete, categorize, and reorder tasks.
 */

// DOM Elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

/** ID of the task currently being dragged */
let dragSourceId = null;

// Load & render on start
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

// Dark mode toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Helpers: localStorage
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Render all tasks, grouped by category, & wire up drag-and-drop.
 * @param {Array<Object>} tasks
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // 1. Group tasks by category, in stored order
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // 2. Sort category headers: Urgent first, Uncategorized last, then alpha
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  // 3. Render each category
  sortedCategories.forEach(category => {
    // Header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    // List
    const ul = document.createElement("ul");

    // 4. Iterate in the order tasks are stored (no .sort by id)
    grouped[category].forEach((task, idx) => {
      const li = document.createElement("li");
      li.draggable        = true;
      li.dataset.id       = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // — Drag & Drop Handlers —
      li.addEventListener("dragstart", e => {
        dragSourceId = task.id;
        li.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
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

      li.addEventListener("dragover", e => {
        e.preventDefault();
      });

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

      // — Checkbox —
      const checkbox = document.createElement("input");
      checkbox.type    = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      // — Task Detail (text + category) —
      const detail = document.createElement("div");
      detail.className = "task-detail";
      const span       = document.createElement("span");
      span.textContent = task.text;
      span.addEventListener("click", e => {
        detail.classList.toggle("expanded");
        e.stopPropagation();
      });
      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;
      detail.append(span, small);

      // — Actions (Edit + Delete) —
      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Edit
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

      // Delete
      const deleteBtn = document.createElement("button");
      deleteBtn.className   = "delete-btn";
      deleteBtn.textContent = "❌";
      deleteBtn.setAttribute("aria-label", "Delete task");
      deleteBtn.addEventListener("click", () => {
        const updated = tasks.filter(t => t.id !== task.id);
        saveTasks(updated);
        renderTasks(updated);
      });

      actions.append(editBtn, deleteBtn);

      // Completed style
      if (task.completed) li.classList.add("completed");

      // Assemble row: checkbox | detail | actions
      li.append(checkbox, detail, actions);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
