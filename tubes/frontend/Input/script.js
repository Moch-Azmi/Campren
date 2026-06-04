/**
 * CAMPREN – Input Data | script.js
 * Handles:
 *   1. Smooth scroll antar section
 *   2. Sidebar step progress tracker
 *   3. Channel button selection
 *   4. ROAS Aktual calculation
 *   5. CTR preview bar
 *   6. Section fade-in on scroll (Intersection Observer)
 *   7. Save Campaign validation & toast
 */

// ============================================================
// 1. SCROLL TO SECTION
// ============================================================
/**
 * Scroll ke section tertentu secara smooth di dalam container.
 * @param {string} sectionId - ID element section (misal: 'section-2')
 */
function scrollToSection(sectionId) {
  const container = document.getElementById('formScroll');
  const target    = document.getElementById(sectionId);

  if (!container || !target) return;

  // Hitung posisi offset section relatif terhadap container
  const containerTop = container.getBoundingClientRect().top;
  const targetTop    = target.getBoundingClientRect().top;
  const offset       = targetTop - containerTop + container.scrollTop - 20; // 20px margin atas

  container.scrollTo({
    top:      offset,
    behavior: 'smooth'
  });
}

// ============================================================
// 2. INTERSECTION OBSERVER – Fade-in & Sidebar Progress
// ============================================================
const sections = document.querySelectorAll('.form-section');
const spSteps  = document.querySelectorAll('.sp-step');
const spLines  = document.querySelectorAll('.sp-line');

/**
 * Map section ID ke index step sidebar
 */
const sectionIndexMap = {
  'section-1': 0,
  'section-2': 1,
  'section-3': 2
};

/**
 * Update sidebar step indicator berdasarkan section yang sedang aktif
 * @param {number} activeIndex - index step yang sedang di-view
 */
function updateSidebarProgress(activeIndex) {
  spSteps.forEach((step, i) => {
    step.classList.remove('active', 'done');
    if (i < activeIndex)  step.classList.add('done');
    if (i === activeIndex) step.classList.add('active');
  });

  // Update garis antar step
  spLines.forEach((line, i) => {
    if (i < activeIndex) {
      line.style.background = 'var(--green)';
    } else if (i === activeIndex - 1) {
      line.style.background = 'var(--accent)';
    } else {
      line.style.background = 'var(--border)';
    }
  });
}

// Observer untuk fade-in section saat masuk viewport
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');       // fade-in class
        entry.target.classList.add('in-view');       // highlight border
        
        const idx = sectionIndexMap[entry.target.id];
        if (idx !== undefined) updateSidebarProgress(idx);
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  },
  {
    root:       document.getElementById('formScroll'), // scroll dalam container
    rootMargin: '-10% 0px -50% 0px',                  // trigger saat ~40% terlihat
    threshold:  0
  }
);

sections.forEach(section => fadeObserver.observe(section));

// Trigger fade-in pertama kali (section pertama langsung visible)
setTimeout(() => {
  document.getElementById('section-1')?.classList.add('visible');
}, 100);

// ============================================================
// 3. SIDEBAR STEP CLICK – Scroll ke section
// ============================================================
spSteps.forEach((step, index) => {
  step.addEventListener('click', () => {
    const targetId = step.getAttribute('data-target');
    if (targetId) scrollToSection(targetId);
  });
});

// ============================================================
// 4. CHANNEL BUTTON SELECTION
// ============================================================
const channelBtns = document.querySelectorAll('.channel-btn');
let selectedChannel = null;

channelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Toggle: kalau sudah selected, unselect
    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      selectedChannel = null;
    } else {
      // Unselect semua dulu
      channelBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedChannel = btn.getAttribute('data-channel');
    }
  });
});

// ============================================================
// 5. ROAS & CTR AUTO CALCULATION
// ============================================================

const anggaranInput = document.getElementById("anggaran");
const targetRevenueInput = document.getElementById("targetRevenue");
const targetViewsInput = document.getElementById("targetViews");
const targetClicksInput = document.getElementById("targetClicks");
const targetCTRInput = document.getElementById("targetCTR");
const tanggalMulaiInput = document.getElementById("tanggalMulai");
const tanggalBerakhirInput = document.getElementById("tanggalBerakhir");

const roasAktualCard = document.getElementById("roasAktualCard");
const roasFormula = document.getElementById("roasFormula");
const roasValue = document.getElementById("roasValue");
const roasStatus = document.getElementById("roasStatus");

const ctrPreview = document.getElementById("ctrPreview");
const ctrBarFill = document.getElementById("ctrBarFill");
const ctrBarLabel = document.getElementById("ctrBarLabel");
tanggalMulaiInput.addEventListener("change", () => {
  tanggalBerakhirInput.min = tanggalMulaiInput.value;

  if (
    tanggalBerakhirInput.value &&
    tanggalBerakhirInput.value < tanggalMulaiInput.value
  ) {
    tanggalBerakhirInput.value = "";
  }
});

function formatRupiahShort(value) {
  const num = Number(value);

  if (!num || isNaN(num)) return "–";
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + " M";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + " Jt";
  if (num >= 1000) return (num / 1000).toFixed(0) + " Rb";

  return num.toLocaleString("id-ID");
}

