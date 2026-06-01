const BASE_URL = "https://camprentelu.azurewebsites.net/api";

let reportData = [];
let filteredData = [];

function getUserId() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.userId || user.id || 3;
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
    1: "Tokopedia",
    2: "Youtube",
    3: "Google",
    4: "Tiktok",
    5: "Instagram"
  };

  return map[platformId] || "Unknown";
}

function getCampaignName(campaign) {
  return campaign.namaCampaign || campaign.campaignName || campaign.name || "Campaign Tanpa Nama";
}

function normalizePerformance(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.performance)) return raw.performance;
  if (Array.isArray(raw.performanceMetrics)) return raw.performanceMetrics;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
}

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }

  return await res.json();
}

function getRevenue(item) {
  return Number(
    item.revenue ||
    item.income ||
    item.actualRevenue ||
    item.totalRevenue ||
    0
  );
}

function getSpend(item) {
  return Number(
    item.cost ||
    item.spend ||
    item.adSpend ||
    item.totalSpend ||
    item.budgetUsed ||
    0
  );
}

function getViews(item) {
  return Number(item.views || item.view || item.impression || item.impressions || 0);
}

function getClicks(item) {
  return Number(item.clicks || item.click || 0);
}

function getStatus(roas) {
  if (roas >= 4) return "Good";
  if (roas >= 2.5) return "Warning";
  return "Bad";
}

function getStatusClass(status) {
  if (status === "Good") return "good";
  if (status === "Warning") return "warning";
  return "bad";
}

async function loadReportData() {
  const userId = getUserId();

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);

  const result = [];

  for (const campaign of campaigns) {
    const campaignId = campaign.campaignId || campaign.id;
    if (!campaignId) continue;

    try {
      const performanceRaw = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);
      const performanceList = normalizePerformance(performanceRaw);
      const reportCampaign = performanceRaw.campaign || campaign;

      const spend = performanceList.reduce((sum, item) => sum + getSpend(item), 0);
      const revenue = performanceList.reduce((sum, item) => sum + getRevenue(item), 0);
      const views = performanceList.reduce((sum, item) => sum + getViews(item), 0);
      const clicks = performanceList.reduce((sum, item) => sum + getClicks(item), 0);

      let roas = spend > 0 ? revenue / spend : 0;

      try {
        const roasRaw = await fetchJson(`${BASE_URL}/roas/${campaignId}`);
        roas = Number(roasRaw.roas || roasRaw.value || roasRaw || roas);
      } catch {
        console.warn(`ROAS API campaign ${campaignId} gagal, pakai hitungan manual.`);
      }

      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      result.push({
        campaignId,
        campaign: getCampaignName(reportCampaign),
        channel: getChannelName(reportCampaign.platformId || campaign.platformId),
        budget: Number(reportCampaign.budget || campaign.budget || 0),
        targetRevenue: Number(reportCampaign.targetIncome || reportCampaign.targetRevenue || campaign.targetIncome || campaign.targetRevenue || 0),
        spend,
        revenue,
        views,
        clicks,
        ctr,
        roas,
        status: getStatus(roas),
        date: reportCampaign.tanggalMulai || campaign.tanggalMulai || campaign.startDate || ""
      });

    } catch (err) {
      console.error(`Gagal ambil PerformanceReport campaign ${campaignId}:`, err);
    }
  }

  reportData = result;
  filteredData = [...reportData];

  renderKPI(filteredData);
  renderTable(filteredData);
}

function renderKPI(data) {
  const totalCampaign = data.length;
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  document.getElementById("totalCampaign").textContent = totalCampaign;
  document.getElementById("totalRevenue").textContent = formatRupiah(totalRevenue);
  document.getElementById("totalSpend").textContent = formatRupiah(totalSpend);
  document.getElementById("avgRoas").textContent = `${avgRoas.toFixed(2)}x`;
}

function renderTable(data) {
  const tbody = document.getElementById("reportTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty">
          Data laporan kosong. Kalau campaign ada tapi kosong, berarti PerformanceReport-nya belum ngasih data.
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const statusClass = getStatusClass(item.status);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.campaign}</td>
      <td>${item.channel}</td>
      <td>${formatRupiah(item.budget)}</td>
      <td>${formatRupiah(item.targetRevenue)}</td>
      <td>${formatRupiah(item.spend)}</td>
      <td>${formatRupiah(item.revenue)}</td>
      <td>${item.views.toLocaleString("id-ID")}</td>
      <td>${item.clicks.toLocaleString("id-ID")}</td>
      <td>${item.ctr.toFixed(2)}%</td>
      <td>${item.roas.toFixed(2)}x</td>
      <td>
        <span class="badge ${statusClass}">
          ${item.status}
        </span>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function applyFilter() {
  const channel = document.getElementById("channelFilter").value;
  const status = document.getElementById("statusFilter").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  filteredData = reportData.filter(item => {
    const matchChannel = channel === "all" || item.channel === channel;
    const matchStatus = status === "all" || item.status === status;
    const matchStartDate = !startDate || !item.date || item.date >= startDate;
    const matchEndDate = !endDate || !item.date || item.date <= endDate;

    return matchChannel && matchStatus && matchStartDate && matchEndDate;
  });

  renderKPI(filteredData);
  renderTable(filteredData);
}

function resetFilter() {
  document.getElementById("channelFilter").value = "all";
  document.getElementById("statusFilter").value = "all";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";

  filteredData = [...reportData];

  renderKPI(filteredData);
  renderTable(filteredData);
}

function exportReport(type) {
  if (!filteredData.length) {
    alert("Data kosong. Mau export apa, kesedihan?");
    return;
  }

  if (type === "CSV" || type === "Excel") {
    exportCSV(type);
    return;
  }

  window.print();
}

function exportCSV(type) {
  const header = [
    "Campaign",
    "Channel",
    "Budget",
    "Target Revenue",
    "Spend",
    "Revenue",
    "Views",
    "Clicks",
    "CTR",
    "ROAS",
    "Status"
  ];

  const rows = filteredData.map(item => [
    item.campaign,
    item.channel,
    item.budget,
    item.targetRevenue,
    item.spend,
    item.revenue,
    item.views,
    item.clicks,
    `${item.ctr.toFixed(2)}%`,
    `${item.roas.toFixed(2)}x`,
    item.status
  ]);

  const csvContent = [
    header.join(","),
    ...rows.map(row => row.map(value => `"${value}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = type === "Excel"
    ? "campren-export-report.xls"
    : "campren-export-report.csv";

  link.click();
  URL.revokeObjectURL(url);
}

function goBack() {
  window.location.href = "../Dashboard/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadReportData().catch(err => {
    console.error("Export Report Error:", err);

    document.getElementById("reportTable").innerHTML = `
      <tr>
        <td colspan="10" class="empty">
          Gagal load data dari API. Cek BASE_URL, CORS, endpoint, atau backend lu lagi ngambek.
        </td>
      </tr>
    `;
  });
});