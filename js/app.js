(function () {
  "use strict";

  var STORAGE_KEY = "roadTripMissions";

  var STOP_TEMPLATE = [
    "Find 3 different car brands",
    "Do 10 squats",
    "Take a group photo"
  ];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function makeMissions() {
    return STOP_TEMPLATE.map(function (text) {
      return { id: uid(), text: text, done: false };
    });
  }

  function defaultData() {
    return {
      mode: "stops",
      currentStopId: "stop-1",
      stops: [
        { id: "stop-1", name: "First Stop", missions: makeMissions() }
      ],
      carActivities: [
        { id: uid(), text: "Play I Spy", done: false },
        { id: uid(), text: "Count red cars you pass", done: false },
        { id: uid(), text: "Play 20 Questions", done: false },
        { id: uid(), text: "Find letters A-Z on signs, in order", done: false },
        { id: uid(), text: "Sing along to a road trip playlist", done: false }
      ]
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var parsed = JSON.parse(raw);
      if (!parsed.stops || !parsed.stops.length) return defaultData();
      if (!Array.isArray(parsed.carActivities)) parsed.carActivities = defaultData().carActivities;
      if (parsed.mode !== "stops" && parsed.mode !== "car") parsed.mode = "stops";
      return parsed;
    } catch (e) {
      return defaultData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var state = loadData();

  var driveBtn = document.getElementById("driveBtn");
  var stopBtn = document.getElementById("stopBtn");
  var modeStopsBtn = document.getElementById("modeStopsBtn");
  var modeCarBtn = document.getElementById("modeCarBtn");
  var stopsBarEl = document.getElementById("stopsBar");
  var stopsListEl = document.getElementById("stopsList");
  var addStopBtn = document.getElementById("addStopBtn");
  var clearStopsBtn = document.getElementById("clearStopsBtn");
  var currentStopNameEl = document.getElementById("currentStopName");
  var renameStopBtn = document.getElementById("renameStopBtn");
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

  // Returns the currently active activity list, regardless of mode.
  function getActiveList() {
    return state.mode === "car" ? state.carActivities : getCurrentStop().missions;
  }

  function addStop(name) {
    var stop = { id: uid(), name: name, missions: makeMissions() };
    state.stops.push(stop);
    state.currentStopId = stop.id;
    state.mode = "stops";
    return stop;
  }

  function render() {
    var isCar = state.mode === "car";

    driveBtn.classList.toggle("active", isCar);
    stopBtn.classList.toggle("active", !isCar);
    modeStopsBtn.classList.toggle("active", !isCar);
    modeStopsBtn.setAttribute("aria-selected", String(!isCar));
    modeCarBtn.classList.toggle("active", isCar);
    modeCarBtn.setAttribute("aria-selected", String(isCar));
    stopsBarEl.hidden = isCar;
    renameStopBtn.hidden = isCar;
    missionInput.placeholder = isCar
      ? "Add a car activity, e.g. Count red cars"
      : "Add a mission, e.g. Find a Tesla";

    if (isCar) {
      currentStopNameEl.textContent = "In the Car";
    } else {
      var currentStop = getCurrentStop();
      state.currentStopId = currentStop.id;
      currentStopNameEl.textContent = currentStop.name;
      renderStopsBar(currentStop);
    }

    renderActivities(getActiveList());
    renderProgress(getActiveList());
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
        state.mode = "stops";
        saveData();
        render();
      });
      stopsListEl.appendChild(btn);
    });
  }

  function renderActivities(list) {
    missionsListEl.innerHTML = "";

    if (!list.length) {
      emptyStateEl.hidden = false;
      return;
    }
    emptyStateEl.hidden = true;

    list.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "mission-item";

      var checkbox = document.createElement("button");
      checkbox.type = "button";
      checkbox.className = "mission-checkbox" + (item.done ? " checked" : "");
      checkbox.setAttribute("aria-label", item.done ? "Mark incomplete" : "Mark complete");
      checkbox.textContent = item.done ? "✓" : "";
      checkbox.addEventListener("click", function () {
        item.done = !item.done;
        saveData();
        render();
      });

      var text = document.createElement("span");
      text.className = "mission-text" + (item.done ? " done" : "");
      text.textContent = item.text;

      var del = document.createElement("button");
      del.type = "button";
      del.className = "mission-delete";
      del.setAttribute("aria-label", "Delete activity");
      del.textContent = "✕";
      del.addEventListener("click", function () {
        var index = list.indexOf(item);
        if (index !== -1) list.splice(index, 1);
        saveData();
        render();
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(del);
      missionsListEl.appendChild(li);
    });
  }

  function renderProgress(list) {
    var total = list.length;
    var done = list.filter(function (m) { return m.done; }).length;
    var percent = total ? Math.round((done / total) * 100) : 0;

    progressLabelEl.textContent = done + " / " + total + " completed";
    progressPercentEl.textContent = percent + "%";
    progressBarFillEl.style.width = percent + "%";
  }

  // Big one-tap controls for the drive / stop / drive / stop rhythm of a road trip.
  driveBtn.addEventListener("click", function () {
    state.mode = "car";
    saveData();
    render();
  });

  stopBtn.addEventListener("click", function () {
    addStop("Stop " + (state.stops.length + 1));
    saveData();
    render();
  });

  modeStopsBtn.addEventListener("click", function () {
    state.mode = "stops";
    saveData();
    render();
  });

  modeCarBtn.addEventListener("click", function () {
    state.mode = "car";
    saveData();
    render();
  });

  addStopBtn.addEventListener("click", function () {
    var name = window.prompt("Name this stop:", "Stop " + (state.stops.length + 1));
    if (!name) return;
    addStop(name.trim().slice(0, 40) || "Stop");
    saveData();
    render();
  });

  clearStopsBtn.addEventListener("click", function () {
    var confirmed = window.confirm("Remove all stops and start over with one fresh stop?");
    if (!confirmed) return;
    state.stops = [];
    addStop("First Stop");
    saveData();
    render();
  });

  renameStopBtn.addEventListener("click", function () {
    var stop = getCurrentStop();
    var name = window.prompt("Rename this stop:", stop.name);
    if (!name) return;
    stop.name = name.trim().slice(0, 40) || stop.name;
    saveData();
    render();
  });

  addMissionForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = missionInput.value.trim();
    if (!text) return;
    getActiveList().push({ id: uid(), text: text, done: false });
    missionInput.value = "";
    saveData();
    render();
  });

  render();
})();
