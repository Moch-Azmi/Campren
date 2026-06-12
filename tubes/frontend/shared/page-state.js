(function () {
  function getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.userId || user.id || null;
    } catch (error) {
      console.error("Data user tidak valid:", error);
      return null;
    }
  }

  function renderState(selector, options) {
    const host = document.querySelector(selector);

    if (!host) return false;

    const isError = options.type === "error";
    const icon = isError
      ? `
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v5"></path>
          <path d="M12 17h.01"></path>
        </svg>
      `
      : `
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
          stroke-linejoin="round" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2"></rect>
          <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
        </svg>
      `;

    host.classList.add("auth-state-host");
    host.innerHTML = `
      <section class="auth-state-card ${isError ? "is-error" : ""}"
        role="status" aria-live="polite">
        <div class="auth-state-glow"></div>
        <div class="auth-state-icon">${icon}</div>
        <div class="auth-state-eyebrow">
          ${isError ? "DATA TIDAK TERSEDIA" : "AKSES TERBATAS"}
        </div>
        <h2 class="auth-state-title">${options.title}</h2>
        <p class="auth-state-message">${options.message}</p>
        <div class="auth-state-actions">
          <a class="auth-state-button primary" href="${options.primaryHref}">
            ${options.primaryLabel}
          </a>
          ${
            options.secondaryLabel && options.secondaryHref
              ? `
                <a class="auth-state-button secondary"
                  href="${options.secondaryHref}">
                  ${options.secondaryLabel}
                </a>
              `
              : ""
          }
        </div>
      </section>
    `;

    return true;
  }

  function requireLogin(selector, message) {
    if (getUserId()) return true;

    renderState(selector, {
      title: "Login diperlukan",
      message:
        message ||
        "Masuk ke akun CAMPREN untuk mengakses data dan fitur campaign kamu.",
      primaryLabel: "Masuk ke akun",
      primaryHref: "../Login/index.html",
      secondaryLabel: "Buat akun baru",
      secondaryHref: "../Registrasi/index.html"
    });

    return false;
  }

  function showLoadError(selector, message) {
    renderState(selector, {
      type: "error",
      title: "Data gagal dimuat",
      message:
        message ||
        "Terjadi kendala saat mengambil data. Coba muat ulang halaman ini.",
      primaryLabel: "Muat ulang",
      primaryHref: window.location.href
    });
  }

  function getUserName() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.username || user.name || user.email || "User";
    } catch (error) {
      console.error("Error parsing user name:", error);
      return "User";
    }
  }

  function showUserPopup() {
    const userName = getUserName();
    
    // Remove existing popup if any
    const existingPopup = document.getElementById("userPopup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup
    const popup = document.createElement("div");
    popup.id = "userPopup";
    popup.className = "user-popup-overlay";
    popup.innerHTML = `
      <div class="user-popup-content">
        <div class="user-popup-header">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div class="user-popup-name">${userName}</div>
        <div class="user-popup-divider"></div>
        <button id="logoutPopupBtn" class="user-popup-logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Close popup when clicking overlay
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.remove();
      }
    });

    // Logout handler
    document.getElementById("logoutPopupBtn").addEventListener("click", logout);
  }

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.replace("../Login/index.html");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-logout]").forEach(button => {
      button.addEventListener("click", showUserPopup);
    });
  });

  window.CamprenPageState = {
    getUserId,
    requireLogin,
    showLoadError,
    logout
  };
})();
