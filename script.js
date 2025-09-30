/**
 * To-Do List App Script
 * Author: Mike St.Amour - PDM
 * Description: Handles task creation, rendering, category grouping, and dark mode toggle.
 * Persistence: Uses localStorage to save tasks per browser session.
 */

// DOM Elements
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const taskGroups = document.getElementById("taskGroups");
const darkModeToggle = document.getElementById("toggleDarkMode");

// Initialize app on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedTasks = getStoredTasks();
  renderTasks(savedTasks);
});

// Event: Add new task
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const category = categorySelect.value;

  if (!text) return;

  const tasks = getStoredTasks();
  const newTask = {
    id: Date.now(), // Unique timestamp-based ID
    text,
    completed: false,
    category
  };

  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks(tasks);
  taskInput.value = "";
});

// Event: Toggle dark mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

/**
 * Retrieves tasks from localStorage
 * @returns {Array} Array of task objects
 */
function getStoredTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

/**
 * Saves tasks to localStorage
 * @param {Array} tasks - Array of task objects
 */
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Renders tasks grouped by category
 * @param {Array} tasks - Array of task objects
 */
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  // Group tasks by category
  const grouped = tasks.reduce((acc, task) => {
    const key = task.category || "Uncategorized";
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  // Sort categories: Urgent first, then alphabetical
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === "Urgent") return -1;
    if (b === "Urgent") return 1;
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  // Render each category and its tasks
  sortedCategories.forEach(category => {
    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = category;
    taskGroups.appendChild(header);

    const ul = document.createElement("ul");

    // Sort tasks by creation time (oldest first)
    grouped[category].sort((a, b) => a.id - b.id).forEach((task, index) => {
      const li = document.createElement("li");
      li.style.animationDelay = `${index * 0.05}s`; // Staggered fade-in

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      // Task detail wrapper
      const detail = document.createElement("div");
      detail.className = "task-detail";

      const textSpan = document.createElement("span");
      textSpan.textContent = task.text;
      textSpan.addEventListener("click", e => {
        textSpan.classList.toggle("expanded");
        e.stopPropagation();
      });

      const categoryLabel = document.createElement("small");
      if (task.category) categoryLabel.textContent = task.category;

      detail.appendChild(textSpan);
      detail.appendChild(categoryLabel);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "❌";
      deleteBtn.setAttribute("aria-label", "Delete task");
      deleteBtn.addEventListener("click", () => {
        const updatedTasks = tasks.filter(t => t.id !== task.id);
        saveTasks(updatedTasks);
        renderTasks(updatedTasks);
      });

      // Completed styling
      if (task.completed) li.classList.add("completed");

      // Assemble task item
      li.appendChild(checkbox);
      li.appendChild(detail);
      li.appendChild(deleteBtn);
      ul.appendChild(li);
    });

    taskGroups.appendChild(ul);
  });
}
