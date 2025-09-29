const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups = document.getElementById("taskGroups");

window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(saved);
});

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

document.getElementById("toggleDarkMode")
  .addEventListener("click", () => document.body.classList.toggle("dark"));

function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  const grouped = tasks.reduce((acc, t) => {
    const key = t.category || "Uncategorized";
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  Object.keys(grouped).forEach(cat => {
    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = cat;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    grouped[cat].forEach((task, i) => {
      const li = document.createElement("li");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.completed;
      cb.addEventListener("change", () => {
        task.completed = cb.checked;
        saveAndRerender(tasks);
      });

      const detail = document.createElement("div");
      detail.className = "task-detail";

      const span = document.createElement("span");
      span.textContent = task.text;
      span.addEventListener("click", e => {
        span.classList.toggle("expanded");
        e.stopPropagation();
      });

      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;

      detail.appendChild(span);
      detail.appendChild(small);

      const edit = document.createElement("button");
      edit.className = "edit-btn";
      edit.textContent = "✏️";
      edit.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = task.text;
        input.className = "edit-input";

        detail.replaceChild(input, span);
        input.focus();

        const saveEdit = () => {
          task.text = input.value.trim() || task.text;
          saveAndRerender(tasks);
        };

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") input.blur();
        });
      });

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
      li.appendChild(edit);
      li.appendChild(del);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}

function saveAndRerender(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(tasks);
}
