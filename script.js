const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups = document.getElementById("taskGroups");

// Load tasks on page load
window.onload = () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(savedTasks);
};

// Add new task
addTaskBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();
  const category = categorySelect.value;
  if (taskText === "") return;

  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  savedTasks.push({ text: taskText, completed: false, category });
  localStorage.setItem("tasks", JSON.stringify(savedTasks));
  renderTasks(savedTasks);

  taskInput.value = "";
});

// Toggle dark mode
document.getElementById("toggleDarkMode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Render tasks grouped by category
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  const grouped = tasks.reduce((acc, task) => {
    const key = task.category || "Uncategorized";
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  Object.keys(grouped).forEach(category => {
    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    grouped[category].forEach(task => {
      const li = document.createElement("li");

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks(tasks);
      });

      // Task content wrapper
      const taskContent = document.createElement("div");
      taskContent.className = "task-content";

      const span = document.createElement("span");
      span.textContent = task.text;

      taskContent.appendChild(span);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.addEventListener("click", () => {
        const index = tasks.indexOf(task);
        tasks.splice(index, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks(tasks);
      });

      if (task.completed) li.classList.add("completed");

      li.appendChild(checkbox);
      li.appendChild(taskContent);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
