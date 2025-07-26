const todos = [];
const RENDER_EVENT = "render-todo";
const STORAGE_KEY = "TODO_APPS";

const generateId = () => +new Date();
const findTodo = (todoId) => todos.find((todo) => todo.id === todoId);
const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));

const loadDataFromStorage = () => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (data) {
    todos.push(...data);
    document.dispatchEvent(new Event(RENDER_EVENT));
  }
};

const postItColors = [
  "#ffff88",
  "#ff9999",
  "#99ff99",
  "#99ccff",
  "#ffcc99",
  "#ff99ff",
];
const getPostItColor = (id) => postItColors[id % postItColors.length];

const isOverdue = (deadline) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
};

const makeTodo = ({ id, task, priority, deadline, isCompleted, timestamp }) => {
  const container = document.createElement("div");
  const overdue = isOverdue(deadline) && !isCompleted;
  const displayPriority = overdue ? "High" : priority || "Medium";

  container.className = `item shadow ${isCompleted ? "completed" : ""} ${
    overdue ? "overdue" : ""
  }`;
  container.style.backgroundColor = getPostItColor(id);

  const createdDate = timestamp 
    ? new Date(timestamp).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    : new Date().toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });

  const deadlineText = deadline
    ? new Date(deadline).toLocaleDateString("id-ID", {
        weekday: 'short',
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "Tidak ada";

  container.innerHTML = `
    <div class="inner">
      <h2>${task}</h2>
      <span class="priority priority-${displayPriority.toLowerCase()}">${displayPriority}</span>
      <p>Dibuat: ${createdDate}<br>Deadline: ${deadlineText}</p>
    </div>
    <div class="checkbox-container">
      <input type="checkbox" class="neo-checkbox" ${
        isCompleted ? "checked" : ""
      }>
    </div>
  `;

  container.querySelector(".neo-checkbox").onchange = (e) =>
    toggleTodoStatus(id, e.target.checked);

  return container;
};

const addTodo = () => {
  const textarea = document.getElementById("title");
  const priority = document.getElementById("priority");
  const deadline = document.getElementById("deadline");
  const task = textarea.value.trim();
  if (!task) return;

  todos.push({
    id: generateId(),
    task,
    priority: priority.value,
    deadline: deadline.value,
    timestamp: new Date().toISOString(),
    isCompleted: false,
  });

  textarea.value = "";
  textarea.style.height = "";
  priority.value = "Medium";
  deadline.value = "";
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
};

const toggleTodoStatus = (todoId, isCompleted) => {
  const todo = findTodo(todoId);
  if (todo) {
    todo.isCompleted = isCompleted;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  }
};

const removeAllCompletedTasks = () => {
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  todos.length = 0;
  todos.push(...activeTodos);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
};

const updateStatistics = () => {
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);
  
  const overdueCount = activeTodos.filter(todo => isOverdue(todo.deadline)).length;
  const highCount = activeTodos.filter(todo => !isOverdue(todo.deadline) && todo.priority === 'High').length;
  const mediumCount = activeTodos.filter(todo => !isOverdue(todo.deadline) && todo.priority === 'Medium').length;
  const lowCount = activeTodos.filter(todo => !isOverdue(todo.deadline) && todo.priority === 'Low').length;
  const doneCount = completedTodos.length;
  
  document.getElementById('overdue-count').textContent = overdueCount;
  document.getElementById('high-count').textContent = highCount;
  document.getElementById('medium-count').textContent = mediumCount;
  document.getElementById('low-count').textContent = lowCount;
  document.getElementById('done-count').textContent = doneCount;
};

const updateCurrentTime = () => {
  const now = new Date();
  const dayName = now.toLocaleDateString("id-ID", { weekday: "long" });
  const dateString = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeString = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const timeElement = document.getElementById("current-time");
  if (timeElement) {
    timeElement.innerHTML = `<h3>${dayName}</h3><p>${dateString}</p><p>${timeString}</p>`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("title");

  textarea.oninput = function () {
    this.style.height = this.value.trim() ? `${this.scrollHeight}px` : "";
  };

  document.getElementById("form").onsubmit = (e) => {
    e.preventDefault();
    addTodo();
  };

  document.getElementById("delete-all-btn").onclick = removeAllCompletedTasks;

  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  loadDataFromStorage();
});

document.addEventListener(RENDER_EVENT, () => {
  const uncompletedList = document.getElementById("todos");
  const completedList = document.getElementById("completed-todos");

  uncompletedList.innerHTML = "";
  completedList.innerHTML = "";

  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  activeTodos.sort((a, b) => {
    const aOverdue = isOverdue(a.deadline);
    const bOverdue = isOverdue(b.deadline);

    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  activeTodos.forEach((todo) => uncompletedList.append(makeTodo(todo)));
  completedTodos.forEach((todo) => completedList.append(makeTodo(todo)));

  document.getElementById("delete-all-btn").style.display =
    completedTodos.length > 0 ? "block" : "none";
    
  updateStatistics();
});
