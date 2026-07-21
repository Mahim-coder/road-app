/**
 * Road-trip mini-games for the "We're Driving" tab.
 *
 * Each game registers { id, title, emoji, tagline, accent, render }.
 * app.js opens a full-screen overlay and calls render(container, api) where:
 *   api.onCleanup(fn)  -> register teardown (timers etc.), run when the game closes
 *   api.close()        -> close the overlay
 *   api.confetti()     -> fire a celebration
 *   api.addStars(n)    -> add to the family's shared trip stars
 */
window.RoadTripGames = (function () {
  "use strict";

  // ---- small DOM helpers -------------------------------------------------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    node.innerHTML = "";
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // A countdown ring/bar timer helper. Returns { el, stop }.
  function makeTimer(seconds, onTick, onDone) {
    var wrap = el("div", "game-timer");
    var fill = el("div", "game-timer-fill");
    var label = el("span", "game-timer-label");
    wrap.appendChild(fill);
    wrap.appendChild(label);

    var total = seconds;
    var remaining = seconds;
    label.textContent = remaining + "s";
    fill.style.width = "100%";

    var interval = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        label.textContent = "Time!";
        fill.style.width = "0%";
        clearInterval(interval);
        if (onDone) onDone();
        return;
      }
      label.textContent = remaining + "s";
      fill.style.width = (remaining / total) * 100 + "%";
      if (remaining <= 5) wrap.classList.add("game-timer-low");
      if (onTick) onTick(remaining);
    }, 1000);

    return {
      el: wrap,
      stop: function () { clearInterval(interval); }
    };
  }

  // =======================================================================
  // 1. CAR BRAND COUNTER
  // =======================================================================
  var CAR_BRANDS = [
    { name: "Toyota", emoji: "🚗" },
    { name: "Ford", emoji: "🛻" },
    { name: "BMW", emoji: "🏎️" },
    { name: "Tesla", emoji: "⚡" },
    { name: "Audi", emoji: "🚙" },
    { name: "VW", emoji: "🚐" },
    { name: "Mercedes", emoji: "✨" },
    { name: "Honda", emoji: "🚗" },
    { name: "Kia", emoji: "🚙" },
    { name: "Volvo", emoji: "🚚" }
  ];

  function carBrandsGame(root, api) {
    var selected = ["Toyota", "Ford", "BMW", "Tesla"];
    var guess = null;
    var counts = {};

    function renderSetup() {
      clear(root);
      var wrap = el("div", "game-pane");
      wrap.appendChild(el("p", "game-lead", "Pick the brands to hunt for, then guess which one you'll see most!"));

      var grid = el("div", "chip-grid");
      CAR_BRANDS.forEach(function (b) {
        var chip = el("button", "chip", b.emoji + " " + b.name);
        chip.type = "button";
        if (selected.indexOf(b.name) !== -1) chip.classList.add("chip-on");
        chip.addEventListener("click", function () {
          var i = selected.indexOf(b.name);
          if (i === -1) {
            if (selected.length >= 6) return;
            selected.push(b.name);
            chip.classList.add("chip-on");
          } else {
            selected.splice(i, 1);
            chip.classList.remove("chip-on");
          }
          if (guess && selected.indexOf(guess) === -1) guess = null;
        });
        grid.appendChild(chip);
      });
      wrap.appendChild(grid);

      wrap.appendChild(el("p", "game-lead", "🔮 Family guess: which brand wins? (optional)"));
      var guessRow = el("div", "chip-grid");
      function renderGuessRow() {
        clear(guessRow);
        selected.forEach(function (name) {
          var g = el("button", "chip chip-guess", name);
          g.type = "button";
          if (guess === name) g.classList.add("chip-on");
          g.addEventListener("click", function () {
            guess = guess === name ? null : name;
            renderGuessRow();
          });
          guessRow.appendChild(g);
        });
      }
      renderGuessRow();
      wrap.appendChild(guessRow);

      var start = el("button", "game-cta", "Start hunting 🚦");
      start.type = "button";
      start.addEventListener("click", function () {
        if (selected.length < 2) return;
        counts = {};
        selected.forEach(function (n) { counts[n] = 0; });
        renderPlay();
      });
      wrap.appendChild(start);
      root.appendChild(wrap);
    }

    function renderPlay() {
      clear(root);
      var wrap = el("div", "game-pane");
      wrap.appendChild(el("p", "game-lead", "Tap a brand every time you spot one on the road!"));

      var tiles = el("div", "brand-grid");
      var countEls = {};
      var barWrap = el("div", "brand-bars");

      function repaintBars() {
        clear(barWrap);
        var max = Math.max(1, Math.max.apply(null, selected.map(function (n) { return counts[n]; })));
        shuffle(selected).sort(function (a, b) { return counts[b] - counts[a]; }).forEach(function (n) {
          var row = el("div", "brand-bar-row");
          row.appendChild(el("span", "brand-bar-name", n));
          var track = el("div", "brand-bar-track");
          var fill = el("div", "brand-bar-fill");
          fill.style.width = (counts[n] / max) * 100 + "%";
          track.appendChild(fill);
          row.appendChild(track);
          row.appendChild(el("span", "brand-bar-count", String(counts[n])));
          barWrap.appendChild(row);
        });
      }

      selected.forEach(function (n) {
        var tile = el("button", "brand-tile", null);
        tile.type = "button";
        tile.appendChild(el("span", "brand-tile-name", n));
        var c = el("span", "brand-tile-count", "0");
        countEls[n] = c;
        tile.appendChild(c);
        tile.addEventListener("click", function () {
          counts[n] += 1;
          c.textContent = String(counts[n]);
          tile.classList.remove("bump");
          void tile.offsetWidth;
          tile.classList.add("bump");
          repaintBars();
        });
        tiles.appendChild(tile);
      });

      wrap.appendChild(tiles);
      wrap.appendChild(barWrap);
      repaintBars();

      var finish = el("button", "game-cta", "Finish & see the winner 🏁");
      finish.type = "button";
      finish.addEventListener("click", renderResults);
      wrap.appendChild(finish);
      root.appendChild(wrap);
    }

    function renderResults() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      var ranked = selected.slice().sort(function (a, b) { return counts[b] - counts[a]; });
      var winner = ranked[0];
      var total = selected.reduce(function (s, n) { return s + counts[n]; }, 0);

      if (total === 0) {
        wrap.appendChild(el("div", "game-big-emoji", "🤷"));
        wrap.appendChild(el("h3", "game-result-title", "No cars spotted yet!"));
      } else {
        wrap.appendChild(el("div", "game-big-emoji", "🏆"));
        wrap.appendChild(el("h3", "game-result-title", winner + " wins!"));
        wrap.appendChild(el("p", "game-lead", counts[winner] + " spotted out of " + total + " total"));
        if (guess) {
          var right = guess === winner;
          var g = el("p", "game-verdict " + (right ? "good" : "bad"),
            right ? ("🎯 Your guess of " + guess + " was right!") : ("So close — you guessed " + guess));
          wrap.appendChild(g);
          if (right) { api.confetti(); api.addStars(2); }
          else api.addStars(1);
        } else {
          api.addStars(1);
        }
        if (total > 0 && !guess) api.confetti();
      }

      var again = el("button", "game-cta", "Play again 🔁");
      again.type = "button";
      again.addEventListener("click", renderSetup);
      wrap.appendChild(again);
      root.appendChild(wrap);
    }

    renderSetup();
  }

  // =======================================================================
  // 2. ROAD TRIP QUIZ
  // =======================================================================
  var QUIZ = [
    { q: "Which animal is the tallest in the world?", a: ["Giraffe", "Elephant", "Horse", "Camel"], c: 0 },
    { q: "How many legs does a spider have?", a: ["6", "8", "10", "4"], c: 1 },
    { q: "What planet is known as the Red Planet?", a: ["Venus", "Jupiter", "Mars", "Saturn"], c: 2 },
    { q: "What is the largest ocean on Earth?", a: ["Atlantic", "Indian", "Arctic", "Pacific"], c: 3 },
    { q: "Which of these can fly?", a: ["Penguin", "Ostrich", "Bat", "Kiwi"], c: 2 },
    { q: "What do bees make?", a: ["Milk", "Honey", "Silk", "Butter"], c: 1 },
    { q: "How many colors are in a rainbow?", a: ["5", "6", "7", "9"], c: 2 },
    { q: "Which is the fastest land animal?", a: ["Cheetah", "Lion", "Horse", "Kangaroo"], c: 0 },
    { q: "What is frozen water called?", a: ["Steam", "Ice", "Snowflake", "Cloud"], c: 1 },
    { q: "Which shape has three sides?", a: ["Square", "Circle", "Triangle", "Star"], c: 2 },
    { q: "What is a baby dog called?", a: ["Kitten", "Cub", "Puppy", "Calf"], c: 2 },
    { q: "Which fruit is yellow and curved?", a: ["Apple", "Banana", "Grape", "Cherry"], c: 1 },
    { q: "How many days are in a week?", a: ["5", "6", "7", "8"], c: 2 },
    { q: "What do you call frozen rain?", a: ["Hail", "Fog", "Dew", "Mist"], c: 0 },
    { q: "Which animal says 'moo'?", a: ["Sheep", "Cow", "Goat", "Pig"], c: 1 }
  ];

  function quizGame(root, api) {
    var questions = shuffle(QUIZ).slice(0, 6);
    var idx = 0;
    var score = 0;
    var timer = null;

    api.onCleanup(function () { if (timer) timer.stop(); });

    function renderQuestion() {
      if (timer) timer.stop();
      clear(root);
      var item = questions[idx];
      var wrap = el("div", "game-pane");

      var head = el("div", "quiz-head");
      head.appendChild(el("span", "quiz-progress", "Question " + (idx + 1) + " / " + questions.length));
      head.appendChild(el("span", "quiz-score", "⭐ " + score));
      wrap.appendChild(head);

      var answered = false;
      timer = makeTimer(20, null, function () {
        if (!answered) reveal(-1);
      });
      wrap.appendChild(timer.el);

      wrap.appendChild(el("h3", "quiz-question", item.q));

      var opts = el("div", "quiz-options");
      var buttons = [];
      item.a.forEach(function (text, i) {
        var b = el("button", "quiz-option", text);
        b.type = "button";
        b.addEventListener("click", function () {
          if (answered) return;
          reveal(i);
        });
        buttons.push(b);
        opts.appendChild(b);
      });
      wrap.appendChild(opts);
      root.appendChild(wrap);

      function reveal(chosen) {
        answered = true;
        if (timer) timer.stop();
        buttons.forEach(function (b, i) {
          b.disabled = true;
          if (i === item.c) b.classList.add("correct");
          else if (i === chosen) b.classList.add("wrong");
        });
        if (chosen === item.c) { score += 1; }

        var next = el("button", "game-cta", idx + 1 < questions.length ? "Next question →" : "See results 🎉");
        next.type = "button";
        next.addEventListener("click", function () {
          idx += 1;
          if (idx < questions.length) renderQuestion();
          else renderResults();
        });
        wrap.appendChild(next);
      }
    }

    function renderResults() {
      if (timer) timer.stop();
      clear(root);
      var wrap = el("div", "game-pane game-center");
      var pct = score / questions.length;
      var emoji = pct === 1 ? "🌟" : pct >= 0.6 ? "🎉" : pct >= 0.3 ? "👍" : "🚀";
      wrap.appendChild(el("div", "game-big-emoji", emoji));
      wrap.appendChild(el("h3", "game-result-title", "You scored " + score + " / " + questions.length));
      wrap.appendChild(el("p", "game-lead", pct >= 0.6 ? "Awesome teamwork!" : "Great try — play again to beat it!"));
      if (pct >= 0.6) api.confetti();
      api.addStars(score);

      var again = el("button", "game-cta", "Play again 🔁");
      again.type = "button";
      again.addEventListener("click", function () {
        questions = shuffle(QUIZ).slice(0, 6);
        idx = 0; score = 0;
        renderQuestion();
      });
      wrap.appendChild(again);
      root.appendChild(wrap);
    }

    renderQuestion();
  }

  // =======================================================================
  // 3. NAME · PLACE · ANIMAL · THING
  // =======================================================================
  var LETTERS = "ABCDEFGHILMNOPRSTW".split("");
  var CATEGORIES = [
    { label: "Name", emoji: "🙋" },
    { label: "Place", emoji: "🌍" },
    { label: "Animal", emoji: "🐾" },
    { label: "Thing", emoji: "💡" },
    { label: "Food", emoji: "🍎" }
  ];

  function categoriesGame(root, api) {
    var timer = null;
    api.onCleanup(function () { if (timer) timer.stop(); });

    function renderRound() {
      if (timer) timer.stop();
      clear(root);
      var letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      var wrap = el("div", "game-pane game-center");

      wrap.appendChild(el("p", "game-lead", "Everyone shout out one for each — starting with…"));
      wrap.appendChild(el("div", "letter-badge", letter));

      timer = makeTimer(60, null, function () {
        buzzer.hidden = false;
        api.confetti();
        api.addStars(1);
      });
      wrap.appendChild(timer.el);

      var list = el("div", "cat-list");
      CATEGORIES.forEach(function (c) {
        var row = el("div", "cat-row");
        row.appendChild(el("span", "cat-emoji", c.emoji));
        row.appendChild(el("span", "cat-label", c.label));
        row.appendChild(el("span", "cat-letter", letter + "…"));
        list.appendChild(row);
      });
      wrap.appendChild(list);

      var buzzer = el("div", "game-verdict good", "⏰ Time's up — count your answers!");
      buzzer.hidden = true;
      wrap.appendChild(buzzer);

      var again = el("button", "game-cta", "New letter 🔤");
      again.type = "button";
      again.addEventListener("click", renderRound);
      wrap.appendChild(again);
      root.appendChild(wrap);
    }

    renderRound();
  }

  // =======================================================================
  // 4. WOULD YOU RATHER
  // =======================================================================
  var WYR = [
    ["have a pet dinosaur", "have a pet dragon"],
    ["be able to fly", "be invisible"],
    ["eat pizza every day", "eat ice cream every day"],
    ["live in a treehouse", "live in a castle"],
    ["be super fast", "be super strong"],
    ["talk to animals", "speak every language"],
    ["swim like a fish", "climb like a monkey"],
    ["have a robot friend", "have a magic carpet"],
    ["always be too hot", "always be too cold"],
    ["never do homework", "never do chores"],
    ["visit the moon", "explore the deep ocean"],
    ["have hands for feet", "feet for hands"],
    ["be a famous singer", "be a famous athlete"],
    ["control the weather", "control time"],
    ["only whisper", "only shout"]
  ];

  function wouldYouRatherGame(root, api) {
    var deck = shuffle(WYR);
    var i = 0;

    function renderCard() {
      clear(root);
      var pair = deck[i % deck.length];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("p", "game-lead", "Would you rather…"));

      var optA = el("button", "wyr-option wyr-a", null);
      optA.type = "button";
      optA.appendChild(el("span", "wyr-text", pair[0]));
      var optB = el("button", "wyr-option wyr-b", null);
      optB.type = "button";
      optB.appendChild(el("span", "wyr-text", pair[1]));

      var or = el("div", "wyr-or", "OR");

      function choose(btn) {
        optA.disabled = true; optB.disabled = true;
        btn.classList.add("wyr-picked");
        api.addStars(1);
        setTimeout(next, 700);
      }
      optA.addEventListener("click", function () { choose(optA); });
      optB.addEventListener("click", function () { choose(optB); });

      wrap.appendChild(optA);
      wrap.appendChild(or);
      wrap.appendChild(optB);

      var skip = el("button", "game-cta ghost", "Next one →");
      skip.type = "button";
      skip.addEventListener("click", next);
      wrap.appendChild(skip);
      root.appendChild(wrap);
    }

    function next() {
      i += 1;
      renderCard();
    }

    renderCard();
  }

  // =======================================================================
  // 5. SING-ALONG CHALLENGE
  // =======================================================================
  var SING_WORDS = ["love", "night", "sun", "heart", "home", "dance", "fire", "dream",
    "road", "rain", "star", "baby", "time", "happy", "world", "light", "hello", "friend"];

  function singGame(root, api) {
    var timer = null;
    api.onCleanup(function () { if (timer) timer.stop(); });

    function renderRound() {
      if (timer) timer.stop();
      clear(root);
      var word = SING_WORDS[Math.floor(Math.random() * SING_WORDS.length)];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🎤"));
      wrap.appendChild(el("p", "game-lead", "Sing a song that includes the word…"));
      wrap.appendChild(el("div", "sing-word", "“" + word + "”"));

      var done = el("div", "game-verdict good", "🎶 Nice one! Everybody claps!");
      done.hidden = true;

      timer = makeTimer(30, null, function () {
        done.hidden = false;
        api.addStars(1);
      });
      wrap.appendChild(timer.el);
      wrap.appendChild(done);

      var sang = el("button", "game-cta", "We sang it! 👏");
      sang.type = "button";
      sang.addEventListener("click", function () {
        if (timer) timer.stop();
        api.confetti();
        api.addStars(2);
        renderRound();
      });
      wrap.appendChild(sang);

      var skip = el("button", "game-cta ghost", "New word 🔁");
      skip.type = "button";
      skip.addEventListener("click", renderRound);
      wrap.appendChild(skip);
      root.appendChild(wrap);
    }

    renderRound();
  }

  // ---- registry ----------------------------------------------------------
  var GAMES = [
    { id: "carBrands", title: "Car Brand Hunt", emoji: "🚗", accent: "teal",
      tagline: "Spot & tally brands, then crown a winner", render: carBrandsGame },
    { id: "quiz", title: "Road Trip Quiz", emoji: "🧠", accent: "purple",
      tagline: "Family trivia with a beat-the-clock timer", render: quizGame },
    { id: "categories", title: "Name · Place · Animal", emoji: "🔤", accent: "orange",
      tagline: "Race the clock for each category", render: categoriesGame },
    { id: "wyr", title: "Would You Rather", emoji: "🤔", accent: "pink",
      tagline: "Silly choices to argue about", render: wouldYouRatherGame },
    { id: "sing", title: "Sing-Along Challenge", emoji: "🎤", accent: "blue",
      tagline: "Belt out a song with the secret word", render: singGame }
  ];

  var byId = {};
  GAMES.forEach(function (g) { byId[g.id] = g; });

  return {
    list: function () { return GAMES.slice(); },
    get: function (id) { return byId[id]; }
  };
})();
