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
  return (
    campaign.namaCampaign ||
    campaign.campaignName ||
    campaign.name ||
    "Campaign Tanpa Nama"
  );
}

function normalizePerformance(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.performance)) return raw.performance;
  if (Array.isArray(raw.performanceMetrics)) return raw.performanceMetrics;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
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

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }

  return await res.json();
}

async function loadReportData() {
  const userId = getUserId();

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);

  const result = [];

  for (const campaign of campaigns) {
    const campaignId = campaign.campaignId || campaign.id;

    if (!campaignId) continue;

    try {
      const performanceRaw = await fetchJson(
        `${BASE_URL}/PerformanceReport/${campaignId}`
      );

      const reportCampaign = performanceRaw.campaign || campaign;
      const performanceList = normalizePerformance(performanceRaw);

      const spend = performanceList.reduce((sum, item) => {
        return sum + Number(item.cost || item.spend || item.adSpend || 0);
      }, 0);

      const revenue = performanceList.reduce((sum, item) => {
        return sum + Number(item.revenue || item.income || item.actualRevenue || 0);
      }, 0);

      const roas = spend > 0 ? revenue / spend : 0;

      result.push({
        campaignId,
        campaign: getCampaignName(reportCampaign),
        channel: getChannelName(reportCampaign.platformId || campaign.platformId),
        spend,
        revenue,
        roas,
        date:
          reportCampaign.tanggalMulai ||
          campaign.tanggalMulai ||
          campaign.startDate ||
          ""
      });
    } catch (err) {
      console.error(`Gagal ambil report campaign ${campaignId}:`, err);
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
        <td colspan="6" class="empty">
          Data laporan kosong. API-nya belum ngasih data, bukan CSS-nya yang kesurupan.
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const status = getStatus(item.roas);
    const statusClass = getStatusClass(status);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        ${item.campaign}
        <br>
        <small>ID: ${item.campaignId}</small>
      </td>
      <td>${item.channel}</td>
      <td>${formatRupiah(item.spend)}</td>
      <td>${formatRupiah(item.revenue)}</td>
      <td>${item.roas.toFixed(2)}x</td>
      <td>
        <span class="badge ${statusClass}">
          ${status}
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
    const itemStatus = getStatus(item.roas);

    const matchChannel = channel === "all" || item.channel === channel;
    const matchStatus = status === "all" || itemStatus === status;
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
    alert("Data kosong. Mau export apa, angin?");
    return;
  }

  if (type === "CSV") {
    exportCSV();
  } else {
    window.print();
  }
}

function exportCSV() {
  const header = [
    "Campaign",
    "Channel",
    "Spend",
    "Revenue",
    "ROAS",
    "Status"
  ];

  const rows = filteredData.map(item => [
    item.campaign,
    item.channel,
    item.spend,
    item.revenue,
    item.roas.toFixed(2),
    getStatus(item.roas)
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
  link.download = "campren-export-report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function goBack() {
  window.location.href = "../Dashboard/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadReportData().catch(err => {
    console.error("Export report error:", err);

    const tbody = document.getElementById("reportTable");
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Gagal load data dari API. Cek BASE_URL, endpoint, CORS, atau backend-nya lagi drama.
        </td>
      </tr>
    `;
  });
});