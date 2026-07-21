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

  var CONFETTI_EMOJI = ["🎉", "✨", "🎊", "⭐"];

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
      carActivities: makeCarActivities(),
      totalFinds: 0
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
      if (typeof parsed.totalFinds !== "number") parsed.totalFinds = 0;
      return parsed;
    } catch (e) {
      return defaultData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var state = loadData();
  var lastFoundId = null;
  var celebrating = false;

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
  var totalFindsNumberEl = document.getElementById("totalFindsNumber");
  var celebrationEl = document.getElementById("celebration");
  var celebrationRerollBtn = document.getElementById("celebrationRerollBtn");
  var confettiLayerEl = document.getElementById("confettiLayer");

  // Returns the currently active activity list, regardless of mode.
  function getActiveList() {
    return state.mode === "car" ? state.carActivities : state.stopMissions;
  }

  function rerollActiveList() {
    if (state.mode === "car") {
      state.carActivities = makeCarActivities();
    } else {
      state.stopMissions = makeMissions();
    }
  }

  function fireConfetti() {
    for (var i = 0; i < 28; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.textContent = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)];
      piece.style.left = Math.random() * 100 + "%";
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      piece.style.animationDuration = 1.4 + Math.random() * 0.8 + "s";
      piece.style.fontSize = 14 + Math.random() * 14 + "px";
      confettiLayerEl.appendChild(piece);
      (function (el) {
        el.addEventListener("animationend", function () {
          el.remove();
        });
      })(piece);
    }
  }

  function render() {
    var isCar = state.mode === "car";

    driveBtn.classList.toggle("active", isCar);
    stopBtn.classList.toggle("active", !isCar);
    currentStopNameEl.textContent = isCar ? "In the Car" : "This Stop";
    missionInput.placeholder = isCar
      ? "Add something to find, e.g. a red truck"
      : "Add something to find, e.g. a Tesla";
    totalFindsNumberEl.textContent = state.totalFinds;

    var list = getActiveList();
    renderActivities(list);
    renderProgress(list);
    renderCelebration(list);
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

      var findBtn = document.createElement("button");
      findBtn.type = "button";
      findBtn.className = "find-btn" + (item.done ? " found" : "") + (item.id === lastFoundId ? " pop" : "");
      findBtn.setAttribute("aria-label", item.done ? "Mark as not found yet" : "Mark as found");
      findBtn.addEventListener("click", function () {
        var wasDone = item.done;
        item.done = !item.done;
        if (!wasDone && item.done) {
          state.totalFinds += 1;
          lastFoundId = item.id;
        } else {
          lastFoundId = null;
        }
        saveData();
        render();
      });

      var icon = document.createElement("span");
      icon.className = "find-icon";
      icon.textContent = item.done ? "✅" : "🔍";

      var text = document.createElement("span");
      text.className = "find-text";
      text.textContent = item.text;

      var status = document.createElement("span");
      status.className = "find-status";
      status.textContent = item.done ? "Found!" : "Spot it";

      findBtn.appendChild(icon);
      findBtn.appendChild(text);
      findBtn.appendChild(status);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "mission-delete";
      del.setAttribute("aria-label", "Remove from list");
      del.textContent = "✕";
      del.addEventListener("click", function () {
        var index = list.indexOf(item);
        if (index !== -1) list.splice(index, 1);
        saveData();
        render();
      });

      li.appendChild(findBtn);
      li.appendChild(del);
      missionsListEl.appendChild(li);
    });

    lastFoundId = null;
  }

  function renderProgress(list) {
    var total = list.length;
    var done = list.filter(function (m) { return m.done; }).length;
    var percent = total ? Math.round((done / total) * 100) : 0;

    progressLabelEl.textContent = done + " of " + total + " found";
    progressPercentEl.textContent = percent + "%";
    progressBarFillEl.style.width = percent + "%";
  }

  function renderCelebration(list) {
    var allFound = list.length > 0 && list.every(function (m) { return m.done; });
    if (allFound && !celebrating) {
      celebrating = true;
      celebrationEl.hidden = false;
      fireConfetti();
    } else if (!allFound) {
      celebrating = false;
      celebrationEl.hidden = true;
    }
  }

  // Big one-tap controls for the drive / stop / drive / stop rhythm of a road trip.
  // Each just switches which single list is showing; use the reroll button
  // to get a new random set of activities.
  driveBtn.addEventListener("click", function () {
    state.mode = "car";
    saveData();
    render();
  });

  stopBtn.addEventListener("click", function () {
    state.mode = "stops";
    saveData();
    render();
  });

  rerollBtn.addEventListener("click", function () {
    var list = getActiveList();
    if (list.length && !window.confirm("Replace current activities with a new random set?")) return;
    rerollActiveList();
    saveData();
    render();
  });

  celebrationRerollBtn.addEventListener("click", function () {
    rerollActiveList();
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
