/**
 * To-Do List App with Inline Editing & Drag-and-Drop
 * Author: Mike
 * Description: Create, edit, delete, categorize, and reorder tasks.
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

// Dark Mode Toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Helpers: storage
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Render tasks, grouped & sorted by category, with drag-and-drop.
 * @param {Array} tasks 
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // Group by category
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // Sort categories: Urgent first, Uncategorized last, others alpha
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  sortedCats.forEach(cat => {
    // Category header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = cat;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    // Sort tasks by creation time
    grouped[cat]
      .sort((a, b) => a.id - b.id)
      .forEach((task, idx) => {
        // Task row
        const li = document.createElement("li");
        li.draggable      = true;
        li.dataset.id     = task.id;
        li.style.animationDelay = `${idx * 0.05}s`;

        // Drag events for reordering
        li.addEventListener("dragstart", () => {
          dragSourceId = task.id;
          li.classList.add("dragging");
        });
        li.addEventListener("dragend", () => {
          li.classList.remove("dragging");
        });
        li.addEventListener("dragenter", () => {
          if (task.id !== dragSourceId) li.classList.add("drag-over");
        });
        li.addEventListener("dragleave", () => {
          li.classList.remove("drag-over");
        });
        li.addEventListener("dragover", e => {
          e.preventDefault();
        });
        li.addEventListener("drop", () => {
          li.classList.remove("drag-over");
          const fromId = dragSourceId;
          const toId   = task.id;
          if (fromId === toId) return;

          const allTasks = getStoredTasks();
          const fromIdx  = allTasks.findIndex(t => t.id === fromId);
          const toIdx    = allTasks.findIndex(t => t.id === toId);
          const [moved]  = allTasks.splice(fromIdx, 1);
          allTasks.splice(toIdx, 0, moved);

          saveTasks(allTasks);
          renderTasks(allTasks);
        });

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type    = "checkbox";
        checkbox.checked = task.completed;
        checkbox.addEventListener("change", () => {
          task.completed = checkbox.checked;
          saveTasks(tasks);
          renderTasks(tasks);
        });

        // Detail (text + category label)
        const detail = document.createElement("div");
        detail.className = "task-detail";
        const span = document.createElement("span");
        span.textContent = task.text;
        span.addEventListener("click", e => {
          detail.classList.toggle("expanded");
          e.stopPropagation();
        });
        const small = document.createElement("small");
        if (task.category) small.textContent = task.category;
        detail.append(span, small);

        // Action buttons (Edit + Delete)
        const btnGroup = document.createElement("div");
        btnGroup.className = "task-actions";

        // Edit
        const editBtn = document.createElement("button");
        editBtn.className    = "edit-btn";
        editBtn.textContent  = "✏️";
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

        btnGroup.append(editBtn, deleteBtn);

        // Completed styling
        if (task.completed) li.classList.add("completed");

        // Assemble row: checkbox | detail | actions
        li.append(checkbox, detail, btnGroup);
        ul.appendChild(li);
      });

    taskGroups.appendChild(ul);
  });
}
