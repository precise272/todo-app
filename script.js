const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups = document.getElementById("taskGroups");

// Load tasks on page load
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(saved);
});

// Add new task
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const category = categorySelect.value;
  if (!text) return;

  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  all.push({ text, completed: false, category });
  localStorage.setItem("tasks", JSON.stringify(all));
  renderTasks(all);

  taskInput.value = "";
});

// Dark mode toggle
document.getElementById("toggleDarkMode")
  .addEventListener("click", () => document.body.classList.toggle("dark"));

// Render and group tasks
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // Group by category
  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  // Build DOM
  Object.keys(grouped).forEach(cat => {
    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = cat;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    grouped[cat].forEach((task, i) => {
      const li = document.createElement("li");

      // checkbox
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.completed;
      cb.addEventListener("change", () => {
        task.completed = cb.checked;
        saveAndRerender(tasks);
      });

      // middle detail wrapper
      const detail = document.createElement("div");
      detail.className = "task-detail";

      const span = document.createElement("span");
      span.textContent = task.text;

// 1) Toggle expanded class on the text span only
span.addEventListener("click", e => {
  span.classList.toggle("expanded");
  // Prevent this click from also bubbling up (optional)
  e.stopPropagation();
});


      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;

      detail.appendChild(span);
      detail.appendChild(small);

      // delete button
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "❌";
      del.addEventListener("click", () => {
        tasks.splice(i, 1);
        saveAndRerender(tasks);
      });

      if (task.completed) li.classList.add("completed");

      li.appendChild(cb);
      li.appendChild(detail);
      li.appendChild(del);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}

// helper to persist & redraw
function saveAndRerender(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(tasks);
}
