(function () {
  "use strict";

  var SESSION_KEY = "lent_supabase_session_v1";
  var CONFIG_KEY = "lent_supabase_config_v1";
  var QUEUE_KEY = "lent_remote_queue_v1";

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getConfig() {
    var fromWindow = window.LENT_SUPABASE_CONFIG;
    if (fromWindow && fromWindow.url && fromWindow.anonKey) {
      return {
        url: String(fromWindow.url).replace(/\/$/, ""),
        anonKey: String(fromWindow.anonKey)
      };
    }
    var fromStorage = readJson(CONFIG_KEY, null);
    if (fromStorage && fromStorage.url && fromStorage.anonKey) {
      return {
        url: String(fromStorage.url).replace(/\/$/, ""),
        anonKey: String(fromStorage.anonKey)
      };
    }
    return null;
  }

  function setConfig(url, anonKey) {
    var value = {
      url: String(url || "").trim().replace(/\/$/, ""),
      anonKey: String(anonKey || "").trim()
    };
    return writeJson(CONFIG_KEY, value);
  }

  function isConfigured() {
    return Boolean(getConfig());
  }

  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function setSession(session) {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return true;
    }
    return writeJson(SESSION_KEY, session);
  }

  function getUser() {
    var session = getSession();
    return session && session.user ? session.user : null;
  }

  function isAuthenticated() {
    var session = getSession();
    return Boolean(session && session.access_token && session.user);
  }

  function parseHashParams() {
    if (!window.location.hash || window.location.hash.length < 2) {
      return {};
    }
    var payload = {};
    var parts = window.location.hash.slice(1).split("&");
    for (var i = 0; i < parts.length; i += 1) {
      var kv = parts[i].split("=");
      payload[decodeURIComponent(kv[0] || "")] = decodeURIComponent(kv[1] || "");
    }
    return payload;
  }

  function clearHash() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function authHeaders(withAuth) {
    var config = getConfig();
    if (!config) {
      return null;
    }
    var headers = {
      "apikey": config.anonKey,
      "Content-Type": "application/json"
    };
    if (withAuth) {
      var session = getSession();
      if (session && session.access_token) {
        headers.Authorization = "Bearer " + session.access_token;
      }
    }
    return headers;
  }

  function request(path, options) {
    var config = getConfig();
    if (!config) {
      return Promise.reject(new Error("Supabase config missing"));
    }
    var url = config.url + path;
    return fetch(url, options).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          var error = new Error(text || "Request failed");
          error.status = response.status;
          throw error;
        });
      }
      if (response.status === 204) {
        return null;
      }
      return response.json();
    });
  }

  function fetchAuthUser(accessToken) {
    var config = getConfig();
    if (!config) {
      return Promise.reject(new Error("Supabase config missing"));
    }
    return fetch(config.url + "/auth/v1/user", {
      method: "GET",
      headers: {
        "apikey": config.anonKey,
        "Authorization": "Bearer " + accessToken
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to fetch user");
      }
      return response.json();
    });
  }

  function bootstrapAuthFromUrl() {
    var hash = parseHashParams();
    if (!hash.access_token) {
      return Promise.resolve(getSession());
    }
    return fetchAuthUser(hash.access_token)
      .then(function (user) {
        var session = {
          access_token: hash.access_token,
          refresh_token: hash.refresh_token || "",
          expires_at: hash.expires_at ? Number(hash.expires_at) : null,
          token_type: hash.token_type || "bearer",
          user: user
        };
        setSession(session);
        clearHash();
        return session;
      })
      .catch(function () {
        clearHash();
        return null;
      });
  }

  function refreshUser() {
    var session = getSession();
    if (!session || !session.access_token) {
      return Promise.resolve(null);
    }
    return fetchAuthUser(session.access_token)
      .then(function (user) {
        session.user = user;
        setSession(session);
        return session;
      })
      .catch(function () {
        return session;
      });
  }

  function signInWithEmail(email, redirectTo) {
    var headers = authHeaders(false);
    if (!headers) {
      return Promise.reject(new Error("Supabase config missing"));
    }
    return request("/auth/v1/otp", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        email: email,
        create_user: true,
        data: {},
        gotrue_meta_security: {},
        options: {
          email_redirect_to: redirectTo
        }
      })
    });
  }

  function signInWithOAuth(provider, redirectTo) {
    var config = getConfig();
    if (!config) {
      return;
    }
    var params = new URLSearchParams({
      provider: provider,
      redirect_to: redirectTo
    });
    window.location.href = config.url + "/auth/v1/authorize?" + params.toString();
  }

  function signOut() {
    var headers = authHeaders(true);
    if (!headers) {
      setSession(null);
      return Promise.resolve();
    }
    return request("/auth/v1/logout", {
      method: "POST",
      headers: headers
    }).finally(function () {
      setSession(null);
    });
  }

  function upsertProfile(profilePayload) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    headers.Prefer = "resolution=merge-duplicates,return=representation";
    var body = {
      id: user.id,
      display_name: profilePayload.display_name || "",
      avatar_id: profilePayload.avatar_id || "avatar_1",
      tone: profilePayload.tone || "neutral",
      share_logs_to_community: Boolean(profilePayload.share_logs_to_community)
    };
    return request("/rest/v1/profiles", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function fetchMyProfile() {
    var user = getUser();
    if (!user) {
      return Promise.resolve(null);
    }
    var headers = authHeaders(true);
    return request("/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=*", {
      method: "GET",
      headers: headers
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function upsertCheckin(payload) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    headers.Prefer = "resolution=merge-duplicates,return=representation";
    return request("/rest/v1/checkins", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        user_id: user.id,
        date: payload.date,
        items_json: payload.items_json || {},
        note: payload.note || "",
        inspiration_added: payload.inspiration_added || "",
        mood: payload.mood || null,
        missed_notes_json: payload.missed_notes_json || {}
      })
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function fetchMyCheckins(limit) {
    var user = getUser();
    if (!user) {
      return Promise.resolve([]);
    }
    var headers = authHeaders(true);
    var query = "/rest/v1/checkins?user_id=eq." + encodeURIComponent(user.id) + "&select=id,user_id,date,items_json,note,inspiration_added,mood,missed_notes_json,updated_at,created_at&order=date.desc&limit=" + String(limit || 120);
    return request(query, {
      method: "GET",
      headers: headers
    });
  }

  function upsertFeedPost(payload) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    headers.Prefer = "resolution=merge-duplicates,return=representation";
    return request("/rest/v1/feed_posts", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        user_id: user.id,
        checkin_id: payload.checkin_id,
        date: payload.date,
        summary: payload.summary || "",
        note: payload.note || "",
        inspiration: payload.inspiration || "",
        mood: payload.mood || null,
        visibility: payload.visibility || "public"
      })
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function fetchPublicFeed(limit) {
    var headers = authHeaders(isAuthenticated());
    var query = "/rest/v1/feed_posts?select=id,user_id,date,summary,note,inspiration,mood,updated_at,created_at,profiles(display_name,avatar_id)&visibility=eq.public&order=updated_at.desc&limit=" + String(limit || 50);
    return request(query, {
      method: "GET",
      headers: headers
    });
  }

  function fetchSupportRows(postIds) {
    if (!postIds || !postIds.length) {
      return Promise.resolve([]);
    }
    var headers = authHeaders(isAuthenticated());
    var inList = postIds.map(function (id) { return id; }).join(",");
    return request("/rest/v1/post_supports?select=post_id,user_id&post_id=in.(" + inList + ")", {
      method: "GET",
      headers: headers
    });
  }

  function toggleSupport(postId) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    return request("/rest/v1/post_supports?select=id,post_id,user_id&post_id=eq." + encodeURIComponent(postId) + "&user_id=eq." + encodeURIComponent(user.id), {
      method: "GET",
      headers: headers
    }).then(function (rows) {
      if (rows && rows.length) {
        return request("/rest/v1/post_supports?post_id=eq." + encodeURIComponent(postId) + "&user_id=eq." + encodeURIComponent(user.id), {
          method: "DELETE",
          headers: headers
        }).then(function () {
          return { supported: false };
        });
      }
      return request("/rest/v1/post_supports", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id
        })
      }).then(function () {
        return { supported: true };
      });
    });
  }

  function fetchPostComments(postIds) {
    if (!postIds || !postIds.length) {
      return Promise.resolve([]);
    }
    var headers = authHeaders(isAuthenticated());
    var inList = postIds.map(function (id) { return id; }).join(",");
    var query = "/rest/v1/post_comments?select=id,post_id,parent_comment_id,user_id,content,created_at,updated_at,profiles(display_name,avatar_id)&post_id=in.(" + inList + ")&order=created_at.asc";
    return request(query, {
      method: "GET",
      headers: headers
    });
  }

  function createPostComment(payload) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    headers.Prefer = "return=representation";
    return request("/rest/v1/post_comments", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        post_id: payload.post_id,
        parent_comment_id: payload.parent_comment_id || null,
        user_id: user.id,
        content: payload.content || ""
      })
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function deletePostComment(commentId) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    return request("/rest/v1/post_comments?id=eq." + encodeURIComponent(commentId) + "&user_id=eq." + encodeURIComponent(user.id), {
      method: "DELETE",
      headers: headers
    }).then(function () {
      return true;
    });
  }

  function createContentReport(payload) {
    var user = getUser();
    if (!user) {
      return Promise.reject(new Error("Not authenticated"));
    }
    var headers = authHeaders(true);
    headers.Prefer = "return=representation";
    return request("/rest/v1/content_reports", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        reporter_user_id: user.id,
        post_id: payload.post_id || null,
        comment_id: payload.comment_id || null,
        reason: payload.reason || "",
        details: payload.details || ""
      })
    }).then(function (rows) {
      return rows && rows[0] ? rows[0] : null;
    });
  }

  function readQueue() {
    return readJson(QUEUE_KEY, []);
  }

  function writeQueue(queue) {
    return writeJson(QUEUE_KEY, queue || []);
  }

  function enqueueQueueItem(item) {
    var queue = readQueue();
    queue.push({
      id: String(Date.now()) + "-" + Math.random().toString(16).slice(2, 8),
      createdAt: new Date().toISOString(),
      type: item.type,
      payload: item.payload
    });
    writeQueue(queue);
  }

  function flushQueue(executorMap) {
    var queue = readQueue();
    if (!queue.length) {
      return Promise.resolve({ flushed: 0, remaining: 0 });
    }
    var index = 0;
    var flushed = 0;

    function step() {
      if (index >= queue.length) {
        writeQueue([]);
        return Promise.resolve({ flushed: flushed, remaining: 0 });
      }
      var item = queue[index];
      index += 1;
      var executor = executorMap && executorMap[item.type];
      if (!executor) {
        return step();
      }
      return executor(item.payload)
        .then(function () {
          flushed += 1;
          return step();
        })
        .catch(function () {
          var remaining = queue.slice(index - 1);
          writeQueue(remaining);
          return { flushed: flushed, remaining: remaining.length };
        });
    }

    return step();
  }

  window.LentSupabase = {
    getConfig: getConfig,
    setConfig: setConfig,
    isConfigured: isConfigured,
    getSession: getSession,
    setSession: setSession,
    getUser: getUser,
    isAuthenticated: isAuthenticated,
    bootstrapAuthFromUrl: bootstrapAuthFromUrl,
    refreshUser: refreshUser,
    signInWithEmail: signInWithEmail,
    signInWithOAuth: signInWithOAuth,
    signOut: signOut,
    upsertProfile: upsertProfile,
    fetchMyProfile: fetchMyProfile,
    upsertCheckin: upsertCheckin,
    fetchMyCheckins: fetchMyCheckins,
    upsertFeedPost: upsertFeedPost,
    fetchPublicFeed: fetchPublicFeed,
    fetchSupportRows: fetchSupportRows,
    toggleSupport: toggleSupport,
    fetchPostComments: fetchPostComments,
    createPostComment: createPostComment,
    deletePostComment: deletePostComment,
    createContentReport: createContentReport,
    enqueueQueueItem: enqueueQueueItem,
    flushQueue: flushQueue
  };
})();
