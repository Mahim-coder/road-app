(function () {
  "use strict";

  var STORAGE_KEY = "roadTripMissions";

  var STOP_PICK_COUNT = 3;
  var CAR_PICK_COUNT = 4;

  var STOP_POOL = [
    "Do 10 squats",
    "Take a group photo",
    "Find something red",
    "Do 15 jumping jacks",
    "Find a license plate from another state",
    "Take a selfie with something interesting nearby",
    "Find a dog",
    "Stretch for 1 minute",
    "Find a vending machine",
    "Try a local snack",
    "Find something starting with your first initial",
    "Skip 10 times",
    "Find a flag",
    "Do a 30 second wall sit"
  ];

  var CAR_POOL = [
    "Find 3 different car brands",
    "Play I Spy",
    "Count red cars you pass",
    "Play 20 Questions",
    "Find letters A-Z on signs, in order",
    "Sing along to a road trip playlist",
    "Play the license plate game",
    "Two truths and a lie",
    "Would you rather...?",
    "Guess how many minutes until the next stop",
    "Categories game (name 5 fruits, animals, etc.)",
    "Count how many trucks you see",
    "Tell your favorite travel story",
    "Name 5 movies with a road in the title",
    "Spot 3 different state license plates",
    "Rock paper scissors, best of 5"
  ];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // "Shuffle bag" picker: draws without replacement from a shuffled copy of
  // the pool, reshuffling only once it runs out, so nothing repeats until
  // every item in the pool has come up once.
  function makePicker(pool, count) {
    var queue = [];
    return function next() {
      while (queue.length < count) {
        queue = queue.concat(shuffle(pool));
      }
      return queue.splice(0, count).map(function (text) {
        return { id: uid(), text: text, done: false };
      });
    };
  }

  var nextStopMissions = makePicker(STOP_POOL, STOP_PICK_COUNT);
  var nextCarActivities = makePicker(CAR_POOL, CAR_PICK_COUNT);

  function makeMissions() {
    return nextStopMissions();
  }

  function makeCarActivities() {
    return nextCarActivities();
  }

  function defaultData() {
    return {
      mode: "stops",
      stopMissions: makeMissions(),
      carActivities: makeCarActivities()
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.stopMissions)) parsed.stopMissions = makeMissions();
      if (!Array.isArray(parsed.carActivities)) parsed.carActivities = makeCarActivities();
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
  var currentStopNameEl = document.getElementById("currentStopName");
  var rerollBtn = document.getElementById("rerollBtn");
  var missionsListEl = document.getElementById("missionsList");
  var emptyStateEl = document.getElementById("emptyState");
  var progressLabelEl = document.getElementById("progressLabel");
  var progressPercentEl = document.getElementById("progressPercent");
  var progressBarFillEl = document.getElementById("progressBarFill");
  var addMissionForm = document.getElementById("addMissionForm");
  var missionInput = document.getElementById("missionInput");

  // Returns the currently active activity list, regardless of mode.
  function getActiveList() {
    return state.mode === "car" ? state.carActivities : state.stopMissions;
  }

  function render() {
    var isCar = state.mode === "car";

    driveBtn.classList.toggle("active", isCar);
    stopBtn.classList.toggle("active", !isCar);
    currentStopNameEl.textContent = isCar ? "In the Car" : "This Stop";
    missionInput.placeholder = isCar
      ? "Add a car activity, e.g. Count red cars"
      : "Add a mission, e.g. Find a Tesla";

    renderActivities(getActiveList());
    renderProgress(getActiveList());
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
  // Starting a new leg rolls a fresh set of activities for that leg.
  driveBtn.addEventListener("click", function () {
    if (state.mode !== "car") {
      state.carActivities = makeCarActivities();
    }
    state.mode = "car";
    saveData();
    render();
  });

  stopBtn.addEventListener("click", function () {
    if (state.mode !== "stops") {
      state.stopMissions = makeMissions();
    }
    state.mode = "stops";
    saveData();
    render();
  });

  rerollBtn.addEventListener("click", function () {
    var list = getActiveList();
    if (list.length && !window.confirm("Replace current activities with a new random set?")) return;
    if (state.mode === "car") {
      state.carActivities = makeCarActivities();
    } else {
      state.stopMissions = makeMissions();
    }
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
