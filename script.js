/**
 * To-Do List App with Inline Editing, Drag-and-Drop,
 * and an Expand button to reveal full task text.
 * Author: Mike
 */

// DOM Elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

let dragSourceId = null; // ID of the task being dragged

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  renderTasks(getStoredTasks());
});

// Add a new task
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

// localStorage helpers
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Render all tasks grouped by category.
 * Enables drag/drop and adds Expand/Edit/Delete buttons.
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // 1. Group tasks by their category (maintaining stored order)
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // 2. Sort categories: Urgent first, Uncategorized last, then alphabetically
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  // 3. Render each category and its tasks
  sortedCategories.forEach(category => {
    // Category header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    // List container
    const ul = document.createElement("ul");

    // Allow drops here to move tasks into this category
    ul.addEventListener("dragover", e => e.preventDefault());
    ul.addEventListener("drop", e => {
      e.preventDefault();
      const fromId = Number(e.dataTransfer.getData("text/plain"));
      if (!fromId) return;

      const original = tasks.find(t => t.id === fromId);
      if (original.category === category) return;

      // Remove from old place
      const idx = tasks.findIndex(t => t.id === fromId);
      const [moved] = tasks.splice(idx, 1);

      // Update category & append to end
      moved.category = category;
      tasks.push(moved);

      saveTasks(tasks);
      renderTasks(tasks);
    });

    // 4. Render each task in stored order (no additional sort)
    grouped[category].forEach((task, idx) => {
      const li = document.createElement("li");
      li.draggable        = true;
      li.dataset.id       = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // — Drag & Drop Handlers for reorder within same list —
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
      const span  = document.createElement("span");
      span.textContent = task.text;
      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;
      detail.append(span, small);

      // — Action Buttons: Expand, Edit, Delete —
      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Expand button
      const expandBtn = document.createElement("button");
      expandBtn.className   = "expand-btn";
      expandBtn.textContent = "🔍";
      expandBtn.setAttribute("aria-label", "Expand/collapse text");
      expandBtn.addEventListener("click", () => {
        detail.classList.toggle("expanded");
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

      // Completed styling
      if (task.completed) li.classList.add("completed");

      // Assemble row: checkbox | detail | actions
      li.append(checkbox, detail, actions);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
