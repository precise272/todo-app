/**
 * To-Do List App with Debug Logs for Drag-and-Drop
 * Author: Mike
 * Description: Create, edit, delete, categorize, and reorder tasks with verbose logging.
 */

// DOM Elements
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

console.log("🟢 App initializing…");

window.addEventListener("DOMContentLoaded", () => {
  console.log("📥 DOMContentLoaded, loading tasks");
  const tasks = getStoredTasks();
  renderTasks(tasks);
});

// Add new task
addTaskBtn.addEventListener("click", () => {
  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) {
    console.log("⚠️ AddTask clicked but no text");
    return;
  }

  const tasks = getStoredTasks();
  const newTask = { id: Date.now(), text, completed: false, category };
  tasks.push(newTask);
  console.log("➕ Adding task:", newTask);
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";
});

// Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  console.log("🌙 Dark mode toggled. New classList:", document.body.classList);
});

// Helpers: localStorage
function getStoredTasks() {
  const raw = localStorage.getItem("tasks");
  const arr = raw ? JSON.parse(raw) : [];
  console.log("📤 getStoredTasks ->", arr);
  return arr;
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  console.log("💾 saveTasks ->", tasks);
}

/**
 * Renders tasks, grouped & sorted, and wires up drag-and-drop.
 * @param {Array} tasks
 */
function renderTasks(tasks) {
  console.log("🌐 renderTasks(", tasks, ")");
  taskGroups.innerHTML = "";

  // 1) Group by category
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});
  console.log("🗂️ Grouped tasks:", grouped);

  // 2) Sort categories
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent")      return -1;
    if (b === "Urgent")      return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });
  console.log("🔀 Sorted categories:", sortedCats);

  // 3) Build UI
  sortedCats.forEach(cat => {
    // Category header
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = cat;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    // Sort tasks by id (creation time)
    grouped[cat]
      .sort((a, b) => a.id - b.id)
      .forEach((task, idx) => {
        // Create LI
        const li = document.createElement("li");
        li.draggable      = true;
        li.dataset.id     = task.id;
        li.style.animationDelay = `${idx * 0.05}s`;
        console.log(`🔨 Creating <li> for task.id=${task.id}`);

        // — Drag Events —
        li.addEventListener("dragstart", e => {
          console.log("▶️ dragstart on", task.id);
          e.dataTransfer.setData("text/plain", task.id);
          e.dataTransfer.effectAllowed = "move";
          li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
          console.log("⏹️ dragend on", task.id);
          li.classList.remove("dragging");
        });

        li.addEventListener("dragenter", e => {
          e.preventDefault();
          if (!li.classList.contains("dragging")) {
            console.log("↗️ dragenter on", task.id);
            li.classList.add("drag-over");
          }
        });

        li.addEventListener("dragleave", () => {
          console.log("↘️ dragleave on", task.id);
          li.classList.remove("drag-over");
        });

        li.addEventListener("dragover", e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          // console.log("↔️ dragover on", task.id);
        });

        li.addEventListener("drop", e => {
          e.preventDefault();
          li.classList.remove("drag-over");
          const fromId = Number(e.dataTransfer.getData("text/plain"));
          const toId   = task.id;
          console.log("📥 drop event: from", fromId, "to", toId);

          if (fromId === toId) {
            console.log("ℹ️ Dropped on same item, no reorder.");
            return;
          }

          const allTasks = getStoredTasks();
          console.log("🔄 Before reorder:", allTasks);

          const fromIdx = allTasks.findIndex(t => t.id === fromId);
          const toIdx   = allTasks.findIndex(t => t.id === toId);
          console.log("🕵️ Indices fromIdx=", fromIdx, "toIdx=", toIdx);

          const [moved] = allTasks.splice(fromIdx, 1);
          allTasks.splice(toIdx, 0, moved);
          console.log("✅ After reorder:", allTasks);

          saveTasks(allTasks);
          renderTasks(allTasks);
        });

        // — Checkbox —
        const checkbox = document.createElement("input");
        checkbox.type    = "checkbox";
        checkbox.checked = task.completed;
        checkbox.addEventListener("change", () => {
          console.log("✅ Checkbox changed for", task.id, "to", checkbox.checked);
          task.completed = checkbox.checked;
          saveTasks(tasks);
          renderTasks(tasks);
        });

        // — Detail (text + category) —
        const detail = document.createElement("div");
        detail.className = "task-detail";
        const span = document.createElement("span");
        span.textContent = task.text;
        span.addEventListener("click", e => {
          detail.classList.toggle("expanded");
          console.log("🔍 Toggled expand on", task.id, detail.classList);
          e.stopPropagation();
        });
        const small = document.createElement("small");
        if (task.category) small.textContent = task.category;
        detail.append(span, small);

        // — Actions (Edit + Delete) —
        const btnGroup = document.createElement("div");
        btnGroup.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.className   = "edit-btn";
        editBtn.textContent = "✏️";
        editBtn.setAttribute("aria-label", "Edit task");
        editBtn.addEventListener("click", () => {
          console.log("✏️ Edit clicked for", task.id);
          const input = document.createElement("input");
          input.type      = "text";
          input.value     = task.text;
          input.className = "edit-input";
          detail.replaceChild(input, span);
          input.focus();

          input.addEventListener("blur", () => {
            console.log("✔️ Edit blur for", task.id, "new text:", input.value);
            task.text = input.value.trim() || task.text;
            saveTasks(tasks);
            renderTasks(tasks);
          });

          input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
              console.log("↵ Enter pressed on edit for", task.id);
              input.blur();
            }
          });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className   = "delete-btn";
        deleteBtn.textContent = "❌";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.addEventListener("click", () => {
          console.log("🗑️ Delete clicked for", task.id);
          const updated = tasks.filter(t => t.id !== task.id);
          saveTasks(updated);
          renderTasks(updated);
        });

        btnGroup.append(editBtn, deleteBtn);

        // Completed styling
        if (task.completed) {
          console.log("☑️ Applying completed style for", task.id);
          li.classList.add("completed");
        }

        // — Assemble —
        li.append(checkbox, detail, btnGroup);
        ul.appendChild(li);
      });

    taskGroups.appendChild(ul);
  });
}
