const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups = document.getElementById("taskGroups");

window.onload = () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(savedTasks);
};

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

document.getElementById("toggleDarkMode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


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

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks(tasks);
      });

      const span = document.createElement("span");
      span.textContent = task.text;

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
      li.appendChild(span);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
