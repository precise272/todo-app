/**
 * To-Do List App with Inline Editing, Drag-and-Drop,
 * and Expand/Collapse via ▼/▲ caret with debug logs.
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
  console.log("🟢 DOMContentLoaded → rendering tasks");
  renderTasks(getStoredTasks());
});

// Add a new task
addTaskBtn.addEventListener("click", () => {
  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) {
    console.log("⚠️ Add clicked but input empty");
    return;
  }

  const tasks = getStoredTasks();
  const newTask = { id: Date.now(), text, completed: false, category };
  tasks.push(newTask);
  console.log("➕ Added task:", newTask);
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";
});

// Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  console.log("🌙 Dark mode toggled:", document.body.classList.contains("dark"));
});

// localStorage helpers
function getStoredTasks() {
  const raw = localStorage.getItem("tasks");
  const arr = raw ? JSON.parse(raw) : [];
  console.log("📥 getStoredTasks →", arr);
  return arr;
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  console.log("💾 saveTasks →", tasks);
}

/**
 * Render tasks grouped by category,
 * wire up drag/drop, Expand/Edit/Delete,
 * and emit logs for the Expand button.
 */
function renderTasks(tasks) {
  console.log("🔄 renderTasks()", tasks);
  taskGroups.innerHTML = "";

  // 1) Group by category (keep stored order)
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});
  console.log("🗂 Grouped:", grouped);

  // 2) Sort category headers
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent")           return -1;
    if (b === "Urgent")           return 1;
    if (a === "Uncategorized")    return 1;
    if (b === "Uncategorized")    return -1;
    return a.localeCompare(b);
  });
  console.log("🔀 Category order:", sortedCats);

  // 3) Render each category
  sortedCats.forEach(category => {
    const header = document.createElement("div");
    header.className   = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    // Drop on UL to move tasks into THIS category
    ul.addEventListener("dragover", e => e.preventDefault());
    ul.addEventListener("drop", e => {
      e.preventDefault();
      const fromId = Number(e.dataTransfer.getData("text/plain"));
      if (!fromId) return;

      const original = tasks.find(t => t.id === fromId);
      if (original.category === category) return;

      console.log(`📦 Moving Task ${fromId} → category "${category}"`);
      // Remove then append with new category
      const idx = tasks.findIndex(t => t.id === fromId);
      const [moved] = tasks.splice(idx, 1);
      moved.category = category;
      tasks.push(moved);

      saveTasks(tasks);
      renderTasks(tasks);
    });

    // 4) Render each task
    grouped[category].forEach((task, idx) => {
      const li = document.createElement("li");
      li.draggable  = true;
      li.dataset.id = task.id;
      li.style.animationDelay = `${idx * 0.05}s`;

      // Drag & drop for reorder
      li.addEventListener("dragstart", e => {
        dragSourceId = task.id;
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        console.log("▶️ dragstart", task.id);
      });
      li.addEventListener("dragend", () => {
        console.log("⏹️ dragend", task.id);
        li.classList.remove("dragging");
      });
      li.addEventListener("dragenter", e => {
        e.preventDefault();
        if (task.id !== dragSourceId) {
          li.classList.add("drag-over");
          console.log("↗️ dragenter on", task.id);
        }
      });
      li.addEventListener("dragleave", () => {
        li.classList.remove("drag-over");
        console.log("↘️ dragleave on", task.id);
      });
      li.addEventListener("dragover", e => e.preventDefault());
      li.addEventListener("drop", e => {
        e.preventDefault();
        li.classList.remove("drag-over");
        const fromId = Number(e.dataTransfer.getData("text/plain"));
        const toId   = task.id;
        console.log(`📥 drop event from ${fromId} to ${toId}`);

        if (fromId === toId) return;

        const all = getStoredTasks();
        const fromIdx = all.findIndex(t => t.id === fromId);
        const toIdx   = all.findIndex(t => t.id === toId);
        const [moved] = all.splice(fromIdx, 1);
        all.splice(toIdx, 0, moved);

        console.log("✅ Reordered:", all);
        saveTasks(all);
        renderTasks(all);
      });

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type    = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        console.log("✔️ Toggling completed", task.id, checkbox.checked);
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      // Detail
      const detail = document.createElement("div");
      detail.className = "task-detail";
      const span  = document.createElement("span");
      span.textContent = task.text;
      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;
      detail.append(span, small);

      // Actions (Expand/Edit/Delete)
      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Expand/Collapse button (▼/▲)
      const expandBtn = document.createElement("button");
      expandBtn.className   = "expand-btn";
      expandBtn.textContent = "▾"; // collapsed icon
      expandBtn.setAttribute("aria-label", "Expand text");
      expandBtn.addEventListener("click", () => {
        console.log("🔍 Expand clicked for", task.id);
        detail.classList.toggle("expanded");
        const isExpanded = detail.classList.contains("expanded");
        expandBtn.textContent = isExpanded ? "▴" : "▾";
        console.log(`   ➡️ Task ${task.id} expanded?`, isExpanded);
      });

      // Edit button
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
          console.log("   📥 Edit blur for", task.id, "new text:", input.value);
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
        console.log("🗑️ Delete clicked for", task.id);
        const updated = tasks.filter(t => t.id !== task.id);
        saveTasks(updated);
        renderTasks(updated);
      });

      actions.append(expandBtn, editBtn, deleteBtn);

      // Completed styling
      if (task.completed) li.classList.add("completed");

      // Assemble row
      li.append(checkbox, detail, actions);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
