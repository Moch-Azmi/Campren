/* =====================
   CAMPREN – app.js (FIXED + FETCH)
   ===================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── NAV ACTIVE STATE ─────────────────────────
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelector('.page-title').textContent =
        item.dataset.page.charAt(0).toUpperCase() + item.dataset.page.slice(1);
    });
  });

  // ── PENCAPAIAN TARGET ────────────────────────
  const targetInput  = document.getElementById('targetRevenue');
  const pencapaianEl = document.getElementById('pencapaianPct');

  let TOTAL_REVENUE = 85000000;

  function updatePencapaian() {
    const target = parseFloat(targetInput.value);
    if (!target || target <= 0) {
      pencapaianEl.textContent = '—';
      return;
    }
    const pct = ((TOTAL_REVENUE / target) * 100).toFixed(1);
    pencapaianEl.textContent = pct + '%';
  }

  targetInput.value = 566666667;
  updatePencapaian();
  targetInput.addEventListener('input', updatePencapaian);

  // ── DONUT CHART ──────────────────────────────
  const donutCtx = document.getElementById('donutChart').getContext('2d');

  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['TikTok', 'Youtube', 'Instagram', 'Tokopedia'],
      datasets: [{
        data: [35, 25, 20, 20],
        backgroundColor: ['#3B82F6', '#F87171', '#FBBF24', '#A78BFA'],
        borderWidth: 2,
        borderColor: '#181A22',
        hoverOffset: 6,
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false } }
    }
  });

  // ── AREA CHART ───────────────────────────────
  const areaCtx = document.getElementById('areaChart').getContext('2d');

  function makeGradient(ctx, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'];

  const revenueData = [2, 3, 5, 7, 12, 18, 25];
  const spendData   = [1, 2, 3, 4, 7, 11, 16];

  const revGrad  = makeGradient(areaCtx, 'rgba(52,211,153,0.4)', 'rgba(52,211,153,0)');
  const spendGrad = makeGradient(areaCtx, 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0)');

  window.areaChart = new Chart(areaCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#34D399',
          fill: true,
          backgroundColor: revGrad,
          tension: 0.4,
        },
        {
          label: 'Ad Spend',
          data: spendData,
          borderColor: '#3B82F6',
          fill: true,
          backgroundColor: spendGrad,
          tension: 0.4,
        }
      ]
    }
  });

  // ── FETCH DASHBOARD DATA ─────────────────────
  async function loadDashboardData() {
    try {
      const res = await fetch("https://camprentelu.azurewebsites.net/api/dashboard");

      if (!res.ok) throw new Error("Fetch gagal");

      const data = await res.json();

      // update KPI
      TOTAL_REVENUE = data.totalRevenue;

      targetInput.value = data.targetRevenue;
      updatePencapaian();

      // update chart
      areaChart.data.datasets[0].data = data.revenue;
      areaChart.data.datasets[1].data = data.spend;
      areaChart.update();

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }

  loadDashboardData();

  // ── PROGRESS BAR ANIMATION ───────────────────
  const bars = document.querySelectorAll('.troas-bar, .roas-progress-fill');
  const widths = [...bars].map(b => b.style.width);
  bars.forEach(b => b.style.width = '0');

  setTimeout(() => {
    bars.forEach((b, i) => b.style.width = widths[i]);
  }, 300);

});