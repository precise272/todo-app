// script.js
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// Load tasks from localStorage
window.onload = () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  savedTasks.forEach(task => createTaskElement(task.text, task.completed));
};

function createTaskElement(text, completed = false, category = "") {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = completed;
  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
    saveTasks();
  });

  const span = document.createElement("span");
  span.textContent = text;

  const categoryTag = document.createElement("small");
  categoryTag.textContent = category ? ` [${category}]` : "";
  categoryTag.style.marginLeft = "5px";
  categoryTag.style.color = "#555";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.addEventListener("click", () => {
    li.remove();
    saveTasks();
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(categoryTag);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll("li").forEach(li => {
    const text = li.querySelector("span").textContent;
    const completed = li.querySelector("input[type='checkbox']").checked;

    const categoryRaw = li.querySelector("small").textContent;
    const category = categoryRaw.replace(/\[|\]/g, "").trim();

    tasks.push({ text, completed, category });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

addTaskBtn.addEventListener("click", () => {
  const taskText = taskInput.value.trim();
  const category = document.getElementById("categorySelect").value;
  if (taskText === "") return;
  createTaskElement(taskText, false, category);
  saveTasks();
  taskInput.value = "";
});
