(function () {
  "use strict";

  var STORAGE_KEY = "roadTripQuest";
  var STOP_PICK_COUNT = 4;

  // Rich stop activities. `howTo` steps + optional reference `link` show in a
  // "How to do it" drawer (mainly for the exercise / stretch ones).
  var STOP_POOL = [
    {
      text: "Do 10 squats", emoji: "🦵",
      howTo: [
        "Stand with feet shoulder-width apart.",
        "Push your hips back and bend your knees like sitting in a chair.",
        "Keep your chest up, then stand back tall. Repeat 10 times!"
      ],
      link: "https://www.youtube.com/results?search_query=how+to+do+a+squat+for+kids"
    },
    {
      text: "Hamstring stretch", emoji: "🤸",
      howTo: [
        "Stand tall, then slowly reach down toward your toes.",
        "Let your head and arms hang loose — don't bounce.",
        "Hold for 20 seconds and breathe."
      ],
      link: "https://www.youtube.com/results?search_query=hamstring+stretch+for+kids"
    },
    {
      text: "15 jumping jacks", emoji: "⭐",
      howTo: [
        "Jump your feet out wide while raising your arms overhead.",
        "Jump back in, arms down.",
        "Count out loud together to 15!"
      ],
      link: "https://www.youtube.com/results?search_query=jumping+jacks+for+kids"
    },
    {
      text: "30-second calf stretch", emoji: "🧘",
      howTo: [
        "Face a wall or the car and press both hands on it.",
        "Step one foot back, keeping that heel on the ground.",
        "Lean in gently for 15s each leg."
      ],
      link: "https://www.youtube.com/results?search_query=calf+stretch"
    },
    { text: "Take a silly group photo", emoji: "📸" },
    { text: "Find something red", emoji: "🔴" },
    { text: "Everyone shares a favorite moment so far", emoji: "💬" },
    { text: "Find a license plate from far away", emoji: "🚙" },
    { text: "Try a local snack together", emoji: "🍫" },
    { text: "Skip 10 times", emoji: "🤾" },
    { text: "Find a cool rock or leaf to keep", emoji: "🍂" },
    { text: "Do a 20-second wall sit", emoji: "🪑",
      howTo: [
        "Put your back flat against a wall.",
        "Slide down until your knees are bent like a chair.",
        "Hold it and count to 20 together!"
      ]
    }
  ];

  // ---- shuffle-bag picker for stop activities ----------------------------
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function makePicker(pool, count) {
    var queue = [];
    return function () {
      while (queue.length < count) queue = queue.concat(shuffle(pool));
      return queue.splice(0, count).map(function (item) {
        return {
          id: uid(), text: item.text, emoji: item.emoji || "✨",
          howTo: item.howTo || null, link: item.link || null, done: false
        };
      });
    };
  }
  var nextActivities = makePicker(STOP_POOL, STOP_PICK_COUNT);

  var PLAYER_COLORS = ["#ef4444", "#f97316", "#eab308", "#16a34a", "#0ea5a5",
    "#3b82f6", "#8b5cf6", "#ec4899"];

  // ---- state -------------------------------------------------------------
  function defaultData() {
    return { tab: "driving", activities: nextActivities(), stars: 0, players: [], turnIndex: 0 };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var p = JSON.parse(raw);
      if (!Array.isArray(p.activities) || !p.activities.length) p.activities = nextActivities();
      if (p.tab !== "driving" && p.tab !== "stopped") p.tab = "driving";
      if (typeof p.stars !== "number") p.stars = 0;
      if (!Array.isArray(p.players)) p.players = [];
      if (typeof p.turnIndex !== "number") p.turnIndex = 0;
      return p;
    } catch (e) { return defaultData(); }
  }

  function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  var state = loadData();
  var celebrating = false;
  var lastDoneId = null;

  // ---- elements ----------------------------------------------------------
  var tabDriving = document.getElementById("tabDriving");
  var tabStopped = document.getElementById("tabStopped");
  var drivingView = document.getElementById("drivingView");
  var stoppedView = document.getElementById("stoppedView");
  var gamesGrid = document.getElementById("gamesGrid");
  var activitiesList = document.getElementById("activitiesList");
  var rerollBtn = document.getElementById("rerollBtn");
  var celebrationEl = document.getElementById("celebration");
  var celebrationRerollBtn = document.getElementById("celebrationRerollBtn");
  var addActivityForm = document.getElementById("addActivityForm");
  var activityInput = document.getElementById("activityInput");
  var starsNumberEl = document.getElementById("starsNumber");
  var starsPill = document.getElementById("starsPill");
  var overlayStarsNumberEl = document.getElementById("overlayStarsNumber");
  var overlayStarsPill = document.getElementById("overlayStarsPill");

  var overlay = document.getElementById("gameOverlay");
  var overlayBack = document.getElementById("overlayBack");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayContent = document.getElementById("overlayContent");
  var overlayInfo = document.getElementById("overlayInfo");
  var confettiLayer = document.getElementById("confettiLayer");

  var rulesModal = document.getElementById("rulesModal");
  var rulesClose = document.getElementById("rulesClose");
  var rulesTitle = document.getElementById("rulesTitle");
  var rulesHow = document.getElementById("rulesHow");
  var rulesPoints = document.getElementById("rulesPoints");

  var playersBtn = document.getElementById("playersBtn");
  var playersBtnCount = document.getElementById("playersBtnCount");
  var playersModal = document.getElementById("playersModal");
  var playersClose = document.getElementById("playersClose");
  var playersList = document.getElementById("playersList");
  var addPlayerForm = document.getElementById("addPlayerForm");
  var playerInput = document.getElementById("playerInput");

  var CONFETTI = ["🎉", "✨", "🎊", "⭐", "🌈"];

  function fireConfetti() {
    for (var i = 0; i < 30; i++) {
      var p = document.createElement("span");
      p.className = "confetti-piece";
      p.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDelay = Math.random() * 0.3 + "s";
      p.style.animationDuration = (1.4 + Math.random() * 0.9) + "s";
      p.style.fontSize = (14 + Math.random() * 16) + "px";
      confettiLayer.appendChild(p);
      (function (node) {
        node.addEventListener("animationend", function () { node.remove(); });
      })(p);
    }
  }

  function bump(node) {
    node.classList.remove("bump");
    void node.offsetWidth;
    node.classList.add("bump");
  }

  function renderStars() {
    starsNumberEl.textContent = state.stars;
    overlayStarsNumberEl.textContent = state.stars;
  }

  // A big star pops in the center and flies into the star counter.
  function flyStar() {
    var target = (overlay && !overlay.hidden) ? overlayStarsPill : starsPill;
    if (!target) return;
    var rect = target.getBoundingClientRect();
    var star = document.createElement("div");
    star.className = "fly-star";
    star.textContent = "⭐";
    star.style.left = (window.innerWidth / 2) + "px";
    star.style.top = (window.innerHeight / 2) + "px";
    document.body.appendChild(star);
    requestAnimationFrame(function () { star.classList.add("show"); });
    setTimeout(function () {
      star.classList.add("fly");
      star.style.left = (rect.left + rect.width / 2) + "px";
      star.style.top = (rect.top + rect.height / 2) + "px";
    }, 240);
    setTimeout(function () { star.remove(); bump(target); }, 700);
  }

  function addStars(n) {
    state.stars += n;
    saveData();
    renderStars();
    flyStar();
  }

  // ---- players & turns ---------------------------------------------------
  function currentPlayer() {
    if (!state.players.length) return null;
    return state.players[state.turnIndex % state.players.length];
  }

  // Banner shown at the top of turn-based games (null when no players added).
  function turnBanner() {
    var p = currentPlayer();
    if (!p) return null;
    var b = document.createElement("div");
    b.className = "turn-banner";
    var dot = document.createElement("span");
    dot.className = "turn-dot";
    dot.style.background = p.color;
    var label = document.createElement("span");
    label.className = "turn-label";
    label.textContent = "It's " + p.name + "'s turn";
    var score = document.createElement("span");
    score.className = "turn-score";
    score.textContent = "⭐ " + p.stars;
    b.appendChild(dot);
    b.appendChild(label);
    b.appendChild(score);
    return b;
  }

  // Credit the current player (if any) + the shared total, then advance turn.
  function turnAward(n) {
    n = n || 1;
    var p = currentPlayer();
    if (p) {
      p.stars += n;
      state.turnIndex += 1;
    }
    addStars(n);
    if (playersModalOpen()) renderPlayers();
  }

  function playersModalOpen() { return !playersModal.hidden; }

  function renderPlayersCount() {
    playersBtnCount.textContent = state.players.length;
  }

  function renderPlayers() {
    playersList.innerHTML = "";
    if (!state.players.length) {
      var empty = document.createElement("li");
      empty.className = "players-empty";
      empty.textContent = "No players yet — add everyone in the car!";
      playersList.appendChild(empty);
    } else {
      // Show sorted by stars (leaderboard), but keep it stable-ish.
      var ranked = state.players.slice().sort(function (a, b) { return b.stars - a.stars; });
      ranked.forEach(function (p, i) {
        var li = document.createElement("li");
        li.className = "player-row";
        var dot = document.createElement("span");
        dot.className = "player-dot";
        dot.style.background = p.color;
        var name = document.createElement("span");
        name.className = "player-name";
        name.textContent = p.name;
        var stars = document.createElement("span");
        stars.className = "player-stars";
        stars.textContent = (i === 0 && p.stars > 0 ? "👑 " : "") + "⭐ " + p.stars;
        var del = document.createElement("button");
        del.type = "button";
        del.className = "player-remove";
        del.setAttribute("aria-label", "Remove " + p.name);
        del.textContent = "✕";
        del.addEventListener("click", function () {
          state.players = state.players.filter(function (x) { return x.id !== p.id; });
          saveData();
          renderPlayers();
          renderPlayersCount();
        });
        li.appendChild(dot);
        li.appendChild(name);
        li.appendChild(stars);
        li.appendChild(del);
        playersList.appendChild(li);
      });
    }
    renderPlayersCount();
  }

  function openPlayers() { renderPlayers(); playersModal.hidden = false; }
  function closePlayers() { playersModal.hidden = true; }

  playersBtn.addEventListener("click", openPlayers);
  playersClose.addEventListener("click", closePlayers);
  playersModal.addEventListener("click", function (e) {
    if (e.target === playersModal) closePlayers();
  });

  addPlayerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = playerInput.value.trim().slice(0, 20);
    if (!name) return;
    state.players.push({
      id: uid(), name: name,
      color: PLAYER_COLORS[state.players.length % PLAYER_COLORS.length],
      stars: 0
    });
    playerInput.value = "";
    saveData();
    renderPlayers();
    renderPlayersCount();
  });

  // ---- driving: game menu (grouped into sections) ------------------------
  function makeGameCard(g) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "game-card accent-" + g.accent;

    var badge = document.createElement("span");
    badge.className = "game-badge";
    badge.textContent = g.emoji;

    var info = document.createElement("span");
    info.className = "game-info";
    var title = document.createElement("span");
    title.className = "game-title";
    title.textContent = g.title;
    var tag = document.createElement("span");
    tag.className = "game-tagline";
    tag.textContent = g.tagline;
    info.appendChild(title);
    info.appendChild(tag);

    var play = document.createElement("span");
    play.className = "game-play";
    play.textContent = "▶";

    card.appendChild(badge);
    card.appendChild(info);
    card.appendChild(play);
    card.addEventListener("click", function () { openGame(g); });
    return card;
  }

  function renderGames() {
    gamesGrid.innerHTML = "";
    var games = window.RoadTripGames.list();
    var order = [];
    var groups = {};
    games.forEach(function (g) {
      var key = g.group || "Games";
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(g);
    });
    order.forEach(function (key) {
      var header = document.createElement("h2");
      header.className = "group-header";
      header.textContent = key;
      var count = document.createElement("span");
      count.className = "group-count";
      count.textContent = groups[key].length;
      header.appendChild(count);
      gamesGrid.appendChild(header);
      groups[key].forEach(function (g) { gamesGrid.appendChild(makeGameCard(g)); });
    });
  }

  // ---- game overlay ------------------------------------------------------
  var cleanupFns = [];
  var activeGame = null;

  function openGame(game) {
    activeGame = game;
    cleanupFns = [];
    overlayContent.innerHTML = "";
    overlayContent.className = "overlay-content accent-" + game.accent;
    overlayTitle.textContent = game.emoji + " " + game.title;

    var api = {
      onCleanup: function (fn) { cleanupFns.push(fn); },
      close: closeGame,
      confetti: fireConfetti,
      addStars: addStars,
      // player/turn helpers (no-ops-friendly: turnBanner returns null if no players)
      players: function () { return state.players.slice(); },
      currentPlayer: currentPlayer,
      turnBanner: turnBanner,
      turnAward: turnAward
    };
    game.render(overlayContent, api);
    overlay.hidden = false;
    document.body.classList.add("overlay-open");
  }

  function closeGame() {
    cleanupFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanupFns = [];
    overlayContent.innerHTML = "";
    overlay.hidden = true;
    document.body.classList.remove("overlay-open");
  }

  overlayBack.addEventListener("click", closeGame);

  function openRules() {
    if (!activeGame) return;
    var r = activeGame.rules || {};
    rulesTitle.textContent = activeGame.emoji + " " + activeGame.title;
    rulesHow.textContent = r.how || "Just tap around and have fun!";
    rulesPoints.textContent = r.points || "Play for fun — no points here.";
    rulesModal.hidden = false;
  }
  function closeRules() { rulesModal.hidden = true; }

  overlayInfo.addEventListener("click", openRules);
  rulesClose.addEventListener("click", closeRules);
  rulesModal.addEventListener("click", function (e) {
    if (e.target === rulesModal) closeRules();
  });

  // ---- stopped: activity list -------------------------------------------
  function renderActivities() {
    activitiesList.innerHTML = "";
    state.activities.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "activity-item";

      var main = document.createElement("button");
      main.type = "button";
      main.className = "activity-main" + (item.done ? " done" : "") + (item.id === lastDoneId ? " pop" : "");
      main.setAttribute("aria-pressed", String(!!item.done));

      var badge = document.createElement("span");
      badge.className = "activity-emoji";
      badge.textContent = item.done ? "✅" : item.emoji;

      var text = document.createElement("span");
      text.className = "activity-text";
      text.textContent = item.text;

      main.appendChild(badge);
      main.appendChild(text);

      if (item.howTo || item.link) {
        var hint = document.createElement("span");
        hint.className = "activity-hint";
        hint.textContent = "How-to";
        main.appendChild(hint);
      }

      main.addEventListener("click", function () {
        var was = item.done;
        item.done = !item.done;
        if (!was && item.done) { addStars(1); lastDoneId = item.id; }
        else lastDoneId = null;
        saveData();
        renderStopped();
      });

      var del = document.createElement("button");
      del.type = "button";
      del.className = "activity-delete";
      del.setAttribute("aria-label", "Remove");
      del.textContent = "✕";
      del.addEventListener("click", function () {
        var i = state.activities.indexOf(item);
        if (i !== -1) state.activities.splice(i, 1);
        saveData();
        renderStopped();
      });

      var row = document.createElement("div");
      row.className = "activity-row";
      row.appendChild(main);
      row.appendChild(del);
      li.appendChild(row);

      // Expandable how-to drawer
      if (item.howTo || item.link) {
        var drawer = document.createElement("div");
        drawer.className = "howto";
        if (item.howTo) {
          var ol = document.createElement("ol");
          ol.className = "howto-steps";
          item.howTo.forEach(function (step) {
            var liStep = document.createElement("li");
            liStep.textContent = step;
            ol.appendChild(liStep);
          });
          drawer.appendChild(ol);
        }
        if (item.link) {
          var a = document.createElement("a");
          a.className = "howto-link";
          a.href = item.link;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "▶ Watch a how-to video";
          drawer.appendChild(a);
        }
        drawer.hidden = true;
        li.appendChild(drawer);

        main.querySelector(".activity-hint").addEventListener("click", function (e) {
          e.stopPropagation();
          drawer.hidden = !drawer.hidden;
          main.classList.toggle("open", !drawer.hidden);
        });
      }

      activitiesList.appendChild(li);
    });

    lastDoneId = null;

    // celebration when everything is done
    var allDone = state.activities.length > 0 && state.activities.every(function (a) { return a.done; });
    if (allDone && !celebrating) {
      celebrating = true;
      celebrationEl.hidden = false;
      fireConfetti();
    } else if (!allDone) {
      celebrating = false;
      celebrationEl.hidden = true;
    }
  }

  function renderStopped() { renderActivities(); }

  function freshActivities() {
    state.activities = nextActivities();
    celebrating = false;
    saveData();
    renderStopped();
  }

  // ---- tabs --------------------------------------------------------------
  function renderTabs() {
    var driving = state.tab === "driving";
    tabDriving.classList.toggle("active", driving);
    tabStopped.classList.toggle("active", !driving);
    tabDriving.setAttribute("aria-selected", String(driving));
    tabStopped.setAttribute("aria-selected", String(!driving));
    drivingView.hidden = !driving;
    stoppedView.hidden = driving;
  }

  tabDriving.addEventListener("click", function () {
    state.tab = "driving"; saveData(); renderTabs();
  });
  tabStopped.addEventListener("click", function () {
    state.tab = "stopped"; saveData(); renderTabs();
  });

  rerollBtn.addEventListener("click", function () {
    if (!window.confirm("Swap in a fresh set of activities?")) return;
    freshActivities();
  });
  celebrationRerollBtn.addEventListener("click", freshActivities);

  addActivityForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = activityInput.value.trim();
    if (!text) return;
    state.activities.push({ id: uid(), text: text, emoji: "✨", howTo: null, link: null, done: false });
    activityInput.value = "";
    saveData();
    renderStopped();
  });

  // ---- init --------------------------------------------------------------
  renderStars();
  renderPlayersCount();
  renderGames();
  renderStopped();
  renderTabs();
})();
