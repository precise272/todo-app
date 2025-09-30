/**
 * To-Do List App with Inline Editing & Drag-and-Drop
 * Author: Mike
 * Description: Create, edit, delete, categorize, and reorder tasks.
 */

// Grab DOM elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

// Initialize on page load
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

// Helpers: localStorage
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Render tasks grouped by category; sets up drag-and-drop and Edit/Delete.
 * @param {Array} tasks
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // 1. Group tasks by category
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // 2. Sort categories: Urgent first, Uncategorized last, then alpha
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  // 3. Render each category section
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
        // ----- Build <li> -----
        const li = document.createElement("li");
        li.draggable        = true;
        li.dataset.id      = task.id;
        li.style.animationDelay = `${idx * 0.05}s`;

        // Drag start: attach the task ID to dataTransfer
        li.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", task.id);
          e.dataTransfer.effectAllowed = "move";
          li.classList.add("dragging");
        });

        // Drag end: clean up styles
        li.addEventListener("dragend", () => {
          li.classList.remove("dragging");
        });

        // Drag enter/leave: visual feedback
        li.addEventListener("dragenter", e => {
          e.preventDefault();
          if (!li.classList.contains("dragging")) {
            li.classList.add("drag-over");
          }
        });
        li.addEventListener("dragleave", () => {
          li.classList.remove("drag-over");
        });

        // Drag over: must preventDefault to allow drop
        li.addEventListener("dragover", e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });

        // Drop: reorder array, save, rerender
        li.addEventListener("drop", e => {
          e.preventDefault();
          li.classList.remove("drag-over");

          const fromId = Number(e.dataTransfer.getData("text/plain"));
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

        // ----- Checkbox -----
        const checkbox = document.createElement("input");
        checkbox.type    = "checkbox";
        checkbox.checked = task.completed;
        checkbox.addEventListener("change", () => {
          task.completed = checkbox.checked;
          saveTasks(tasks);
          renderTasks(tasks);
        });

        // ----- Detail (text + category) -----
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

        // ----- Actions (Edit + Delete) -----
        const btnGroup = document.createElement("div");
        btnGroup.className = "task-actions";

        // Edit button
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

        btnGroup.append(editBtn, deleteBtn);

        // Completed styling
        if (task.completed) li.classList.add("completed");

        // ----- Assemble Row -----
        // grid-template-columns: auto 1fr auto in CSS
        li.append(checkbox, detail, btnGroup);
        ul.appendChild(li);
      });

    taskGroups.appendChild(ul);
  });
}
