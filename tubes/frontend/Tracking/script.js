const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

const channelColors = {
  Tiktok: "#3b82f6",
  Instagram: "#FBBF24",
  Youtube: "#ef4444",
  Unknown: "#71717a"
};

let roasChart = null;
let revenueChart = null;

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
  }).format(value || 0);
}

function getChannelName(platformId) {
  const id = Number(platformId);

  const map = {
    1: "Instagram",
    2: "Youtube",
    3: "Tiktok",
  };

  return map[id] || "Unknown";
}

function getStatus(item) {
  if (item.targetRoas <= 0) {
    return { text: "No Target", className: "warning" };
  }

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
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} - ${url}`);
  }

  if (!text) {
    throw new Error(`Respons API kosong - ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Respons API bukan JSON valid - ${url}`);
  }
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

  if (!userId) {
    throw new Error("User belum login");
  }

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);
  const trackingData = [];

  for (const item of campaigns) {
    const campaignId = item.campaignId || item.id || item.CampaignID;

    if (!campaignId) {
      console.warn("Campaign tanpa ID:", item);
      continue;
    }

    try {
      const performanceRaw = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);

      const campaign = performanceRaw.campaign || item;
      const performanceList = normalizePerformance(performanceRaw);

      const revenue = performanceList.reduce((sum, p) => {
        return sum + Number(p.revenue || p.Revenue || 0);
      }, 0);

      const adSpend = performanceList.reduce((sum, p) => {
        return sum + Number(p.cost || p.Cost || p.adSpend || 0);
      }, 0);

      const targetRevenue = Number(campaign.targetIncome || campaign.targetRevenue || 0);
      const budget = Number(campaign.budget || campaign.Budget || 0);
      const targetRoas = budget > 0 ? targetRevenue / budget : 0;
      const manualRoas = adSpend > 0 ? revenue / adSpend : 0;

      let roas = manualRoas;

      try {
        const roasRaw = await fetchJson(`${BASE_URL}/roas/${campaignId}`);
        roas = getRoasValue(roasRaw) || manualRoas;
      } catch (error) {
        console.warn(`ROAS API campaign ${campaignId} gagal, memakai hitungan manual.`, error);
      }
      
      trackingData.push({
        campaign: campaign.namaCampaign || campaign.name || "-",
        product: "-",
        channel: getChannelName(
          campaign.platformId ||
          campaign.PlatformID ||
          campaign.platformID ||
          campaign.platform_id ||
          item.platformId ||
          item.PlatformID ||
          item.platformID ||
          item.platform_id
        ),
        budget,
        adSpend,
        targetRevenue,
        revenue,
        targetRoas,
        roas
      });

    } catch (err) {
      console.error(`Campaign ID ${campaignId} error, dilewati:`, err);
      continue;
    }
  }

  return trackingData;
}

function renderKpi(trackingData) {
  const totalSpend = trackingData.reduce((sum, item) => sum + item.adSpend, 0);
  const totalRevenue = trackingData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const channelData = aggregateByChannel(trackingData);

  const best = channelData.length
    ? channelData.reduce((prev, curr) => curr.roas > prev.roas ? curr : prev)
    : null;

  document.getElementById("totalSpend").textContent = formatRupiah(totalSpend);
  document.getElementById("totalRevenue").textContent = formatRupiah(totalRevenue);
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
      <td>${formatRupiah(item.adSpend)}</td>
      <td>${formatRupiah(item.targetRevenue)}</td>
      <td class="${status.className}">${formatRupiah(item.revenue)}</td>
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
  const channelData = aggregateByChannel(trackingData);

  if (roasChart) roasChart.destroy();

  roasChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: channelData.map(item => item.channel),
      datasets: [
        {
          label: "ROAS",
          data: channelData.map(item => item.roas),
          backgroundColor: channelData.map(item => channelColors[item.channel] || channelColors.Unknown),
          borderRadius: 10
        },
        {
          label: "Target ROAS",
          data: channelData.map(item => item.targetRoas),
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
  const channelData = aggregateByChannel(trackingData);

  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: channelData.map(item => item.channel),
      datasets: [
        {
          data: channelData.map(item => item.revenue),
          backgroundColor: channelData.map(item => channelColors[item.channel] || channelColors.Unknown),
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

function aggregateByChannel(trackingData) {
  const channelMap = new Map();

  trackingData.forEach(item => {
    const channel = channelMap.get(item.channel) || {
      channel: item.channel,
      budget: 0,
      adSpend: 0,
      targetRevenue: 0,
      revenue: 0
    };

    channel.budget += item.budget;
    channel.adSpend += item.adSpend;
    channel.targetRevenue += item.targetRevenue;
    channel.revenue += item.revenue;
    channelMap.set(item.channel, channel);
  });

  return Array.from(channelMap.values()).map(channel => ({
    ...channel,
    targetRoas: channel.budget > 0
      ? channel.targetRevenue / channel.budget
      : 0,
    roas: channel.adSpend > 0
      ? channel.revenue / channel.adSpend
      : 0
  }));
}

async function initTracking() {
  try {
    const trackingData = await loadTrackingData();

    renderKpi(trackingData);
    renderTable(trackingData);
    renderRoasChart(trackingData);
    renderRevenueChart(trackingData);

  } catch (err) {
    console.error("Tracking fatal error:", err);
    alert(err.message || "Gagal memuat data tracking.");
  }
}

document.addEventListener("DOMContentLoaded", initTracking);
