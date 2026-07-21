(function () {
  "use strict";

  var STORAGE_KEY = "roadTripMissions";

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function defaultData() {
    return {
      currentStopId: "stop-1",
      stops: [
        {
          id: "stop-1",
          name: "First Stop",
          missions: [
            { id: uid(), text: "Find 3 different car brands", done: false },
            { id: uid(), text: "Do 10 squats", done: false },
            { id: uid(), text: "Take a group photo", done: false }
          ]
        }
      ]
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var parsed = JSON.parse(raw);
      if (!parsed.stops || !parsed.stops.length) return defaultData();
      return parsed;
    } catch (e) {
      return defaultData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var state = loadData();

  var stopsListEl = document.getElementById("stopsList");
  var addStopBtn = document.getElementById("addStopBtn");
  var currentStopNameEl = document.getElementById("currentStopName");
  var missionsListEl = document.getElementById("missionsList");
  var emptyStateEl = document.getElementById("emptyState");
  var progressLabelEl = document.getElementById("progressLabel");
  var progressPercentEl = document.getElementById("progressPercent");
  var progressBarFillEl = document.getElementById("progressBarFill");
  var addMissionForm = document.getElementById("addMissionForm");
  var missionInput = document.getElementById("missionInput");

  function getCurrentStop() {
    var stop = state.stops.find(function (s) { return s.id === state.currentStopId; });
    return stop || state.stops[0];
  }

  function render() {
    var currentStop = getCurrentStop();
    state.currentStopId = currentStop.id;

    renderStopsBar(currentStop);
    renderMissions(currentStop);
    renderProgress(currentStop);
  }

  function renderStopsBar(currentStop) {
    stopsListEl.innerHTML = "";
    state.stops.forEach(function (stop) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "stop-chip" + (stop.id === currentStop.id ? " active" : "");
      btn.textContent = stop.name;
      btn.addEventListener("click", function () {
        state.currentStopId = stop.id;
        saveData();
        render();
      });
      stopsListEl.appendChild(btn);
    });
  }

  function renderMissions(stop) {
    currentStopNameEl.textContent = stop.name;
    missionsListEl.innerHTML = "";

    if (!stop.missions.length) {
      emptyStateEl.hidden = false;
      return;
    }
    emptyStateEl.hidden = true;

    stop.missions.forEach(function (mission) {
      var li = document.createElement("li");
      li.className = "mission-item";

      var checkbox = document.createElement("button");
      checkbox.type = "button";
      checkbox.className = "mission-checkbox" + (mission.done ? " checked" : "");
      checkbox.setAttribute("aria-label", mission.done ? "Mark incomplete" : "Mark complete");
      checkbox.textContent = mission.done ? "✓" : "";
      checkbox.addEventListener("click", function () {
        mission.done = !mission.done;
        saveData();
        render();
      });

      var text = document.createElement("span");
      text.className = "mission-text" + (mission.done ? " done" : "");
      text.textContent = mission.text;

      var del = document.createElement("button");
      del.type = "button";
      del.className = "mission-delete";
      del.setAttribute("aria-label", "Delete mission");
      del.textContent = "✕";
      del.addEventListener("click", function () {
        stop.missions = stop.missions.filter(function (m) { return m.id !== mission.id; });
        saveData();
        render();
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(del);
      missionsListEl.appendChild(li);
    });
  }

  function renderProgress(stop) {
    var total = stop.missions.length;
    var done = stop.missions.filter(function (m) { return m.done; }).length;
    var percent = total ? Math.round((done / total) * 100) : 0;

    progressLabelEl.textContent = done + " / " + total + " completed";
    progressPercentEl.textContent = percent + "%";
    progressBarFillEl.style.width = percent + "%";
  }

  addStopBtn.addEventListener("click", function () {
    var name = window.prompt("Name this stop:", "Stop " + (state.stops.length + 1));
    if (!name) return;
    var stop = { id: uid(), name: name.trim().slice(0, 40) || "Stop", missions: [] };
    state.stops.push(stop);
    state.currentStopId = stop.id;
    saveData();
    render();
  });

  addMissionForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = missionInput.value.trim();
    if (!text) return;
    var stop = getCurrentStop();
    stop.missions.push({ id: uid(), text: text, done: false });
    missionInput.value = "";
    saveData();
    render();
  });

  render();
})();
