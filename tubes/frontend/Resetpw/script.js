document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.querySelector(".signup");

  if (signupBtn) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "../Registrasi/index.html";
    });
  }
});

/* ══════════════════════════════════════════════════
   WAVE CANVAS BACKGROUND
══════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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


/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

function setErr(input, msg, el) {
  input.classList.add('err');
  input.classList.remove('ok');
  el.textContent  = msg;
  el.style.color  = 'var(--red)';
}

function setOk(input, msg, el) {
  input.classList.remove('err');
  input.classList.add('ok');
  el.textContent  = msg;
  el.style.color  = 'var(--green)';
}

function clearState(input, el) {
  input.classList.remove('err','ok');
  el.textContent = '';
}

function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect();
  el.style.animation = 'shake .4s ease';
}


/* ══════════════════════════════════════════════════
   EMAIL VALIDATION
══════════════════════════════════════════════════ */
const emailInput = $('emailInput');
const emailHint  = $('emailHint');

emailInput.addEventListener('input', () => {
  const val = emailInput.value.trim();
  if (!val) { clearState(emailInput, emailHint); return; }
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  valid
    ? setOk(emailInput,  '✓ Email valid',   emailHint)
    : setErr(emailInput, '✗ Format email tidak valid', emailHint);
});


/* ══════════════════════════════════════════════════
   PASSWORD STRENGTH
══════════════════════════════════════════════════ */
const newPwd      = $('newPassword');
const strText     = $('strengthText');

const levels = [
  { pct:'0%',   bg:'var(--red)',   label:'' },
  { pct:'22%',  bg:'var(--red)',   label:'Lemah' },
  { pct:'44%',  bg:'var(--amber)', label:'Cukup' },
  { pct:'66%',  bg:'var(--amber)', label:'Baik' },
  { pct:'88%',  bg:'var(--green)', label:'Kuat' },
  { pct:'100%', bg:'var(--green)', label:'Sangat Kuat' },
];

function calcStrength(p) {
  let s = 0;
  if (p.length >= 8)           s++;
  if (p.length >= 12)          s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

newPwd.addEventListener('input', () => {
  const val = newPwd.value;

  if (!val) {
    strText.textContent = '';
    validateMatch();
    return;
  }

  if (isPasswordValid(val)) {
    strText.textContent = '✓ Password valid';
    strText.style.color = 'var(--green)';
    newPwd.classList.remove('err');
    newPwd.classList.add('ok');
  } else {
    strText.textContent =
      '✗ Minimal 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka';
    strText.style.color = 'var(--red)';
    newPwd.classList.add('err');
    newPwd.classList.remove('ok');
  }

  validateMatch();
});

function validatePasswordRule(p) {
  return {
    minLength: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
  };
}

function isPasswordValid(p) {
  const r = validatePasswordRule(p);
  return r.minLength && r.upper && r.lower && r.number;
}


/* ══════════════════════════════════════════════════
   CONFIRM PASSWORD MATCH
══════════════════════════════════════════════════ */
const confirmPwd = $('confirmPassword');
const matchText  = $('matchText');

function validateMatch() {
  const a = newPwd.value;
  const b = confirmPwd.value;
  if (!b) { clearState(confirmPwd, matchText); return; }
  a === b
    ? setOk(confirmPwd,  '✓ Password cocok',        matchText)
    : setErr(confirmPwd, '✗ Password tidak cocok',  matchText);
}

confirmPwd.addEventListener('input', validateMatch);


/* ══════════════════════════════════════════════════
   EYE TOGGLE
══════════════════════════════════════════════════ */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp  = $(btn.dataset.target);
    const show = inp.type === 'password';
    inp.type   = show ? 'text' : 'password';
    btn.querySelector('.eye-icon').style.opacity = show ? '.45' : '1';
  });
});


/* ══════════════════════════════════════════════════
   SUBMIT
══════════════════════════════════════════════════ */
$('submitBtn').addEventListener('click', (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const pwd   = newPwd.value;
  const conf  = confirmPwd.value;

  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr(emailInput, '✗ Masukkan email valid', emailHint);
    shake(emailInput);
    valid = false;
  }

  if (!pwd || !isPasswordValid(pwd)) {
  strText.textContent = '✗ Password wajib minimal 8 karakter, 1 huruf besar, 1 huruf kecil, dan 1 angka';
  strText.style.color = 'var(--red)';
  newPwd.classList.add('err');
  newPwd.classList.remove('ok');
  shake(newPwd);
  valid = false;
}

  if (!conf || pwd !== conf) {
    setErr(confirmPwd, '✗ Password tidak cocok', matchText);
    shake(confirmPwd);
    valid = false;
  }

  if (!valid) return;

  const btn = $('submitBtn');
  btn.disabled = true;
  btn.querySelector('.btn-label').textContent = 'Processing...';

  fetch("https://camprentelyu.azurewebsites.net/api/change-password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: pwd
    })
  })
  .then(async response => {
    const result = await response.text();

    console.log("STATUS:", response.status);
    console.log("BODY:", result);

    btn.disabled = false;

    const clean = result.trim().toLowerCase();

    if (response.status === 404 || clean.includes("email not found")) {
      btn.querySelector('.btn-label').textContent = 'Make a new password';
      setErr(emailInput, '✗ Email tidak ditemukan', emailHint);
      shake(emailInput);
      return;
    }

    if (response.ok && clean.includes("success")) {
    btn.querySelector('.btn-label').textContent = 'Password berhasil diubah ✓';

    btn.style.background = 'var(--green)';
    btn.style.color = '#0c0c0f';

    // Hapus session/login lama jika ada
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();

    // Redirect ke Login setelah 2 detik
    setTimeout(() => {
      window.location.replace("../Login/index.html");
    }, 1000);

    return;
  }

    btn.querySelector('.btn-label').textContent = 'Make a new password';
    alert("Gagal mengubah password: " + result);
  })
  .catch(error => {
    btn.disabled = false;
    btn.querySelector('.btn-label').textContent = 'Make a new password';

    console.log("ERROR:", error);
    alert("Server error");
  });
});
