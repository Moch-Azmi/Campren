const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

const channelColors = {
  Instagram: "#FBBF24",
  Youtube: "#ef4444",
  Tiktok: "#3b82f6",
  Unknown: "#71717a"
};

let productRevenueChart = null;
let productRoasChart = null;
let allProducts = [];

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
    3: "Tiktok",
  };

  return map[platformId] || "Unknown";
}

function getSafeProductName(campaign) {
  return (
    campaign.namaProduk ||
    campaign.productName ||
    campaign.produk ||
    campaign.product ||
    campaign.namaCampaign ||
    "Produk Tanpa Nama"
  );
}

function getStatus(item) {
  if (item.targetRevenue <= 0 || item.targetRoas <= 0) {
    return { text: "No Target", className: "warning" };
  }

  if (item.roas >= item.targetRoas && item.revenue >= item.targetRevenue) {
    return { text: "Excellent", className: "good" };
  }

  if (item.roas >= item.targetRoas * 0.8 || item.revenue >= item.targetRevenue * 0.8) {
    return { text: "Need Watch", className: "warning" };
  }

  return { text: "Underperform", className: "bad" };
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

async function loadProductData() {
  const userId = getUserId();

  if (!userId) {
    throw new Error("User belum login");
  }

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);
  const productMap = new Map();

  for (const campaignItem of campaigns) {
    const campaignId = campaignItem.campaignId || campaignItem.id;
    if (!campaignId) continue;

    try {
      const performanceRaw = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);
      const reportCampaign = performanceRaw.campaign || campaignItem;
      const performanceList = normalizePerformance(performanceRaw);

      const productName = getSafeProductName(reportCampaign);
      const campaignName = reportCampaign.namaCampaign || campaignItem.namaCampaign || "Campaign Tanpa Nama";
      const channel = getChannelName(reportCampaign.platformId || campaignItem.platformId);

      const revenue = performanceList.reduce((sum, p) => sum + Number(p.revenue || p.income || 0), 0);
      const adSpend = performanceList.reduce((sum, p) => sum + Number(p.cost || p.spend || 0), 0);
      const budget = Number(reportCampaign.budget || campaignItem.budget || 0);
      const targetRevenue = Number(reportCampaign.targetIncome || reportCampaign.targetRevenue || 0);
      const key = `${productName}-${channel}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          product: productName,
          campaigns: [],
          channel,
          budget: 0,
          adSpend: 0,
          targetRevenue: 0,
          revenue: 0,
          roas: 0,
          targetRoas: 0
        });
      }

      const item = productMap.get(key);
      item.campaigns.push(campaignName);
      item.budget += budget;
      item.adSpend += adSpend;
      item.targetRevenue += targetRevenue;
      item.revenue += revenue;
    } catch (error) {
      console.error(`Campaign ${campaignId} gagal dimuat:`, error);
    }
  }

  return Array.from(productMap.values()).map(item => {
    item.roas = item.adSpend > 0 ? item.revenue / item.adSpend : 0;
    item.targetRoas = item.budget > 0 ? item.targetRevenue / item.budget : 0;
    return item;
  });
}

function getFilteredProducts() {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const channel = document.getElementById("channelFilter").value;

  return allProducts.filter(item => {
    const matchKeyword =
      item.product.toLowerCase().includes(keyword) ||
      item.campaigns.join(" ").toLowerCase().includes(keyword);

    const matchChannel = channel === "all" || item.channel === channel;

    return matchKeyword && matchChannel;
  });
}

function renderKpi(data) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalSpend = data.reduce((sum, item) => sum + item.adSpend, 0);

  const best = data.length
    ? data.reduce((prev, curr) => curr.roas > prev.roas ? curr : prev)
    : null;

  document.getElementById("totalProduct").textContent = data.length;
  document.getElementById("totalRevenue").textContent = formatRupiah(totalRevenue);
  document.getElementById("totalSpend").textContent = formatRupiah(totalSpend);
  document.getElementById("bestProduct").textContent = best ? best.product : "-";
}

function renderProductCards(data) {
  const wrapper = document.getElementById("productCards");
  wrapper.innerHTML = "";

  if (!data.length) {
    wrapper.innerHTML = `<div class="empty-state">Data produk kosong.</div>`;
    return;
  }

  data.slice(0, 4).forEach(item => {
    const status = getStatus(item);
    const progress = item.targetRevenue > 0
      ? Math.min((item.revenue / item.targetRevenue) * 100, 100)
      : 0;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-card-top">
        <div>
          <div class="product-title">${item.product}</div>
          <div class="product-meta">${item.campaigns.length} campaign • ${item.channel}</div>
        </div>
        <span class="status ${status.className}">${status.text}</span>
      </div>

      <div class="product-card-value">${formatRupiah(item.revenue)}</div>
      <div class="product-card-sub">ROAS ${item.roas.toFixed(2)}x • Spend ${formatRupiah(item.adSpend)}</div>

      <div class="progress-track">
        <div class="progress-fill ${status.className}" style="width:${progress}%"></div>
      </div>
    `;

    wrapper.appendChild(card);
  });
}

function renderTable(data) {
  const tbody = document.getElementById("productTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:24px;">Data produk tidak ditemukan</td>
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
        <div class="campaign-name">${item.product}</div>
        <div class="product-name">${item.campaigns.length} campaign</div>
      </td>
      <td>${item.campaigns.join(", ")}</td>
      <td><span class="badge ${channelClass}">${item.channel}</span></td>
      <td>${formatRupiah(item.adSpend)}</td>
      <td>${formatRupiah(item.targetRevenue)}</td>
      <td class="${status.className}">${formatRupiah(item.revenue)}</td>
      <td class="${status.className}">${item.roas.toFixed(2)}x</td>
      <td><span class="status ${status.className}">${status.text}</span></td>
    `;

    tbody.appendChild(row);
  });
}

function renderRevenueChart(data) {
  const ctx = document.getElementById("productRevenueChart");

  if (productRevenueChart) productRevenueChart.destroy();

  productRevenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => item.product),
      datasets: [{
        label: "Revenue",
        data: data.map(item => item.revenue),
        backgroundColor: data.map(item => channelColors[item.channel] || channelColors.Unknown),
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
            callback: value => `Rp ${Number(value).toLocaleString("id-ID")}`
          },
          grid: { color: "#24242b" }
        }
      }
    }
  });
}

function renderRoasChart(data) {
  const ctx = document.getElementById("productRoasChart");

  if (productRoasChart) productRoasChart.destroy();

  productRoasChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(item => item.product),
      datasets: [{
        data: data.map(item => item.roas),
        backgroundColor: data.map(item => channelColors[item.channel] || channelColors.Unknown),
        borderColor: "#18181d",
        borderWidth: 4
      }]
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
        }
      }
    }
  });
}

function renderAll() {
  const data = getFilteredProducts();

  renderKpi(data);
  renderProductCards(data);
  renderTable(data);
  renderRevenueChart(data);
  renderRoasChart(data);
}

async function initProductBreakdown() {
  try {
    allProducts = await loadProductData();
    renderAll();
  } catch (err) {
    console.error("Product breakdown error:", err);
    alert(err.message || "Gagal memuat breakdown produk.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("input", renderAll);
  document.getElementById("channelFilter").addEventListener("change", renderAll);
  initProductBreakdown();
});
