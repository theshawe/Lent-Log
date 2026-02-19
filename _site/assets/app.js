(function () {
  "use strict";

  var STORAGE_KEY = "lent_tracker_v1";
  var TONES = ["neutral", "spiritual", "discipline"];
  var PROMPTS = {
    neutral: [
      "What is one small yes you can say today?",
      "Quiet consistency beats intensity. What is your next step?",
      "What did you choose on purpose this morning?",
      "Keep it simple. What matters most today?",
      "What habit is becoming easier because you keep showing up?",
      "Where can you trade urgency for intention today?",
      "What one decision will future-you thank you for?",
      "Notice one trigger. Choose a better response.",
      "What are you practicing becoming today?",
      "What is one thing you can do with full attention?",
      "A clean day starts with one clear boundary.",
      "What would a grounded version of you do right now?",
      "Choose progress over perfect. What does progress look like today?",
      "What can you remove to make room for what matters?",
      "Keep your promises small and real.",
      "What is one difficult thing worth doing today?",
      "What can you finish before noon?",
      "Where are you tempted to drift, and what is your redirect?",
      "What helps you stay calm and committed?",
      "Which commitment needs your best hour today?",
      "You do not need more noise. You need one next action.",
      "What can you decline today to protect your focus?",
      "What is your kindest disciplined choice today?",
      "What did you learn from yesterday's slip?",
      "What can be done in ten faithful minutes?",
      "Hold the line with humility.",
      "Which small win will build momentum now?",
      "A steady day is a strong day.",
      "What does enough look like today?",
      "Start where you are. Stay with it."
    ],
    spiritual: [
      "Begin again with grace.",
      "Where is God inviting trust today?",
      "Choose the quiet good over the loud urgent.",
      "Offer this day one faithful step at a time.",
      "What can you surrender before you start?",
      "Let your no make room for a better yes.",
      "Practice hidden faithfulness today.",
      "What would love ask of you in this moment?",
      "Return to prayer before reaction.",
      "Where can you choose patience over control?",
      "What burden can you place in God's hands right now?",
      "A gentle heart can still be disciplined.",
      "What would repentance look like in one concrete action?",
      "Seek depth, not display.",
      "Let restraint become worship.",
      "What is one person you can bless today?",
      "Where can you be truthful and kind?",
      "Faith grows in repeated ordinary obedience.",
      "What can you fast from to make room for God?",
      "Receive this day as a gift, not a test.",
      "Choose mercy when you feel defensive.",
      "Slow down enough to notice what is holy.",
      "How can your commitments reflect love today?",
      "A small prayer can reset a whole day.",
      "Give up what numbs; receive what nourishes.",
      "What does faithful courage look like right now?",
      "The quiet path still leads forward.",
      "What can you confess and release today?",
      "Let gratitude steady your decisions.",
      "Stay near grace and continue."
    ],
    discipline: [
      "No drama. Do the next rep.",
      "You only need today's consistency.",
      "Protect the first focused hour.",
      "Do hard things before easy distractions.",
      "A boundary kept is a promise honored.",
      "What is the standard for today? Meet it.",
      "Win the morning, calm the day.",
      "Trade impulse for intention.",
      "One clean choice compounds.",
      "Do not negotiate with obvious distractions.",
      "Momentum is built in quiet minutes.",
      "What task are you avoiding? Start there.",
      "Discipline is self-respect in action.",
      "Keep commitments boring and repeatable.",
      "Tighten inputs, improve outcomes.",
      "If it matters, track it and do it.",
      "Small slips are signals. Correct fast.",
      "Reduce friction for the right habit.",
      "No perfect day required. Just complete day.",
      "Choose systems over mood.",
      "Do less, better, and daily.",
      "You are building proof, not hype.",
      "Consistency is identity training.",
      "Cut one distraction before lunch.",
      "What is the minimum effective action today?",
      "Stay steady when motivation is low.",
      "Keep your edge through simple routines.",
      "Respect your own rules.",
      "One decision at a time. Hold the line.",
      "Discipline now, freedom later."
    ]
  };
  var AVATAR_PRESETS = [
    {
      id: "avatar_1",
      className: "avatar-art-1"
    },
    {
      id: "avatar_2",
      className: "avatar-art-2"
    },
    {
      id: "avatar_3",
      className: "avatar-art-3"
    },
    {
      id: "avatar_4",
      className: "avatar-emoji-cross"
    },
    {
      id: "avatar_5",
      className: "avatar-emoji-yinyang"
    },
    {
      id: "avatar_6",
      className: "avatar-emoji-sparkle"
    }
  ];

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function toDateKey(dateObj) {
    var year = dateObj.getFullYear();
    var month = String(dateObj.getMonth() + 1).padStart(2, "0");
    var day = String(dateObj.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function parseDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    var parts = value.split("-");
    var dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(dateObj.getTime())) {
      return null;
    }
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }

  function todayKey() {
    return toDateKey(new Date());
  }

  function currentAuthenticatedUserId() {
    var remote = window.LentSupabase;
    if (!remote || typeof remote.isConfigured !== "function" || typeof remote.isAuthenticated !== "function") {
      return "";
    }
    if (!remote.isConfigured() || !remote.isAuthenticated()) {
      return "";
    }
    var user = typeof remote.getUser === "function" ? remote.getUser() : null;
    return user && user.id ? String(user.id) : "";
  }

  function activeStoreKey() {
    var userId = currentAuthenticatedUserId();
    if (!userId) {
      return STORAGE_KEY;
    }
    return STORAGE_KEY + "__" + userId;
  }

  function addDays(dateObj, days) {
    var copy = new Date(dateObj.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function hashString(value) {
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function formatDateForHumans(dateKey) {
    var parsed = parseDateKey(dateKey);
    if (!parsed) {
      return dateKey;
    }
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function computeEasterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    var easter = new Date(year, month - 1, day);
    easter.setHours(0, 0, 0, 0);
    return easter;
  }

  function getLentRangeForYear(year) {
    var easter = computeEasterSunday(year);
    return {
      startDate: toDateKey(addDays(easter, -46)),
      endDate: toDateKey(addDays(easter, -3))
    };
  }

  function getAutoLentRange(referenceDate) {
    var ref = new Date(referenceDate.getTime());
    ref.setHours(0, 0, 0, 0);
    var year = ref.getFullYear();
    var currentRange = getLentRangeForYear(year);
    var currentStart = parseDateKey(currentRange.startDate);
    var currentEnd = parseDateKey(currentRange.endDate);

    if (ref.getTime() < currentStart.getTime()) {
      return currentRange;
    }
    if (ref.getTime() > currentEnd.getTime()) {
      return getLentRangeForYear(year + 1);
    }
    return currentRange;
  }

  function syncStoreLentDates(store) {
    var autoRange = getAutoLentRange(new Date());
    var changed = false;
    if (store.settings.startDate !== autoRange.startDate) {
      store.settings.startDate = autoRange.startDate;
      changed = true;
    }
    if (store.settings.endDate !== autoRange.endDate) {
      store.settings.endDate = autoRange.endDate;
      changed = true;
    }
    return changed;
  }

  function defaultStore() {
    var autoRange = getAutoLentRange(new Date());
    var authUserId = currentAuthenticatedUserId();
    return {
      version: 1,
      user: {
        id: authUserId || uuid(),
        createdAt: new Date().toISOString(),
        displayName: "",
        avatarId: "avatar_1"
      },
      settings: {
        tone: "neutral",
        accent: "#0f172a",
        startDate: autoRange.startDate,
        endDate: autoRange.endDate,
        shareLogsToCommunity: false,
        lastBackupAt: ""
      },
      commitments: [],
      checkins: {},
      savedCommunityNotes: [],
      communityBoard: []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validateStoreSchema(store) {
    if (!store || typeof store !== "object") {
      return false;
    }
    if (store.version !== 1) {
      return false;
    }
    if (!store.user || typeof store.user !== "object") {
      return false;
    }
    if (typeof store.user.id !== "string" || typeof store.user.createdAt !== "string" || typeof store.user.displayName !== "string") {
      return false;
    }
    if (typeof store.user.avatarId !== "string" && typeof store.user.avatarId !== "undefined") {
      return false;
    }
    if (!store.settings || typeof store.settings !== "object") {
      return false;
    }
    if (TONES.indexOf(store.settings.tone) === -1) {
      return false;
    }
    if (typeof store.settings.accent !== "string") {
      return false;
    }
    if (typeof store.settings.shareLogsToCommunity !== "boolean" && typeof store.settings.shareLogsToCommunity !== "undefined") {
      return false;
    }
    if (!parseDateKey(store.settings.startDate) || !parseDateKey(store.settings.endDate)) {
      return false;
    }
    if (!Array.isArray(store.commitments) || !store.checkins || typeof store.checkins !== "object" || Array.isArray(store.checkins)) {
      return false;
    }
    for (var i = 0; i < store.commitments.length; i += 1) {
      var item = store.commitments[i];
      if (!item || typeof item !== "object") {
        return false;
      }
      if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.createdAt !== "string") {
        return false;
      }
      if (item.type !== "not_doing" && item.type !== "doing") {
        return false;
      }
      if (typeof item.active !== "boolean") {
        return false;
      }
    }
    var checkinKeys = Object.keys(store.checkins);
    for (var c = 0; c < checkinKeys.length; c += 1) {
      var dateKey = checkinKeys[c];
      var checkin = store.checkins[dateKey];
      if (!parseDateKey(dateKey) || !checkin || typeof checkin !== "object") {
        return false;
      }
      if (checkin.date !== dateKey || !checkin.items || typeof checkin.items !== "object" || Array.isArray(checkin.items)) {
        return false;
      }
      if (typeof checkin.note !== "string" || typeof checkin.inspirationAdded !== "string") {
        return false;
      }
      if (typeof checkin.missedNotes !== "undefined") {
        if (!checkin.missedNotes || typeof checkin.missedNotes !== "object" || Array.isArray(checkin.missedNotes)) {
          return false;
        }
        var missedNoteKeys = Object.keys(checkin.missedNotes);
        for (var mn = 0; mn < missedNoteKeys.length; mn += 1) {
          if (typeof checkin.missedNotes[missedNoteKeys[mn]] !== "string") {
            return false;
          }
        }
      }
      if (!(checkin.mood === null || typeof checkin.mood === "number" || typeof checkin.mood === "undefined")) {
        return false;
      }
      var itemIds = Object.keys(checkin.items);
      for (var ci = 0; ci < itemIds.length; ci += 1) {
        var status = checkin.items[itemIds[ci]];
        if (status !== "kept" && status !== "slipped") {
          return false;
        }
      }
    }
    if (!Array.isArray(store.savedCommunityNotes)) {
      return false;
    }
    for (var n = 0; n < store.savedCommunityNotes.length; n += 1) {
      var note = store.savedCommunityNotes[n];
      if (!note || typeof note !== "object") {
        return false;
      }
      if (typeof note.id !== "string" || typeof note.date !== "string" || typeof note.text !== "string" || typeof note.savedAt !== "string") {
        return false;
      }
      if (!Array.isArray(note.tags)) {
        return false;
      }
    }
    if (!Array.isArray(store.communityBoard) && typeof store.communityBoard !== "undefined") {
      return false;
    }
    var board = store.communityBoard || [];
    for (var b = 0; b < board.length; b += 1) {
      var entry = board[b];
      if (!entry || typeof entry !== "object") {
        return false;
      }
      if (
        typeof entry.id !== "string" ||
        typeof entry.userId !== "string" ||
        typeof entry.displayName !== "string" ||
        typeof entry.date !== "string" ||
        typeof entry.summary !== "string" ||
        typeof entry.note !== "string" ||
        typeof entry.inspiration !== "string" ||
        typeof entry.updatedAt !== "string" ||
        typeof entry.createdAt !== "string"
      ) {
        return false;
      }
      if (!(entry.mood === null || typeof entry.mood === "number" || typeof entry.mood === "undefined")) {
        return false;
      }
      if (!Array.isArray(entry.supporterIds)) {
        return false;
      }
    }
    return true;
  }

  function normalizeStore(store) {
    var safeStore = clone(store);
    if (!safeStore.settings.lastBackupAt) {
      safeStore.settings.lastBackupAt = "";
    }
    if (typeof safeStore.settings.shareLogsToCommunity !== "boolean") {
      safeStore.settings.shareLogsToCommunity = false;
    }
    if (typeof safeStore.user.displayName !== "string") {
      safeStore.user.displayName = "";
    }
    if (typeof safeStore.user.avatarId !== "string") {
      safeStore.user.avatarId = "avatar_1";
    }
    var checkinKeys = Object.keys(safeStore.checkins);
    for (var i = 0; i < checkinKeys.length; i += 1) {
      var checkin = safeStore.checkins[checkinKeys[i]];
      if (typeof checkin.note !== "string") {
        checkin.note = "";
      }
      if (typeof checkin.inspirationAdded !== "string") {
        checkin.inspirationAdded = "";
      }
      if (typeof checkin.mood === "undefined") {
        checkin.mood = null;
      }
      if (!checkin.missedNotes || typeof checkin.missedNotes !== "object" || Array.isArray(checkin.missedNotes)) {
        checkin.missedNotes = {};
      }
    }
    if (!Array.isArray(safeStore.communityBoard)) {
      safeStore.communityBoard = [];
    }
    return safeStore;
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(activeStoreKey());
      if (!raw) {
        return { store: null, error: null };
      }
      var parsed = JSON.parse(raw);
      if (!validateStoreSchema(parsed)) {
        return { store: null, error: "invalid_schema" };
      }
      return { store: normalizeStore(parsed), error: null };
    } catch (error) {
      return { store: null, error: "parse_error" };
    }
  }

  function loadStoreFromKey(storageKey) {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!validateStoreSchema(parsed)) {
        return null;
      }
      return normalizeStore(parsed);
    } catch (error) {
      return null;
    }
  }

  function saveStore(store) {
    if (!validateStoreSchema(store)) {
      return false;
    }
    try {
      localStorage.setItem(activeStoreKey(), JSON.stringify(store));
      return true;
    } catch (error) {
      window.alert("Unable to save your Lent data on this browser.");
      return false;
    }
  }

  function ensureInitialized() {
    var loaded = loadStore();
    if (loaded.error) {
      var reset = window.confirm("Your local Lent Log data looks corrupted. Reset data on this browser?");
      if (!reset) {
        return null;
      }
      var fresh = defaultStore();
      saveStore(fresh);
      return fresh;
    }
    if (!loaded.store) {
      var authUserId = currentAuthenticatedUserId();
      if (authUserId) {
        var legacyGuestStore = loadStoreFromKey(STORAGE_KEY);
        if (legacyGuestStore) {
          legacyGuestStore.user.id = authUserId;
          saveStore(legacyGuestStore);
          return legacyGuestStore;
        }
      }
      var initial = defaultStore();
      saveStore(initial);
      return initial;
    }
    var authUserId = currentAuthenticatedUserId();
    if (authUserId && loaded.store.user.id !== authUserId) {
      loaded.store.user.id = authUserId;
      saveStore(loaded.store);
    }
    if (syncStoreLentDates(loaded.store)) {
      saveStore(loaded.store);
    }
    return loaded.store;
  }

  function computeDayIndex(startDateKey, currentDateKey) {
    var start = parseDateKey(startDateKey);
    var day = parseDateKey(currentDateKey);
    if (!start || !day) {
      return null;
    }
    var diffMs = day.getTime() - start.getTime();
    return Math.floor(diffMs / 86400000) + 1;
  }

  function getDailyPrompt(dateKey, tone) {
    var available = PROMPTS[tone] || PROMPTS.neutral;
    var index = hashString(dateKey + "|" + tone) % available.length;
    return available[index];
  }

  function computeStreak(checkins) {
    if (!checkins || typeof checkins !== "object") {
      return 0;
    }
    var streak = 0;
    var cursor = parseDateKey(todayKey());
    while (cursor) {
      var key = toDateKey(cursor);
      if (Object.prototype.hasOwnProperty.call(checkins, key)) {
        streak += 1;
      } else {
        break;
      }
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function dateIsInRange(dateKey, startDateKey, endDateKey) {
    var dateObj = parseDateKey(dateKey);
    var start = parseDateKey(startDateKey);
    var end = parseDateKey(endDateKey);
    if (!dateObj || !start || !end) {
      return false;
    }
    return dateObj.getTime() >= start.getTime() && dateObj.getTime() <= end.getTime();
  }

  function computeCompletionRate(store) {
    var start = parseDateKey(store.settings.startDate);
    var end = parseDateKey(store.settings.endDate);
    var today = parseDateKey(todayKey());
    if (!start || !end || !today) {
      return { checked: 0, total: 0, rate: 0 };
    }
    if (today.getTime() < start.getTime()) {
      return { checked: 0, total: 0, rate: 0 };
    }
    var windowEnd = today.getTime() < end.getTime() ? today : end;
    var total = Math.floor((windowEnd.getTime() - start.getTime()) / 86400000) + 1;
    if (total <= 0) {
      return { checked: 0, total: 0, rate: 0 };
    }
    var keys = Object.keys(store.checkins);
    var checked = 0;
    var loggedCount = 0;
    var trackedCount = 0;
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var dateObj = parseDateKey(key);
      if (!dateObj) {
        continue;
      }
      if (dateObj.getTime() >= start.getTime() && dateObj.getTime() <= windowEnd.getTime()) {
        checked += 1;
        var checkin = store.checkins[key] || {};
        var itemKeys = Object.keys(checkin.items || {});
        for (var j = 0; j < itemKeys.length; j += 1) {
          var status = checkin.items[itemKeys[j]];
          if (status === "kept" || status === "slipped") {
            trackedCount += 1;
            if (status === "kept") {
              loggedCount += 1;
            }
          }
        }
      }
    }
    if (trackedCount > 0) {
      return { checked: checked, total: total, rate: Math.round((loggedCount / trackedCount) * 100) };
    }
    return { checked: checked, total: total, rate: Math.round((checked / total) * 100) };
  }

  function setMessage(element, text, tone) {
    if (!element) {
      return;
    }
    element.textContent = text || "";
    element.classList.remove("ok", "warn");
    if (tone === "ok" || tone === "warn") {
      element.classList.add(tone);
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function createSegmentedStatus(name, selected) {
    var wrapper = document.createElement("div");
    wrapper.className = "segment";
    var options = [
      { value: "kept", label: "Logged" },
      { value: "slipped", label: "Missed" }
    ];

    for (var i = 0; i < options.length; i += 1) {
      var opt = options[i];
      var label = document.createElement("label");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = opt.value;
      input.checked = selected === opt.value;
      var span = document.createElement("span");
      span.textContent = opt.label;
      label.appendChild(input);
      label.appendChild(span);
      wrapper.appendChild(label);
    }
    return wrapper;
  }

  function goTo(path) {
    window.location.href = path;
  }

  function getRemoteClient() {
    return window.LentSupabase || null;
  }

  function isRemoteConfigured() {
    var remote = getRemoteClient();
    return Boolean(remote && remote.isConfigured && remote.isConfigured());
  }

  function isRemoteAuthenticated() {
    var remote = getRemoteClient();
    return Boolean(remote && remote.isAuthenticated && remote.isAuthenticated());
  }

  function maybeCreateAuthMount(referenceElement, id) {
    if (!referenceElement || byId(id)) {
      return byId(id);
    }
    var mount = document.createElement("div");
    mount.id = id;
    referenceElement.insertAdjacentElement("afterend", mount);
    return mount;
  }

  function renderAuthPanelFor(container, onSessionChange) {
    if (!container || !window.LentAuthUI || typeof window.LentAuthUI.renderAuthPanel !== "function") {
      return;
    }
    window.LentAuthUI.renderAuthPanel(container, {
      onSessionChange: onSessionChange
    });
  }

  function mountAuthGateOverlay(page) {
    if (page === "index" || byId("authGateOverlay")) {
      return;
    }
    if (isRemoteConfigured() && isRemoteAuthenticated()) {
      return;
    }

    var overlay = document.createElement("div");
    overlay.id = "authGateOverlay";
    overlay.className = "auth-gate-overlay";

    var card = document.createElement("div");
    card.className = "auth-gate-card";

    var title = document.createElement("h2");
    title.textContent = "Sign in to continue";
    var text = document.createElement("p");
    text.className = "muted";
    text.textContent = "Lent Log keeps your entries tied to your account.";
    var hint = document.createElement("p");
    hint.className = "auth-gate-hint";
    hint.textContent = "Click outside this card to return home.";
    var panelMount = document.createElement("div");
    panelMount.id = "authGatePanelMount";

    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(hint);
    card.appendChild(panelMount);
    overlay.appendChild(card);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        goTo("index.html");
      }
    });
    document.body.appendChild(overlay);
    document.body.classList.add("auth-gated");

    renderAuthPanelFor(panelMount, function () {
      window.location.reload();
    });
  }

  function localCheckinFromRemoteRow(row) {
    return {
      date: row.date,
      items: row.items_json || {},
      note: row.note || "",
      inspirationAdded: row.inspiration_added || "",
      mood: row.mood || null,
      missedNotes: row.missed_notes_json || {}
    };
  }

  function mergeRemoteCheckinsIntoStore(store, remoteRows) {
    if (!Array.isArray(remoteRows)) {
      return false;
    }
    var changed = false;
    remoteRows.forEach(function (row) {
      if (!row || !row.date) {
        return;
      }
      var local = store.checkins[row.date];
      if (!local) {
        store.checkins[row.date] = localCheckinFromRemoteRow(row);
        changed = true;
        return;
      }
      var localUpdated = local.updatedAt || "";
      var remoteUpdated = row.updated_at || "";
      if (!localUpdated || (remoteUpdated && remoteUpdated > localUpdated)) {
        store.checkins[row.date] = localCheckinFromRemoteRow(row);
        changed = true;
      }
    });
    return changed;
  }

  function buildRemoteSummary(payload) {
    var ids = Object.keys(payload.items || {});
    if (!ids.length) {
      return "No commitments set";
    }
    var logged = 0;
    for (var i = 0; i < ids.length; i += 1) {
      if (payload.items[ids[i]] === "kept") {
        logged += 1;
      }
    }
    var missed = ids.length - logged;
    var base = logged + "/" + ids.length + " logged" + (missed > 0 ? ", " + missed + " missed" : "");
    if (Array.isArray(payload.loggedTitles) && payload.loggedTitles.length) {
      base += " | Logged: " + payload.loggedTitles.slice(0, 4).join(", ");
    }
    if (Array.isArray(payload.autoTags) && payload.autoTags.length) {
      base += " | Tags: " + payload.autoTags.join(";");
    }
    return base;
  }

  function queueRemoteOperation(type, payload) {
    var remote = getRemoteClient();
    if (!remote || typeof remote.enqueueQueueItem !== "function") {
      return;
    }
    remote.enqueueQueueItem({
      type: type,
      payload: payload
    });
  }

  function queueRemotePublish(payload) {
    queueRemoteOperation("publish_checkin", payload);
  }

  function shouldPublishFeedPost(payload) {
    if (!payload) {
      return false;
    }
    return Boolean(payload.sharePublic);
  }

  function runRemotePublish(payload) {
    var remote = getRemoteClient();
    if (!remote || !isRemoteConfigured() || !isRemoteAuthenticated()) {
      return Promise.resolve(false);
    }
    return remote.upsertCheckin({
      date: payload.date,
      items_json: payload.items,
      note: payload.note || "",
      inspiration_added: payload.inspirationAdded || "",
      mood: payload.mood || null,
      missed_notes_json: payload.missedNotes || {}
    }).then(function (checkinRow) {
      if (!shouldPublishFeedPost(payload) || !checkinRow) {
        return true;
      }
      return remote.upsertFeedPost({
        checkin_id: checkinRow.id,
        date: payload.date,
        summary: buildRemoteSummary(payload),
        note: payload.note || "",
        inspiration: payload.inspirationAdded || "",
        mood: payload.mood || null,
        visibility: "public"
      }).then(function () {
        return true;
      });
    });
  }

  function syncRemoteProfileFromStore(store) {
    var remote = getRemoteClient();
    if (!remote || !isRemoteConfigured() || !isRemoteAuthenticated()) {
      return Promise.resolve(false);
    }
    return remote.upsertProfile({
      display_name: preferredDisplayName(store),
      avatar_id: store.user.avatarId || "avatar_1",
      tone: store.settings.tone,
      share_logs_to_community: Boolean(store.settings.shareLogsToCommunity)
    }).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  function syncFromRemoteIntoStore(store) {
    var remote = getRemoteClient();
    if (!remote || !isRemoteConfigured() || !isRemoteAuthenticated()) {
      return Promise.resolve(false);
    }
    return Promise.all([remote.fetchMyProfile(), remote.fetchMyCheckins(180)])
      .then(function (results) {
        var profile = results[0];
        var checkins = results[1];
        var changed = false;
        var authUserId = currentAuthenticatedUserId();
        if (authUserId && store.user.id !== authUserId) {
          store.user.id = authUserId;
          changed = true;
        }
        if (profile) {
          if (profile.display_name && profile.display_name !== store.user.displayName) {
            store.user.displayName = profile.display_name;
            changed = true;
          }
          if (profile.avatar_id && profile.avatar_id !== store.user.avatarId) {
            store.user.avatarId = profile.avatar_id;
            changed = true;
          }
          if (profile.tone && profile.tone !== store.settings.tone) {
            store.settings.tone = profile.tone;
            changed = true;
          }
          if (typeof profile.share_logs_to_community === "boolean" && profile.share_logs_to_community !== store.settings.shareLogsToCommunity) {
            store.settings.shareLogsToCommunity = profile.share_logs_to_community;
            changed = true;
          }
        }
        if (mergeRemoteCheckinsIntoStore(store, checkins)) {
          changed = true;
        }
        if (changed) {
          saveStore(store);
        }
        return changed;
      })
      .catch(function () {
        return false;
      });
  }

  function flushRemoteQueue(store) {
    var remote = getRemoteClient();
    if (!remote || !isRemoteConfigured() || !isRemoteAuthenticated()) {
      return Promise.resolve(false);
    }
    return remote.flushQueue({
      publish_checkin: function (payload) {
        payload.sharePublic = Boolean(payload.sharePublic);
        return runRemotePublish(payload);
      },
      profile_sync: function () {
        return syncRemoteProfileFromStore(store);
      }
    }).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  function preferredDisplayName(store) {
    if (store.user.displayName && store.user.displayName.trim()) {
      return store.user.displayName.trim();
    }
    return "Anonymous pilgrim";
  }

  function profileHandle(store) {
    return "@lent-" + String(store.user.id || "").slice(0, 6);
  }

  function avatarClassForId(avatarId) {
    for (var i = 0; i < AVATAR_PRESETS.length; i += 1) {
      if (AVATAR_PRESETS[i].id === avatarId) {
        return AVATAR_PRESETS[i].className;
      }
    }
    return AVATAR_PRESETS[0].className;
  }

  function createAvatarArt(className) {
    var art = document.createElement("span");
    art.className = "avatar-art " + className;
    if (className === "avatar-emoji-cross") {
      art.classList.add("avatar-emoji");
      art.textContent = "✝";
    } else if (className === "avatar-emoji-yinyang") {
      art.classList.add("avatar-emoji");
      art.textContent = "☯";
    } else if (className === "avatar-emoji-sparkle") {
      art.classList.add("avatar-emoji");
      art.textContent = "✨";
    }
    art.setAttribute("aria-hidden", "true");
    return art;
  }

  function summarizePayload(payload) {
    var ids = Object.keys(payload.items || {});
    if (!ids.length) {
      return "No commitments set";
    }
    var kept = 0;
    for (var i = 0; i < ids.length; i += 1) {
      if (payload.items[ids[i]] === "kept") {
        kept += 1;
      }
    }
    var slipped = ids.length - kept;
    return kept + "/" + ids.length + " logged" + (slipped > 0 ? ", " + slipped + " missed" : "");
  }

  function getLoggedCommitmentTitles(store, itemsMap) {
    var titleById = {};
    (store.commitments || []).forEach(function (commitment) {
      titleById[commitment.id] = (commitment.title || "").trim();
    });
    var out = [];
    Object.keys(itemsMap || {}).forEach(function (id) {
      if (itemsMap[id] !== "kept") {
        return;
      }
      var title = titleById[id];
      if (title) {
        out.push(title);
      }
    });
    return out;
  }

  function toDashedTag(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function buildAutoPostTags(store, itemsMap) {
    var byId = {};
    (store.commitments || []).forEach(function (commitment) {
      byId[commitment.id] = commitment;
    });
    var dedupe = {};
    Object.keys(itemsMap || {}).forEach(function (id) {
      var commitment = byId[id];
      if (!commitment || !commitment.title) {
        return;
      }
      var dashed = toDashedTag(commitment.title);
      if (!dashed) {
        return;
      }
      var prefix = commitment.type === "not_doing" ? "giving-up-" : "starting-";
      dedupe[prefix + dashed] = true;
    });
    return Object.keys(dedupe);
  }

  function extractAutoTagsFromSummary(summaryText) {
    if (!summaryText || summaryText.indexOf("| Tags:") === -1) {
      return [];
    }
    var parts = String(summaryText).split("| Tags:");
    if (parts.length < 2) {
      return [];
    }
    return parts[1]
      .split(";")
      .map(function (piece) {
        return piece.trim();
      })
      .filter(function (piece) {
        return Boolean(piece);
      });
  }

  function normalizeSuggestionKey(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[^\w\s']/g, "")
      .replace(/\s+/g, " ");
  }

  function extractLoggedTitlesFromSummary(summaryText) {
    if (!summaryText || summaryText.indexOf("| Logged:") === -1) {
      return [];
    }
    var parts = String(summaryText).split("| Logged:");
    if (parts.length < 2) {
      return [];
    }
    return parts[1]
      .split(",")
      .map(function (piece) {
        return piece.trim();
      })
      .filter(function (piece) {
        return Boolean(piece);
      });
  }

  function topCommunitySuggestions(rows) {
    var counts = {};
    var displayByKey = {};
    (rows || []).forEach(function (row) {
      extractLoggedTitlesFromSummary(row.summary).forEach(function (title) {
        var key = normalizeSuggestionKey(title);
        if (!key) {
          return;
        }
        counts[key] = (counts[key] || 0) + 1;
        if (!displayByKey[key]) {
          displayByKey[key] = title;
        }
      });
    });
    return Object.keys(counts)
      .filter(function (key) {
        return counts[key] > 2;
      })
      .sort(function (a, b) {
        if (counts[b] !== counts[a]) {
          return counts[b] - counts[a];
        }
        return String(displayByKey[a]).localeCompare(String(displayByKey[b]));
      })
      .slice(0, 10)
      .map(function (key) {
        return displayByKey[key];
      });
  }

  function upsertCommunityBoardEntry(store, payload) {
    if (!Array.isArray(store.communityBoard)) {
      store.communityBoard = [];
    }
    var existing = null;
    for (var i = 0; i < store.communityBoard.length; i += 1) {
      var row = store.communityBoard[i];
      if (row.userId === store.user.id && row.date === payload.date) {
        existing = row;
        break;
      }
    }
    var nowIso = new Date().toISOString();
    if (!existing) {
      existing = {
        id: uuid(),
        userId: store.user.id,
        displayName: preferredDisplayName(store),
        avatarId: store.user.avatarId || "avatar_1",
        date: payload.date,
        summary: summarizePayload(payload),
        tags: Array.isArray(payload.autoTags) ? payload.autoTags.slice() : [],
        note: payload.note || "",
        inspiration: payload.inspirationAdded || "",
        mood: payload.mood || null,
        supporterIds: [],
        createdAt: nowIso,
        updatedAt: nowIso
      };
      store.communityBoard.push(existing);
      return;
    }
    existing.displayName = preferredDisplayName(store);
    existing.avatarId = store.user.avatarId || "avatar_1";
    existing.summary = summarizePayload(payload);
    existing.tags = Array.isArray(payload.autoTags) ? payload.autoTags.slice() : [];
    existing.note = payload.note || "";
    existing.inspiration = payload.inspirationAdded || "";
    existing.mood = payload.mood || null;
    existing.updatedAt = nowIso;
  }

  function refreshOwnCommunityIdentity(store) {
    if (!Array.isArray(store.communityBoard)) {
      return false;
    }
    var changed = false;
    var ownName = preferredDisplayName(store);
    var ownAvatarId = store.user.avatarId || "avatar_1";
    for (var i = 0; i < store.communityBoard.length; i += 1) {
      var entry = store.communityBoard[i];
      if (!entry || entry.userId !== store.user.id) {
        continue;
      }
      if (entry.displayName !== ownName) {
        entry.displayName = ownName;
        changed = true;
      }
      if (entry.avatarId !== ownAvatarId) {
        entry.avatarId = ownAvatarId;
        changed = true;
      }
    }
    return changed;
  }

  function initIndexPage(store) {
    var ctaWrap = byId("indexPrimaryCta");
    var infoWrap = byId("indexSecondaryInfo");
    var communityInfoWrap = byId("indexCommunityInfo");
    var communityPostsInfoWrap = byId("indexCommunityPostsInfo");
    if (!ctaWrap || !infoWrap) {
      return;
    }
    ctaWrap.innerHTML = "";
    infoWrap.innerHTML = "";
    if (communityInfoWrap) {
      communityInfoWrap.textContent = "";
    }
    if (communityPostsInfoWrap) {
      communityPostsInfoWrap.textContent = "";
    }
    var hasCommitments = store.commitments.length > 0;

    var button = document.createElement("button");
    button.className = "primary";
    if (hasCommitments) {
      button.textContent = "Continue";
      button.addEventListener("click", function () {
        goTo("app.html");
      });
      var streak = computeStreak(store.checkins);
      infoWrap.textContent = "Current streak: " + streak + " day" + (streak === 1 ? "" : "s") + ".";
    } else {
      button.textContent = "Start tracking";
      button.addEventListener("click", function () {
        goTo("setup.html");
      });
      infoWrap.textContent = "Set your commitments once, then check in daily.";
    }
    ctaWrap.appendChild(button);

    function setCommunityPeopleLine(count) {
      if (!communityInfoWrap) {
        return;
      }
      if (!count || count <= 0) {
        communityInfoWrap.textContent = "";
        return;
      }
      communityInfoWrap.textContent = count + " " + (count === 1 ? "person is" : "people are") + " taking part.";
    }

    function readLocalSupportCounts() {
      return {
        comments: 0,
        replies: 0
      };
    }

    function setCommunityActivityLine(totalCount) {
      if (!communityPostsInfoWrap) {
        return;
      }
      if (!totalCount || totalCount <= 0) {
        communityPostsInfoWrap.textContent = "";
        return;
      }
      communityPostsInfoWrap.textContent = totalCount + " total community posts, notes, comments, and replies.";
      communityPostsInfoWrap.setAttribute("href", "community.html");
    }

    var localParticipantIds = {};
    (store.communityBoard || []).forEach(function (entry) {
      if (entry && entry.userId) {
        localParticipantIds[entry.userId] = true;
      }
    });
    var localCount = Object.keys(localParticipantIds).length;
    setCommunityPeopleLine(localCount);
    var localSupportCounts = readLocalSupportCounts();
    var localActivityCount = (store.communityBoard || []).length +
      (store.savedCommunityNotes || []).length +
      localSupportCounts.comments +
      localSupportCounts.replies;
    setCommunityActivityLine(localActivityCount);

    if (isRemoteConfigured()) {
      var remote = getRemoteClient();
      if (remote && typeof remote.fetchPublicFeed === "function") {
        remote.fetchPublicFeed(120).then(function (rows) {
          var ids = {};
          (rows || []).forEach(function (row) {
            if (row && row.user_id) {
              ids[row.user_id] = true;
            }
          });
          var remoteCount = Object.keys(ids).length;
          if (remoteCount > 0) {
            setCommunityPeopleLine(remoteCount);
          }
          var remotePostCount = Array.isArray(rows) ? rows.length : 0;
          var postIds = (rows || []).map(function (row) { return row.id; });
          if (typeof remote.fetchPostComments === "function") {
            remote.fetchPostComments(postIds).then(function (commentRows) {
              var totalComments = Array.isArray(commentRows) ? commentRows.length : 0;
              var remoteActivityCount = remotePostCount +
                (store.savedCommunityNotes || []).length +
                totalComments;
              if (remoteActivityCount > 0) {
                setCommunityActivityLine(remoteActivityCount);
              }
            }).catch(function () {
              var fallbackActivityCount = remotePostCount + (store.savedCommunityNotes || []).length;
              if (fallbackActivityCount > 0) {
                setCommunityActivityLine(fallbackActivityCount);
              }
            });
            return;
          }
          var remoteActivityCount = remotePostCount + (store.savedCommunityNotes || []).length;
          if (remoteActivityCount > 0) {
            setCommunityActivityLine(remoteActivityCount);
          }
        }).catch(function () {
        });
      }
    }
  }

  function commitmentListItem(store, commitment, onChange) {
    var item = document.createElement("li");
    item.className = "item";
    item.dataset.id = commitment.id;
    commitment.active = true;

    var top = document.createElement("div");
    top.className = "item-top";
    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = commitment.title;
    titleInput.maxLength = 80;
    titleInput.setAttribute("aria-label", "Commitment title");
    titleInput.addEventListener("change", function () {
      commitment.title = titleInput.value.trim() || commitment.title;
      saveStore(store);
      onChange();
    });

    top.appendChild(titleInput);

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tiny";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      var confirmDelete = window.confirm("Delete this commitment?");
      if (!confirmDelete) {
        return;
      }
      store.commitments = store.commitments.filter(function (itemObj) {
        return itemObj.id !== commitment.id;
      });
      var checkinKeys = Object.keys(store.checkins);
      for (var i = 0; i < checkinKeys.length; i += 1) {
        var key = checkinKeys[i];
        delete store.checkins[key].items[commitment.id];
      }
      saveStore(store);
      onChange();
    });
    top.appendChild(deleteBtn);
    item.appendChild(top);
    return item;
  }

  function initSetupPage(store) {
    var displayNameInput = byId("displayName");
    var toneSelect = byId("toneSelect");
    var lentDateRange = byId("lentDateRange");
    var shareLogsToggle = byId("shareLogsToggle");
    var avatarPicker = byId("avatarPicker");
    var profileViewPanel = byId("profileViewPanel");
    var profileEditView = byId("profileEditView");
    var openEditProfileBtn = byId("openEditProfileBtn");
    var editAvatarQuickBtn = byId("editAvatarQuickBtn");
    var profileAvatarView = byId("profileAvatarView");
    var profileDisplayNameView = byId("profileDisplayNameView");
    var profileHandleView = byId("profileHandleView");
    var profileStreakView = byId("profileStreakView");
    var profileCompletionView = byId("profileCompletionView");
    var profileCheckinsView = byId("profileCheckinsView");
    var profileSummaryView = byId("profileSummaryView");
    var profileCommitmentsPreview = byId("profileCommitmentsPreview");
    var profileUpdateLoggingBtn = byId("profileUpdateLoggingBtn");
    var profileAddMoreBtn = byId("profileAddMoreBtn");
    var notDoingSection = byId("notDoingSection");
    var doingSection = byId("doingSection");
    var notDoingInput = byId("notDoingInput");
    var doingInput = byId("doingInput");
    var notDoingList = byId("notDoingList");
    var doingList = byId("doingList");
    var addNotDoingForm = byId("addNotDoingForm");
    var addDoingForm = byId("addDoingForm");
    var addNotDoingBtn = addNotDoingForm ? addNotDoingForm.querySelector("button[type='submit']") : null;
    var addDoingBtn = addDoingForm ? addDoingForm.querySelector("button[type='submit']") : null;
    var notDoingFormMessage = byId("notDoingFormMessage");
    var doingFormMessage = byId("doingFormMessage");
    var notDoingCount = byId("notDoingCount");
    var doingCount = byId("doingCount");
    var notDoingSuggestionsWrap = byId("notDoingSuggestionsWrap");
    var doingSuggestionsWrap = byId("doingSuggestionsWrap");
    var notDoingSuggestions = byId("notDoingSuggestions");
    var doingSuggestions = byId("doingSuggestions");
    var saveSetupBtn = byId("saveSetupBtn");
    var setupMessage = byId("setupMessage");
    var exportBtn = byId("exportDataBtn");
    var importInput = byId("importDataInput");
    var lastBackupLabel = byId("lastBackupLabel");

    if (!displayNameInput) {
      return;
    }

    var pageIntro = document.querySelector(".page-intro");
    var authMount = maybeCreateAuthMount(pageIntro, "setupAuthMount");
    renderAuthPanelFor(authMount, function () {
      window.location.reload();
    });

    var selectedAvatarId = store.user.avatarId || "avatar_1";

    function setEditMode(enabled) {
      if (enabled) {
        profileViewPanel.classList.add("is-hidden");
        profileEditView.classList.remove("is-hidden");
      } else {
        profileEditView.classList.add("is-hidden");
        profileViewPanel.classList.remove("is-hidden");
      }
    }

    function openEditForLogging(targetSection, focusInput) {
      setEditMode(true);
      var target = targetSection || notDoingSection;
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (focusInput && typeof focusInput.focus === "function") {
        window.setTimeout(function () {
          focusInput.focus();
        }, 220);
      }
    }

    function renderAvatarPicker() {
      if (!avatarPicker) {
        return;
      }
      avatarPicker.innerHTML = "";
      AVATAR_PRESETS.forEach(function (avatar) {
        var option = document.createElement("button");
        option.type = "button";
        option.className = "avatar-option";
        option.setAttribute("role", "radio");
        option.setAttribute("aria-checked", avatar.id === selectedAvatarId ? "true" : "false");
        option.appendChild(createAvatarArt(avatar.className));
        if (avatar.id === selectedAvatarId) {
          option.classList.add("is-selected");
        }
        option.addEventListener("click", function () {
          selectedAvatarId = avatar.id;
          renderAvatarPicker();
        });
        avatarPicker.appendChild(option);
      });
    }

    function updateLentDateLabel() {
      syncStoreLentDates(store);
      if (lentDateRange) {
        lentDateRange.textContent = formatDateForHumans(store.settings.startDate) + " - " + formatDateForHumans(store.settings.endDate);
      }
    }

    function renderProfileView() {
      var existingAvatarArt = profileAvatarView.querySelector(".avatar-art");
      if (existingAvatarArt) {
        existingAvatarArt.remove();
      }
      profileAvatarView.insertBefore(
        createAvatarArt(avatarClassForId(store.user.avatarId || selectedAvatarId)),
        profileAvatarView.firstChild
      );
      profileDisplayNameView.textContent = preferredDisplayName(store);
      profileHandleView.textContent = profileHandle(store);
      profileStreakView.textContent = String(computeStreak(store.checkins));
      var completion = computeCompletionRate(store);
      profileCompletionView.textContent = completion.rate + "%";
      profileCheckinsView.textContent = String(Object.keys(store.checkins).length);
      profileSummaryView.textContent =
        "Tone: " +
        store.settings.tone +
        " | Sharing: " +
        (store.settings.shareLogsToCommunity ? "On" : "Off") +
        " | Lent: " +
        formatDateForHumans(store.settings.startDate) +
        " - " +
        formatDateForHumans(store.settings.endDate);

      profileCommitmentsPreview.innerHTML = "";
      var active = getActiveCommitments(store);
      if (!active.length) {
        profileCommitmentsPreview.classList.add("is-hidden");
        if (profileUpdateLoggingBtn) {
          profileUpdateLoggingBtn.textContent = "Edit your lent log settings";
          profileUpdateLoggingBtn.classList.remove("danger-cta");
          profileUpdateLoggingBtn.classList.remove("is-hidden");
        }
        if (profileAddMoreBtn) {
          profileAddMoreBtn.classList.add("is-hidden");
        }
        return;
      }
      profileCommitmentsPreview.classList.remove("is-hidden");
      if (profileUpdateLoggingBtn) {
        profileUpdateLoggingBtn.classList.add("is-hidden");
      }
      if (profileAddMoreBtn) {
        profileAddMoreBtn.textContent = "Add more";
        profileAddMoreBtn.classList.remove("is-hidden");
      }
      active.slice(0, 6).forEach(function (item) {
        var li = document.createElement("li");
        li.className = "item";
        var text = document.createElement("p");
        text.textContent = item.title;
        var meta = document.createElement("p");
        meta.className = "note-card-date";
        meta.textContent = item.type === "not_doing" ? "Giving up" : "Starting";
        li.appendChild(text);
        li.appendChild(meta);
        profileCommitmentsPreview.appendChild(li);
      });
      if (active.length > 6) {
        var more = document.createElement("li");
        more.className = "muted";
        more.textContent = "+" + (active.length - 6) + " more commitments";
        profileCommitmentsPreview.appendChild(more);
      }
    }

    function renderCommitmentLists() {
      notDoingList.innerHTML = "";
      doingList.innerHTML = "";
      var notDoing = store.commitments.filter(function (item) {
        return item.type === "not_doing";
      });
      var doing = store.commitments.filter(function (item) {
        return item.type === "doing";
      });

      notDoing.forEach(function (item) {
        notDoingList.appendChild(commitmentListItem(store, item, renderCommitmentLists));
      });
      doing.forEach(function (item) {
        doingList.appendChild(commitmentListItem(store, item, renderCommitmentLists));
      });

      if (!notDoing.length) {
        var emptyNotDoing = document.createElement("li");
        emptyNotDoing.className = "muted";
        emptyNotDoing.textContent = "No items yet.";
        notDoingList.appendChild(emptyNotDoing);
      }
      if (!doing.length) {
        var emptyDoing = document.createElement("li");
        emptyDoing.className = "muted";
        emptyDoing.textContent = "No items yet.";
        doingList.appendChild(emptyDoing);
      }
      if (notDoingCount) {
        notDoingCount.textContent = "Your list: " + notDoing.length;
      }
      if (doingCount) {
        doingCount.textContent = "Your list: " + doing.length;
      }
      if (addNotDoingBtn) {
        addNotDoingBtn.textContent = notDoing.length > 0 ? "Add more" : "Add";
      }
      if (addDoingBtn) {
        addDoingBtn.textContent = doing.length > 0 ? "Add more" : "Add";
      }
      renderProfileView();
    }

    function addCommitment(type, inputEl, messageEl) {
      var value = inputEl.value.trim();
      if (!value) {
        setMessage(messageEl, "Enter a commitment title before adding.", "warn");
        return;
      }
      var normalizedValue = normalizeSuggestionKey(value);
      var alreadyExists = store.commitments.some(function (item) {
        return item.type === type && normalizeSuggestionKey(item.title) === normalizedValue;
      });
      if (alreadyExists) {
        setMessage(messageEl, "Already added in this section.", "warn");
        return;
      }
      store.commitments.push({
        id: uuid(),
        type: type,
        title: value,
        createdAt: new Date().toISOString(),
        active: true
      });
      inputEl.value = "";
      saveStore(store);
      renderCommitmentLists();
      setMessage(messageEl, "Added to your list.", "ok");
      window.setTimeout(function () {
        if (messageEl && messageEl.textContent === "Added to your list.") {
          setMessage(messageEl, "", "");
        }
      }, 1600);
      inputEl.focus();
    }

    function renderSuggestionChips(container, suggestions, type, inputEl, messageEl) {
      if (!container) {
        return;
      }
      container.innerHTML = "";
      suggestions.forEach(function (text) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "suggestion-chip";
        chip.textContent = "+ " + text;
        chip.addEventListener("click", function () {
          inputEl.value = text;
          addCommitment(type, inputEl, messageEl);
        });
        container.appendChild(chip);
      });
    }

    function renderCommunitySuggestions(suggestions) {
      var hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;
      if (notDoingSuggestionsWrap) {
        notDoingSuggestionsWrap.classList.toggle("is-hidden", !hasSuggestions);
      }
      if (doingSuggestionsWrap) {
        doingSuggestionsWrap.classList.toggle("is-hidden", !hasSuggestions);
      }
      if (!hasSuggestions) {
        return;
      }
      renderSuggestionChips(notDoingSuggestions, suggestions, "not_doing", notDoingInput, notDoingFormMessage);
      renderSuggestionChips(doingSuggestions, suggestions, "doing", doingInput, doingFormMessage);
    }

    addNotDoingForm.addEventListener("submit", function (event) {
      event.preventDefault();
      addCommitment("not_doing", notDoingInput, notDoingFormMessage);
    });

    addDoingForm.addEventListener("submit", function (event) {
      event.preventDefault();
      addCommitment("doing", doingInput, doingFormMessage);
    });

    saveSetupBtn.addEventListener("click", function () {
      store.user.displayName = displayNameInput.value.trim();
      store.user.avatarId = selectedAvatarId;
      store.settings.tone = toneSelect.value;
      store.settings.shareLogsToCommunity = Boolean(shareLogsToggle && shareLogsToggle.checked);
      if (!store.settings.shareLogsToCommunity && Array.isArray(store.communityBoard)) {
        store.communityBoard = store.communityBoard.filter(function (entry) {
          return entry.userId !== store.user.id;
        });
      }
      refreshOwnCommunityIdentity(store);
      syncStoreLentDates(store);
      if (!saveStore(store)) {
        setMessage(setupMessage, "Unable to save your setup.", "warn");
        return;
      }
      setMessage(setupMessage, "Saved. Opening Today...", "ok");
      renderProfileView();
      syncRemoteProfileFromStore(store).then(function (ok) {
        if (!ok) {
          queueRemoteOperation("profile_sync", {});
        }
      });
      window.setTimeout(function () {
        goTo("app.html");
      }, 280);
    });

    if (openEditProfileBtn) {
      openEditProfileBtn.addEventListener("click", function () {
        setEditMode(true);
      });
    }
    if (profileUpdateLoggingBtn) {
      profileUpdateLoggingBtn.addEventListener("click", function () {
        openEditForLogging(notDoingSection, notDoingInput);
      });
    }
    if (profileAddMoreBtn) {
      profileAddMoreBtn.addEventListener("click", function () {
        openEditForLogging(doingSection || notDoingSection, doingInput || notDoingInput);
      });
    }
    if (editAvatarQuickBtn) {
      editAvatarQuickBtn.addEventListener("click", function () {
        setEditMode(true);
        if (avatarPicker) {
          avatarPicker.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        store.settings.lastBackupAt = new Date().toISOString();
        if (!saveStore(store)) {
          setMessage(setupMessage, "Unable to export right now.", "warn");
          return;
        }
        var blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "lent-tracker-backup-" + todayKey() + ".json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        updateLastBackupLabel();
        setMessage(setupMessage, "Backup exported.", "ok");
      });
    }

    if (importInput) {
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        if (!file) {
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var parsed = JSON.parse(String(reader.result));
            if (!validateStoreSchema(parsed)) {
              throw new Error("Schema mismatch");
            }
            var normalized = normalizeStore(parsed);
            syncStoreLentDates(normalized);
            store = normalized;
            saveStore(store);
            selectedAvatarId = store.user.avatarId || "avatar_1";
            displayNameInput.value = store.user.displayName || "";
            toneSelect.value = store.settings.tone;
            if (shareLogsToggle) {
              shareLogsToggle.checked = Boolean(store.settings.shareLogsToCommunity);
            }
            updateLentDateLabel();
            renderAvatarPicker();
            renderCommitmentLists();
            updateLastBackupLabel();
            setMessage(setupMessage, "Data imported. Local store replaced.", "ok");
          } catch (error) {
            setMessage(setupMessage, "Import failed. Please use a valid Lent Log JSON export.", "warn");
          } finally {
            importInput.value = "";
          }
        };
        reader.readAsText(file);
      });
    }

    function updateLastBackupLabel() {
      if (!lastBackupLabel) {
        return;
      }
      if (!store.settings.lastBackupAt) {
        lastBackupLabel.textContent = "No export yet.";
        return;
      }
      var date = new Date(store.settings.lastBackupAt);
      if (Number.isNaN(date.getTime())) {
        lastBackupLabel.textContent = "Last backup time unavailable.";
      } else {
        lastBackupLabel.textContent = "Last export: " + date.toLocaleString();
      }
    }

    displayNameInput.value = store.user.displayName || "";
    toneSelect.value = store.settings.tone;
    if (shareLogsToggle) {
      shareLogsToggle.checked = Boolean(store.settings.shareLogsToCommunity);
    }
    updateLentDateLabel();
    renderAvatarPicker();
    renderCommitmentLists();
    updateLastBackupLabel();
    renderProfileView();
    setEditMode(false);

    syncFromRemoteIntoStore(store).then(function (changed) {
      if (changed) {
        selectedAvatarId = store.user.avatarId || "avatar_1";
        displayNameInput.value = store.user.displayName || "";
        toneSelect.value = store.settings.tone;
        if (shareLogsToggle) {
          shareLogsToggle.checked = Boolean(store.settings.shareLogsToCommunity);
        }
        updateLentDateLabel();
        renderAvatarPicker();
        renderCommitmentLists();
        renderProfileView();
      }
    });

    var remote = getRemoteClient();
    if (remote && isRemoteConfigured()) {
      remote.fetchPublicFeed(120)
        .then(function (rows) {
          renderCommunitySuggestions(topCommunitySuggestions(rows));
        })
        .catch(function () {
          renderCommunitySuggestions([]);
        });
    } else {
      renderCommunitySuggestions([]);
    }
  }

  function getActiveCommitments(store) {
    return store.commitments.slice();
  }

  function initTodayPage(store) {
    var today = todayKey();
    var todayDateLabel = byId("todayDateLabel");
    var todayPhaseLabel = byId("todayPhaseLabel");
    var todayStreakLabel = byId("todayStreakLabel");
    var daySelectorGrid = byId("daySelectorGrid");
    var daySelectorMessage = byId("daySelectorMessage");
    var todayEditorPanel = byId("todayEditorPanel");
    var dailyPromptText = byId("dailyPromptText");
    var addInspirationToggle = byId("addInspirationToggle");
    var inspirationFieldWrap = byId("inspirationFieldWrap");
    var todayCommitments = byId("todayCommitments");
    var noteInput = byId("todayNote");
    var moodSelector = byId("moodSelector");
    var inspirationInput = byId("inspirationAdded");
    var saveBtn = byId("saveTodayBtn");
    var saveMessage = byId("todaySaveMessage");

    if (!todayDateLabel) {
      return;
    }

    var activeCommitments = getActiveCommitments(store);

    todayDateLabel.textContent = formatDateForHumans(today);

    var dayNumber = computeDayIndex(store.settings.startDate, today);
    var totalDays = computeDayIndex(store.settings.startDate, store.settings.endDate);
    var todayObj = parseDateKey(today);
    var startObj = parseDateKey(store.settings.startDate);
    var endObj = parseDateKey(store.settings.endDate);
    if (todayObj.getTime() < startObj.getTime()) {
      todayPhaseLabel.textContent = "Pre-Lent";
      todayStreakLabel.textContent = "Your journey begins on " + formatDateForHumans(store.settings.startDate) + ".";
    } else if (todayObj.getTime() > endObj.getTime()) {
      todayPhaseLabel.textContent = "Post-Lent";
      todayStreakLabel.textContent = "Lent window ended on " + formatDateForHumans(store.settings.endDate) + ". Keep the momentum.";
    } else {
      todayPhaseLabel.textContent = "Day " + dayNumber + " of " + totalDays;
      var streak = computeStreak(store.checkins);
      todayStreakLabel.textContent = "Current streak: " + streak + " day" + (streak === 1 ? "" : "s") + ".";
    }

    function isCompletedCheckin(dateKey) {
      var checkin = store.checkins[dateKey];
      if (!checkin) {
        return false;
      }
      if (activeCommitments.length > 0) {
        for (var i = 0; i < activeCommitments.length; i += 1) {
          var id = activeCommitments[i].id;
          var status = checkin.items && checkin.items[id];
          if (status !== "kept" && status !== "slipped") {
            return false;
          }
        }
        return true;
      }
      var hasNote = Boolean((checkin.note || "").trim());
      var hasInspiration = Boolean((checkin.inspirationAdded || "").trim());
      var hasMood = Number.isFinite(checkin.mood) && checkin.mood > 0;
      return hasNote || hasInspiration || hasMood;
    }

    function renderEditor(dateKey) {
      var existingCheckin = store.checkins[dateKey] || {
        date: dateKey,
        items: {},
        note: "",
        inspirationAdded: "",
        mood: null,
        missedNotes: {}
      };
      for (var i = 0; i < activeCommitments.length; i += 1) {
        var activeItem = activeCommitments[i];
        if (!existingCheckin.items[activeItem.id]) {
          existingCheckin.items[activeItem.id] = "kept";
        }
      }

      dailyPromptText.textContent = getDailyPrompt(dateKey, store.settings.tone);
      todayCommitments.innerHTML = "";

      if (!activeCommitments.length) {
        var empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No active commitments yet. Add them in Setup.";
        todayCommitments.appendChild(empty);
      } else {
        var groups = [
          { type: "not_doing", label: "What I'm giving up" },
          { type: "doing", label: "What I'm starting" }
        ];
        for (var g = 0; g < groups.length; g += 1) {
          var group = groups[g];
          var items = activeCommitments.filter(function (item) {
            return item.type === group.type;
          });
          if (!items.length) {
            continue;
          }
          var groupWrap = document.createElement("section");
          groupWrap.className = "commitment-group";
          var groupTitle = document.createElement("p");
          groupTitle.className = "muted";
          groupTitle.textContent = group.label;
          groupWrap.appendChild(groupTitle);

          items.forEach(function (item) {
            var row = document.createElement("div");
            row.className = "commitment-row";
            var title = document.createElement("span");
            title.textContent = item.title;
            var control = createSegmentedStatus("status-" + dateKey + "-" + item.id, existingCheckin.items[item.id] || "kept");
            row.appendChild(title);
            row.appendChild(control);

            var followupWrap = document.createElement("div");
            followupWrap.className = "missed-followup";
            var followupLabel = document.createElement("label");
            followupLabel.className = "tiny muted";
            var followupId = "missed-note-" + dateKey + "-" + item.id;
            followupLabel.setAttribute("for", followupId);
            followupLabel.textContent = "No judgment - tell us what happened (optional)";
            var followupInput = document.createElement("textarea");
            followupInput.id = followupId;
            followupInput.rows = 2;
            followupInput.maxLength = 220;
            followupInput.placeholder = "Rough moment, what happened?";
            followupInput.value = (existingCheckin.missedNotes && existingCheckin.missedNotes[item.id]) || "";
            followupWrap.appendChild(followupLabel);
            followupWrap.appendChild(followupInput);
            row.appendChild(followupWrap);

            function syncMissedFollowupVisibility() {
              var selectedStatus = document.querySelector("input[name='status-" + dateKey + "-" + item.id + "']:checked");
              var isMissed = selectedStatus && selectedStatus.value === "slipped";
              var hasExistingText = Boolean((followupInput.value || "").trim());
              followupWrap.classList.toggle("is-visible", Boolean(isMissed || hasExistingText));
            }

            var rowRadios = row.querySelectorAll("input[name='status-" + dateKey + "-" + item.id + "']");
            rowRadios.forEach(function (radio) {
              radio.addEventListener("change", syncMissedFollowupVisibility);
            });
            syncMissedFollowupVisibility();
            groupWrap.appendChild(row);
          });
          todayCommitments.appendChild(groupWrap);
        }
      }

      moodSelector.innerHTML = "";
      for (var mood = 1; mood <= 5; mood += 1) {
        var moodLabel = document.createElement("label");
        moodLabel.className = "segment mood-pill";
        var moodInput = document.createElement("input");
        moodInput.type = "radio";
        moodInput.name = "todayMood-" + dateKey;
        moodInput.value = String(mood);
        moodInput.checked = Number(existingCheckin.mood) === mood;
        var moodSpan = document.createElement("span");
        moodSpan.textContent = String(mood);
        moodLabel.appendChild(moodInput);
        moodLabel.appendChild(moodSpan);
        moodSelector.appendChild(moodLabel);
      }

      noteInput.value = existingCheckin.note || "";
      inspirationInput.value = existingCheckin.inspirationAdded || "";
      if (addInspirationToggle && inspirationFieldWrap) {
        addInspirationToggle.checked = Boolean((existingCheckin.inspirationAdded || "").trim());
        addInspirationToggle.onchange = function () {
          inspirationFieldWrap.classList.toggle("is-hidden", !addInspirationToggle.checked);
          if (!addInspirationToggle.checked) {
            inspirationInput.value = "";
          } else {
            inspirationInput.focus();
          }
        };
        inspirationFieldWrap.classList.toggle("is-hidden", !addInspirationToggle.checked);
      }
      saveBtn.textContent = "Save";
      setMessage(saveMessage, "", "");

      function submitDayUpdate(doneMessage, nextPage) {
        var saveStartedAt = Date.now();
        todayEditorPanel.classList.add("is-saving");
        saveBtn.disabled = true;
        setMessage(saveMessage, "", "");

        var payload = {
          date: dateKey,
          items: {},
          note: noteInput.value.trim(),
          inspirationAdded: addInspirationToggle && addInspirationToggle.checked ? inspirationInput.value.trim() : "",
          mood: null,
          missedNotes: {},
          updatedAt: new Date().toISOString()
        };
        activeCommitments.forEach(function (item) {
          var selected = document.querySelector("input[name='status-" + dateKey + "-" + item.id + "']:checked");
          payload.items[item.id] = selected ? selected.value : "kept";
          if (payload.items[item.id] === "slipped") {
            var missedInput = byId("missed-note-" + dateKey + "-" + item.id);
            payload.missedNotes[item.id] = missedInput ? missedInput.value.trim() : "";
          }
        });
        var chosenMood = document.querySelector("input[name='todayMood-" + dateKey + "']:checked");
        if (chosenMood) {
          payload.mood = Number(chosenMood.value);
        }
        payload.autoTags = buildAutoPostTags(store, payload.items);
        var previouslyShared = Array.isArray(store.communityBoard) && store.communityBoard.some(function (entry) {
          return entry.userId === store.user.id && entry.date === payload.date;
        });
        store.checkins[dateKey] = payload;
        if (previouslyShared || store.settings.shareLogsToCommunity) {
          upsertCommunityBoardEntry(store, payload);
        }
        if (!saveStore(store)) {
          todayEditorPanel.classList.remove("is-saving");
          saveBtn.disabled = false;
          setMessage(saveMessage, "Could not save your check-in.", "warn");
          return;
        }
        var publishPromise = runRemotePublish({
          date: payload.date,
          items: payload.items,
          note: payload.note,
          inspirationAdded: payload.inspirationAdded,
          mood: payload.mood,
          missedNotes: payload.missedNotes,
          loggedTitles: getLoggedCommitmentTitles(store, payload.items),
          autoTags: payload.autoTags,
          sharePublic: Boolean(previouslyShared || store.settings.shareLogsToCommunity)
        }).then(function (ok) {
          if (!ok && isRemoteConfigured() && isRemoteAuthenticated()) {
            queueRemotePublish({
              date: payload.date,
              items: payload.items,
              note: payload.note,
              inspirationAdded: payload.inspirationAdded,
              mood: payload.mood,
              missedNotes: payload.missedNotes,
              loggedTitles: getLoggedCommitmentTitles(store, payload.items),
              autoTags: payload.autoTags,
              sharePublic: Boolean(previouslyShared || store.settings.shareLogsToCommunity)
            });
          }
        }).catch(function () {
          if (!isRemoteConfigured() || !isRemoteAuthenticated()) {
            return;
          }
          queueRemotePublish({
            date: payload.date,
            items: payload.items,
            note: payload.note,
            inspirationAdded: payload.inspirationAdded,
            mood: payload.mood,
            missedNotes: payload.missedNotes,
            loggedTitles: getLoggedCommitmentTitles(store, payload.items),
            autoTags: payload.autoTags,
            sharePublic: Boolean(previouslyShared || store.settings.shareLogsToCommunity)
          });
        });
        var elapsed = Date.now() - saveStartedAt;
        var remaining = Math.max(0, 520 - elapsed);
        window.setTimeout(function () {
          todayEditorPanel.classList.remove("is-saving");
          saveBtn.disabled = false;
          setMessage(saveMessage, doneMessage, "ok");
          renderDaySelector();
          var streakNow = computeStreak(store.checkins);
          if (todayObj.getTime() >= startObj.getTime() && todayObj.getTime() <= endObj.getTime()) {
            todayStreakLabel.textContent = "Current streak: " + streakNow + " day" + (streakNow === 1 ? "" : "s") + ".";
          }
          if (nextPage) {
            window.setTimeout(function () {
              goTo(nextPage);
            }, 180);
          }
        }, remaining);
      }

      saveBtn.onclick = function () {
        submitDayUpdate("Saved. Opening Progress...", "progress.html");
      }
    }

    function openDayEditor(dateKey) {
      todayEditorPanel.classList.remove("is-hidden");
      renderEditor(dateKey);
      setMessage(daySelectorMessage, "Day opened. Complete your check-in below.", "ok");
      todayEditorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderDaySelector() {
      daySelectorGrid.innerHTML = "";
      var inRange = todayObj.getTime() >= startObj.getTime() && todayObj.getTime() <= endObj.getTime();
      var effectiveDay = dayNumber;
      if (effectiveDay < 1) {
        effectiveDay = 1;
      }
      if (effectiveDay > totalDays) {
        effectiveDay = totalDays;
      }
      var visibleRows = Math.ceil(effectiveDay / 8);
      var visibleDayCount = Math.min(totalDays, visibleRows * 8);
      if (!inRange) {
        todayEditorPanel.classList.add("is-hidden");
      }

      for (var day = 1; day <= visibleDayCount; day += 1) {
        var dateKey = toDateKey(addDays(startObj, day - 1));
        var dateObj = parseDateKey(dateKey);
        var isFuture = dateObj.getTime() > todayObj.getTime();
        var isCurrent = dateKey === today;
        var isComplete = isCompletedCheckin(dateKey);
        var canOpen = !isFuture;

        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "day-chip";
        chip.textContent = String(day);
        chip.title = "Day " + day + " - " + formatDateForHumans(dateKey);
        chip.setAttribute("aria-label", chip.title);

        if (isCurrent) {
          chip.classList.add("is-current");
        }
        chip.disabled = !canOpen;
        if (canOpen) {
          chip.addEventListener("click", function (keyCopy) {
            return function () {
              openDayEditor(keyCopy);
            };
          }(dateKey));
        }

        if (isFuture) {
          chip.classList.add("is-locked");
        }
        if (isComplete) {
          chip.classList.add("is-complete");
        }

        daySelectorGrid.appendChild(chip);
      }

      if (todayObj.getTime() < startObj.getTime()) {
        setMessage(daySelectorMessage, "Pre-Lent. Day 1 unlocks on " + formatDateForHumans(store.settings.startDate) + ".", "");
      } else if (todayObj.getTime() > endObj.getTime()) {
        setMessage(daySelectorMessage, "Lent has ended. You can review and edit days in Progress.", "");
      } else {
        setMessage(daySelectorMessage, "Tap any available day to add or update your log. Future days stay locked.", "");
      }
    }

    renderDaySelector();
  }

  function initProgressPage(store) {
    var streakEl = byId("metricStreak");
    var completionEl = byId("metricCompletion");
    var checkinsEl = byId("metricCheckins");
    var daysLoggedEl = byId("metricDaysLogged");
    var grid = byId("last30Grid");
    var modal = byId("dayModal");
    var modalTitle = byId("dayModalTitle");
    var modalBody = byId("dayModalBody");
    var modalSaveBtn = byId("dayModalSaveBtn");
    var modalCloseBtn = byId("dayModalCloseBtn");
    var modalMessage = byId("dayModalMessage");

    if (!streakEl || !grid) {
      return;
    }

    function renderMetrics() {
      streakEl.textContent = String(computeStreak(store.checkins));
      var completion = computeCompletionRate(store);
      completionEl.textContent = completion.rate + "%";
      checkinsEl.textContent = String(Object.keys(store.checkins).length);
      if (daysLoggedEl) {
        var daysLoggedRate = completion.total > 0 ? Math.round((completion.checked / completion.total) * 100) : 0;
        daysLoggedEl.textContent = daysLoggedRate + "%";
      }
    }

    function openModalFor(dateKey) {
      var checkin = store.checkins[dateKey] || {
        date: dateKey,
        items: {},
        note: "",
        inspirationAdded: "",
        mood: null
      };
      var activeCommitments = getActiveCommitments(store);
      modal.dataset.dateKey = dateKey;
      modalTitle.textContent = "Check-in for " + formatDateForHumans(dateKey);
      modalBody.innerHTML = "";
      setMessage(modalMessage, "", "");

      if (!activeCommitments.length) {
        var noCommitments = document.createElement("p");
        noCommitments.className = "muted";
        noCommitments.textContent = "No active commitments. Add some in Setup.";
        modalBody.appendChild(noCommitments);
      } else {
        activeCommitments.forEach(function (item) {
          var field = document.createElement("div");
          field.className = "field";
          var label = document.createElement("label");
          label.setAttribute("for", "modal-status-" + item.id);
          label.textContent = item.title;
          var select = document.createElement("select");
          select.id = "modal-status-" + item.id;
          select.dataset.commitmentId = item.id;
          var optKept = document.createElement("option");
          optKept.value = "kept";
          optKept.textContent = "Logged";
          var optSlipped = document.createElement("option");
          optSlipped.value = "slipped";
          optSlipped.textContent = "Missed";
          select.appendChild(optKept);
          select.appendChild(optSlipped);
          select.value = checkin.items[item.id] || "kept";
          field.appendChild(label);
          field.appendChild(select);
          modalBody.appendChild(field);
        });
      }

      var noteField = document.createElement("div");
      noteField.className = "field";
      var noteLabel = document.createElement("label");
      noteLabel.setAttribute("for", "modal-note");
      noteLabel.textContent = "Note";
      var noteInput = document.createElement("textarea");
      noteInput.id = "modal-note";
      noteInput.rows = 3;
      noteInput.maxLength = 400;
      noteInput.value = checkin.note || "";
      noteField.appendChild(noteLabel);
      noteField.appendChild(noteInput);
      modalBody.appendChild(noteField);

      var moodField = document.createElement("div");
      moodField.className = "field";
      var moodLabel = document.createElement("label");
      moodLabel.setAttribute("for", "modal-mood");
      moodLabel.textContent = "Mood";
      var moodSelect = document.createElement("select");
      moodSelect.id = "modal-mood";
      var noMood = document.createElement("option");
      noMood.value = "";
      noMood.textContent = "Not set";
      moodSelect.appendChild(noMood);
      for (var mood = 1; mood <= 5; mood += 1) {
        var moodOption = document.createElement("option");
        moodOption.value = String(mood);
        moodOption.textContent = String(mood);
        moodSelect.appendChild(moodOption);
      }
      moodSelect.value = checkin.mood ? String(checkin.mood) : "";
      moodField.appendChild(moodLabel);
      moodField.appendChild(moodSelect);
      modalBody.appendChild(moodField);

      var inspField = document.createElement("div");
      inspField.className = "field";
      var inspLabel = document.createElement("label");
      inspLabel.setAttribute("for", "modal-inspiration");
      inspLabel.textContent = "Encouragement line";
      var inspInput = document.createElement("input");
      inspInput.id = "modal-inspiration";
      inspInput.type = "text";
      inspInput.maxLength = 160;
      inspInput.value = checkin.inspirationAdded || "";
      inspField.appendChild(inspLabel);
      inspField.appendChild(inspInput);
      modalBody.appendChild(inspField);

      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "open");
      }
    }

    function renderDots() {
      grid.innerHTML = "";
      var start = parseDateKey(store.settings.startDate);
      if (!start) {
        return;
      }
      for (var i = 0; i < 40; i += 1) {
        var day = addDays(start, i);
        var key = toDateKey(day);
        var button = document.createElement("button");
        button.type = "button";
        button.className = "dot";
        button.textContent = String(day.getDate());
        button.setAttribute("aria-label", formatDateForHumans(key));
        button.title = formatDateForHumans(key);
        if (Object.prototype.hasOwnProperty.call(store.checkins, key)) {
          button.classList.add("checked");
        }
        button.addEventListener("click", function (dateClicked) {
          return function () {
            openModalFor(dateClicked);
          };
        }(key));
        grid.appendChild(button);
      }
    }

    modalSaveBtn.addEventListener("click", function () {
      var dateKey = modal.dataset.dateKey;
      if (!dateKey) {
        return;
      }
      var updated = {
        date: dateKey,
        items: {},
        note: "",
        inspirationAdded: "",
        mood: null,
        updatedAt: new Date().toISOString()
      };
      var selectors = modalBody.querySelectorAll("select[data-commitment-id]");
      selectors.forEach(function (select) {
        updated.items[select.dataset.commitmentId] = select.value;
      });
      var noteInput = byId("modal-note");
      var inspirationInput = byId("modal-inspiration");
      var moodSelect = byId("modal-mood");
      updated.note = noteInput ? noteInput.value.trim() : "";
      updated.inspirationAdded = inspirationInput ? inspirationInput.value.trim() : "";
      updated.mood = moodSelect && moodSelect.value ? Number(moodSelect.value) : null;
      updated.autoTags = buildAutoPostTags(store, updated.items);
      var modalPreviouslyShared = Array.isArray(store.communityBoard) && store.communityBoard.some(function (entry) {
        return entry.userId === store.user.id && entry.date === updated.date;
      });
      store.checkins[dateKey] = updated;
      if (modalPreviouslyShared || store.settings.shareLogsToCommunity) {
        upsertCommunityBoardEntry(store, updated);
      }
      if (!saveStore(store)) {
        setMessage(modalMessage, "Unable to save changes.", "warn");
        return;
      }
      runRemotePublish({
        date: updated.date,
        items: updated.items,
        note: updated.note,
        inspirationAdded: updated.inspirationAdded,
        mood: updated.mood,
        missedNotes: updated.missedNotes || {},
        loggedTitles: getLoggedCommitmentTitles(store, updated.items),
        autoTags: updated.autoTags,
        sharePublic: Boolean(modalPreviouslyShared || store.settings.shareLogsToCommunity)
      }).then(function (ok) {
        if (!ok && isRemoteConfigured() && isRemoteAuthenticated()) {
          queueRemotePublish({
            date: updated.date,
            items: updated.items,
            note: updated.note,
            inspirationAdded: updated.inspirationAdded,
            mood: updated.mood,
            missedNotes: updated.missedNotes || {},
            loggedTitles: getLoggedCommitmentTitles(store, updated.items),
            autoTags: updated.autoTags,
            sharePublic: Boolean(modalPreviouslyShared || store.settings.shareLogsToCommunity)
          });
        }
      }).catch(function () {
        if (!isRemoteConfigured() || !isRemoteAuthenticated()) {
          return;
        }
        queueRemotePublish({
          date: updated.date,
          items: updated.items,
          note: updated.note,
          inspirationAdded: updated.inspirationAdded,
          mood: updated.mood,
          missedNotes: updated.missedNotes || {},
          loggedTitles: getLoggedCommitmentTitles(store, updated.items),
          autoTags: updated.autoTags,
          sharePublic: Boolean(store.settings.shareLogsToCommunity)
        });
      });
      setMessage(modalMessage, "Saved.", "ok");
      renderMetrics();
      renderDots();
      window.setTimeout(function () {
        if (typeof modal.close === "function") {
          modal.close();
        } else {
          modal.removeAttribute("open");
        }
      }, 160);
    });

    modalCloseBtn.addEventListener("click", function () {
      if (typeof modal.close === "function") {
        modal.close();
      } else {
        modal.removeAttribute("open");
      }
    });

    renderMetrics();
    renderDots();
  }

  function initCommunityPage(store) {
    var form = byId("communityNoteForm");
    var textInput = byId("communityText");
    var tagsInput = byId("communityTags");
    var list = byId("communityNotesList");
    var boardList = byId("communityBoardList");
    var message = byId("communitySaveMessage");
    var feedPostModal = byId("feedPostModal");
    var feedPostModalTitle = byId("feedPostModalTitle");
    var feedPostModalBody = byId("feedPostModalBody");
    var feedPostModalCloseBtn = byId("feedPostModalCloseBtn");
    if (!form || !list || !boardList) {
      return;
    }

    var supportCommentsByPost = {};
    var commentPostKeyById = {};

    function clearSupportCommentsStore() {
      supportCommentsByPost = {};
      commentPostKeyById = {};
    }

    function hydrateRemoteComments(rows) {
      clearSupportCommentsStore();
      var commentById = {};
      (rows || []).forEach(function (row) {
        if (!row || row.parent_comment_id) {
          return;
        }
        var postKey = "remote:" + row.post_id;
        if (!Array.isArray(supportCommentsByPost[postKey])) {
          supportCommentsByPost[postKey] = [];
        }
        var comment = {
          id: row.id,
          userId: row.user_id,
          displayName: row.profiles && row.profiles.display_name ? row.profiles.display_name : "Anonymous pilgrim",
          text: row.content || "",
          createdAt: row.created_at || new Date().toISOString(),
          replies: []
        };
        supportCommentsByPost[postKey].push(comment);
        commentById[row.id] = comment;
        commentPostKeyById[row.id] = postKey;
      });
      (rows || []).forEach(function (row) {
        if (!row || !row.parent_comment_id) {
          return;
        }
        var parent = commentById[row.parent_comment_id];
        if (!parent) {
          return;
        }
        var reply = {
          id: row.id,
          userId: row.user_id,
          displayName: row.profiles && row.profiles.display_name ? row.profiles.display_name : "Anonymous pilgrim",
          text: row.content || "",
          createdAt: row.created_at || new Date().toISOString()
        };
        parent.replies.push(reply);
        commentPostKeyById[row.id] = commentPostKeyById[row.parent_comment_id];
      });
    }

    function commentsFor(postKey) {
      var rows = supportCommentsByPost[postKey];
      return Array.isArray(rows) ? rows : [];
    }

    function addSupportComment(postKey, text) {
      var trimmed = String(text || "").trim();
      if (!trimmed) {
        return Promise.resolve(false);
      }
      if (postKey.indexOf("remote:") !== 0 || !isRemoteConfigured() || !isRemoteAuthenticated()) {
        return Promise.resolve(false);
      }
      var remote = getRemoteClient();
      if (!remote || typeof remote.createPostComment !== "function") {
        return Promise.resolve(false);
      }
      return remote.createPostComment({
        post_id: postKey.slice(7),
        parent_comment_id: null,
        content: trimmed
      }).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    function addSupportReply(postKey, commentId, text) {
      var trimmed = String(text || "").trim();
      if (!trimmed) {
        return Promise.resolve(false);
      }
      if (postKey.indexOf("remote:") !== 0 || !isRemoteConfigured() || !isRemoteAuthenticated()) {
        return Promise.resolve(false);
      }
      var remote = getRemoteClient();
      if (!remote || typeof remote.createPostComment !== "function") {
        return Promise.resolve(false);
      }
      return remote.createPostComment({
        post_id: postKey.slice(7),
        parent_comment_id: commentId,
        content: trimmed
      }).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    function removeSupportComment(postKey, commentId) {
      if (postKey.indexOf("remote:") !== 0 || !isRemoteConfigured() || !isRemoteAuthenticated()) {
        return Promise.resolve(false);
      }
      var remote = getRemoteClient();
      if (!remote || typeof remote.deletePostComment !== "function") {
        return Promise.resolve(false);
      }
      return remote.deletePostComment(commentId).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    function removeSupportReply(postKey, commentId, replyId) {
      return removeSupportComment(postKey, replyId);
    }

    function reportContent(payload) {
      if (!isRemoteConfigured() || !isRemoteAuthenticated()) {
        setMessage(message, "Sign in to report content.", "warn");
        return;
      }
      var reason = window.prompt("Report reason (e.g. spam, abuse, harassment):", "spam");
      if (!reason) {
        return;
      }
      var remote = getRemoteClient();
      if (!remote || typeof remote.createContentReport !== "function") {
        setMessage(message, "Reporting is unavailable right now.", "warn");
        return;
      }
      remote.createContentReport({
        post_id: payload.post_id || null,
        comment_id: payload.comment_id || null,
        reason: String(reason).trim().slice(0, 160),
        details: ""
      }).then(function () {
        setMessage(message, "Report sent. Thanks for flagging this.", "ok");
      }).catch(function () {
        setMessage(message, "Could not submit report right now.", "warn");
      });
    }

    function possessive(name) {
      var base = String(name || "Someone");
      if (!base) {
        return "Someone's";
      }
      if (base.endsWith("s") || base.endsWith("S")) {
        return base + "'";
      }
      return base + "'s";
    }

    function buildSupportActivityRows(postMetaByKey) {
      var out = [];
      Object.keys(supportCommentsByPost || {}).forEach(function (postKey) {
        var meta = postMetaByKey[postKey];
        if (!meta) {
          return;
        }
        var rows = commentsFor(postKey);
        rows.forEach(function (comment) {
          out.push({
            kind: "comment_activity",
            id: "comment-activity-" + comment.id,
            date: meta.date,
            updatedAt: comment.createdAt,
            commenterName: comment.displayName || "Someone",
            ownerName: meta.displayName || "Someone",
            avatarId: meta.avatarId || "avatar_1",
            text: comment.text || ""
          });
        });
      });
      return out;
    }

    function renderCommentsPreview(container, postKey) {
      var rows = commentsFor(postKey);
      var wrap = document.createElement("div");
      wrap.className = "support-comments-preview";
      var label = document.createElement("p");
      label.className = "tiny muted";
      label.textContent = "Support comments (" + rows.length + ")";
      wrap.appendChild(label);
      container.appendChild(wrap);
    }

    function openPostThread(postKey, postData) {
      if (!feedPostModal || !feedPostModalBody || !feedPostModalTitle) {
        return;
      }
      feedPostModalTitle.textContent = postData.displayName + " - " + postData.dayLabel;
      feedPostModalBody.innerHTML = "";

      var summary = document.createElement("p");
      summary.textContent = postData.summary || "";
      feedPostModalBody.appendChild(summary);
      if (postData.note) {
        var note = document.createElement("p");
        note.className = "muted";
        note.textContent = postData.note;
        feedPostModalBody.appendChild(note);
      }
      if (postData.inspiration) {
        var inspiration = document.createElement("p");
        inspiration.textContent = "\"" + postData.inspiration + "\"";
        feedPostModalBody.appendChild(inspiration);
      }
      if (postData.mood) {
        var mood = document.createElement("p");
        mood.className = "note-card-date";
        mood.textContent = "Mood: " + postData.mood;
        feedPostModalBody.appendChild(mood);
      }

      var heading = document.createElement("p");
      heading.className = "tiny muted";
      heading.style.marginTop = "0.55rem";
      heading.textContent = "Support comments";
      feedPostModalBody.appendChild(heading);
      var rows = commentsFor(postKey);
      if (!rows.length) {
        var empty = document.createElement("p");
        empty.className = "muted tiny";
        empty.textContent = "No comments yet.";
        feedPostModalBody.appendChild(empty);
      } else {
        rows.forEach(function (row) {
          var item = document.createElement("div");
          item.className = "support-comment-item";
          var actionStack = document.createElement("div");
          actionStack.className = "comment-action-stack";
          var meta = document.createElement("p");
          meta.className = "note-card-date";
          meta.textContent = row.displayName + " - " + new Date(row.createdAt).toLocaleString();
          var text = document.createElement("p");
          text.textContent = row.text;
          item.appendChild(meta);
          item.appendChild(text);
          if (Array.isArray(row.replies) && row.replies.length) {
            var threadReplies = document.createElement("div");
            threadReplies.className = "support-replies";
            row.replies.forEach(function (reply) {
              var replyItem = document.createElement("div");
              replyItem.className = "support-comment-item support-reply-item";
              var replyMeta = document.createElement("p");
              replyMeta.className = "note-card-date";
              replyMeta.textContent = reply.displayName + " - " + new Date(reply.createdAt).toLocaleString();
              var replyText = document.createElement("p");
              replyText.textContent = reply.text;
              replyItem.appendChild(replyMeta);
              replyItem.appendChild(replyText);
              if (reply.userId === store.user.id) {
                var deleteReplyBtn = document.createElement("button");
                deleteReplyBtn.type = "button";
                deleteReplyBtn.className = "comment-delete-link";
                deleteReplyBtn.textContent = "Delete";
                deleteReplyBtn.addEventListener("click", function () {
                  removeSupportReply(postKey, row.id, reply.id).then(function (removed) {
                    if (!removed) {
                      setMessage(message, "Could not delete reply right now.", "warn");
                      return;
                    }
                    loadFeed().then(function () {
                      openPostThread(postKey, postData);
                    });
                  });
                });
                replyItem.appendChild(deleteReplyBtn);
              }
              threadReplies.appendChild(replyItem);
            });
            item.appendChild(threadReplies);
          }
          var openReplyBtn = document.createElement("button");
          openReplyBtn.type = "button";
          openReplyBtn.className = "comment-action-link";
          openReplyBtn.textContent = "Reply";
          var replyWrap = document.createElement("div");
          replyWrap.className = "reply-compose is-hidden";
          var replyInput = document.createElement("textarea");
          replyInput.rows = 2;
          replyInput.maxLength = 220;
          replyInput.placeholder = "Write a reply...";
          var postReplyBtn = document.createElement("button");
          postReplyBtn.type = "button";
          postReplyBtn.className = "tiny";
          postReplyBtn.textContent = "Post reply";
          postReplyBtn.addEventListener("click", function () {
            addSupportReply(postKey, row.id, replyInput.value).then(function (added) {
              if (!added) {
                setMessage(message, "Sign in and support the post to reply.", "warn");
                return;
              }
              replyInput.value = "";
              loadFeed().then(function () {
                openPostThread(postKey, postData);
              });
            });
          });
          openReplyBtn.addEventListener("click", function () {
            replyWrap.classList.toggle("is-hidden");
            if (!replyWrap.classList.contains("is-hidden")) {
              replyInput.focus();
            }
          });
          replyWrap.appendChild(replyInput);
          replyWrap.appendChild(postReplyBtn);

          if (row.userId === store.user.id) {
            var deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "comment-delete-link";
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", function () {
              removeSupportComment(postKey, row.id).then(function (removed) {
                if (!removed) {
                  setMessage(message, "Could not delete comment right now.", "warn");
                  return;
                }
                loadFeed().then(function () {
                  openPostThread(postKey, postData);
                });
              });
            });
            actionStack.appendChild(deleteBtn);
          }
          actionStack.appendChild(openReplyBtn);
          item.appendChild(actionStack);
          item.appendChild(replyWrap);
          feedPostModalBody.appendChild(item);
        });
      }

      if (typeof feedPostModal.showModal === "function") {
        feedPostModal.showModal();
      } else {
        feedPostModal.setAttribute("open", "open");
      }
    }

    if (feedPostModalCloseBtn) {
      feedPostModalCloseBtn.addEventListener("click", function () {
        if (feedPostModal && typeof feedPostModal.close === "function") {
          feedPostModal.close();
        } else if (feedPostModal) {
          feedPostModal.removeAttribute("open");
        }
      });
    }

    function tagArrayFromText(value) {
      if (!value.trim()) {
        return [];
      }
      return value
        .split(",")
        .map(function (tag) {
          return toDashedTag(tag);
        })
        .filter(function (tag) {
          return Boolean(tag);
        });
    }

    function compareFeedOrder(aDate, aUpdatedAt, bDate, bUpdatedAt) {
      var todayLentDay = computeDayIndex(store.settings.startDate, todayKey());
      var fallbackDistance = 9999;
      var aDay = computeDayIndex(store.settings.startDate, aDate);
      var bDay = computeDayIndex(store.settings.startDate, bDate);
      var aDistance = typeof aDay === "number" && typeof todayLentDay === "number" ? Math.abs(aDay - todayLentDay) : fallbackDistance;
      var bDistance = typeof bDay === "number" && typeof todayLentDay === "number" ? Math.abs(bDay - todayLentDay) : fallbackDistance;
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      return String(bUpdatedAt || "").localeCompare(String(aUpdatedAt || ""));
    }

    function feedStamp(dateKey, updatedAt) {
      var dayIndex = computeDayIndex(store.settings.startDate, dateKey);
      var dateText = formatDateForHumans(dateKey);
      var timeText = "";
      var updated = new Date(updatedAt || "");
      if (!Number.isNaN(updated.getTime())) {
        timeText = updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      }
      var dayLabel = dayIndex && dayIndex > 0 ? "Day " + dayIndex + " of Lent" : dateText;
      return timeText ? dayLabel + " · " + dateText + " · " + timeText : dayLabel + " · " + dateText;
    }

    function buildLocalNoteFeedRows() {
      return (store.savedCommunityNotes || []).map(function (note) {
        return {
          kind: "saved_note",
          id: "saved-note-" + note.id,
          date: note.date,
          updatedAt: note.savedAt,
          displayName: preferredDisplayName(store),
          avatarId: store.user.avatarId || "avatar_1",
          summary: "Saved note",
          note: note.text || "",
          inspiration: "",
          mood: null,
          tags: Array.isArray(note.tags) ? note.tags : []
        };
      });
    }

    function supportLabel(hasSupported, count) {
      if (!count || count <= 0) {
        return "🙏 Show support";
      }
      return "🙏 " + count + " " + (count === 1 ? "supporter" : "supporters");
    }

    function getCombinedNotes() {
      var fromDaily = Object.keys(store.checkins)
        .map(function (key) {
          var checkin = store.checkins[key];
          return {
            id: "checkin-" + key,
            date: key,
            text: checkin.inspirationAdded || "",
            tags: [],
            savedAt: checkin.date,
            source: "daily"
          };
        })
        .filter(function (note) {
          return note.text.trim().length > 0;
        });

      var localNotes = store.savedCommunityNotes.map(function (note) {
        return {
          id: note.id,
          date: note.date,
          text: note.text,
          tags: note.tags,
          savedAt: note.savedAt,
          source: "saved"
        };
      });

      return fromDaily.concat(localNotes).sort(function (a, b) {
        return String(b.savedAt).localeCompare(String(a.savedAt));
      });
    }

    function renderLocalNotes() {
      list.innerHTML = "";
      var notes = getCombinedNotes();
      if (!notes.length) {
        var empty = document.createElement("li");
        empty.className = "muted";
        empty.textContent = "No encouragement notes yet.";
        list.appendChild(empty);
        return;
      }
      notes.forEach(function (note) {
        var li = document.createElement("li");
        li.className = "item";

        var date = document.createElement("p");
        date.className = "note-card-date";
        date.textContent = formatDateForHumans(note.date);
        li.appendChild(date);

        var text = document.createElement("p");
        text.textContent = note.text;
        li.appendChild(text);

        if (note.tags && note.tags.length) {
          var tags = document.createElement("div");
          tags.className = "tag-row";
          note.tags.forEach(function (tagText) {
            var tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = tagText;
            tags.appendChild(tag);
          });
          li.appendChild(tags);
        }

        if (note.source === "saved") {
          var deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "tiny";
          deleteBtn.textContent = "Delete";
          deleteBtn.addEventListener("click", function () {
            store.savedCommunityNotes = store.savedCommunityNotes.filter(function (item) {
              return item.id !== note.id;
            });
            saveStore(store);
            renderLocalNotes();
          });
          li.appendChild(deleteBtn);
        }
        list.appendChild(li);
      });
    }

    function renderLocalBoard() {
      list.innerHTML = "";
      boardList.innerHTML = "";

      var postMetaByKey = {};
      var boardRows = (store.communityBoard || []).map(function (entry) {
        postMetaByKey["local:" + entry.id] = {
          date: entry.date,
          displayName: entry.userId === store.user.id ? preferredDisplayName(store) : entry.displayName,
          avatarId: entry.userId === store.user.id ? (store.user.avatarId || entry.avatarId || "avatar_1") : (entry.avatarId || "avatar_1")
        };
        return {
          kind: "board",
          id: entry.id,
          date: entry.date,
          updatedAt: entry.updatedAt,
          entry: entry
        };
      });
      var noteRows = buildLocalNoteFeedRows();
      var board = boardRows.concat(noteRows).sort(function (a, b) {
        return compareFeedOrder(a.date, a.updatedAt, b.date, b.updatedAt);
      });
      if (!board.length) {
        var boardEmpty = document.createElement("li");
        boardEmpty.className = "muted";
        boardEmpty.textContent = "No shared logs yet.";
        boardList.appendChild(boardEmpty);
      } else {
        board.forEach(function (row, index) {
          if (row.kind === "saved_note") {
            var noteItem = document.createElement("li");
          noteItem.className = "item feed-post note-feed-post " + (index % 2 === 0 ? "feed-post-dark" : "feed-post-light");
            var noteMeta = document.createElement("div");
            noteMeta.className = "board-meta";
            var noteLeft = document.createElement("p");
            noteLeft.className = "note-card-date";
            noteLeft.textContent = "#" + (index + 1) + " " + row.displayName;
            var noteRight = document.createElement("p");
            noteRight.className = "board-rank";
            noteRight.textContent = feedStamp(row.date, row.updatedAt);
            noteMeta.appendChild(noteLeft);
            noteMeta.appendChild(noteRight);
            var noteHead = document.createElement("div");
            noteHead.className = "feed-post-head";
            var noteAvatar = document.createElement("div");
            noteAvatar.className = "feed-post-avatar";
            noteAvatar.appendChild(createAvatarArt(avatarClassForId(row.avatarId || "avatar_1")));
            noteHead.appendChild(noteAvatar);
            noteHead.appendChild(noteMeta);
            noteItem.appendChild(noteHead);
            var noteSummary = document.createElement("p");
            noteSummary.textContent = row.summary;
            noteItem.appendChild(noteSummary);
            var noteBody = document.createElement("p");
            noteBody.className = "muted";
            noteBody.textContent = row.note;
            noteItem.appendChild(noteBody);
            if (row.tags && row.tags.length) {
              var noteTags = document.createElement("div");
              noteTags.className = "tag-row";
              row.tags.forEach(function (tagText) {
                var tag = document.createElement("span");
                tag.className = "tag";
                tag.textContent = tagText;
                noteTags.appendChild(tag);
              });
              noteItem.appendChild(noteTags);
            }
            boardList.appendChild(noteItem);
            return;
          }

          var entry = row.entry;
          var item = document.createElement("li");
          item.className = "item feed-post " + (index % 2 === 0 ? "feed-post-dark" : "feed-post-light");

          var meta = document.createElement("div");
          meta.className = "board-meta";
          var left = document.createElement("p");
          left.className = "note-card-date";
          var localDisplayName = entry.userId === store.user.id ? preferredDisplayName(store) : entry.displayName;
          left.textContent = "#" + (index + 1) + " " + localDisplayName;
          var right = document.createElement("p");
          right.className = "board-rank";
          right.textContent = feedStamp(entry.date, entry.updatedAt);
          meta.appendChild(left);
          meta.appendChild(right);
          var localHead = document.createElement("div");
          localHead.className = "feed-post-head";
          var localAvatar = document.createElement("div");
          localAvatar.className = "feed-post-avatar";
          var localAvatarId = entry.userId === store.user.id ? (store.user.avatarId || entry.avatarId || "avatar_1") : (entry.avatarId || "avatar_1");
          localAvatar.appendChild(createAvatarArt(avatarClassForId(localAvatarId)));
          localHead.appendChild(localAvatar);
          localHead.appendChild(meta);
          item.appendChild(localHead);

          var summary = document.createElement("p");
          summary.textContent = entry.summary;
          item.appendChild(summary);
          var localTags = Array.isArray(entry.tags) && entry.tags.length ? entry.tags : buildAutoPostTags(store, (store.checkins[entry.date] && store.checkins[entry.date].items) || {});
          if (localTags.length) {
            var localTagRow = document.createElement("div");
            localTagRow.className = "tag-row";
            localTags.forEach(function (tagText) {
              var tag = document.createElement("span");
              tag.className = "tag";
              tag.textContent = tagText;
              localTagRow.appendChild(tag);
            });
            item.appendChild(localTagRow);
          }

          if (entry.note) {
            var note = document.createElement("p");
            note.className = "muted";
            note.textContent = entry.note;
            item.appendChild(note);
          }
          if (entry.inspiration) {
            var encouragement = document.createElement("p");
            encouragement.textContent = "\"" + entry.inspiration + "\"";
            item.appendChild(encouragement);
          }
          if (entry.mood) {
            var mood = document.createElement("p");
            mood.className = "note-card-date";
            mood.textContent = "Mood: " + entry.mood;
            item.appendChild(mood);
          }

          var supporters = Array.isArray(entry.supporterIds) ? entry.supporterIds : [];
          var localPostKey = "local:" + entry.id;
          var upvoteBtn = document.createElement("button");
          upvoteBtn.type = "button";
          var hasVoted = supporters.indexOf(store.user.id) !== -1;
          upvoteBtn.textContent = supportLabel(hasVoted, supporters.length);
          upvoteBtn.addEventListener("click", function () {
            if (!Array.isArray(entry.supporterIds)) {
              entry.supporterIds = [];
            }
            var idx = entry.supporterIds.indexOf(store.user.id);
            if (idx === -1) {
              entry.supporterIds.push(store.user.id);
            } else {
              entry.supporterIds.splice(idx, 1);
            }
            entry.updatedAt = new Date().toISOString();
            saveStore(store);
            renderLocalBoard();
          });
          item.appendChild(upvoteBtn);

          renderCommentsPreview(item, localPostKey);
          item.addEventListener("click", function (event) {
            var target = event.target;
            if (target && target.closest("button, textarea, input, select, label, a")) {
              return;
            }
            openPostThread(localPostKey, {
              displayName: localDisplayName,
              dayLabel: feedStamp(entry.date, entry.updatedAt),
              summary: entry.summary,
              note: entry.note,
              inspiration: entry.inspiration,
              mood: entry.mood
            });
          });
          boardList.appendChild(item);
        });
      }
      renderLocalNotes();
    }

    function renderRemoteBoard(rows, supportRows, commentRows) {
      boardList.innerHTML = "";
      hydrateRemoteComments(commentRows || []);
      var noteRows = buildLocalNoteFeedRows();
      if ((!rows || !rows.length) && !noteRows.length) {
        var empty = document.createElement("li");
        empty.className = "muted";
        empty.textContent = "No shared logs yet.";
        boardList.appendChild(empty);
        return;
      }

      var viewer = null;
      var remote = getRemoteClient();
      if (remote && remote.getUser) {
        viewer = remote.getUser();
      }
      var postMetaByKey = {};

      var counts = {};
      var supportedByViewer = {};
      (supportRows || []).forEach(function (row) {
        counts[row.post_id] = (counts[row.post_id] || 0) + 1;
        if (viewer && row.user_id === viewer.id) {
          supportedByViewer[row.post_id] = true;
        }
      });

      var remoteRows = (rows || []).map(function (entry) {
        var isOwnRemotePost = viewer && entry.user_id === viewer.id;
        var remoteDisplayName = entry.profiles && entry.profiles.display_name
          ? entry.profiles.display_name
          : (isOwnRemotePost ? preferredDisplayName(store) : "Anonymous pilgrim");
        var remoteAvatarId = entry.profiles && entry.profiles.avatar_id
          ? entry.profiles.avatar_id
          : (isOwnRemotePost ? (store.user.avatarId || "avatar_1") : "avatar_1");
        var postKey = "remote:" + entry.id;
        postMetaByKey[postKey] = {
          date: entry.date,
          displayName: remoteDisplayName,
          avatarId: remoteAvatarId
        };
        return {
          kind: "remote",
          id: entry.id,
          date: entry.date,
          updatedAt: entry.updated_at,
          entry: entry,
          displayName: remoteDisplayName,
          avatarId: remoteAvatarId
        };
      });
      var combinedRows = remoteRows.concat(noteRows).sort(function (a, b) {
        return compareFeedOrder(a.date, a.updatedAt, b.date, b.updatedAt);
      });

      combinedRows.forEach(function (row, index) {
        if (row.kind === "saved_note") {
          var savedItem = document.createElement("li");
          savedItem.className = "item feed-post note-feed-post " + (index % 2 === 0 ? "feed-post-dark" : "feed-post-light");
          var savedMeta = document.createElement("div");
          savedMeta.className = "board-meta";
          var savedLeft = document.createElement("p");
          savedLeft.className = "note-card-date";
          savedLeft.textContent = "#" + (index + 1) + " " + row.displayName;
          var savedRight = document.createElement("p");
          savedRight.className = "board-rank";
          savedRight.textContent = feedStamp(row.date, row.updatedAt);
          savedMeta.appendChild(savedLeft);
          savedMeta.appendChild(savedRight);
          var savedHead = document.createElement("div");
          savedHead.className = "feed-post-head";
          var savedAvatar = document.createElement("div");
          savedAvatar.className = "feed-post-avatar";
          savedAvatar.appendChild(createAvatarArt(avatarClassForId(row.avatarId || "avatar_1")));
          savedHead.appendChild(savedAvatar);
          savedHead.appendChild(savedMeta);
          savedItem.appendChild(savedHead);
          var savedSummary = document.createElement("p");
          savedSummary.textContent = row.summary;
          savedItem.appendChild(savedSummary);
          var savedNote = document.createElement("p");
          savedNote.className = "muted";
          savedNote.textContent = row.note;
          savedItem.appendChild(savedNote);
          if (row.tags && row.tags.length) {
            var savedTags = document.createElement("div");
            savedTags.className = "tag-row";
            row.tags.forEach(function (tagText) {
              var tag = document.createElement("span");
              tag.className = "tag";
              tag.textContent = tagText;
              savedTags.appendChild(tag);
            });
            savedItem.appendChild(savedTags);
          }
          boardList.appendChild(savedItem);
          return;
        }

        var entry = row.entry;
        var item = document.createElement("li");
        item.className = "item feed-post " + (index % 2 === 0 ? "feed-post-dark" : "feed-post-light");

        var meta = document.createElement("div");
        meta.className = "board-meta";
        var left = document.createElement("p");
        left.className = "note-card-date";
        var displayName = row.displayName;
        left.textContent = "#" + (index + 1) + " " + displayName;
        var right = document.createElement("p");
        right.className = "board-rank";
        right.textContent = feedStamp(entry.date, entry.updated_at);
        meta.appendChild(left);
        meta.appendChild(right);
        var remoteHead = document.createElement("div");
        remoteHead.className = "feed-post-head";
        var remoteAvatar = document.createElement("div");
        remoteAvatar.className = "feed-post-avatar";
        var remoteAvatarId = row.avatarId;
        remoteAvatar.appendChild(createAvatarArt(avatarClassForId(remoteAvatarId)));
        remoteHead.appendChild(remoteAvatar);
        remoteHead.appendChild(meta);
        item.appendChild(remoteHead);

        var summary = document.createElement("p");
        summary.textContent = entry.summary || "";
        item.appendChild(summary);
        var remoteTags = extractAutoTagsFromSummary(entry.summary || "");
        if (remoteTags.length) {
          var remoteTagRow = document.createElement("div");
          remoteTagRow.className = "tag-row";
          remoteTags.forEach(function (tagText) {
            var tag = document.createElement("span");
            tag.className = "tag";
            tag.textContent = tagText;
            remoteTagRow.appendChild(tag);
          });
          item.appendChild(remoteTagRow);
        }
        if (entry.note) {
          var note = document.createElement("p");
          note.className = "muted";
          note.textContent = entry.note;
          item.appendChild(note);
        }
        if (entry.inspiration) {
          var inspiration = document.createElement("p");
          inspiration.textContent = "\"" + entry.inspiration + "\"";
          item.appendChild(inspiration);
        }
        if (entry.mood) {
          var mood = document.createElement("p");
          mood.className = "note-card-date";
          mood.textContent = "Mood: " + entry.mood;
          item.appendChild(mood);
        }

        var remotePostKey = "remote:" + entry.id;
        var supportBtn = document.createElement("button");
        supportBtn.type = "button";
        var hasSupported = Boolean(supportedByViewer[entry.id]);
        supportBtn.textContent = supportLabel(hasSupported, counts[entry.id] || 0);
        supportBtn.addEventListener("click", function () {
          var remoteClient = getRemoteClient();
          if (!remoteClient || !isRemoteConfigured() || !isRemoteAuthenticated()) {
            setMessage(message, "Sign in to support posts.", "warn");
            return;
          }
          remoteClient.toggleSupport(entry.id)
            .then(function () {
              loadFeed();
            })
            .catch(function () {
              setMessage(message, "Could not update support right now.", "warn");
            });
        });
        item.appendChild(supportBtn);
        var reportBtn = document.createElement("button");
        reportBtn.type = "button";
        reportBtn.className = "tiny";
        reportBtn.textContent = "Report";
        reportBtn.addEventListener("click", function () {
          reportContent({ post_id: entry.id });
        });
        item.appendChild(reportBtn);

        if (hasSupported && isRemoteAuthenticated()) {
          var remoteOpenCommentBtn = document.createElement("button");
          remoteOpenCommentBtn.type = "button";
          remoteOpenCommentBtn.className = "tiny";
          remoteOpenCommentBtn.textContent = "Leave a comment";
          var remoteCommentWrap = document.createElement("div");
          remoteCommentWrap.className = "support-comment-wrap is-hidden";
          var remoteCommentLabel = document.createElement("label");
          remoteCommentLabel.className = "tiny muted";
          remoteCommentLabel.textContent = "Leave a support comment";
          var remoteCommentInput = document.createElement("textarea");
          remoteCommentInput.rows = 2;
          remoteCommentInput.maxLength = 220;
          remoteCommentInput.placeholder = "Add a short encouragement...";
          var remoteCommentBtn = document.createElement("button");
          remoteCommentBtn.type = "button";
          remoteCommentBtn.className = "tiny";
          remoteCommentBtn.textContent = "Post comment";
          remoteCommentBtn.addEventListener("click", function () {
            addSupportComment(remotePostKey, remoteCommentInput.value).then(function (added) {
              if (!added) {
                setMessage(message, "Sign in and support the post to comment.", "warn");
                return;
              }
              remoteCommentInput.value = "";
              loadFeed();
            });
          });
          remoteOpenCommentBtn.addEventListener("click", function () {
            remoteCommentWrap.classList.toggle("is-hidden");
            if (!remoteCommentWrap.classList.contains("is-hidden")) {
              remoteCommentInput.focus();
            }
          });
          remoteCommentWrap.appendChild(remoteCommentLabel);
          remoteCommentWrap.appendChild(remoteCommentInput);
          remoteCommentWrap.appendChild(remoteCommentBtn);
          item.appendChild(remoteOpenCommentBtn);
          item.appendChild(remoteCommentWrap);
        }

        renderCommentsPreview(item, remotePostKey);
        item.addEventListener("click", function (event) {
          var target = event.target;
          if (target && target.closest("button, textarea, input, select, label, a")) {
            return;
          }
          openPostThread(remotePostKey, {
            displayName: displayName,
            dayLabel: feedStamp(entry.date, entry.updated_at),
            summary: entry.summary || "",
            note: entry.note || "",
            inspiration: entry.inspiration || "",
            mood: entry.mood
          });
        });

        boardList.appendChild(item);
      });
    }

    function loadFeed() {
      if (!isRemoteConfigured()) {
        clearSupportCommentsStore();
        renderLocalBoard();
        renderLocalNotes();
        return Promise.resolve();
      }
      var remote = getRemoteClient();
      return remote.fetchPublicFeed(50)
        .then(function (rows) {
          if ((!rows || !rows.length) && Array.isArray(store.communityBoard) && store.communityBoard.length) {
            clearSupportCommentsStore();
            renderLocalBoard();
            setMessage(message, "No remote posts yet. Showing your local shared logs.", "ok");
            return Promise.resolve();
          }
          var ids = rows.map(function (row) { return row.id; });
          return Promise.all([
            remote.fetchSupportRows(ids),
            remote.fetchPostComments(ids)
          ]).then(function (results) {
            var supportRows = results[0];
            var commentRows = results[1];
            renderRemoteBoard(rows, supportRows, commentRows);
          });
        })
        .catch(function () {
          clearSupportCommentsStore();
          renderLocalBoard();
          setMessage(message, "Showing local feed.", "");
        })
        .finally(function () {
          renderLocalNotes();
        });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = textInput.value.trim();
      if (!text) {
        setMessage(message, "Write a note before saving.", "warn");
        return;
      }
      var tags = tagArrayFromText(tagsInput.value);
      var canPostRemote = isRemoteConfigured() && isRemoteAuthenticated();
      if (canPostRemote) {
        var remote = getRemoteClient();
        if (remote && typeof remote.upsertFeedPost === "function") {
          var summary = "Support post";
          if (tags.length) {
            summary += " | Tags: " + tags.join(";");
          }
          remote.upsertFeedPost({
            checkin_id: null,
            date: todayKey(),
            summary: summary,
            note: text,
            inspiration: "",
            mood: null,
            visibility: "public"
          }).then(function () {
            textInput.value = "";
            tagsInput.value = "";
            setMessage(message, "Post added to feed.", "ok");
            loadFeed();
          }).catch(function () {
            setMessage(message, "Could not post to the public feed right now.", "warn");
          });
          return;
        }
      }

      store.savedCommunityNotes.push({
        id: uuid(),
        date: todayKey(),
        text: text,
        tags: tags,
        savedAt: new Date().toISOString()
      });
      if (!saveStore(store)) {
        setMessage(message, "Could not save note.", "warn");
        return;
      }
      textInput.value = "";
      tagsInput.value = "";
      setMessage(message, "Saved locally. Sign in to publish publicly.", "ok");
      loadFeed();
    });

    loadFeed();
  }

  function boot() {
    var page = document.body.getAttribute("data-page");
    if (!page) {
      return;
    }
    var store = null;

    function continueBoot() {
      if (page === "index") {
        initIndexPage(store);
      } else if (page === "setup") {
        initSetupPage(store);
      } else if (page === "app") {
        initTodayPage(store);
      } else if (page === "progress") {
        initProgressPage(store);
      } else if (page === "community") {
        initCommunityPage(store);
      }
      mountAuthGateOverlay(page);
    }

    function initializeStoreAndBoot() {
      store = ensureInitialized();
      if (!store) {
        return;
      }
      if (isRemoteConfigured()) {
        syncFromRemoteIntoStore(store)
          .then(function () {
            return flushRemoteQueue(store);
          })
          .finally(function () {
            continueBoot();
          });
      } else {
        continueBoot();
      }
    }

    if (!isRemoteConfigured()) {
      initializeStoreAndBoot();
      return;
    }

    var remote = getRemoteClient();
    remote.bootstrapAuthFromUrl()
      .then(function () {
        return remote.refreshUser();
      })
      .finally(function () {
        initializeStoreAndBoot();
      });

    window.addEventListener("online", function () {
      if (store) {
        flushRemoteQueue(store);
      }
    });
  }

  boot();
})();
