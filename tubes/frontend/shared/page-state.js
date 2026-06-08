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

  window.CamprenPageState = {
    getUserId,
    requireLogin,
    showLoadError
  };
})();
