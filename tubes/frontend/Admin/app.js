const BASE_URL = "https://camprentelyu.azurewebsites.net/api";

const platformMap = {
  1: "Instagram",
  2: "Tiktok",
  3: "Youtube"
};

const badgeClassMap = {
  1: "instagram-badge",
  2: "tiktok-badge",
  3: "youtube-badge"
};

function getVal(obj, keys, fallback = 0) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return fallback;
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  if (Array.isArray(data?.performance)) return data.performance;
  if (Array.isArray(data?.performance?.$values)) return data.performance.$values;
  if (Array.isArray(data?.Performance)) return data.Performance;
  if (Array.isArray(data?.Performance?.$values)) return data.Performance.$values;
  return [];
}

function formatDate(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  const dateText = value.toString();
  return dateText.includes("T") ? dateText.split("T")[0] : dateText;
}

async function safeJsonFetch(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) {
      console.warn("API error:", url, text);
      return null;
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn("Response bukan JSON:", url, text);
      return null;
    }
  } catch (err) {
    console.error("Fetch gagal:", url, err);
    return null;
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

async function loadAdminDashboard() {
  const tbody = document.getElementById("adminCampaignsTableBody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; font-family: var(--font); color: var(--text-secondary);">Mengambil data campaigns system...</td></tr>`;
  }

  try {
    // 1. Fetch all campaign IDs
    const allCampaignsRaw = await safeJsonFetch(`${BASE_URL}/GetAllCampaigns`);
    const campaignsList = normalizeArray(allCampaignsRaw);
    console.log("All Campaigns List:", campaignsList);

    if (campaignsList.length === 0) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; font-family: var(--font); color: var(--text-secondary);">Tidak ada campaign dalam sistem.</td></tr>`;
      }
      return;
    }

    document.getElementById("totalCampaigns").textContent = campaignsList.length;

    let overallRevenue = 0;
    let overallSpend = 0;
    let loadedCount = 0;

    if (tbody) tbody.innerHTML = "";

    // 2. Loop through all campaigns and fetch details
    for (const item of campaignsList) {
      const campaignId = getVal(item, ["campaignId", "campaign_id", "CampaignId"], null);
      if (!campaignId) continue;

      try {
        const perfData = await safeJsonFetch(`${BASE_URL}/PerformanceReport/${campaignId}`);
        const roasData = await safeJsonFetch(`${BASE_URL}/roas/${campaignId}`) || {};
        
        const campaignInfo = perfData?.campaign || item || {};
        const performance = normalizeArray(perfData?.performance || perfData);

        const campaignName = campaignInfo.namaCampaign || campaignInfo.nama_campaign || "Campaign";
        const userId = campaignInfo.userId || campaignInfo.user_id || "-";
        const platformId = campaignInfo.platformId || campaignInfo.platform_id || 1;
        
        const budget = Number(campaignInfo.budget) || 0;
        const tanggalMulai = formatDate(getVal(campaignInfo, ["tanggalAwal", "tanggalMulai", "TanggalAwal", "tanggal_awal", "tanggal_mulai"], "-"));
        const tanggalAkhir = formatDate(getVal(campaignInfo, ["tanggalAkhir", "TanggalAkhir", "tanggal_akhir"], "-"));

        // Sum spend & revenue from performance list
        const campaignSpend = performance.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);
        const actualRevenue = performance.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);

        const roasValue = campaignSpend > 0 ? actualRevenue / campaignSpend : 0;
        const apiRoas = Number(roasData.roas ?? roasData.Roas ?? roasData.ROAS ?? roasValue);

        overallRevenue += actualRevenue;
        overallSpend += campaignSpend;
        loadedCount++;

        // Determine Status based on end date
        let statusHtml = '<span class="status-badge active">Active</span>';
        if (tanggalAkhir !== "-") {
          const today = new Date();
          today.setHours(0,0,0,0);
          const end = new Date(tanggalAkhir);
          if (!isNaN(end.getTime()) && end < today) {
            statusHtml = '<span class="status-badge completed">Completed</span>';
          }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div class="camp-name">${campaignName}</div>
            <div class="camp-sub">Campaign ID : ${campaignId}</div>
          </td>
          <td>
            <span class="user-id-badge">User ID: ${userId}</span>
          </td>
          <td>
            <span class="channel-badge ${badgeClassMap[platformId] || ""}">
              ${platformMap[platformId] || "Unknown"}
            </span>
          </td>
          <td>${tanggalMulai}</td>
          <td>${tanggalAkhir}</td>
          <td>Rp ${budget.toLocaleString("id-ID")}</td>
          <td>Rp ${campaignSpend.toLocaleString("id-ID")}</td>
          <td class="revenue-green">Rp ${actualRevenue.toLocaleString("id-ID")}</td>
          <td class="roas-orange">${apiRoas.toFixed(2)}x</td>
          <td>${statusHtml}</td>
        `;

        if (tbody) tbody.appendChild(tr);

      } catch (innerErr) {
        console.error(`Gagal memuat campaign ${campaignId}:`, innerErr);
      }
    }

    // Update Overall KPI values
    document.getElementById("totalSpend").textContent = `Rp ${overallSpend.toLocaleString("id-ID")}`;
    document.getElementById("totalRevenue").textContent = `Rp ${overallRevenue.toLocaleString("id-ID")}`;
    
    const overallAvgRoas = overallSpend > 0 ? overallRevenue / overallSpend : 0;
    document.getElementById("avgRoas").textContent = `${overallAvgRoas.toFixed(2)}x`;

    showToast("Dashboard Admin berhasil dimuat!", "success");

  } catch (err) {
    console.error(err);
    showToast("Gagal memuat data dashboard Admin.", "error");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; font-family: var(--font); color: var(--accent-red);">Terjadi masalah saat mengambil data. Silakan muat ulang.</td></tr>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Check auth & role
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.replace("../Login/index.html");
    return;
  }

  const user = JSON.parse(userStr);
  if (Number(user.roleId) !== 2) {
    // Restricted access presentation
    const mainNode = document.querySelector("body");
    if (mainNode) {
      mainNode.innerHTML = `
        <div class="auth-state-host" style="width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #111217;">
          <section class="auth-state-card" role="status" aria-live="polite">
            <div class="auth-state-glow"></div>
            <div class="auth-state-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
                stroke-linejoin="round" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
              </svg>
            </div>
            <div class="auth-state-eyebrow">AKSES TERBATAS</div>
            <h2 class="auth-state-title">Akses Khusus Admin</h2>
            <p class="auth-state-message">Maaf, akun Anda tidak memiliki akses ke panel admin CAMPREN.</p>
            <div class="auth-state-actions">
              <a class="auth-state-button primary" href="../Login/index.html">
                Kembali ke Login
              </a>
            </div>
          </section>
        </div>
      `;
    }
    return;
  }

  loadAdminDashboard();
});
