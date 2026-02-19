(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderAuthPanel(container, options) {
    if (!container) {
      return;
    }
    var supa = window.LentSupabase;
    if (!supa || !supa.isConfigured()) {
      container.innerHTML = (
        '<div class="panel auth-panel">' +
        '<h2>Public feed login</h2>' +
        '<p class="muted">Supabase is not configured yet. Add keys in <code>window.LENT_SUPABASE_CONFIG</code> or localStorage <code>lent_supabase_config_v1</code>.</p>' +
        "</div>"
      );
      return;
    }

    var session = supa.getSession();
    var user = session && session.user ? session.user : null;
    if (user) {
      container.innerHTML = (
        '<div class="panel auth-panel">' +
        '<div class="auth-panel-row">' +
        "<h2>Signed in</h2>" +
        '<button type="button" id="authSignOutBtn">Log out</button>' +
        "</div>" +
        "<p>" + escapeHtml(user.email || user.id) + "</p>" +
        "</div>"
      );
      var signOutBtn = container.querySelector("#authSignOutBtn");
      signOutBtn.addEventListener("click", function () {
        supa.signOut().finally(function () {
          try {
            localStorage.removeItem("lent_tracker_v1");
          } catch (error) {
            // ignore storage clear failures
          }
          renderAuthPanel(container, options);
          if (options && typeof options.onSessionChange === "function") {
            options.onSessionChange();
          }
        });
      });
      return;
    }

    container.innerHTML = (
      '<div class="panel auth-panel">' +
      "<h2>Sign in with your email</h2>" +
      '<p class="muted">We will send a one-time magic link. No password needed.</p>' +
      '<div class="field">' +
      '<label for="authEmailInput">Email</label>' +
      '<input id="authEmailInput" type="email" placeholder="you@example.com">' +
      "</div>" +
      '<div class="button-row">' +
      '<button type="button" id="authMagicLinkBtn" class="auth-cta-btn">Send magic link</button>' +
      "</div>" +
      '<p id="authStatusMessage" class="status-message" role="status" aria-live="polite"></p>' +
      "</div>"
    );

    var emailInput = container.querySelector("#authEmailInput");
    var magicLinkBtn = container.querySelector("#authMagicLinkBtn");
    var status = container.querySelector("#authStatusMessage");

    function setStatus(text, tone) {
      status.textContent = text || "";
      status.classList.remove("ok", "warn");
      if (tone) {
        status.classList.add(tone);
      }
    }

    magicLinkBtn.addEventListener("click", function () {
      var email = (emailInput.value || "").trim();
      if (!email) {
        setStatus("Enter an email first.", "warn");
        return;
      }
      setStatus("Sending link...", "");
      supa.signInWithEmail(email, window.location.origin + window.location.pathname)
        .then(function () {
          setStatus("Magic link sent. Check your inbox.", "ok");
        })
        .catch(function (error) {
          setStatus(error && error.message ? error.message : "Could not send magic link.", "warn");
        });
    });

  }

  window.LentAuthUI = {
    renderAuthPanel: renderAuthPanel
  };
})();
