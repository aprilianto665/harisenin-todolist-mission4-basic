const todos = [];
const RENDER_EVENT = "render-todo";
const STORAGE_KEY = "TODO_APPS";
const postItColors = [
  "#ffff88",
  "#ff9999",
  "#99ff99",
  "#99ccff",
  "#ffcc99",
  "#ff99ff",
];
const dateOptions = {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
};

const generateId = () => +new Date();
const findTodo = (todoId) => todos.find((todo) => todo.id === todoId);
const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
const getPostItColor = (id) => postItColors[id % postItColors.length];
const formatDate = (datetime) => {
  if (!datetime) return "Tidak ada";
  const d = new Date(datetime);
  return d.toLocaleDateString("id-ID", dateOptions);
};

const loadDataFromStorage = () => {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (data) {
    todos.push(...data);
    document.dispatchEvent(new Event(RENDER_EVENT));
  }
};

const isOverdue = (deadline) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
};

const makeTodo = ({ id, task, priority, deadline, isCompleted }) => {
  const container = document.createElement("div");
  const overdue = isOverdue(deadline) && !isCompleted;
  const displayPriority = overdue ? "High" : priority || "Medium";

  container.className = `item shadow ${isCompleted ? "completed" : ""} ${
    overdue ? "overdue" : ""
  }`;
  container.style.backgroundColor = getPostItColor(id);

  container.innerHTML = `
    <div class="inner">
      <h2>${task}</h2>
      <span class="priority priority-${displayPriority.toLowerCase()}">${displayPriority}</span>
      <p>Tanggal: ${formatDate(deadline)}</p>
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
  const task = document.getElementById("title").value.trim();
  if (!task) return;

  const priority = document.getElementById("priority");
  const deadline = document.getElementById("deadline");

  todos.push({
    id: generateId(),
    task,
    priority: priority.value,
    deadline: deadline.value,
    isCompleted: false,
  });

  document.getElementById("form").reset();
  document.getElementById("title").style.height = "";
  priority.value = "Medium";

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
  todos.splice(0, todos.length, ...todos.filter((todo) => !todo.isCompleted));
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
};

const updateStatistics = () => {
  const stats = { overdue: 0, high: 0, medium: 0, low: 0, done: 0 };

  todos.forEach((todo) => {
    if (todo.isCompleted) {
      stats.done++;
    } else if (isOverdue(todo.deadline)) {
      stats.overdue++;
    } else {
      stats[todo.priority.toLowerCase()]++;
    }
  });

  Object.entries(stats).forEach(([key, value]) => {
    document.getElementById(`${key}-count`).textContent = value;
  });
};

const updateCurrentTime = () => {
  const now = new Date();
  const timeElement = document.getElementById("current-time");
  if (timeElement) {
    timeElement.innerHTML = `
      <h3>${now.toLocaleDateString("id-ID", { weekday: "long" })}</h3>
      <p>${now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}</p>
      <p>${now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}</p>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("title").oninput = function () {
    this.style.height = this.value.trim() ? `${this.scrollHeight}px` : "";
  };

  document.getElementById("form").onsubmit = (e) => {
    e.preventDefault();
    addTodo();
  };

  document.getElementById("delete-all-btn").onclick = removeAllCompletedTasks;
  document.getElementById("date-filter").onchange = () => {
    document.dispatchEvent(new Event(RENDER_EVENT));
  };

  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  loadDataFromStorage();
});

document.addEventListener(RENDER_EVENT, () => {
  const [activeTodos, completedTodos] = [[], []];
  const filterDate = document.getElementById("date-filter").value;

  todos.forEach((todo) => {
    if (filterDate && todo.deadline !== filterDate && !todo.isCompleted) {
      return;
    }
    (todo.isCompleted ? completedTodos : activeTodos).push(todo);
  });

  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  activeTodos.sort((a, b) => {
    const [aOverdue, bOverdue] = [isOverdue(a.deadline), isOverdue(b.deadline)];
    return aOverdue !== bOverdue
      ? bOverdue - aOverdue
      : priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const uncompletedList = document.getElementById("todos");
  const completedList = document.getElementById("completed-todos");

  uncompletedList.innerHTML = "";
  completedList.innerHTML = "";

  activeTodos.forEach((todo) => uncompletedList.append(makeTodo(todo)));
  completedTodos.forEach((todo) => completedList.append(makeTodo(todo)));

  document.getElementById("delete-all-btn").style.display =
    completedTodos.length > 0 ? "block" : "none";
  updateStatistics();
});
