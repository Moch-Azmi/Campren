document.addEventListener("DOMContentLoaded", () => {

const fullnameInput = document.getElementById('fullname');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput  = document.getElementById('confirm-password');

const signupBtn = document.getElementById('signupBtn');
const btnLoader = document.getElementById('btnLoader');
const btnText   = signupBtn.querySelector('.btn-text');

function showError(inputEl, errorId, msg) {
  inputEl.classList.add('error');

  const errorEl = document.getElementById(errorId);
  errorEl.textContent = msg;
  errorEl.classList.add('visible');
}

function clearError(inputEl, errorId) {
  inputEl.classList.remove('error');

  const errorEl = document.getElementById(errorId);
  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validatePassword(v) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
}

// ================= REALTIME PASSWORD VALIDATION =================
passwordInput.addEventListener("input", () => {
  if (!passwordInput.value) {
    clearError(passwordInput, "password-error");
    return;
  }

  if (!validatePassword(passwordInput.value)) {
    showError(
      passwordInput,
      "password-error",
      "Min. 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka"
    );
  } else {
    clearError(passwordInput, "password-error");
  }
});

// ================= SIGNUP =================
signupBtn.addEventListener('click', () => {

  const nama  = fullnameInput.value.trim();
  const email = emailInput.value.trim();
  const pass  = passwordInput.value;
  const conf  = confirmInput.value;

  let valid = true;

  if (!nama) { showError(fullnameInput,'fullname-error','Nama wajib'); valid=false; }
  else clearError(fullnameInput,'fullname-error');

  if (!email || !validateEmail(email)) {
    showError(emailInput,'email-error','Email tidak valid');
    valid=false;
  } else clearError(emailInput,'email-error');

  if (!pass || !validatePassword(pass)) {
  showError(
    passwordInput,
    "password-error",
    "Min. 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka"
  );
  valid = false;
  } else {
    clearError(passwordInput, "password-error");
  }

  if (conf !== pass) {
    showError(confirmInput,'confirm-password-error','Password tidak sama');
    valid=false;
  } else clearError(confirmInput,'confirm-password-error');

  if (!valid) return;

  signupBtn.disabled = true;
  btnText.textContent = "Loading...";
  btnLoader.classList.add('show');

  fetch("https://camprentelyu.azurewebsites.net/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama,
      email,
      password: pass
    })
  })
  .then(res => res.text())
  .then(result => {

    signupBtn.disabled = false;
    btnLoader.classList.remove('show');
    btnText.textContent = "Sign Up";

    if (result === "registered") {
      btnText.textContent = "Success ✓";

      setTimeout(() => {
        window.location.href = "../Login/index.html";
      }, 1200);

    } else if (result === "email exists") {
      showError(emailInput,'email-error','Email sudah terdaftar');
    } else {
      alert("Signup gagal");
    }

  })
  .catch(err => {
    signupBtn.disabled = false;
    btnLoader.classList.remove('show');
    btnText.textContent = "Sign Up";
    console.error(err);
    alert("Server error");
  });

});

// ================= TOGGLE PASSWORD =================
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);

    if (input.type === "password") {
      input.type = "text";
      btn.classList.add("active");
    } else {
      input.type = "password";
      btn.classList.remove("active");
    }
  });
});

/* ══════════════════════════════════════════════════
   WAVE CANVAS BACKGROUND
══════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('waveCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // update yBase ratios on resize
    waves.forEach(w => { w.yBase = H * w.yRatio; });
  }

  const palettes = [
    'rgba(91,110,245,',   // indigo
    'rgba(110, 70,210,',  // violet
    'rgba(160, 90,230,',  // lavender
    'rgba(240,240,255,',  // white-ish
  ];

  // Build waves once
  const waves = Array.from({ length: 30 }, () => {
    const yRatio = 0.1 + Math.random() * 0.8;
    const band   = Math.floor(Math.random() * palettes.length);
    return {
      amp:   35  + Math.random() * 130,
      freq:  0.0025 + Math.random() * 0.007,
      speed: 0.002  + Math.random() * 0.008,
      phase: Math.random() * Math.PI * 2,
      yRatio,
      yBase: 0,           // set in resize()
      color: palettes[band],
      alpha: 0.035 + Math.random() * 0.13,
      lw:    0.9 + Math.random() * 0.8,
    };
  });

  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    waves.forEach(w => {
      w.phase += w.speed;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = w.yBase
          + Math.sin(x * w.freq + w.phase) * w.amp
          + Math.sin(x * w.freq * 0.38 + w.phase * 1.4) * w.amp * 0.38;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = w.color + w.alpha + ')';
      ctx.lineWidth   = w.lw;
      ctx.stroke();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

});