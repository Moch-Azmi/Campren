document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    const signInBtn = document.getElementById("signInBtn");

    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");

    function setLoading(state) {

        signInBtn.disabled = state;

        signInBtn.textContent =
            state ? "Loading..." : "Sign In";
    }

    async function handleLogin(e) {

        e.preventDefault();

        const email = emailInput.value.trim();

        const password = passwordInput.value.trim();

        if (!email || !password) {

            alert("Email / Password wajib diisi");

            return;
        }

        setLoading(true);

        try {

            const res = await fetch(
                "https://camprentelu.azurewebsites.net/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const result = await res.json();

            console.log("LOGIN:", result);

            if (
                res.ok &&
                result.status === "registered"
            ) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(result)
                );

                alert("Login berhasil");

                window.location.href =
                    "../Dashboard/index.html";

            } else {

                alert("Email / Password salah");

            }

        } catch (err) {

            console.error(err);

            alert("Server error");

        }

        setLoading(false);
    }

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

    document
    .querySelector(".forgot-password")
    .addEventListener("click", (e) => {

        e.preventDefault();

        window.location.href =
            "../Resetpw/index.html";
    });

    document
    .querySelector(".signup-link")
    .addEventListener("click", (e) => {

        e.preventDefault();

        window.location.href =
            "../Registrasi/index.html";
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