function calculateROAS() {
  const anggaran = Number(anggaranInput.value) || 0;
  const revenue = Number(targetRevenueInput.value) || 0;

  if (anggaran > 0 && revenue > 0) {
    const roas = revenue / anggaran;

    roasFormula.textContent =
      `${formatRupiahShort(revenue)} / ${formatRupiahShort(anggaran)}`;

    roasValue.textContent =
      roas.toFixed(2) + "x";

    roasStatus.classList.add("show");

    if (roas >= 5) {
      roasStatus.className = "roas-status show good";
      roasStatus.textContent = "▲ Sangat bagus";
      roasAktualCard.className = "roas-aktual-card status-good";
    } else if (roas >= 2) {
      roasStatus.className = "roas-status show";
      roasStatus.textContent = "● Normal";
      roasAktualCard.className = "roas-aktual-card";
    } else {
      roasStatus.className = "roas-status show bad";
      roasStatus.textContent = "▼ Kurang optimal";
      roasAktualCard.className = "roas-aktual-card status-bad";
    }

  } else {
    roasFormula.textContent = "– / –";
    roasValue.textContent = "–x";
    roasStatus.textContent = "";
    roasStatus.className = "roas-status";
    roasAktualCard.className = "roas-aktual-card";
  }
}

function calculateCTR() {
  const views = Number(targetViewsInput.value) || 0;
  const clicks = Number(targetClicksInput.value) || 0;

  if (views > 0 && clicks > 0) {
    const ctr = (clicks / views) * 100;

    targetCTRInput.value = ctr.toFixed(2);

    ctrPreview.style.display = "flex";
    ctrBarFill.style.width = Math.min(ctr, 100) + "%";
    ctrBarLabel.textContent = ctr.toFixed(2) + "%";

    if (ctr >= 5) {
      ctrBarFill.style.background =
        "linear-gradient(90deg, #22c55e, #86efac)";
    } else if (ctr >= 2) {
      ctrBarFill.style.background =
        "linear-gradient(90deg, #6366f1, #a5b4fc)";
    } else {
      ctrBarFill.style.background =
        "linear-gradient(90deg, #ef4444, #fca5a5)";
    }

  } else {
    targetCTRInput.value = "";
    ctrPreview.style.display = "none";
  }
}

function calculateAllPreview() {
  calculateROAS();
  calculateCTR();
}

[
  anggaranInput,
  targetRevenueInput,
  targetViewsInput,
  targetClicksInput
].forEach(input => {
  input.addEventListener("input", calculateAllPreview);
});


// ============================================================
// 7. SAVE CAMPAIGN – SAVE TO API
// ============================================================

async function saveCampaign() {

  const data = collectFormData();
  const validation = validateForm(data);

  if (!validation.valid) {
    showToast(validation.message, 'error');
    return;
  }

  const btn = document.getElementById('btnSave');

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  // mapping channel ke platformId
  const platformMap = {
    instagram: 1,
    tiktok: 2,
    youtube: 3
  };

  // payload sesuai API backend
 const userData = JSON.parse(localStorage.getItem("user"));

const userId =
  userData?.userId ||
  userData?.id;

if (!userId) {
  showToast("User belum login", "error");
  return;
}

const payload = {
  userId: userId,

  platformId: platformMap[data.channel],

  namaCampaign: data.namaCampaign,

  budget: data.anggaran,

  tanggalMulai: data.tanggalMulai,
  tanggalAkhir: data.tanggalBerakhir,

  targetViews: data.targetViews,

  targetClicks: data.targetClicks,

  targetIncome: data.targetRevenue
};

  try {

    const response = await fetch(
      'https://camprentelyu.azurewebsites.net/api/campaign',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)
      }
    );

    // ambil response text/json
    const result = await response.text();

    if (!response.ok) {
      throw new Error(result);
    }

    console.log('SUCCESS:', result);

    showToast(
      `✅ Campaign "${data.namaCampaign}" berhasil disimpan!`,
      'success'
    );

  } catch (error) {

    console.error(error);

    showToast(
      '❌ Gagal menyimpan campaign!',
      'error'
    );

  } finally {

    btn.disabled = false;

    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      Save Campaign
    `;
  }
}

function collectFormData() {
  return {
    namaCampaign: document.getElementById('namaCampaign').value,
    channel: selectedChannel,

    tanggalMulai: tanggalMulaiInput.value,
    tanggalBerakhir: tanggalBerakhirInput.value,

    anggaran: parseFloat(document.getElementById('anggaran').value) || 0,
    targetViews: parseFloat(document.getElementById('targetViews').value) || 0,
    targetClicks: parseFloat(document.getElementById('targetClicks').value) || 0,
    targetRevenue: parseFloat(document.getElementById('targetRevenue').value) || 0
  };
}

function validateForm(data) {

  if (!data.namaCampaign) {
    return {
      valid: false,
      message: 'Nama campaign wajib diisi'
    };
  }

  if (!data.channel) {
    return {
      valid: false,
      message: 'Pilih channel dulu'
    };
  }

  if (!data.tanggalMulai) {
    return {
      valid: false,
      message: 'Tanggal mulai wajib diisi'
    };
  }

  if (!data.tanggalBerakhir) {
    return {
      valid: false,
      message: 'Tanggal berakhir wajib diisi'
    };
  }

  if (data.tanggalBerakhir < data.tanggalMulai) {
    return {
      valid: false,
      message: 'Tanggal berakhir tidak boleh lebih awal dari tanggal mulai'
    };
  }

  return { valid: true };
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ============================================================
// INIT – jalankan saat DOM siap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set section pertama langsung terlihat
  const firstSection = document.getElementById('section-1');
  if (firstSection) {
    setTimeout(() => firstSection.classList.add('visible'), 50);
  }

  // Init sidebar step pertama sebagai active
  updateSidebarProgress(0);
});
