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

  // Prepend a "whose turn" banner (does nothing if no players were added).
  function addTurn(wrap, api) {
    if (!api.turnBanner) return;
    var b = api.turnBanner();
    if (b) wrap.appendChild(b);
  }

  // Award a star: to the current player + shared total when players exist,
  // otherwise just the shared total. Falls back gracefully.
  function award(api, n) {
    if (api.turnAward) api.turnAward(n || 1);
    else api.addStars(n || 1);
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
      addTurn(wrap, api);
      wrap.appendChild(el("div", "game-big-emoji", "🎤"));
      wrap.appendChild(el("p", "game-lead", "Sing a song that includes the word…"));
      wrap.appendChild(el("div", "sing-word", "“" + word + "”"));

      var done = el("div", "game-verdict good", "🎶 Nice one! Everybody claps!");
      done.hidden = true;

      timer = makeTimer(30, null, function () {
        done.hidden = false;
      });
      wrap.appendChild(timer.el);
      wrap.appendChild(done);

      var sang = el("button", "game-cta", "We sang it! 👏");
      sang.type = "button";
      sang.addEventListener("click", function () {
        if (timer) timer.stop();
        api.confetti();
        award(api, 2);
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

  // =======================================================================
  // 6. TRUTH OR DARE (family friendly)
  // =======================================================================
  var TRUTHS = [
    "What's your all-time favorite food?",
    "Who is your best friend and why?",
    "What's the funniest thing that happened this week?",
    "If you could have any pet, what would it be?",
    "Where would your dream vacation be?",
    "What superpower would you pick?",
    "What's your favorite song right now?",
    "What's the silliest thing you're a little scared of?",
    "What's your favorite memory with the family?",
    "If you were a cartoon character, who would you be?",
    "What's a hidden talent you have?",
    "What would you do with a million dollars?",
    "What's the best gift you've ever gotten?",
    "If you could be any age, what age would you be?"
  ];
  var DARES = [
    "Talk in a robot voice until your next turn.",
    "Do your best animal impression.",
    "Sing 'Happy Birthday' in a silly voice.",
    "Make up a 5-second dance.",
    "Say the alphabet backwards from J.",
    "Do your best movie-star impression.",
    "Speak only in rhymes for one minute.",
    "Give everyone in the car a funny nickname.",
    "Tell a joke and make someone laugh.",
    "Do your best evil-villain laugh.",
    "Pretend to be a news reporter describing the trip.",
    "Talk like a pirate until your next turn.",
    "Hum a song and let everyone guess it.",
    "Make the funniest face you can for 10 seconds."
  ];

  function truthOrDareGame(root, api) {
    function renderChoose() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      addTurn(wrap, api);
      wrap.appendChild(el("div", "game-big-emoji", "🎭"));
      wrap.appendChild(el("p", "game-lead", "Pick your challenge!"));

      var truth = el("button", "wyr-option wyr-a", null);
      truth.type = "button";
      truth.appendChild(el("span", "wyr-text", "💬 Truth"));
      var dare = el("button", "wyr-option wyr-b", null);
      dare.type = "button";
      dare.appendChild(el("span", "wyr-text", "🎯 Dare"));
      truth.addEventListener("click", function () { renderPrompt("truth"); });
      dare.addEventListener("click", function () { renderPrompt("dare"); });

      wrap.appendChild(truth);
      wrap.appendChild(el("div", "wyr-or", "OR"));
      wrap.appendChild(dare);
      root.appendChild(wrap);
    }

    function renderPrompt(kind) {
      clear(root);
      var pool = kind === "truth" ? TRUTHS : DARES;
      var text = pool[Math.floor(Math.random() * pool.length)];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", kind === "truth" ? "💬" : "🎯"));
      wrap.appendChild(el("h3", "game-result-title", kind === "truth" ? "Truth" : "Dare"));
      wrap.appendChild(el("div", "prompt-card", text));

      var done = el("button", "game-cta", "Done! ⭐");
      done.type = "button";
      done.addEventListener("click", function () {
        api.confetti();
        award(api, 1);
        renderChoose();
      });
      wrap.appendChild(done);

      var another = el("button", "game-cta ghost", "Another " + kind + " →");
      another.type = "button";
      another.addEventListener("click", function () { renderPrompt(kind); });
      wrap.appendChild(another);

      var back = el("button", "game-cta ghost", "↩ Truth or Dare");
      back.type = "button";
      back.addEventListener("click", renderChoose);
      wrap.appendChild(back);
      root.appendChild(wrap);
    }

    renderChoose();
  }

  // =======================================================================
  // 7. WHO'S MOST LIKELY TO...
  // =======================================================================
  var MOST_LIKELY = [
    "become famous one day",
    "eat the most snacks on this trip",
    "fall asleep in the car first",
    "forget where we parked",
    "become a movie star",
    "laugh at their own joke",
    "win a dance battle",
    "make friends with a stranger's dog",
    "sing the loudest",
    "get us a little bit lost",
    "eat dessert before dinner",
    "become a millionaire",
    "trip over their own feet",
    "start a food fight",
    "know a random fun fact",
    "cry happy tears at a movie"
  ];

  function mostLikelyGame(root, api) {
    var deck = shuffle(MOST_LIKELY);
    var i = 0;

    function renderCard() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "👉"));
      wrap.appendChild(el("p", "game-lead", "Who's most likely to…"));
      wrap.appendChild(el("div", "prompt-card", deck[i % deck.length] + "?"));
      wrap.appendChild(el("p", "game-lead", "On the count of 3, everyone point! 1 · 2 · 3 👉"));

      var next = el("button", "game-cta", "Next one →");
      next.type = "button";
      next.addEventListener("click", function () {
        api.addStars(1);
        i += 1;
        renderCard();
      });
      wrap.appendChild(next);
      root.appendChild(wrap);
    }

    renderCard();
  }

  // =======================================================================
  // 8. EMOJI RIDDLE (guess the movie)
  // =======================================================================
  var EMOJI_RIDDLES = [
    { e: "🦁👑", a: "The Lion King" },
    { e: "🕷️🧑", a: "Spider-Man" },
    { e: "❄️⛄👭", a: "Frozen" },
    { e: "🐠🔍", a: "Finding Nemo" },
    { e: "🍫🏭", a: "Charlie & the Chocolate Factory" },
    { e: "🦖🏞️", a: "Jurassic Park" },
    { e: "🚗⚡🏁", a: "Cars" },
    { e: "🐼🥋", a: "Kung Fu Panda" },
    { e: "🦇🧑", a: "Batman" },
    { e: "🧞‍♂️🪔", a: "Aladdin" },
    { e: "🐷🕸️", a: "Charlotte's Web" },
    { e: "🤖🌱", a: "WALL·E" },
    { e: "🐟🔵🐠", a: "Finding Dory" },
    { e: "👦🎈🏠", a: "Up" },
    { e: "🦕👣", a: "The Good Dinosaur" },
    { e: "🧸🤠🚀", a: "Toy Story" }
  ];

  function emojiRiddleGame(root, api) {
    var deck = shuffle(EMOJI_RIDDLES);
    var i = 0;

    function renderCard() {
      clear(root);
      var item = deck[i % deck.length];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("p", "game-lead", "Guess the movie from the emojis!"));
      wrap.appendChild(el("div", "emoji-riddle", item.e));

      var answer = el("div", "game-verdict good", "👉 " + item.a);
      answer.hidden = true;
      wrap.appendChild(answer);

      var got = el("button", "game-cta", "We got it! ⭐");
      got.type = "button";
      got.addEventListener("click", function () {
        api.confetti();
        api.addStars(1);
        i += 1;
        renderCard();
      });
      wrap.appendChild(got);

      var reveal = el("button", "game-cta ghost", "Reveal answer 👀");
      reveal.type = "button";
      reveal.addEventListener("click", function () {
        answer.hidden = false;
        reveal.hidden = true;
      });
      wrap.appendChild(reveal);

      var next = el("button", "game-cta ghost", "Skip / Next →");
      next.type = "button";
      next.addEventListener("click", function () { i += 1; renderCard(); });
      wrap.appendChild(next);
      root.appendChild(wrap);
    }

    renderCard();
  }

  // =======================================================================
  // 9. CHARADES
  // =======================================================================
  var CHARADES = {
    Animals: ["elephant", "penguin", "kangaroo", "monkey", "snake", "frog",
      "chicken", "horse", "crab", "shark", "rabbit", "gorilla"],
    Movies: ["Frozen", "The Lion King", "Toy Story", "Cars", "Finding Nemo",
      "Shrek", "Moana", "Encanto", "Minions", "Spider-Man"],
    Actions: ["brushing teeth", "swimming", "dancing", "driving a car", "cooking",
      "sleeping", "playing guitar", "riding a bike", "fishing", "painting", "flying a kite"]
  };

  function charadesGame(root, api) {
    var timer = null;
    var category = "Mixed";
    api.onCleanup(function () { if (timer) timer.stop(); });

    function pool() {
      if (category === "Mixed") return CHARADES.Animals.concat(CHARADES.Movies, CHARADES.Actions);
      return CHARADES[category];
    }

    function renderSetup() {
      if (timer) timer.stop();
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🎭"));
      wrap.appendChild(el("p", "game-lead", "One person acts it out — no talking! Everyone else guesses."));
      var chips = el("div", "chip-grid");
      ["Mixed", "Animals", "Movies", "Actions"].forEach(function (cat) {
        var c = el("button", "chip" + (category === cat ? " chip-on" : ""), cat);
        c.type = "button";
        c.addEventListener("click", function () { category = cat; renderSetup(); });
        chips.appendChild(c);
      });
      wrap.appendChild(chips);
      var start = el("button", "game-cta", "Start acting 🎬");
      start.type = "button";
      start.addEventListener("click", renderWord);
      wrap.appendChild(start);
      root.appendChild(wrap);
    }

    function renderWord() {
      if (timer) timer.stop();
      clear(root);
      var list = pool();
      var word = list[Math.floor(Math.random() * list.length)];
      var wrap = el("div", "game-pane game-center");
      addTurn(wrap, api);
      wrap.appendChild(el("p", "game-lead", "Actor: act this out! (Don't say it 🤫)"));
      wrap.appendChild(el("div", "prompt-card", word));
      var timesUp = el("div", "game-verdict bad", "⏰ Time's up!");
      timesUp.hidden = true;
      timer = makeTimer(60, null, function () { timesUp.hidden = false; });
      wrap.appendChild(timer.el);
      wrap.appendChild(timesUp);

      var got = el("button", "game-cta", "Guessed it! ⭐");
      got.type = "button";
      got.addEventListener("click", function () {
        if (timer) timer.stop();
        api.confetti(); award(api, 2); renderWord();
      });
      wrap.appendChild(got);
      var skip = el("button", "game-cta ghost", "New word 🔁");
      skip.type = "button";
      skip.addEventListener("click", renderWord);
      wrap.appendChild(skip);
      var back = el("button", "game-cta ghost", "↩ Categories");
      back.type = "button";
      back.addEventListener("click", renderSetup);
      wrap.appendChild(back);
      root.appendChild(wrap);
    }

    renderSetup();
  }

  // =======================================================================
  // 10. I SPY
  // =======================================================================
  var SPY_COLORS = [
    { n: "red", c: "#ef4444" }, { n: "blue", c: "#3b82f6" }, { n: "green", c: "#16a34a" },
    { n: "yellow", c: "#eab308" }, { n: "white", c: "#9ca3af" }, { n: "black", c: "#374151" },
    { n: "orange", c: "#f97316" }, { n: "silver", c: "#9ca3af" }, { n: "pink", c: "#ec4899" },
    { n: "brown", c: "#92400e" }, { n: "purple", c: "#8b5cf6" }
  ];

  function iSpyGame(root, api) {
    var timer = null;
    api.onCleanup(function () { if (timer) timer.stop(); });

    function renderRound() {
      if (timer) timer.stop();
      clear(root);
      var col = SPY_COLORS[Math.floor(Math.random() * SPY_COLORS.length)];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "👀"));
      wrap.appendChild(el("p", "game-lead", "I spy with my little eye… something"));
      var word = el("div", "sing-word", col.n.toUpperCase());
      word.style.color = col.c;
      wrap.appendChild(word);
      var done = el("div", "game-verdict good", "🎉 Point it out!");
      done.hidden = true;
      timer = makeTimer(30, null, function () { done.hidden = false; });
      wrap.appendChild(timer.el);
      wrap.appendChild(done);

      var found = el("button", "game-cta", "Found it! ⭐");
      found.type = "button";
      found.addEventListener("click", function () {
        if (timer) timer.stop();
        api.confetti(); api.addStars(1); renderRound();
      });
      wrap.appendChild(found);
      var skip = el("button", "game-cta ghost", "New color 🔁");
      skip.type = "button";
      skip.addEventListener("click", renderRound);
      wrap.appendChild(skip);
      root.appendChild(wrap);
    }

    renderRound();
  }

  // =======================================================================
  // 11. ROCK PAPER SCISSORS
  // =======================================================================
  var RPS = [{ n: "Rock", e: "✊" }, { n: "Paper", e: "✋" }, { n: "Scissors", e: "✌️" }];

  function rpsGame(root, api) {
    var timeoutId = null;
    api.onCleanup(function () { if (timeoutId) clearTimeout(timeoutId); });

    function renderStart() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "✊✋✌️"));
      wrap.appendChild(el("p", "game-lead", 'Everyone shoots against the app on "Shoot!"'));
      var go = el("button", "game-cta", "Start round 🥊");
      go.type = "button";
      go.addEventListener("click", countdown);
      wrap.appendChild(go);
      root.appendChild(wrap);
    }

    function countdown() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      var big = el("div", "rps-count", "3");
      wrap.appendChild(big);
      root.appendChild(wrap);
      var seq = ["3", "2", "1", "Shoot!"];
      var i = 0;
      function step() {
        i += 1;
        if (i < seq.length) { big.textContent = seq[i]; timeoutId = setTimeout(step, 750); }
        else reveal();
      }
      timeoutId = setTimeout(step, 750);
    }

    function reveal() {
      clear(root);
      var t = RPS[Math.floor(Math.random() * 3)];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("p", "game-lead", "The app throws…"));
      wrap.appendChild(el("div", "rps-throw", t.e));
      wrap.appendChild(el("h3", "game-result-title", t.n + "!"));
      wrap.appendChild(el("p", "game-lead", "Did you beat it? 🏆"));
      var again = el("button", "game-cta", "Play again 🔁");
      again.type = "button";
      again.addEventListener("click", function () { api.addStars(1); countdown(); });
      wrap.appendChild(again);
      root.appendChild(wrap);
    }

    renderStart();
  }

  // =======================================================================
  // 12. ALPHABET ROAD HUNT
  // =======================================================================
  function alphabetGame(root, api) {
    var got = {};
    var awarded = false;
    var countEl = null;

    function foundCount() {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(function (L) { return got[L]; }).length;
    }

    function refresh() {
      var n = foundCount();
      if (countEl) countEl.textContent = n + " / 26 found";
      if (n === 26 && !awarded) { awarded = true; api.confetti(); api.addStars(5); }
      if (n < 26) awarded = false;
    }

    function render() {
      clear(root);
      var wrap = el("div", "game-pane");
      wrap.appendChild(el("p", "game-lead", "Spot a word starting with each letter (signs, plates, shops). Tap it when you find one!"));
      var grid = el("div", "alpha-grid");
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
        var cell = el("button", "alpha-cell" + (got[L] ? " got" : ""), L);
        cell.type = "button";
        cell.addEventListener("click", function () {
          got[L] = !got[L];
          cell.classList.toggle("got");
          refresh();
        });
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      countEl = el("p", "game-lead", foundCount() + " / 26 found");
      wrap.appendChild(countEl);
      var reset = el("button", "game-cta ghost", "Reset 🔁");
      reset.type = "button";
      reset.addEventListener("click", function () { got = {}; awarded = false; render(); });
      wrap.appendChild(reset);
      root.appendChild(wrap);
    }

    render();
  }

  // =======================================================================
  // 13. RIDDLE ME THIS
  // =======================================================================
  var RIDDLES = [
    { q: "What has hands but can't clap?", a: "A clock" },
    { q: "What has to be broken before you can use it?", a: "An egg" },
    { q: "What goes up but never comes down?", a: "Your age" },
    { q: "What has a neck but no head?", a: "A bottle" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "What has one eye but cannot see?", a: "A needle" },
    { q: "What has teeth but cannot bite?", a: "A comb" },
    { q: "What can you catch but never throw?", a: "A cold" },
    { q: "What has legs but doesn't walk?", a: "A table" },
    { q: "What has words but never speaks?", a: "A book" },
    { q: "What is full of holes but still holds water?", a: "A sponge" },
    { q: "What building has the most stories?", a: "A library" }
  ];

  function riddleGame(root, api) {
    var deck = shuffle(RIDDLES);
    var i = 0;
    function render() {
      clear(root);
      var item = deck[i % deck.length];
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🧩"));
      wrap.appendChild(el("div", "prompt-card", item.q));
      var answer = el("div", "game-verdict good", "💡 " + item.a);
      answer.hidden = true;
      wrap.appendChild(answer);
      var got = el("button", "game-cta", "We solved it! ⭐");
      got.type = "button";
      got.addEventListener("click", function () { api.confetti(); api.addStars(1); i += 1; render(); });
      wrap.appendChild(got);
      var reveal = el("button", "game-cta ghost", "Reveal answer 👀");
      reveal.type = "button";
      reveal.addEventListener("click", function () { answer.hidden = false; reveal.hidden = true; });
      wrap.appendChild(reveal);
      var next = el("button", "game-cta ghost", "Skip / Next →");
      next.type = "button";
      next.addEventListener("click", function () { i += 1; render(); });
      wrap.appendChild(next);
      root.appendChild(wrap);
    }
    render();
  }

  // =======================================================================
  // 14. SIMON SAYS
  // =======================================================================
  var SIMON = ["touch your nose", "raise both hands", "pat your head", "wiggle your fingers",
    "clap twice", "make a fish face", "stick out your tongue", "blink really fast",
    "shrug your shoulders", "wave hello", "touch your ears", "give a thumbs up", "spin your finger"];

  function simonGame(root, api) {
    function render() {
      clear(root);
      var cmd = SIMON[Math.floor(Math.random() * SIMON.length)];
      var says = Math.random() < 0.6;
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🫡"));
      wrap.appendChild(el("p", "game-lead", "Only do it if Simon says!"));
      wrap.appendChild(el("div", "prompt-card", (says ? "Simon says: " : "") + cmd));
      var next = el("button", "game-cta", "Next command →");
      next.type = "button";
      next.addEventListener("click", function () { api.addStars(1); render(); });
      wrap.appendChild(next);
      root.appendChild(wrap);
    }
    render();
  }

  // =======================================================================
  // REUSABLE ENGINES (data-driven games are built from these)
  // =======================================================================

  // Multiple-choice quiz with a per-question timer + score.
  function quizEngine(bank, pickCount) {
    var take = pickCount || 6;
    return function (root, api) {
      var questions = shuffle(bank).slice(0, Math.min(take, bank.length));
      var idx = 0, score = 0, timer = null;
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
        timer = makeTimer(20, null, function () { if (!answered) reveal(-1); });
        wrap.appendChild(timer.el);
        wrap.appendChild(el("h3", "quiz-question", item.q));
        var opts = el("div", "quiz-options"), buttons = [];
        item.a.forEach(function (text, i) {
          var b = el("button", "quiz-option", text);
          b.type = "button";
          b.addEventListener("click", function () { if (!answered) reveal(i); });
          buttons.push(b); opts.appendChild(b);
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
          if (chosen === item.c) score += 1;
          var next = el("button", "game-cta", idx + 1 < questions.length ? "Next question →" : "See results 🎉");
          next.type = "button";
          next.addEventListener("click", function () {
            idx += 1;
            if (idx < questions.length) renderQuestion(); else renderResults();
          });
          wrap.appendChild(next);
        }
      }
      function renderResults() {
        if (timer) timer.stop();
        clear(root);
        var wrap = el("div", "game-pane game-center");
        var pct = score / questions.length;
        wrap.appendChild(el("div", "game-big-emoji", pct === 1 ? "🌟" : pct >= 0.6 ? "🎉" : "🚀"));
        wrap.appendChild(el("h3", "game-result-title", "You scored " + score + " / " + questions.length));
        wrap.appendChild(el("p", "game-lead", pct >= 0.6 ? "Awesome teamwork!" : "Play again to beat it!"));
        if (pct >= 0.6) api.confetti();
        api.addStars(score);
        var again = el("button", "game-cta", "Play again 🔁");
        again.type = "button";
        again.addEventListener("click", function () {
          questions = shuffle(bank).slice(0, Math.min(take, bank.length));
          idx = 0; score = 0; renderQuestion();
        });
        wrap.appendChild(again);
        root.appendChild(wrap);
      }
      renderQuestion();
    };
  }

  // Show a clue/emoji, tap to reveal the answer. items: { q, a }.
  function revealEngine(items, opts) {
    opts = opts || {};
    return function (root, api) {
      var deck = shuffle(items), i = 0;
      function render() {
        clear(root);
        var item = deck[i % deck.length];
        var wrap = el("div", "game-pane game-center");
        if (opts.emoji) wrap.appendChild(el("div", "game-big-emoji", opts.emoji));
        if (opts.lead) wrap.appendChild(el("p", "game-lead", opts.lead));
        if (opts.display === "emoji") wrap.appendChild(el("div", "emoji-riddle", item.q));
        else wrap.appendChild(el("div", "prompt-card", item.q));
        var answer = el("div", "game-verdict good", "💡 " + item.a);
        answer.hidden = true;
        wrap.appendChild(answer);
        var got = el("button", "game-cta", "We got it! ⭐");
        got.type = "button";
        got.addEventListener("click", function () { api.confetti(); api.addStars(1); i += 1; render(); });
        wrap.appendChild(got);
        var reveal = el("button", "game-cta ghost", "Reveal answer 👀");
        reveal.type = "button";
        reveal.addEventListener("click", function () { answer.hidden = false; reveal.hidden = true; });
        wrap.appendChild(reveal);
        var next = el("button", "game-cta ghost", "Skip / Next →");
        next.type = "button";
        next.addEventListener("click", function () { i += 1; render(); });
        wrap.appendChild(next);
        root.appendChild(wrap);
      }
      render();
    };
  }

  // Show a prompt card, "Next" advances and awards a star. items: strings.
  function promptDeckEngine(items, opts) {
    opts = opts || {};
    return function (root, api) {
      var deck = shuffle(items), i = 0;
      function render() {
        clear(root);
        var raw = deck[i % deck.length];
        var text = opts.transform ? opts.transform(raw) : raw;
        var wrap = el("div", "game-pane game-center");
        addTurn(wrap, api);
        if (opts.emoji) wrap.appendChild(el("div", "game-big-emoji", opts.emoji));
        if (opts.lead) wrap.appendChild(el("p", "game-lead", opts.lead));
        wrap.appendChild(el("div", "prompt-card", text));
        if (opts.note) wrap.appendChild(el("p", "game-lead", opts.note));
        var next = el("button", "game-cta", opts.cta || "Next →");
        next.type = "button";
        next.addEventListener("click", function () { award(api, 1); i += 1; render(); });
        wrap.appendChild(next);
        root.appendChild(wrap);
      }
      render();
    };
  }

  // Two big choices (would you rather / this or that). pairs: [a, b].
  function twoChoiceEngine(pairs, opts) {
    opts = opts || {};
    return function (root, api) {
      var deck = shuffle(pairs), i = 0;
      function render() {
        clear(root);
        var pair = deck[i % deck.length];
        var wrap = el("div", "game-pane game-center");
        addTurn(wrap, api);
        if (opts.emoji) wrap.appendChild(el("div", "game-big-emoji", opts.emoji));
        wrap.appendChild(el("p", "game-lead", opts.lead || "Would you rather…"));
        var a = el("button", "wyr-option wyr-a", null);
        a.type = "button"; a.appendChild(el("span", "wyr-text", pair[0]));
        var b = el("button", "wyr-option wyr-b", null);
        b.type = "button"; b.appendChild(el("span", "wyr-text", pair[1]));
        function choose(btn) {
          a.disabled = true; b.disabled = true; btn.classList.add("wyr-picked");
          award(api, 1); setTimeout(function () { i += 1; render(); }, 700);
        }
        a.addEventListener("click", function () { choose(a); });
        b.addEventListener("click", function () { choose(b); });
        wrap.appendChild(a); wrap.appendChild(el("div", "wyr-or", "OR")); wrap.appendChild(b);
        var skip = el("button", "game-cta ghost", "Next one →");
        skip.type = "button";
        skip.addEventListener("click", function () { i += 1; render(); });
        wrap.appendChild(skip);
        root.appendChild(wrap);
      }
      render();
    };
  }

  // A timed challenge with a Done button. items: strings (or {n,c} for color).
  function timerChallengeEngine(items, opts) {
    opts = opts || {};
    return function (root, api) {
      var timer = null, deck = shuffle(items), i = 0;
      api.onCleanup(function () { if (timer) timer.stop(); });
      function render() {
        if (timer) timer.stop();
        clear(root);
        var raw = deck[i % deck.length];
        var wrap = el("div", "game-pane game-center");
        addTurn(wrap, api);
        if (opts.emoji) wrap.appendChild(el("div", "game-big-emoji", opts.emoji));
        if (opts.lead) wrap.appendChild(el("p", "game-lead", opts.lead));
        if (opts.display === "color") {
          var w = el("div", "sing-word", raw.n.toUpperCase());
          w.style.color = raw.c; wrap.appendChild(w);
        } else if (opts.display === "big") {
          wrap.appendChild(el("div", "sing-word", raw));
        } else {
          wrap.appendChild(el("div", "prompt-card", raw));
        }
        var done = el("div", "game-verdict good", opts.timeUpText || "⏰ Time!");
        done.hidden = true;
        timer = makeTimer(opts.seconds || 30, null, function () { done.hidden = false; });
        wrap.appendChild(timer.el);
        wrap.appendChild(done);
        var got = el("button", "game-cta", opts.doneLabel || "Done! ⭐");
        got.type = "button";
        got.addEventListener("click", function () {
          if (timer) timer.stop(); api.confetti(); award(api, 1); i += 1; render();
        });
        wrap.appendChild(got);
        var skip = el("button", "game-cta ghost", "New one 🔁");
        skip.type = "button";
        skip.addEventListener("click", function () { i += 1; render(); });
        wrap.appendChild(skip);
        root.appendChild(wrap);
      }
      render();
    };
  }

  // =======================================================================
  // DATA CATALOG (feeds the engines above)
  // =======================================================================

  // --- Themed quizzes ---
  var QZ_ANIMALS = [
    { q: "Which animal is the tallest?", a: ["Giraffe", "Horse", "Camel", "Ostrich"], c: 0 },
    { q: "How many legs does an insect have?", a: ["4", "6", "8", "10"], c: 1 },
    { q: "Which animal is known as the king of the jungle?", a: ["Tiger", "Elephant", "Lion", "Bear"], c: 2 },
    { q: "What do you call a baby kangaroo?", a: ["Cub", "Joey", "Kit", "Calf"], c: 1 },
    { q: "Which animal can change its color?", a: ["Chameleon", "Zebra", "Panda", "Wolf"], c: 0 },
    { q: "What is the largest animal on Earth?", a: ["Elephant", "Blue whale", "Giraffe", "Shark"], c: 1 },
    { q: "Which bird cannot fly?", a: ["Eagle", "Sparrow", "Penguin", "Parrot"], c: 2 },
    { q: "How many hearts does an octopus have?", a: ["1", "2", "3", "5"], c: 2 }
  ];
  var QZ_SPACE = [
    { q: "Which planet is closest to the Sun?", a: ["Earth", "Mercury", "Mars", "Venus"], c: 1 },
    { q: "What do we call a shooting star?", a: ["Comet", "Meteor", "Planet", "Moon"], c: 1 },
    { q: "Which planet has the most rings?", a: ["Mars", "Earth", "Saturn", "Venus"], c: 2 },
    { q: "What is the name of our galaxy?", a: ["Andromeda", "Milky Way", "Big Dipper", "Orion"], c: 1 },
    { q: "Who was the first to walk on the Moon?", a: ["Neil Armstrong", "Buzz Lightyear", "Yuri Gagarin", "Elon Musk"], c: 0 },
    { q: "What star is at the center of our solar system?", a: ["The Moon", "The Sun", "Mars", "Polaris"], c: 1 },
    { q: "Which planet is called the Red Planet?", a: ["Jupiter", "Mars", "Neptune", "Venus"], c: 1 }
  ];
  var QZ_GEO = [
    { q: "Which is the largest ocean?", a: ["Atlantic", "Indian", "Pacific", "Arctic"], c: 2 },
    { q: "How many continents are there?", a: ["5", "6", "7", "8"], c: 2 },
    { q: "Which country has the most people?", a: ["USA", "India", "Russia", "Brazil"], c: 1 },
    { q: "What is the tallest mountain?", a: ["K2", "Everest", "Kilimanjaro", "Alps"], c: 1 },
    { q: "Which desert is the biggest?", a: ["Sahara", "Gobi", "Mojave", "Arctic"], c: 0 },
    { q: "Which river is the longest?", a: ["Amazon", "Nile", "Yangtze", "Danube"], c: 1 },
    { q: "What color are most stop signs?", a: ["Green", "Blue", "Red", "Yellow"], c: 2 }
  ];
  var QZ_SCIENCE = [
    { q: "What do plants breathe in?", a: ["Oxygen", "Carbon dioxide", "Helium", "Water"], c: 1 },
    { q: "What is H2O better known as?", a: ["Salt", "Water", "Air", "Sugar"], c: 1 },
    { q: "What force pulls us to the ground?", a: ["Magnetism", "Gravity", "Wind", "Friction"], c: 1 },
    { q: "How many bones does an adult have?", a: ["106", "206", "306", "406"], c: 1 },
    { q: "What do bees collect from flowers?", a: ["Water", "Nectar", "Sand", "Leaves"], c: 1 },
    { q: "What state is ice?", a: ["Liquid", "Gas", "Solid", "Plasma"], c: 2 },
    { q: "What gives plants their green color?", a: ["Chlorophyll", "Sunlight", "Soil", "Water"], c: 0 }
  ];
  var QZ_FOOD = [
    { q: "Which fruit keeps the doctor away?", a: ["Banana", "Apple", "Orange", "Grape"], c: 1 },
    { q: "What is the main ingredient in bread?", a: ["Rice", "Flour", "Sugar", "Milk"], c: 1 },
    { q: "Which food comes from cows?", a: ["Honey", "Milk", "Eggs", "Apples"], c: 1 },
    { q: "What vegetable makes you cry?", a: ["Carrot", "Onion", "Potato", "Pea"], c: 1 },
    { q: "Which is a citrus fruit?", a: ["Lemon", "Apple", "Banana", "Cherry"], c: 0 },
    { q: "What is popcorn made from?", a: ["Wheat", "Corn", "Rice", "Oats"], c: 1 },
    { q: "Which dessert is frozen?", a: ["Cake", "Ice cream", "Pie", "Cookie"], c: 1 }
  ];
  var QZ_MOVIES = [
    { q: "In Frozen, who has ice powers?", a: ["Anna", "Elsa", "Olaf", "Kristoff"], c: 1 },
    { q: "What kind of fish is Nemo?", a: ["Shark", "Clownfish", "Goldfish", "Tuna"], c: 1 },
    { q: "In Toy Story, who is the cowboy?", a: ["Buzz", "Woody", "Rex", "Hamm"], c: 1 },
    { q: "What animal is Simba in The Lion King?", a: ["Tiger", "Lion", "Leopard", "Cheetah"], c: 1 },
    { q: "In Moana, who is the demigod?", a: ["Maui", "Pua", "Hei Hei", "Tui"], c: 0 },
    { q: "What color is Shrek?", a: ["Blue", "Green", "Purple", "Brown"], c: 1 },
    { q: "In Cars, what is Lightning McQueen?", a: ["A truck", "A race car", "A plane", "A boat"], c: 1 }
  ];
  var QZ_SPORTS = [
    { q: "How many players on a soccer team on the field?", a: ["9", "10", "11", "12"], c: 2 },
    { q: "In basketball, what do you score?", a: ["Goals", "Points", "Runs", "Tries"], c: 1 },
    { q: "What sport uses a racket and a net?", a: ["Golf", "Tennis", "Boxing", "Rowing"], c: 1 },
    { q: "How many rings are on the Olympic flag?", a: ["4", "5", "6", "7"], c: 1 },
    { q: "In which sport do you hit a home run?", a: ["Cricket", "Baseball", "Hockey", "Rugby"], c: 1 },
    { q: "What do swimmers swim in?", a: ["A court", "A pool", "A track", "A ring"], c: 1 }
  ];
  var QZ_BODY = [
    { q: "Which organ pumps blood?", a: ["Brain", "Heart", "Lungs", "Liver"], c: 1 },
    { q: "How many teeth does an adult usually have?", a: ["20", "28", "32", "40"], c: 2 },
    { q: "What do we use to smell?", a: ["Ears", "Nose", "Eyes", "Tongue"], c: 1 },
    { q: "Which part helps us think?", a: ["Heart", "Brain", "Stomach", "Feet"], c: 1 },
    { q: "How many fingers on two hands?", a: ["8", "10", "12", "5"], c: 1 },
    { q: "What covers and protects your body?", a: ["Bones", "Skin", "Hair", "Blood"], c: 1 }
  ];
  var QZ_SILLY = [
    { q: "What sound does a cow make?", a: ["Woof", "Moo", "Meow", "Quack"], c: 1 },
    { q: "What has a trunk but isn't a tree?", a: ["Dog", "Elephant", "Cat", "Fish"], c: 1 },
    { q: "How many days in a leap year?", a: ["365", "366", "364", "367"], c: 1 },
    { q: "What color do you get mixing blue and yellow?", a: ["Green", "Purple", "Orange", "Pink"], c: 0 },
    { q: "What melts in the sun?", a: ["A rock", "Ice cream", "A spoon", "A cup"], c: 1 },
    { q: "Which is heaviest?", a: ["A feather", "A brick", "A leaf", "A balloon"], c: 1 }
  ];

  // --- Reveal / guess decks ---
  var RV_BRAINTEASERS = [
    { q: "I have keys but no locks. What am I?", a: "A keyboard (or piano!)" },
    { q: "The more you take, the more you leave behind. What are they?", a: "Footsteps" },
    { q: "I get shorter as I get older. What am I?", a: "A candle" },
    { q: "What can travel around the world staying in one corner?", a: "A stamp" },
    { q: "What has many keys but can't open a door?", a: "A piano" },
    { q: "What runs but never walks?", a: "Water (a river)" },
    { q: "The more of me you take, the more you leave behind. What am I?", a: "Footprints" },
    { q: "What has a thumb and four fingers but is not alive?", a: "A glove" },
    { q: "What can you break without touching it?", a: "A promise" },
    { q: "What goes through towns and hills but never moves?", a: "A road" }
  ];
  var RV_WHATAMI = [
    { q: "I'm gray, huge, and have a long trunk. What am I?", a: "An elephant" },
    { q: "I hop, have big ears, and love carrots. What am I?", a: "A rabbit" },
    { q: "I have a mane, roar loudly, and live on the savanna. What am I?", a: "A lion" },
    { q: "I'm black and white and love bamboo. What am I?", a: "A panda" },
    { q: "I have a shell and move very slowly. What am I?", a: "A tortoise" },
    { q: "I buzz, make honey, and live in a hive. What am I?", a: "A bee" },
    { q: "I have stripes and look like a horse. What am I?", a: "A zebra" },
    { q: "I swing in trees and love bananas. What am I?", a: "A monkey" },
    { q: "I'm the tallest animal with a very long neck. What am I?", a: "A giraffe" },
    { q: "I have eight arms and live in the sea. What am I?", a: "An octopus" }
  ];
  var RV_COUNTRY = [
    { q: "Home of the Eiffel Tower and croissants.", a: "France" },
    { q: "Land of pizza, pasta, and the Colosseum.", a: "Italy" },
    { q: "Famous for kangaroos and the Outback.", a: "Australia" },
    { q: "Home of the pyramids and the Nile.", a: "Egypt" },
    { q: "Land of sushi, ninjas, and Mount Fuji.", a: "Japan" },
    { q: "Home of the Statue of Liberty.", a: "USA" },
    { q: "Land of maple syrup and moose.", a: "Canada" },
    { q: "Home of the Taj Mahal and lots of spices.", a: "India" },
    { q: "Famous for the Amazon rainforest and carnival.", a: "Brazil" },
    { q: "Home of Big Ben and red buses.", a: "England (UK)" }
  ];
  var RV_JOKES = [
    { q: "Why did the scarecrow win an award?", a: "He was outstanding in his field!" },
    { q: "What do you call cheese that isn't yours?", a: "Nacho cheese!" },
    { q: "Why can't your nose be 12 inches long?", a: "Because then it'd be a foot!" },
    { q: "What do you call a bear with no teeth?", a: "A gummy bear!" },
    { q: "Why did the bicycle fall over?", a: "It was two-tired!" },
    { q: "What has ears but can't hear?", a: "A cornfield!" },
    { q: "Why did the cookie go to the doctor?", a: "It was feeling crumby!" },
    { q: "What do you call a fish with no eyes?", a: "A fsh!" },
    { q: "What did the ocean say to the beach?", a: "Nothing, it just waved!" },
    { q: "Why are ghosts bad at lying?", a: "Because you can see right through them!" },
    { q: "What's brown and sticky?", a: "A stick!" },
    { q: "How do you make a tissue dance?", a: "Put a little boogie in it!" }
  ];
  var RV_EMOJI_FOOD = [
    { q: "🍎🥧", a: "Apple pie" }, { q: "🌭", a: "Hot dog" }, { q: "🍔🍟", a: "Burger and fries" },
    { q: "🍝🧀", a: "Mac and cheese / pasta" }, { q: "🥞🍯", a: "Pancakes" }, { q: "🍕", a: "Pizza" },
    { q: "🍣🍚", a: "Sushi" }, { q: "🌮", a: "Taco" }, { q: "🍩☕", a: "Donut and coffee" },
    { q: "🥪", a: "Sandwich" }, { q: "🍦🍨", a: "Ice cream" }, { q: "🥤🍿", a: "Movie snacks" }
  ];
  var RV_EMOJI_ANIMALS = [
    { q: "🦓", a: "Zebra" }, { q: "🐘", a: "Elephant" }, { q: "🦒", a: "Giraffe" }, { q: "🐧", a: "Penguin" },
    { q: "🦁", a: "Lion" }, { q: "🐙", a: "Octopus" }, { q: "🦘", a: "Kangaroo" }, { q: "🦊", a: "Fox" },
    { q: "🐢", a: "Turtle" }, { q: "🦜", a: "Parrot" }, { q: "🐝", a: "Bee" }, { q: "🦈", a: "Shark" }
  ];
  var RV_EMOJI_SONGS = [
    { q: "⭐🔭🌟", a: "Twinkle Twinkle Little Star" },
    { q: "🕷️☔", a: "Itsy Bitsy Spider" },
    { q: "🚣‍♂️🌊", a: "Row Row Row Your Boat" },
    { q: "🐑🐑⬛", a: "Baa Baa Black Sheep" },
    { q: "🎂🎉👶", a: "Happy Birthday" },
    { q: "🌧️☔🚶", a: "Rain Rain Go Away" },
    { q: "🐮🌈", a: "Old MacDonald (E-I-E-I-O)" },
    { q: "👏😀", a: "If You're Happy and You Know It" },
    { q: "🚌🎡", a: "Wheels on the Bus" },
    { q: "🦆🦆🦆", a: "Five Little Ducks" }
  ];

  // --- Prompt decks ---
  var PD_CONVO = [
    "What's the best thing that happened to you this week?",
    "If you could visit anywhere right now, where would we go?",
    "What's your favorite family memory?",
    "If you could eat only one meal forever, what would it be?",
    "What superpower would help most on a road trip?",
    "What's the funniest thing you've ever seen?",
    "If our car could talk, what would it say?",
    "What do you want to be when you grow up?",
    "What's your favorite thing about each person in this car?",
    "If you had a theme song, what would it be?",
    "What's the coolest animal you'd want to see today?",
    "What would you do with an extra hour today?",
    "What's a tiny thing that makes you really happy?",
    "If you could rename our car, what would you call it?"
  ];
  var PD_STORY = [
    "Once upon a time, in a car full of snacks…",
    "The map suddenly started glowing and…",
    "A friendly alien knocked on the window and asked…",
    "We took a wrong turn and discovered a town made of candy…",
    "The GPS said 'turn left into the rainbow' so we…",
    "A talking dog jumped into the back seat and said…",
    "Suddenly the car could fly, and we steered toward…",
    "At the gas station we found a mysterious golden key…",
    "The clouds spelled out a secret message that read…",
    "A dinosaur was crossing the road, and then…"
  ];
  var PD_FINISH = [
    "The silliest animal in the world is…",
    "If I ruled the world, the first rule would be…",
    "My dream treehouse would have…",
    "The best pizza topping ever is…",
    "If I had a robot, it would…",
    "The scariest thing about the ocean is…",
    "On my birthday I really want to…",
    "If I could shrink tiny, I'd explore…",
    "The best sound in the whole world is…",
    "My perfect day would start with…",
    "If animals could talk, my pet would say…",
    "The coolest invention ever would be…"
  ];
  var PD_COMPLIMENT = [
    "Tell the person on your left something you love about them.",
    "Say the funniest thing about someone in the car.",
    "Give someone a superhero name that fits them.",
    "Thank someone for something they did recently.",
    "Tell someone what they're really good at.",
    "Say what makes each person a great travel buddy.",
    "Give someone a nickname that's a compliment.",
    "Tell someone why they'd win an award today.",
    "Say something that always makes you smile about your family.",
    "Give a shout-out to the best snack-sharer in the car."
  ];
  var PD_SILLY = [
    "If you were a sandwich, what would be inside you?",
    "Would you rather have spaghetti hair or meatball ears?",
    "What would your pet name a human?",
    "If clouds tasted like food, which flavor would they be?",
    "What's the worst superhero power you can imagine?",
    "If you could be any size for a day, how big or small?",
    "What sound would you make as a car horn?",
    "If your shoes could talk, what would they complain about?",
    "What would you do with a pet dragon in the car?",
    "If you had to wear one costume forever, what is it?",
    "What's the silliest dance move you know?",
    "If vegetables had feelings, which one is the grumpiest?"
  ];
  var PD_FACE = [
    "Make your angriest face.", "Make your silliest face.", "Do a surprised face!",
    "Make a face like you smelled something stinky.", "Do your sleepiest yawn face.",
    "Make a face like you just won a million dollars.", "Do your best confused face.",
    "Make a fish face!", "Do your scariest monster face.", "Make the face you make eating a lemon.",
    "Do your proudest superhero face.", "Make a face like a grumpy cat."
  ];
  var PD_IMPRESSION = [
    "Do your best robot voice.", "Talk like a pirate.", "Act like a news reporter.",
    "Pretend to be a sleepy grandpa.", "Impersonate a cat.", "Talk like a superhero.",
    "Do an announcer voice for the next road sign.", "Pretend to be a tiny mouse.",
    "Act like a movie villain.", "Talk like a cowboy.", "Be a fancy royal king or queen.",
    "Do your best dinosaur roar."
  ];
  var PD_NEVER = [
    "Never have I ever fallen asleep in the car.",
    "Never have I ever eaten dessert before dinner.",
    "Never have I ever sung really loud in the shower.",
    "Never have I ever tripped in front of people.",
    "Never have I ever forgotten someone's name.",
    "Never have I ever laughed so hard I snorted.",
    "Never have I ever made a silly face in a photo.",
    "Never have I ever eaten something I dropped on the floor.",
    "Never have I ever pretended to be asleep.",
    "Never have I ever gotten lost in a store."
  ];
  var PD_FAVORITE = [
    "Best movie you've ever seen?", "Favorite ice cream flavor?", "Best vacation ever?",
    "Favorite animal and why?", "Best gift you've received?", "Favorite song right now?",
    "Best meal ever?", "Favorite game to play?", "Best holiday?", "Favorite season and why?",
    "Best book or story?", "Favorite thing to do on weekends?"
  ];
  var PD_TWOTRUTHS = [
    "Tell two true things and one lie about yourself — others guess the lie!",
    "Share two real facts and one fib about your day.",
    "Say two things you've really done and one you haven't.",
    "Two truths, one lie — about your favorite foods!",
    "Two truths, one lie — about places you've been!",
    "Two truths, one lie — about your hidden talents!",
    "Two truths, one lie — about your dreams!",
    "Two truths, one lie — about animals you've seen!"
  ];

  // --- This-or-that pairs ---
  var TC_THISORTHAT = [
    ["Pizza", "Tacos"], ["Beach", "Mountains"], ["Cats", "Dogs"], ["Summer", "Winter"],
    ["Sweet", "Salty"], ["Morning", "Night"], ["Books", "Movies"], ["Chocolate", "Vanilla"],
    ["Superpowers: flying", "invisibility"], ["Robots", "Dinosaurs"], ["Rollercoaster", "Waterslide"],
    ["Pancakes", "Waffles"], ["Rain", "Snow"], ["Drawing", "Singing"]
  ];
  var TC_SUPER = [
    ["read minds", "teleport"], ["super strength", "super speed"], ["talk to animals", "breathe underwater"],
    ["turn invisible", "shoot lasers"], ["control fire", "control ice"], ["fly", "run super fast"],
    ["shrink tiny", "grow giant"], ["time travel", "stop time"], ["super hearing", "x-ray vision"],
    ["heal any wound", "never get tired"]
  ];
  var TC_FOOD = [
    ["only pizza forever", "only burgers forever"], ["chocolate river", "candy mountain"],
    ["giant cookie", "giant cupcake"], ["ice cream for breakfast", "cake for dinner"],
    ["spicy food", "sweet food"], ["french fries", "onion rings"], ["milkshake", "smoothie"],
    ["popcorn", "nachos"], ["pancakes", "donuts"], ["watermelon", "pineapple"]
  ];

  // --- Timer challenges ---
  var TM_NAME5 = [
    "Name 5 animals!", "Name 5 fruits!", "Name 5 colors!", "Name 5 movies!", "Name 5 sports!",
    "Name 5 countries!", "Name 5 things that are red!", "Name 5 pizza toppings!", "Name 5 jobs!",
    "Name 5 things in the sky!", "Name 5 cartoon characters!", "Name 5 things you pack for a trip!",
    "Name 5 things that fly!", "Name 5 ice cream flavors!"
  ];
  var TM_TONGUE = [
    "She sells seashells by the seashore.", "Red lorry, yellow lorry (say it 5x).",
    "Peter Piper picked a peck of pickled peppers.", "How much wood would a woodchuck chuck?",
    "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.", "Toy boat, toy boat, toy boat (say 5x).",
    "A proper copper coffee pot.", "Six slippery snails slid slowly seaward.",
    "Unique New York (say it 5x).", "Betty bought a bit of butter."
  ];
  var TM_SCAVENGER = [
    "Spot a red car!", "Find a truck!", "Spot an animal outside!", "Find a bridge!",
    "Spot a flag!", "Find a motorcycle!", "Spot a gas station!", "Find a school bus!",
    "Spot something yellow!", "Find a tree taller than a house!", "Spot a bird!", "Find a funny sign!"
  ];
  var TM_HUM = [
    "Hum 'Happy Birthday' — others guess!", "Hum your favorite song!", "Hum a TV theme song!",
    "Hum a nursery rhyme!", "Hum a movie song!", "Hum any pop song!", "Hum a holiday song!"
  ];
  var TM_CATEGORY = [
    "Say a word that rhymes with 'cat' — keep going!", "Take turns naming zoo animals!",
    "Take turns naming things that are cold!", "Name things you'd find at the beach!",
    "Name things that are round!", "Name things that make noise!", "Name things that are soft!"
  ];

  // =======================================================================
  // NEW BESPOKE GAMES
  // =======================================================================

  // License Plate Bingo — tap spots as you see them; fill the card to win.
  var BINGO_ITEMS = [
    { e: "🚚", t: "Truck" }, { e: "🏍️", t: "Motorcycle" }, { e: "🚌", t: "Bus" },
    { e: "🚓", t: "Police car" }, { e: "🌉", t: "Bridge" }, { e: "🐄", t: "Cow" },
    { e: "🚩", t: "Flag" }, { e: "⛽", t: "Gas station" }, { e: "🐕", t: "Dog" },
    { e: "🚲", t: "Bicycle" }, { e: "🚜", t: "Tractor" }, { e: "🛑", t: "Stop sign" }
  ];
  function bingoGame(root, api) {
    var got = {}, awarded = false, countEl = null;
    function n() { return BINGO_ITEMS.filter(function (x, i) { return got[i]; }).length; }
    function refresh() {
      if (countEl) countEl.textContent = n() + " / " + BINGO_ITEMS.length + " spotted";
      if (n() === BINGO_ITEMS.length && !awarded) { awarded = true; api.confetti(); api.addStars(5); }
      if (n() < BINGO_ITEMS.length) awarded = false;
    }
    function render() {
      clear(root);
      var wrap = el("div", "game-pane");
      wrap.appendChild(el("p", "game-lead", "Tap each one as you spot it out the window. Fill the card for BINGO!"));
      var grid = el("div", "bingo-grid");
      BINGO_ITEMS.forEach(function (item, i) {
        var cell = el("button", "bingo-cell" + (got[i] ? " got" : ""), null);
        cell.type = "button";
        cell.appendChild(el("span", "bingo-emoji", item.e));
        cell.appendChild(el("span", "bingo-label", item.t));
        cell.addEventListener("click", function () {
          got[i] = !got[i];
          cell.classList.toggle("got");
          refresh();
        });
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      countEl = el("p", "game-lead", n() + " / " + BINGO_ITEMS.length + " spotted");
      wrap.appendChild(countEl);
      var reset = el("button", "game-cta ghost", "New card 🔁");
      reset.type = "button";
      reset.addEventListener("click", function () { got = {}; awarded = false; render(); });
      wrap.appendChild(reset);
      root.appendChild(wrap);
    }
    render();
  }

  // Spin the Chooser — decides who goes next / who does the dare.
  var CHOOSERS = [
    "the youngest person!", "the oldest person!", "whoever is sitting up front!",
    "whoever is wearing the most blue!", "the person with the longest hair!",
    "whoever laughed last!", "the person on the left!", "whoever is hungriest!",
    "the person who spoke last!", "whoever has the coolest socks!",
    "the person closest to a window!", "whoever woke up earliest today!"
  ];
  function spinGame(root, api) {
    var timeoutId = null;
    api.onCleanup(function () { if (timeoutId) clearTimeout(timeoutId); });
    function render(result) {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "spin-wheel" + (result ? "" : ""), "🎡"));
      if (result) {
        wrap.appendChild(el("h3", "game-result-title", "It's " + result));
      } else {
        wrap.appendChild(el("p", "game-lead", "Spin to pick who goes next!"));
      }
      var spin = el("button", "game-cta", result ? "Spin again 🔁" : "Spin! 🎯");
      spin.type = "button";
      spin.addEventListener("click", doSpin);
      wrap.appendChild(spin);
      root.appendChild(wrap);
    }
    function doSpin() {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      var wheel = el("div", "spin-wheel spinning", "🎡");
      wrap.appendChild(wheel);
      wrap.appendChild(el("p", "game-lead", "Spinning…"));
      root.appendChild(wrap);
      timeoutId = setTimeout(function () {
        api.addStars(1);
        var players = api.players ? api.players() : [];
        var result;
        if (players.length) {
          result = players[Math.floor(Math.random() * players.length)].name + "!";
        } else {
          result = CHOOSERS[Math.floor(Math.random() * CHOOSERS.length)];
        }
        render(result);
      }, 1100);
    }
    render(null);
  }

  // Dice Roller
  var DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  function diceGame(root, api) {
    function render(a, b) {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("p", "game-lead", "Tap to roll two dice!"));
      var row = el("div", "dice-row");
      row.appendChild(el("span", "dice", a != null ? DICE[a] : "🎲"));
      row.appendChild(el("span", "dice", b != null ? DICE[b] : "🎲"));
      wrap.appendChild(row);
      if (a != null) wrap.appendChild(el("h3", "game-result-title", "You rolled " + ((a + 1) + (b + 1)) + "!"));
      var roll = el("button", "game-cta", "Roll 🎲");
      roll.type = "button";
      roll.addEventListener("click", function () {
        render(Math.floor(Math.random() * 6), Math.floor(Math.random() * 6));
      });
      wrap.appendChild(roll);
      root.appendChild(wrap);
    }
    render(null, null);
  }

  // Coin Flip
  function coinGame(root, api) {
    function render(result) {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "coin", result === "Heads" ? "😎" : result === "Tails" ? "🪙" : "🪙"));
      wrap.appendChild(el("h3", "game-result-title", result ? result + "!" : "Heads or Tails?"));
      var flip = el("button", "game-cta", result ? "Flip again 🔁" : "Flip the coin 🪙");
      flip.type = "button";
      flip.addEventListener("click", function () {
        render(Math.random() < 0.5 ? "Heads" : "Tails");
      });
      wrap.appendChild(flip);
      root.appendChild(wrap);
    }
    render(null);
  }

  // Quiet Game — who can stay silent the longest (parents love it!).
  function quietGame(root, api) {
    var timer = null;
    api.onCleanup(function () { if (timer) timer.stop(); });
    function renderStart() {
      if (timer) timer.stop();
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🤫"));
      wrap.appendChild(el("p", "game-lead", "How long can everyone stay totally silent? Last one to make a sound wins!"));
      [30, 60, 120].forEach(function (secs) {
        var b = el("button", "game-cta" + (secs === 30 ? "" : " ghost"), "Start " + (secs < 60 ? secs + " seconds" : (secs / 60) + " minute" + (secs > 60 ? "s" : "")) + " 🔇");
        b.type = "button";
        b.addEventListener("click", function () { renderRun(secs); });
        wrap.appendChild(b);
      });
      root.appendChild(wrap);
    }
    function renderRun(secs) {
      if (timer) timer.stop();
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🤐"));
      wrap.appendChild(el("p", "game-lead", "Shhh… stay silent!"));
      var done = el("div", "game-verdict good", "🎉 You made it! Everybody wins!");
      done.hidden = true;
      timer = makeTimer(secs, null, function () { done.hidden = false; api.confetti(); api.addStars(3); });
      wrap.appendChild(timer.el);
      wrap.appendChild(done);
      var stop = el("button", "game-cta ghost", "End round");
      stop.type = "button";
      stop.addEventListener("click", renderStart);
      wrap.appendChild(stop);
      root.appendChild(wrap);
    }
    renderStart();
  }

  // =======================================================================
  // MUSIC GAMES (app plays melodies via the Web Audio API — no files needed)
  // =======================================================================
  var audioCtx = null;
  function getCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  var NOTE_FREQ = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, REST: 0
  };

  // Play a melody: seq is [[note, beats], ...]. Returns { stop }.
  function playMelody(seq, opts) {
    opts = opts || {};
    var ctx = getCtx();
    if (!ctx) return { stop: function () {} };
    var beat = 60 / (opts.bpm || 140);
    var t = ctx.currentTime + 0.06;
    var master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    var oscs = [];
    seq.forEach(function (n) {
      var dur = n[1] * beat;
      var freq = NOTE_FREQ[n[0]] || 0;
      if (freq > 0) {
        var osc = ctx.createOscillator();
        osc.type = opts.wave || "triangle";
        osc.frequency.value = freq;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(1, t + 0.02);
        g.gain.setValueAtTime(1, t + dur * 0.75);
        g.gain.linearRampToValueAtTime(0, t + dur * 0.97);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + dur);
        oscs.push(osc);
      }
      t += dur;
    });
    return {
      stop: function () {
        oscs.forEach(function (o) { try { o.stop(); } catch (e) {} });
        try { master.disconnect(); } catch (e) {}
      }
    };
  }

  // Name That Tune — the app plays a classic melody; players guess the song.
  var TUNES = [
    { name: "Twinkle Twinkle Little Star", bpm: 150, notes: [
      ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],
      ["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2] ] },
    { name: "Mary Had a Little Lamb", bpm: 150, notes: [
      ["E4",1],["D4",1],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],
      ["D4",1],["D4",1],["D4",2],["E4",1],["G4",1],["G4",2] ] },
    { name: "Jingle Bells", bpm: 160, notes: [
      ["E4",1],["E4",1],["E4",2],["E4",1],["E4",1],["E4",2],
      ["E4",1],["G4",1],["C4",1],["D4",1],["E4",4] ] },
    { name: "Happy Birthday", bpm: 140, notes: [
      ["G4",1],["G4",1],["A4",1],["G4",1],["C5",1],["B4",2],
      ["G4",1],["G4",1],["A4",1],["G4",1],["D5",1],["C5",2] ] },
    { name: "Old MacDonald Had a Farm", bpm: 150, notes: [
      ["G4",1],["G4",1],["G4",1],["D4",1],["E4",1],["E4",1],["D4",2],
      ["B4",1],["B4",1],["A4",1],["A4",1],["G4",2] ] },
    { name: "Row, Row, Row Your Boat", bpm: 150, notes: [
      ["C4",1],["C4",1],["C4",1],["D4",1],["E4",2],
      ["E4",1],["D4",1],["E4",1],["F4",1],["G4",3] ] },
    { name: "London Bridge", bpm: 150, notes: [
      ["G4",1],["A4",1],["G4",1],["F4",1],["E4",1],["F4",1],["G4",2],
      ["D4",1],["E4",1],["F4",2],["E4",1],["F4",1],["G4",2] ] },
    { name: "Ode to Joy", bpm: 150, notes: [
      ["E4",1],["E4",1],["F4",1],["G4",1],["G4",1],["F4",1],["E4",1],["D4",1],
      ["C4",1],["C4",1],["D4",1],["E4",1],["E4",2],["D4",2] ] },
    { name: "Frère Jacques (Are You Sleeping)", bpm: 150, notes: [
      ["C4",1],["D4",1],["E4",1],["C4",1],["C4",1],["D4",1],["E4",1],["C4",1],
      ["E4",1],["F4",1],["G4",2],["E4",1],["F4",1],["G4",2] ] }
  ];

  function nameThatTuneGame(root, api) {
    var deck = shuffle(TUNES), i = 0, current = null;
    api.onCleanup(function () { if (current) current.stop(); });
    function render() {
      if (current) { current.stop(); current = null; }
      clear(root);
      var tune = deck[i % deck.length];
      var wrap = el("div", "game-pane game-center");
      addTurn(wrap, api);
      wrap.appendChild(el("div", "game-big-emoji", "🎵"));
      wrap.appendChild(el("p", "game-lead", "Tap play and guess the song!"));
      var play = el("button", "game-cta", "▶ Play the tune");
      play.type = "button";
      play.addEventListener("click", function () {
        if (current) current.stop();
        current = playMelody(tune.notes, { bpm: tune.bpm });
      });
      wrap.appendChild(play);
      var answer = el("div", "game-verdict good", "🎶 " + tune.name);
      answer.hidden = true;
      wrap.appendChild(answer);
      var got = el("button", "game-cta", "We got it! ⭐");
      got.type = "button";
      got.addEventListener("click", function () {
        if (current) current.stop();
        api.confetti(); award(api, 1); i += 1; render();
      });
      wrap.appendChild(got);
      var reveal = el("button", "game-cta ghost", "Reveal answer 👀");
      reveal.type = "button";
      reveal.addEventListener("click", function () { answer.hidden = false; reveal.hidden = true; });
      wrap.appendChild(reveal);
      var next = el("button", "game-cta ghost", "Skip / Next →");
      next.type = "button";
      next.addEventListener("click", function () { if (current) current.stop(); i += 1; render(); });
      wrap.appendChild(next);
      root.appendChild(wrap);
    }
    render();
  }

  // Freeze Dance — music plays, then randomly stops. Freeze!
  function freezeDanceGame(root, api) {
    var current = null, tid = null;
    api.onCleanup(cleanup);
    function cleanup() {
      if (current) { current.stop(); current = null; }
      if (tid) { clearTimeout(tid); tid = null; }
    }
    function renderStart() {
      cleanup(); clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🕺"));
      wrap.appendChild(el("p", "game-lead", "Dance while the music plays… FREEZE the instant it stops! Last one moving is out."));
      var go = el("button", "game-cta", "Start the music 🎶");
      go.type = "button";
      go.addEventListener("click", dance);
      wrap.appendChild(go);
      root.appendChild(wrap);
    }
    function dance() {
      cleanup(); clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji dance-emoji", "🪩"));
      wrap.appendChild(el("p", "game-lead", "Dance! 💃🕺 …until it stops!"));
      var stop = el("button", "game-cta ghost", "Stop music");
      stop.type = "button";
      stop.addEventListener("click", renderStart);
      wrap.appendChild(stop);
      root.appendChild(wrap);
      var scale = ["C4", "D4", "E4", "G4", "A4", "C5", "A4", "G4", "E4", "D4"];
      var notes = [];
      for (var k = 0; k < 160; k++) notes.push([scale[Math.floor(Math.random() * scale.length)], 0.5]);
      current = playMelody(notes, { bpm: 150, wave: "square" });
      tid = setTimeout(freeze, 3000 + Math.random() * 7000);
    }
    function freeze() {
      if (current) { current.stop(); current = null; }
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", "🧊"));
      wrap.appendChild(el("h3", "game-result-title", "FREEZE! 🥶"));
      wrap.appendChild(el("p", "game-lead", "Last one to freeze is out!"));
      api.confetti();
      var again = el("button", "game-cta", "Dance again 🎶");
      again.type = "button";
      again.addEventListener("click", dance);
      wrap.appendChild(again);
      var back = el("button", "game-cta ghost", "End");
      back.type = "button";
      back.addEventListener("click", renderStart);
      wrap.appendChild(back);
      root.appendChild(wrap);
    }
    renderStart();
  }

  // =======================================================================
  // STORY TIME — listen to a short story on Spotify, then answer questions
  // =======================================================================
  var STORIES = [
    { title: "The Three Little Pigs", emoji: "🐷", blurb: "Huff, puff & brick houses",
      spotify: "The Three Little Pigs story for kids", questions: [
        { q: "What did the wolf want to do to the houses?", a: ["Paint them", "Blow them down", "Buy them", "Clean them"], c: 1 },
        { q: "Which house did the wolf NOT blow down?", a: ["Straw", "Sticks", "Bricks", "Paper"], c: 2 },
        { q: "How did the wolf try to knock the houses down?", a: ["Kicking", "Huffing and puffing", "A hammer", "A truck"], c: 1 },
        { q: "Who was safe at the end?", a: ["The wolf", "The three pigs", "A farmer", "Nobody"], c: 1 } ] },
    { title: "Goldilocks & the Three Bears", emoji: "🐻", blurb: "Too hot, too cold, just right",
      spotify: "Goldilocks and the Three Bears story for kids", questions: [
        { q: "How many bears lived in the house?", a: ["Two", "Three", "Four", "Five"], c: 1 },
        { q: "What food did Goldilocks eat?", a: ["Soup", "Porridge", "Cake", "Pizza"], c: 1 },
        { q: "Whose chair did she break?", a: ["Papa Bear's", "Mama Bear's", "Baby Bear's", "Nobody's"], c: 2 },
        { q: "What did Goldilocks do when the bears came home?", a: ["Made tea", "Ran away", "Took a nap", "Said hello"], c: 1 } ] },
    { title: "Little Red Riding Hood", emoji: "🧺", blurb: "A basket, a wolf & a woodsman",
      spotify: "Little Red Riding Hood story for kids", questions: [
        { q: "Where was Little Red Riding Hood going?", a: ["To school", "To Grandma's house", "To the shop", "To a castle"], c: 1 },
        { q: "What did she carry in her basket?", a: ["Toys", "Goodies to eat", "Money", "Books"], c: 1 },
        { q: "Who did she meet in the woods?", a: ["A fox", "A wolf", "A bear", "A witch"], c: 1 },
        { q: "Who saved her in the end?", a: ["A woodsman", "A prince", "A fairy", "A dog"], c: 0 } ] },
    { title: "The Tortoise & the Hare", emoji: "🐢", blurb: "Slow and steady wins the race",
      spotify: "The Tortoise and the Hare story for kids", questions: [
        { q: "What kind of race did they have?", a: ["Swimming", "Running", "Flying", "Jumping"], c: 1 },
        { q: "Who was faster at the start?", a: ["The tortoise", "The hare", "They tied", "A rabbit"], c: 1 },
        { q: "Why did the hare lose?", a: ["He got lost", "He took a nap", "He tripped", "He gave up"], c: 1 },
        { q: "What is the lesson of the story?", a: ["Be the fastest", "Slow and steady wins", "Never race", "Sleep a lot"], c: 1 } ] },
    { title: "Jack and the Beanstalk", emoji: "🌱", blurb: "Magic beans & a giant",
      spotify: "Jack and the Beanstalk story for kids", questions: [
        { q: "What did Jack trade the cow for?", a: ["Gold", "Magic beans", "A hen", "A map"], c: 1 },
        { q: "What grew overnight?", a: ["A tree", "A beanstalk", "A flower", "A tower"], c: 1 },
        { q: "Who lived at the top?", a: ["A giant", "A dragon", "A king", "A witch"], c: 0 },
        { q: "How did Jack escape the giant?", a: ["He flew away", "He chopped down the beanstalk", "He hid", "He ran"], c: 1 } ] },
    { title: "The Gingerbread Man", emoji: "🍪", blurb: "Run, run as fast as you can!",
      spotify: "The Gingerbread Man story for kids", questions: [
        { q: "Who baked the gingerbread man?", a: ["A king", "An old woman", "A chef", "A child"], c: 1 },
        { q: "What did the gingerbread man say?", a: ["Hello!", "You can't catch me!", "I'm sleepy", "Good night"], c: 1 },
        { q: "Who finally caught him?", a: ["A dog", "A fox", "A cat", "A cow"], c: 1 },
        { q: "How did the fox trick him?", a: ["With candy", "A ride across the river", "A song", "A nap"], c: 1 } ] }
  ];

  function storyTimeGame(root, api) {
    function renderMenu() {
      clear(root);
      var wrap = el("div", "game-pane");
      wrap.appendChild(el("p", "game-lead", "Pick a story, listen to it together on Spotify, then answer the questions!"));
      STORIES.forEach(function (s) {
        var card = el("button", "story-card", null);
        card.type = "button";
        card.appendChild(el("span", "story-emoji", s.emoji));
        var info = el("span", "story-info", null);
        info.appendChild(el("span", "story-title", s.title));
        info.appendChild(el("span", "story-blurb", s.blurb));
        card.appendChild(info);
        card.appendChild(el("span", "game-play", "▶"));
        card.addEventListener("click", function () { renderStory(s); });
        wrap.appendChild(card);
      });
      root.appendChild(wrap);
    }

    function renderStory(s) {
      clear(root);
      var wrap = el("div", "game-pane game-center");
      wrap.appendChild(el("div", "game-big-emoji", s.emoji));
      wrap.appendChild(el("h3", "game-result-title", s.title));
      wrap.appendChild(el("p", "game-lead", "Play it on Spotify and listen together. Then come back and tap Quiz Us!"));
      var link = el("a", "game-cta spotify-btn", "🎧 Listen on Spotify");
      link.href = "https://open.spotify.com/search/" + encodeURIComponent(s.spotify);
      link.target = "_blank";
      link.rel = "noopener";
      wrap.appendChild(link);
      var quiz = el("button", "game-cta", "We listened — Quiz us! ⭐");
      quiz.type = "button";
      quiz.addEventListener("click", function () { renderQuiz(s); });
      wrap.appendChild(quiz);
      var back = el("button", "game-cta ghost", "↩ Pick another story");
      back.type = "button";
      back.addEventListener("click", renderMenu);
      wrap.appendChild(back);
      root.appendChild(wrap);
    }

    function renderQuiz(s) {
      var questions = s.questions, idx = 0, score = 0;
      function q() {
        clear(root);
        var item = questions[idx];
        var wrap = el("div", "game-pane");
        var head = el("div", "quiz-head");
        head.appendChild(el("span", "quiz-progress", "Question " + (idx + 1) + " / " + questions.length));
        head.appendChild(el("span", "quiz-score", "⭐ " + score));
        wrap.appendChild(head);
        wrap.appendChild(el("h3", "quiz-question", item.q));
        var opts = el("div", "quiz-options"), btns = [], answered = false;
        item.a.forEach(function (text, i) {
          var b = el("button", "quiz-option", text);
          b.type = "button";
          b.addEventListener("click", function () {
            if (answered) return;
            answered = true;
            btns.forEach(function (bb, j) {
              bb.disabled = true;
              if (j === item.c) bb.classList.add("correct");
              else if (j === i) bb.classList.add("wrong");
            });
            if (i === item.c) score += 1;
            var next = el("button", "game-cta", idx + 1 < questions.length ? "Next →" : "See results 🎉");
            next.type = "button";
            next.addEventListener("click", function () {
              idx += 1;
              if (idx < questions.length) q(); else results();
            });
            wrap.appendChild(next);
          });
          btns.push(b); opts.appendChild(b);
        });
        wrap.appendChild(opts);
        root.appendChild(wrap);
      }
      function results() {
        clear(root);
        var wrap = el("div", "game-pane game-center");
        var pct = score / questions.length;
        wrap.appendChild(el("div", "game-big-emoji", pct >= 0.8 ? "🌟" : pct >= 0.5 ? "🎉" : "📚"));
        wrap.appendChild(el("h3", "game-result-title", "You scored " + score + " / " + questions.length));
        wrap.appendChild(el("p", "game-lead", pct >= 0.5 ? "Great listening!" : "Give it another listen and try again!"));
        if (pct >= 0.5) api.confetti();
        api.addStars(score);
        var again = el("button", "game-cta", "Another story 📖");
        again.type = "button";
        again.addEventListener("click", renderMenu);
        wrap.appendChild(again);
        root.appendChild(wrap);
      }
      q();
    }

    renderMenu();
  }

  // ---- registry ----------------------------------------------------------
  var ACCENTS = ["teal", "purple", "orange", "pink", "blue", "red", "green", "indigo"];

  var GAMES = [
    // ---- Party & Laughs ----
    { id: "truthDare", title: "Truth or Dare", emoji: "🎭", group: "Party & Laughs",
      tagline: "Family-friendly truths & silly dares", render: truthOrDareGame },
    { id: "wyr", title: "Would You Rather", emoji: "🤔", group: "Party & Laughs",
      tagline: "Silly choices to argue about", render: wouldYouRatherGame },
    { id: "mostLikely", title: "Who's Most Likely To…", emoji: "👉", group: "Party & Laughs",
      tagline: "Point at whoever fits — 1, 2, 3!", render: mostLikelyGame },
    { id: "thisOrThat", title: "This or That", emoji: "⚖️", group: "Party & Laughs",
      tagline: "Quick-fire pick-a-side", render: twoChoiceEngine(TC_THISORTHAT, { lead: "This or that?", emoji: "⚖️" }) },
    { id: "superWyr", title: "Superhero Would You Rather", emoji: "🦸", group: "Party & Laughs",
      tagline: "Pick your dream power", render: twoChoiceEngine(TC_SUPER, { lead: "Would you rather be able to…", emoji: "🦸" }) },
    { id: "foodWyr", title: "Foodie Would You Rather", emoji: "🍕", group: "Party & Laughs",
      tagline: "Tasty impossible choices", render: twoChoiceEngine(TC_FOOD, { lead: "Would you rather have…", emoji: "🍕" }) },
    { id: "simon", title: "Simon Says", emoji: "🫡", group: "Party & Laughs",
      tagline: "Do it only if Simon says!", render: simonGame },
    { id: "faces", title: "Make a Face", emoji: "😜", group: "Party & Laughs",
      tagline: "Pull the silliest face you can", render: promptDeckEngine(PD_FACE, { emoji: "😜", lead: "Everyone do it together!", cta: "Next face →" }) },
    { id: "impressions", title: "Impressions", emoji: "🎙️", group: "Party & Laughs",
      tagline: "Do your best silly voice", render: promptDeckEngine(PD_IMPRESSION, { emoji: "🎙️", lead: "Ham it up!", cta: "Next one →" }) },
    { id: "never", title: "Never Have I Ever", emoji: "🙅", group: "Party & Laughs",
      tagline: "Kid-friendly confessions", render: promptDeckEngine(PD_NEVER, { emoji: "🙅", lead: "Put a finger down if you have!", cta: "Next →" }) },
    { id: "twoTruths", title: "Two Truths & a Lie", emoji: "🤥", group: "Party & Laughs",
      tagline: "Can they spot your fib?", render: promptDeckEngine(PD_TWOTRUTHS, { emoji: "🤥", cta: "Next player →" }) },
    { id: "silly", title: "Silly Questions", emoji: "🤪", group: "Party & Laughs",
      tagline: "Wonderfully weird what-ifs", render: promptDeckEngine(PD_SILLY, { emoji: "🤪", cta: "Next question →" }) },
    { id: "freeze", title: "Freeze Dance", emoji: "🪩", group: "Party & Laughs",
      tagline: "Dance, then freeze when the music stops!", render: freezeDanceGame },

    // ---- Guess & Reveal ----
    { id: "emoji", title: "Emoji Movie Riddle", emoji: "🎬", group: "Guess & Reveal",
      tagline: "Guess the movie from the emojis", render: emojiRiddleGame },
    { id: "emojiFood", title: "Emoji Foods", emoji: "🍔", group: "Guess & Reveal",
      tagline: "Guess the food from the emojis", render: revealEngine(RV_EMOJI_FOOD, { display: "emoji", lead: "Guess the food!", emoji: "🍔" }) },
    { id: "emojiAnimals", title: "Emoji Animals", emoji: "🦁", group: "Guess & Reveal",
      tagline: "Name the animal emoji", render: revealEngine(RV_EMOJI_ANIMALS, { display: "emoji", lead: "Which animal is it?", emoji: "🦁" }) },
    { id: "emojiSongs", title: "Emoji Songs", emoji: "🎵", group: "Guess & Reveal",
      tagline: "Guess the kids' song", render: revealEngine(RV_EMOJI_SONGS, { display: "emoji", lead: "Guess the song!", emoji: "🎵" }) },
    { id: "riddles", title: "Riddle Me This", emoji: "🧩", group: "Guess & Reveal",
      tagline: "Family riddles with a big reveal", render: riddleGame },
    { id: "brain", title: "Brain Teasers", emoji: "🧠", group: "Guess & Reveal",
      tagline: "Tricky puzzles to crack together", render: revealEngine(RV_BRAINTEASERS, { emoji: "🧠", lead: "Think hard!" }) },
    { id: "whatami", title: "What Am I?", emoji: "❓", group: "Guess & Reveal",
      tagline: "Guess the animal from clues", render: revealEngine(RV_WHATAMI, { emoji: "❓", lead: "Guess the animal!" }) },
    { id: "country", title: "Guess the Country", emoji: "🌍", group: "Guess & Reveal",
      tagline: "Name the country from a clue", render: revealEngine(RV_COUNTRY, { emoji: "🌍", lead: "Where in the world?" }) },
    { id: "jokes", title: "Joke Machine", emoji: "😂", group: "Guess & Reveal",
      tagline: "Guess the punchline!", render: revealEngine(RV_JOKES, { emoji: "😂", lead: "Can you guess the punchline?" }) },
    { id: "nameTune", title: "Name That Tune", emoji: "🎵", group: "Guess & Reveal",
      tagline: "The app plays it — you guess the song!", render: nameThatTuneGame },

    // ---- Quizzes ----
    { id: "quiz", title: "Road Trip Quiz", emoji: "🧠", group: "Quizzes",
      tagline: "Mixed family trivia", render: quizGame },
    { id: "qzAnimals", title: "Animal Quiz", emoji: "🐾", group: "Quizzes",
      tagline: "How well do you know animals?", render: quizEngine(QZ_ANIMALS) },
    { id: "qzSpace", title: "Space Quiz", emoji: "🚀", group: "Quizzes",
      tagline: "Blast off with space trivia", render: quizEngine(QZ_SPACE) },
    { id: "qzGeo", title: "Geography Quiz", emoji: "🗺️", group: "Quizzes",
      tagline: "Places around the world", render: quizEngine(QZ_GEO) },
    { id: "qzScience", title: "Science Quiz", emoji: "🔬", group: "Quizzes",
      tagline: "Fun science facts", render: quizEngine(QZ_SCIENCE) },
    { id: "qzFood", title: "Food Quiz", emoji: "🍎", group: "Quizzes",
      tagline: "Yummy trivia", render: quizEngine(QZ_FOOD) },
    { id: "qzMovies", title: "Movie & Cartoon Quiz", emoji: "🍿", group: "Quizzes",
      tagline: "Test your movie smarts", render: quizEngine(QZ_MOVIES) },
    { id: "qzSports", title: "Sports Quiz", emoji: "⚽", group: "Quizzes",
      tagline: "Game on!", render: quizEngine(QZ_SPORTS) },
    { id: "qzBody", title: "Human Body Quiz", emoji: "🦴", group: "Quizzes",
      tagline: "All about you", render: quizEngine(QZ_BODY) },
    { id: "qzSilly", title: "Silly Trivia", emoji: "🤓", group: "Quizzes",
      tagline: "Easy & fun for everyone", render: quizEngine(QZ_SILLY) },
    { id: "storyTime", title: "Story Time (Spotify)", emoji: "🎧", group: "Quizzes",
      tagline: "Listen to a story, then answer questions", render: storyTimeGame },

    // ---- Spot & Race ----
    { id: "carBrands", title: "Car Brand Hunt", emoji: "🚗", group: "Spot & Race",
      tagline: "Spot & tally brands, then crown a winner", render: carBrandsGame },
    { id: "bingo", title: "License Plate Bingo", emoji: "🚌", group: "Spot & Race",
      tagline: "Fill your card of things to spot", render: bingoGame },
    { id: "alphabet", title: "Alphabet Road Hunt", emoji: "🔡", group: "Spot & Race",
      tagline: "Find A to Z on signs along the way", render: alphabetGame },
    { id: "iSpy", title: "I Spy", emoji: "👀", group: "Spot & Race",
      tagline: "Spot the secret color before time's up", render: iSpyGame },
    { id: "scavenger", title: "Scavenger Hunt", emoji: "🔭", group: "Spot & Race",
      tagline: "Race to spot it out the window", render: timerChallengeEngine(TM_SCAVENGER, { emoji: "🔭", seconds: 60, doneLabel: "Spotted it! ⭐" }) },

    // ---- Talk & Perform ----
    { id: "categories", title: "Name · Place · Animal", emoji: "🔤", group: "Talk & Perform",
      tagline: "Race the clock for each category", render: categoriesGame },
    { id: "charades", title: "Charades", emoji: "🎭", group: "Talk & Perform",
      tagline: "Act it out — no talking allowed!", render: charadesGame },
    { id: "sing", title: "Sing-Along Challenge", emoji: "🎤", group: "Talk & Perform",
      tagline: "Belt out a song with the secret word", render: singGame },
    { id: "name5", title: "Name 5", emoji: "🖐️", group: "Talk & Perform",
      tagline: "Rattle off 5 before time's up", render: timerChallengeEngine(TM_NAME5, { emoji: "🖐️", seconds: 20, doneLabel: "Got 5! ⭐" }) },
    { id: "tongue", title: "Tongue Twisters", emoji: "👅", group: "Talk & Perform",
      tagline: "Say it fast without tripping up", render: timerChallengeEngine(TM_TONGUE, { emoji: "👅", seconds: 20, doneLabel: "Nailed it! ⭐" }) },
    { id: "hum", title: "Hum That Tune", emoji: "🎶", group: "Talk & Perform",
      tagline: "Hum it — others guess the song", render: timerChallengeEngine(TM_HUM, { emoji: "🎶", seconds: 30, doneLabel: "Guessed it! ⭐" }) },
    { id: "catRace", title: "Category Race", emoji: "🏁", group: "Talk & Perform",
      tagline: "Keep naming till time runs out", render: timerChallengeEngine(TM_CATEGORY, { emoji: "🏁", seconds: 30, doneLabel: "Done! ⭐" }) },
    { id: "convo", title: "Conversation Starters", emoji: "💬", group: "Talk & Perform",
      tagline: "Fun questions for the whole car", render: promptDeckEngine(PD_CONVO, { emoji: "💬", cta: "Next question →" }) },
    { id: "story", title: "Story Builder", emoji: "📖", group: "Talk & Perform",
      tagline: "Take turns adding to the tale", render: promptDeckEngine(PD_STORY, { emoji: "📖", lead: "Keep the story going, one line each!", cta: "New start →" }) },
    { id: "finish", title: "Finish the Sentence", emoji: "✏️", group: "Talk & Perform",
      tagline: "Everyone completes it their way", render: promptDeckEngine(PD_FINISH, { emoji: "✏️", cta: "Next →" }) },
    { id: "compliment", title: "Compliment Circle", emoji: "💖", group: "Talk & Perform",
      tagline: "Spread the good vibes", render: promptDeckEngine(PD_COMPLIMENT, { emoji: "💖", cta: "Next →" }) },
    { id: "favorites", title: "Favorites Game", emoji: "🌟", group: "Talk & Perform",
      tagline: "Share your all-time bests", render: promptDeckEngine(PD_FAVORITE, { emoji: "🌟", cta: "Next →" }) },

    // ---- Quick Picks ----
    { id: "spin", title: "Spin the Chooser", emoji: "🎡", group: "Quick Picks",
      tagline: "Pick who goes next", render: spinGame },
    { id: "dice", title: "Dice Roller", emoji: "🎲", group: "Quick Picks",
      tagline: "Roll two dice", render: diceGame },
    { id: "coin", title: "Coin Flip", emoji: "🪙", group: "Quick Picks",
      tagline: "Heads or tails?", render: coinGame },
    { id: "rps", title: "Rock Paper Scissors", emoji: "✊", group: "Quick Picks",
      tagline: "3… 2… 1… shoot against the app!", render: rpsGame },
    { id: "quiet", title: "The Quiet Game", emoji: "🤫", group: "Quick Picks",
      tagline: "Who can stay silent longest?", render: quietGame }
  ];

  // Assign a rotating accent colour to every game.
  GAMES.forEach(function (g, idx) { if (!g.accent) g.accent = ACCENTS[idx % ACCENTS.length]; });

  var byId = {};
  GAMES.forEach(function (g) { byId[g.id] = g; });

  return {
    list: function () { return GAMES.slice(); },
    get: function (id) { return byId[id]; }
  };
})();
