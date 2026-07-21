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
        api.addStars(1);
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
        api.confetti(); api.addStars(2); renderWord();
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
      tagline: "Belt out a song with the secret word", render: singGame },
    { id: "truthDare", title: "Truth or Dare", emoji: "🎭", accent: "red",
      tagline: "Family-friendly truths & silly dares", render: truthOrDareGame },
    { id: "mostLikely", title: "Who's Most Likely To…", emoji: "👉", accent: "green",
      tagline: "Point at whoever fits — 1, 2, 3!", render: mostLikelyGame },
    { id: "emoji", title: "Emoji Movie Riddle", emoji: "🎬", accent: "indigo",
      tagline: "Guess the movie from the emojis", render: emojiRiddleGame },
    { id: "charades", title: "Charades", emoji: "🎭", accent: "purple",
      tagline: "Act it out — no talking allowed!", render: charadesGame },
    { id: "iSpy", title: "I Spy", emoji: "👀", accent: "blue",
      tagline: "Spot the secret color before time's up", render: iSpyGame },
    { id: "rps", title: "Rock Paper Scissors", emoji: "✊", accent: "orange",
      tagline: "3… 2… 1… shoot against the app!", render: rpsGame },
    { id: "alphabet", title: "Alphabet Road Hunt", emoji: "🔡", accent: "teal",
      tagline: "Find A to Z on signs along the way", render: alphabetGame },
    { id: "riddles", title: "Riddle Me This", emoji: "🧩", accent: "pink",
      tagline: "Family riddles with a big reveal", render: riddleGame },
    { id: "simon", title: "Simon Says", emoji: "🫡", accent: "green",
      tagline: "Do it only if Simon says!", render: simonGame }
  ];

  var byId = {};
  GAMES.forEach(function (g) { byId[g.id] = g; });

  return {
    list: function () { return GAMES.slice(); },
    get: function (id) { return byId[id]; }
  };
})();
