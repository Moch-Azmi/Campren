const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

const channelColors = {
  Instagram: "#FBBF24",
  Youtube: "#ef4444",
  Tiktok: "#3b82f6",
  Unknown: "#71717a"
};

let comparisonRevenueChart = null;
let achievementChart = null;
let allComparisonData = [];

function showPageState({
  type = "error",
  title,
  message,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}) {
  const content = document.querySelector(".content");

  if (!content) return;

  const isAuthState = type === "auth";
  const icon = isAuthState
    ? `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <rect x="5" y="10" width="14" height="10" rx="2"></rect>
        <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
      </svg>
    `
    : `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v5"></path>
        <path d="M12 17h.01"></path>
      </svg>
    `;

  content.classList.add("page-state-content");
  content.innerHTML = `
    <section class="page-state-card" role="status" aria-live="polite">
      <div class="page-state-glow"></div>
      <div class="page-state-icon ${isAuthState ? "auth" : "error"}">
        ${icon}
      </div>
      <div class="page-state-eyebrow">
        ${isAuthState ? "AKSES TERBATAS" : "DATA TIDAK TERSEDIA"}
      </div>
      <h2 class="page-state-title">${title}</h2>
      <p class="page-state-message">${message}</p>
      <div class="page-state-actions">
        <a class="page-state-button primary" href="${primaryHref}">
          ${primaryLabel}
        </a>
        ${
          secondaryLabel && secondaryHref
            ? `
              <a class="page-state-button secondary" href="${secondaryHref}">
                ${secondaryLabel}
              </a>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function showLoggedOutState() {
  showPageState({
    type: "auth",
    title: "Login diperlukan",
    message:
      "Masuk ke akun CAMPREN untuk melihat perbandingan target dan performa campaign kamu.",
    primaryLabel: "Masuk ke akun",
    primaryHref: "../Login/index.html",
    secondaryLabel: "Buat akun baru",
    secondaryHref: "../Registrasi/index.html"
  });
}

function showLoadErrorState() {
  showPageState({
    title: "Data gagal dimuat",
    message:
      "Terjadi kendala saat mengambil data comparison. Coba muat ulang halaman ini.",
    primaryLabel: "Muat ulang",
    primaryHref: window.location.href
  });
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.userId || user.id || null;
  } catch (error) {
    console.error("Data user tidak valid:", error);
    return null;
  }
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getChannelName(platformId) {
  const map = {
    1: "Instagram",
    2: "Youtube",
    3: "Tiktok"
  };

  return map[Number(platformId)] || "Unknown";
}

function getSafeCampaignName(campaign) {
  return (
    campaign.namaCampaign ||
    campaign.campaignName ||
    campaign.name ||
    "Campaign Tanpa Nama"
  );
}

function getStatus(item) {
  if (item.achievement >= 100) {
    return {
      text: "Achieved",
      className: "good"
    };
  }

  if (item.achievement >= 80) {
    return {
      text: "Need Watch",
      className: "warning"
    };
  }

  return {
    text: "Underperform",
    className: "bad"
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} - ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Respons API bukan JSON valid - ${url}`);
  }
}

function normalizePerformance(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.performance)) return raw.performance;
  if (Array.isArray(raw.performanceMetrics)) return raw.performanceMetrics;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

async function loadComparisonData() {
  const userId = getUserId();

  if (!userId) {
    throw new Error("User belum login");
  }

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);

  const result = [];

  for (const campaignItem of campaigns) {
    const campaignId = campaignItem.campaignId || campaignItem.id;

    if (!campaignId) continue;

    try {
      const performanceRaw = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);
      const reportCampaign = performanceRaw.campaign || campaignItem;
      const performanceList = normalizePerformance(performanceRaw);
      const campaignName = getSafeCampaignName(reportCampaign);
      const channel = getChannelName(reportCampaign.platformId || campaignItem.platformId);

      const targetRevenue = Number(
        reportCampaign.targetIncome ||
        reportCampaign.targetRevenue ||
        campaignItem.targetIncome ||
        campaignItem.targetRevenue ||
        0
      );

      const actualRevenue = performanceList.reduce((sum, p) => {
        return sum + Number(p.revenue || p.income || p.actualRevenue || 0);
      }, 0);

      const difference = actualRevenue - targetRevenue;
      const achievement = targetRevenue > 0
        ? (actualRevenue / targetRevenue) * 100
        : 0;

      result.push({
        campaignId,
        campaign: campaignName,
        channel,
        targetRevenue,
        actualRevenue,
        difference,
        achievement
      });
    } catch (error) {
      console.error(`Campaign ${campaignId} gagal dimuat:`, error);
    }
  }

  return result;
}

function getFilteredData() {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const channel = document.getElementById("channelFilter").value;

  return allComparisonData.filter(item => {
    const matchKeyword = item.campaign.toLowerCase().includes(keyword);
    const matchChannel = channel === "all" || item.channel === channel;

    return matchKeyword && matchChannel;
  });
}

function renderKpi(data) {
  const totalTarget = data.reduce((sum, item) => sum + item.targetRevenue, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actualRevenue, 0);

  const achievement = totalTarget > 0
    ? (totalActual / totalTarget) * 100
    : 0;

  const best = data.length
    ? data.reduce((prev, curr) => curr.achievement > prev.achievement ? curr : prev)
    : null;

  document.getElementById("totalTarget").textContent = formatRupiah(totalTarget);
  document.getElementById("totalActual").textContent = formatRupiah(totalActual);
  document.getElementById("achievementRate").textContent = `${achievement.toFixed(1)}%`;
  document.getElementById("bestCampaign").textContent = best ? best.campaign : "-";

  const achievementEl = document.getElementById("achievementRate");

  achievementEl.classList.remove("good", "warning", "bad");

  if (achievement >= 100) {
    achievementEl.classList.add("good");
  } else if (achievement >= 80) {
    achievementEl.classList.add("warning");
  } else {
    achievementEl.classList.add("bad");
  }
}

function renderComparisonCards(data) {
  const wrapper = document.getElementById("comparisonCards");
  wrapper.innerHTML = "";

  if (!data.length) {
    wrapper.innerHTML = `
      <div class="empty-state">
        Data campaign tidak ditemukan.
      </div>
    `;
    return;
  }

  data.slice(0, 4).forEach(item => {
    const status = getStatus(item);

    const progress = item.targetRevenue > 0
      ? Math.min(item.achievement, 100)
      : 0;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-card-top">
        <div>
          <div class="product-title">${item.campaign}</div>
          <div class="product-meta">${item.channel}</div>
        </div>

        <span class="status ${status.className}">
          ${status.text}
        </span>
      </div>

      <div class="product-card-value ${status.className}">
        ${item.achievement.toFixed(1)}%
      </div>

      <div class="product-card-sub">
        Actual ${formatRupiah(item.actualRevenue)} dari Target ${formatRupiah(item.targetRevenue)}
      </div>

      <div class="progress-track">
        <div class="progress-fill ${status.className}" style="width:${progress}%"></div>
      </div>
    `;

    wrapper.appendChild(card);
  });
}

