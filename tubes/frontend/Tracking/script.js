const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

const channelColors = {
  Tokopedia: "#8b5cf6",
  Tiktok: "#3b82f6",
  TikTok: "#3b82f6",
  Instagram: "#ec4899",
  Youtube: "#ef4444",
  YouTube: "#ef4444",
  Google: "#22c55e",
  Unknown: "#71717a"
};

let roasChart = null;
let revenueChart = null;

function getUserId() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.userId || user.id || 3;
}

function formatRupiahJt(value) {
  return `Rp. ${Number(value || 0).toFixed(1)}jt`;
}

function getChannelName(platformId, fallback) {
  if (fallback) return fallback;

  const map = {
    1: "Tokopedia",
    2: "Youtube",
    3: "Google",
    4: "Tiktok",
    5: "Instagram"
  };

  return map[platformId] || "Unknown";
}

function getStatus(item) {
  if (item.roas >= item.targetRoas) {
    return { text: "Above Target", className: "good" };
  }

  if (item.roas >= item.targetRoas * 0.8) {
    return { text: "Need Watch", className: "warning" };
  }

  return { text: "Below Target", className: "bad" };
}

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} - ${url}`);
  }

  return await res.json();
}

function normalizePerformance(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.performanceMetrics)) return data.performanceMetrics;
  if (Array.isArray(data.performance)) return data.performance;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function getRoasValue(data) {
  if (typeof data === "number") return data;
  return Number(data.roas || data.ROAS || data.value || 0);
}

async function loadTrackingData() {
  const userId = getUserId();

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);
  const trackingData = [];

  for (const campaign of campaigns) {
    const campaignId =
      campaign.campaignId ||
      campaign.id ||
      campaign.CampaignID;

    if (!campaignId) continue;

    let performanceRaw = {};
    let roasRaw = {};

    try {
      performanceRaw = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);
    } catch (err) {
      console.error("Gagal ambil performance:", err);
    }

    try {
      roasRaw = await fetchJson(`${BASE_URL}/roas/${campaignId}`);
    } catch (err) {
      console.error("Gagal ambil ROAS:", err);
    }

    const performanceList = normalizePerformance(performanceRaw);

    const revenue = performanceList.reduce((sum, p) => {
      return sum + Number(p.revenue || p.income || p.totalRevenue || 0);
    }, 0);

    const adSpendFromPerf = performanceList.reduce((sum, p) => {
      return sum + Number(p.cost || p.adSpend || p.spend || 0);
    }, 0);

    const adSpend = adSpendFromPerf || Number(campaign.budget || campaign.adSpend || 0);

    const targetRevenue = Number(
      campaign.targetIncome ||
      campaign.targetRevenue ||
      campaign.target_revenue ||
      0
    );

    const targetRoas = adSpend > 0 ? targetRevenue / adSpend : 0;

    const roasFromApi = getRoasValue(roasRaw);
    const roas = roasFromApi || (adSpend > 0 ? revenue / adSpend : 0);

    trackingData.push({
      campaign: campaign.namaCampaign || campaign.campaignName || campaign.name || "-",
      product: campaign.namaProduk || campaign.product || "-",
      channel: getChannelName(campaign.platformId, campaign.channel),
      adSpend,
      targetRevenue,
      revenue,
      targetRoas,
      roas
    });
  }

  return trackingData;
}

function renderKpi(trackingData) {
  const totalSpend = trackingData.reduce((sum, item) => sum + item.adSpend, 0);
  const totalRevenue = trackingData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const best = trackingData.length
    ? trackingData.reduce((prev, curr) => curr.roas > prev.roas ? curr : prev)
    : null;

  document.getElementById("totalSpend").textContent = formatRupiahJt(totalSpend);
  document.getElementById("totalRevenue").textContent = formatRupiahJt(totalRevenue);
  document.getElementById("avgRoas").textContent = `${avgRoas.toFixed(2)}x`;
  document.getElementById("bestChannel").textContent = best ? best.channel : "-";
}

function renderTable(trackingData) {
  const tbody = document.getElementById("trackingTable");
  tbody.innerHTML = "";

  if (!trackingData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;">Data tracking kosong</td>
      </tr>
    `;
    return;
  }

  trackingData.forEach(item => {
    const status = getStatus(item);
    const channelClass = item.channel.toLowerCase();

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="campaign-name">${item.campaign}</div>
        <div class="product-name">${item.product}</div>
      </td>
      <td>
        <span class="badge ${channelClass}">
          ${item.channel}
        </span>
      </td>
      <td>${formatRupiahJt(item.adSpend)}</td>
      <td>${formatRupiahJt(item.targetRevenue)}</td>
      <td class="${status.className}">${formatRupiahJt(item.revenue)}</td>
      <td>${item.targetRoas.toFixed(1)}x</td>
      <td class="${status.className}">${item.roas.toFixed(1)}x</td>
      <td>
        <span class="status ${status.className}">
          ${status.text}
        </span>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function renderRoasChart(trackingData) {
  const ctx = document.getElementById("roasBarChart");

  if (roasChart) roasChart.destroy();

  roasChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: trackingData.map(item => item.channel),
      datasets: [
        {
          label: "ROAS",
          data: trackingData.map(item => item.roas),
          backgroundColor: trackingData.map(item => channelColors[item.channel] || channelColors.Unknown),
          borderRadius: 10
        },
        {
          label: "Target ROAS",
          data: trackingData.map(item => item.targetRoas),
          backgroundColor: "#3f3f46",
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#d4d4d8" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#a1a1aa" },
          grid: { color: "#24242b" }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#a1a1aa",
            callback: value => `${value}x`
          },
          grid: { color: "#24242b" }
        }
      }
    }
  });
}

function renderRevenueChart(trackingData) {
  const ctx = document.getElementById("revenueDonutChart");

  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: trackingData.map(item => item.channel),
      datasets: [
        {
          data: trackingData.map(item => item.revenue),
          backgroundColor: trackingData.map(item => channelColors[item.channel] || channelColors.Unknown),
          borderColor: "#18181d",
          borderWidth: 4
        }
      ]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#d4d4d8",
            padding: 18
          }
        }
      }
    }
  });
}

async function initTracking() {
  try {
    const trackingData = await loadTrackingData();

    renderKpi(trackingData);
    renderTable(trackingData);
    renderRoasChart(trackingData);
    renderRevenueChart(trackingData);

  } catch (err) {
    console.error("Tracking error:", err);
    alert("Gagal load data tracking. Cek API / CORS / CampaignID. Ya, web dev memang begini hidupnya.");
  }
}

document.addEventListener("DOMContentLoaded", initTracking);