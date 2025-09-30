/**
 * To-Do App: two-row layout (text + buttons)
 * with Expand ▼/▲, Edit, Delete, and drag-and-drop.
 */
const taskInput      = document.getElementById("taskInput");
const addTaskBtn     = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups     = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

let dragSourceId = null;

window.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 App start");
  renderTasks(getStoredTasks());
});

addTaskBtn.addEventListener("click", () => {
  const text     = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) return;

  const tasks = getStoredTasks();
  const newTask = { id: Date.now(), text, completed: false, category };
  tasks.push(newTask);
  console.log("➕ Added", newTask);
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";
});

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  console.log("🌙 Dark mode:", document.body.classList.contains("dark"));
});

function getStoredTasks() {
  const raw = localStorage.getItem("tasks");
  const arr = raw ? JSON.parse(raw) : [];
  console.log("📥 Loaded", arr);
  return arr;
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  console.log("💾 Saved", tasks);
}

function renderTasks(tasks) {
  console.log("🔄 renderTasks", tasks);
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

    // allow drop to change category
    ul.addEventListener("dragover", e => e.preventDefault());
    ul.addEventListener("drop", e => {
      e.preventDefault();
      const fromId = Number(e.dataTransfer.getData("text/plain"));
      if (!fromId) return;
      const original = tasks.find(t => t.id === fromId);
      if (original.category === category) return;

      console.log(`📦 Move ${fromId} → ${category}`);
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

      // drag start/end
      li.addEventListener("dragstart", e => {
        dragSourceId = task.id;
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        console.log("▶️ dragstart", task.id);
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        console.log("⏹️ dragend", task.id);
      });
      // dragover/enter/leave/drop for reorder
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
        console.log(`📥 drop ${fromId} → ${toId}`);
        if (fromId === toId) return;

        const all = getStoredTasks();
        const fromIdx = all.findIndex(t => t.id === fromId);
        const toIdx   = all.findIndex(t => t.id === toId);
        const [moved] = all.splice(fromIdx, 1);
        all.splice(toIdx, 0, moved);
        console.log("✅ Reorder result", all);
        saveTasks(all);
        renderTasks(all);
      });

      // first row: checkbox + detail
      const mainRow = document.createElement("div");
      mainRow.className = "task-main-row";

      const checkbox = document.createElement("input");
      checkbox.type    = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        console.log("✔️ complete", task.id, checkbox.checked);
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

      // second row: action buttons
      const actions = document.createElement("div");
      actions.className = "task-actions";

      // Expand ▼/▲
      const expandBtn = document.createElement("button");
      expandBtn.className   = "expand-btn";
      expandBtn.textContent = "▾";
      expandBtn.addEventListener("click", () => {
        const isExpanded = detail.classList.toggle("expanded");
        expandBtn.textContent = isExpanded ? "▴" : "▾";
        console.log("🔍 toggle expand", task.id, isExpanded);
      });

      // Edit ✏️
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

      // Delete ❌
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