function renderTable(data) {
  const tbody = document.getElementById("comparisonTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:24px;">
          Data comparison tidak ditemukan
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const status = getStatus(item);
    const channelClass = item.channel.toLowerCase();

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="campaign-name">${item.campaign}</div>
        <div class="product-name">Campaign ID: ${item.campaignId}</div>
      </td>

      <td>
        <span class="badge ${channelClass}">
          ${item.channel}
        </span>
      </td>

      <td>${formatRupiah(item.targetRevenue)}</td>

      <td class="${status.className}">
        ${formatRupiah(item.actualRevenue)}
      </td>

      <td class="${item.difference >= 0 ? "good" : "bad"}">
        ${item.difference >= 0 ? "+" : ""}${formatRupiah(item.difference)}
      </td>

      <td class="${status.className}">
        ${item.achievement.toFixed(1)}%
      </td>

      <td>
        <span class="status ${status.className}">
          ${status.text}
        </span>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function renderComparisonRevenueChart(data) {
  const ctx = document.getElementById("comparisonRevenueChart");

  if (comparisonRevenueChart) {
    comparisonRevenueChart.destroy();
  }

  comparisonRevenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => item.campaign),
      datasets: [
        {
          label: "Target Revenue",
          data: data.map(item => item.targetRevenue),
          backgroundColor: "rgba(59,130,246,0.65)",
          borderRadius: 10
        },
        {
          label: "Actual Revenue",
          data: data.map(item => item.actualRevenue),
          backgroundColor: data.map(item => channelColors[item.channel] || channelColors.Unknown),
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            color: "#d4d4d8"
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              return `${context.dataset.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#a1a1aa"
          },
          grid: {
            color: "#24242b"
          }
        },

        y: {
          beginAtZero: true,
          ticks: {
            color: "#a1a1aa",
            callback: value => `Rp ${Number(value).toLocaleString("id-ID")}`
          },
          grid: {
            color: "#24242b"
          }
        }
      }
    }
  });
}

function renderAchievementChart(data) {
  const ctx = document.getElementById("achievementChart");

  if (achievementChart) {
    achievementChart.destroy();
  }

  achievementChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(item => item.campaign),
      datasets: [
        {
          data: data.map(item => item.achievement),
          backgroundColor: data.map(item => {
            const status = getStatus(item);
            if (status.className === "good") return "#34D399";
            if (status.className === "warning") return "#FBBF24";
            return "#F87171";
          }),
          borderColor: "#18181d",
          borderWidth: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#d4d4d8",
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              return `${context.label}: ${Number(context.raw).toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
}

function renderAll() {
  const data = getFilteredData();

  renderKpi(data);
  renderComparisonCards(data);
  renderTable(data);
  renderComparisonRevenueChart(data);
  renderAchievementChart(data);
}

async function initComparisonPage() {
  if (!getUserId()) {
    showLoggedOutState();
    return;
  }

  try {
    allComparisonData = await loadComparisonData();
    renderAll();
  } catch (err) {
    console.error("Comparison page error:", err);
    showLoadErrorState();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("input", renderAll);
  document.getElementById("channelFilter").addEventListener("change", renderAll);

  initComparisonPage();
});
