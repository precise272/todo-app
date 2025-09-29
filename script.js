const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const categorySelect = document.getElementById("categorySelect");
const reminderInput = document.getElementById("reminderInput");
const taskGroups = document.getElementById("taskGroups");

let lastState = [];

// Load and render tasks on page load
window.addEventListener("DOMContentLoaded", () => {
  const tasks = checkRecurring(JSON.parse(localStorage.getItem("tasks")) || []);
  renderTasks(tasks);
});

// Add new task
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const category = categorySelect.value;
  const reminder = reminderInput.value;

  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    category,
    completed: false,
    createdAt: new Date().toISOString(),
    reminder: reminder || null,
    notified: false,
    repeat: null, // Optional: "daily", "weekly", "monthly"
    lastShown: new Date().toISOString()
  };

  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  all.push(newTask);
  saveAndRender(all);

  taskInput.value = "";
  reminderInput.value = "";
});

// Dark mode toggle
document.getElementById("toggleDarkMode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Undo button
document.getElementById("undoBtn").addEventListener("click", () => {
  if (lastState.length) {
    localStorage.setItem("tasks", JSON.stringify(lastState));
    renderTasks(lastState);
  }
});

// Filter listeners
document.getElementById("filterCategory").addEventListener("change", () => {
  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(all);
});

document.getElementById("filterStatus").addEventListener("change", () => {
  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(all);
});

document.getElementById("searchInput").addEventListener("input", () => {
  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  renderTasks(all);
});

// Voice command
document.getElementById("voiceBtn").addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript.toLowerCase();

    if (transcript.includes("add task")) {
      const text = transcript.replace("add task", "").trim();
      if (text) {
        const all = JSON.parse(localStorage.getItem("tasks")) || [];
        all.push({
          id: Date.now(),
          text,
          category: "",
          completed: false,
          createdAt: new Date().toISOString()
        });
        saveAndRender(all);
      }
    } else if (transcript.includes("dark mode")) {
      document.body.classList.toggle("dark");
    } else if (transcript.includes("undo")) {
      if (lastState.length) {
        localStorage.setItem("tasks", JSON.stringify(lastState));
        renderTasks(lastState);
      }
    } else if (transcript.includes("show completed")) {
      document.getElementById("filterStatus").value = "completed";
      renderTasks(JSON.parse(localStorage.getItem("tasks")) || []);
    } else if (transcript.includes("clear filters")) {
      document.getElementById("filterStatus").value = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("searchInput").value = "";
      renderTasks(JSON.parse(localStorage.getItem("tasks")) || []);
    }
  };
});

// Reminder checker
setInterval(() => {
  const all = JSON.parse(localStorage.getItem("tasks")) || [];
  const now = new Date().toISOString();

  all.forEach(task => {
    if (task.reminder && !task.notified && now >= task.reminder) {
      alert(`⏰ Reminder: ${task.text}`);
      task.notified = true;
    }
  });

  localStorage.setItem("tasks", JSON.stringify(all));
}, 60000);

// Render tasks
function renderTasks(tasks) {
  taskGroups.innerHTML = "";

  const selectedCategory = document.getElementById("filterCategory").value;
  const selectedStatus = document.getElementById("filterStatus").value;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  const filtered = tasks.filter(task => {
    const matchCategory = selectedCategory ? task.category === selectedCategory : true;
    const matchStatus =
      selectedStatus === "completed" ? task.completed :
      selectedStatus === "active" ? !task.completed :
      true;
    const matchSearch = task.text.toLowerCase().includes(searchTerm);
    return matchCategory && matchStatus && matchSearch;
  });

  // Group by category
  const grouped = filtered.reduce((acc, t) => {
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

    grouped[cat].forEach(task => {
      const li = document.createElement("li");
      li.setAttribute("draggable", true);
      li.dataset.id = task.id;

      // Drag events
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", task.id);
      });

      ul.addEventListener("dragover", e => e.preventDefault());

      ul.addEventListener("drop", e => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        const targetId = e.target.closest("li")?.dataset.id;
        if (!draggedId || !targetId || draggedId === targetId) return;

        const draggedIndex = tasks.findIndex(t => t.id == draggedId);
        const targetIndex = tasks.findIndex(t => t.id == targetId);

        const [moved] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, moved);
        saveAndRender(tasks);
      });

      // Checkbox
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.completed;
      cb.addEventListener("change", () => {
        task.completed = cb.checked;
        saveAndRender(tasks);
      });

      // Detail wrapper
      const detail = document.createElement("div");
      detail.className = "task-detail";

      const span = document.createElement("span");
      span.textContent = task.text;
      span.classList.add("editable");

      // Expand/collapse or edit
      span.addEventListener("click", e => {
        e.stopPropagation();

        const input = document.createElement("input");
        input.type = "text";
        input.value = task.text;
        input.className = "edit-input";

        detail.replaceChild(input, span);
        input.focus();

        const saveEdit = () => {
          task.text = input.value.trim() || task.text;
          saveAndRender(tasks);
        };

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") input.blur();
        });
      });

      const small = document.createElement("small");
      if (task.category) small.textContent = task.category;

      detail.appendChild(span);
      detail.appendChild(small);

      if (task.reminder) {
        const reminderTag = document.createElement("small");
        reminderTag.textContent = `⏰ ${new Date(task.reminder).toLocaleString()}`;
        detail.appendChild(reminderTag);
      }

// Delete button
const del = document.createElement("button");
del.className = "delete-btn";
del.textContent = "❌";
del.addEventListener("click", () => {
  console.log("Deleting task:", task.id, task.text);
  const updated = tasks.filter(t => t.id !== task.id);
  saveAndRender(updated);
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

// Save and re-render
function saveAndRender(tasks) {
  lastState = JSON.parse(localStorage.getItem("tasks")) || [];
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks(tasks);
}

// Recurring task checker
function checkRecurring(tasks) {
  const now = new Date();
  tasks.forEach(task => {
    if (!task.completed && task.repeat && task.lastShown) {
      const last = new Date(task.lastShown);
      let shouldRepeat = false;

      if (task.repeat === "daily") {
        shouldRepeat = now - last > 86400000; // 1 day
      } else if (task.repeat === "weekly") {
        shouldRepeat = now - last > 604800000; // 1 week
      } else if (task.repeat === "monthly") {
        shouldRepeat = now.getMonth() !== last.getMonth();
      }

      if (shouldRepeat) {
        task.completed = false;
        task.lastShown = now.toISOString();
      }
    }
  });
  return tasks;
}
