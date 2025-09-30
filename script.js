/**
 * To-Do List App with Inline Editing & Full Drag-and-Drop
 * Supports reordering within categories and moving between categories.
 */

// DOM Elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

let dragSourceId = null; // ID of the task being dragged

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
  renderTasks(getStoredTasks());
});

// Add Task
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

// Toggle Dark Mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// localStorage Helpers
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Render tasks grouped by category.
 * Enables drag/drop for reorder and cross-category moves.
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // 1. Group tasks by category (in stored order)
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // 2. Sort category headers: Urgent first, Uncategorized last, others alpha
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  // 3. Render each category section
  sortedCategories.forEach(category => {
    // Category header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    // Task list container
    const ul = document.createElement("ul");

    // Allow dropping into this category to move tasks here
    ul.addEventListener("dragover", e => {
      e.preventDefault();
    });
    ul.addEventListener("drop", e => {
      e.preventDefault();
      const fromId = Number(e.dataTransfer.getData("text/plain"));
      if (!fromId) return;

      // If dropped into the same category, let li-drop handle reorder
      const original = tasks.find(t => t.id === fromId);
      if (original.category === category) return;

      // Remove from old position
      const idx = tasks.findIndex(t => t.id === fromId);
      const [moved] = tasks.splice(idx, 1);

      // Update its category and append at end of this group
      moved.category = category;
      tasks.push(moved);

      saveTasks(tasks);
      renderTasks(tasks);
    });

    // 4. Render each task in stored order (no additional sort)
    grouped[category].forEach((task, idx) => {
      // Task row
      const li = document.createElement("li");
      li.draggable        = true;
      li.dataset.id       = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // --- Drag events for reorder within same <ul> ---
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

      li.addEventListener("dragover", e => {
        e.preventDefault();
      });

      li.addEventListener("drop", e => {
        e.preventDefault();
        li.classList.remove("drag-over");

        const fromId = Number(e.dataTransfer.getData("text/plain"));
        const toId   = task.id;
        if (fromId === toId) return;

        // Reorder within the same category
        const fromIdx = tasks.findIndex(t => t.id === fromId);
        const toIdx   = tasks.findIndex(t => t.id === toId);
        const [moved] = tasks.splice(fromIdx, 1);
        tasks.splice(toIdx, 0, moved);

        saveTasks(tasks);
        renderTasks(tasks);
      });

      // --- Checkbox ---
      const checkbox = document.createElement("input");
      checkbox.type    = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      // --- Task Detail (text + label) ---
      const detail = document.createElement("div");
      detail.className = "task-detail";
      const span  = document.createElement("span");
      span.textContent = task.text;
      span.addEventListener("click", e => {
        detail.classList.toggle("expanded");
        e.stopPropagation();
      });
      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;
      detail.append(span, small);

      // --- Actions (Edit + Delete) ---
      const actions = document.createElement("div");
      actions.className = "task-actions";

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

      // Completed styling
      if (task.completed) li.classList.add("completed");

      // Assemble: checkbox | detail | actions
      li.append(checkbox, detail, actions);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
