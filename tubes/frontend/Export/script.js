const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

let reportData = [];
let filteredData = [];
let isLoaded = false;

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

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Respons API bukan JSON valid: ${url}`);
  }
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

  if (!userId) {
    throw new Error("User belum login");
  }

  const campaigns = await fetchJson(`${BASE_URL}/GetUserCampaigns/${userId}`);

  const result = [];

  for (const item of campaigns) {
    const campaignId = item.campaignId || item.id;

    if (!campaignId) continue;

    try {
      const report = await fetchJson(`${BASE_URL}/PerformanceReport/${campaignId}`);
      const campaign = report.campaign;
      const performance = report.performance || [];

      if (!campaign) continue;

    const spend = performance.reduce((sum, p) => {
      return sum + Number(p.cost || 0);
    }, 0);

    const revenue = performance.reduce((sum, p) => {
      return sum + Number(p.revenue || 0);
    }, 0);

    const impressions = performance.reduce((sum, p) => {
      return sum + Number(p.impression || p.impressions || 0);
    }, 0);

    const clicks = performance.reduce((sum, p) => {
      return sum + Number(p.clicks || 0);
    }, 0);

    const conversions = performance.reduce((sum, p) => {
      return sum + Number(p.conversions || 0);
    }, 0);

    let roas = spend > 0 ? revenue / spend : 0;
    let ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    let cpc = clicks > 0 ? spend / clicks : 0;

    try {
      const metrics = await fetchJson(`${BASE_URL}/roas/${campaignId}`);

      console.log(`METRICS ${campaignId}:`, metrics);

      roas = Number(metrics.roas ?? roas);
      ctr = Number(metrics.ctr ?? ctr);
      cpc = Number(metrics.cpc ?? cpc);
    } catch (err) {
      console.warn(`Metrics API gagal untuk campaign ${campaignId}, pakai hitungan manual.`);
    }

      result.push({
        campaignId,
        campaign: campaign.namaCampaign || "Campaign Tanpa Nama",
        channel: getChannelName(campaign.platformId),
        targetViews: Number(campaign.targetViews || 0),
        targetClicks: Number(campaign.targetClicks || 0),
        targetIncome: Number(campaign.targetIncome || 0),
        spend,
        revenue,
        impressions,
        clicks,
        conversions,
        roas,
        ctr,
        cpc,
        status: getStatus(roas),
        startDate: String(campaign.tanggalMulai || campaign.tanggalAwal || "").split("T")[0],
        endDate: String(campaign.tanggalAkhir || "").split("T")[0]
      });
    } catch (error) {
      console.error(`Campaign ${campaignId} gagal dimuat:`, error);
    }
  }

  reportData = result;
  filteredData = [...reportData];
  isLoaded = true;

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
        <td colspan="12" class="empty">
          Data laporan kosong. Campaign ada, tapi report gagal kebaca.
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
      <td>${formatRupiah(item.targetIncome)}</td>
      <td>${formatRupiah(item.spend)}</td>
      <td>${formatRupiah(item.revenue)}</td>
      <td>${item.impressions.toLocaleString("id-ID")}</td>
      <td>${item.clicks.toLocaleString("id-ID")}</td>
      <td>${item.conversions.toLocaleString("id-ID")}</td>
      <td>${item.ctr.toFixed(2)}%</td>
      <td>${formatRupiah(item.cpc)}</td>
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
    const matchStartDate = !startDate || !item.endDate || item.endDate >= startDate;
    const matchEndDate = !endDate || !item.startDate || item.startDate <= endDate;

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
  if (!isLoaded) {
    alert("Data masih dimuat. Silakan tunggu.");
    return;
  }

  if (!filteredData.length) {
    alert("Tidak ada data untuk diekspor.");
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
    "Target Income",
    "Spend",
    "Revenue",
    "Impressions",
    "Clicks",
    "Conversions",
    "CTR",
    "CPC",
    "ROAS",
    "Status"
  ];

  const rows = filteredData.map(item => [
    item.campaign,
    item.channel,
    item.targetIncome,
    item.spend,
    item.revenue,
    item.impressions,
    item.clicks,
    item.conversions,
    `${item.ctr.toFixed(2)}%`,
    item.cpc.toFixed(2),
    `${item.roas.toFixed(2)}x`,
    item.status
  ]);

  const isExcel = type === "Excel";
  const delimiter = isExcel ? "\t" : ",";
  const escapeValue = value => {
    const text = String(value ?? "");

    if (isExcel) {
      return text.replace(/\t|\r?\n/g, " ");
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    header.map(escapeValue).join(delimiter),
    ...rows.map(row => row.map(escapeValue).join(delimiter))
  ].join("\r\n");

  const blob = new Blob([csvContent], {
    type: isExcel
      ? "application/vnd.ms-excel;charset=utf-8;"
      : "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = isExcel
    ? "campren-export-report.xls"
    : "campren-export-report.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function goBack() {
  window.location.href = "../Dashboard/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!CamprenPageState.requireLogin(
    ".page",
    "Masuk ke akun CAMPREN untuk membuat dan mengunduh laporan campaign."
  )) {
    return;
  }

  loadReportData().catch(err => {
    console.error("EXPORT ERROR:", err);

    isLoaded = true;
    CamprenPageState.showLoadError(
      ".page",
      "Laporan belum bisa dimuat. Periksa koneksi lalu coba lagi."
    );
  });
});
