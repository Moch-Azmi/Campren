const BASE_URL = "https://camprentelu.azurewebsites.net/api";

async function loadDashboard() {

  try {

    // USER LOGIN
    const userId = 3;

    /* =========================
       GET USER CAMPAIGNS
    ========================= */
    const campaignRes = await fetch(
      `${BASE_URL}/GetUserCampaigns/${userId}`
    );

    if (!campaignRes.ok) {
      throw new Error("Campaign gagal");
    }

    const campaigns = await campaignRes.json();

    if (!campaigns.length) {
      console.log("Campaign kosong");
      return;
    }

    // campaign pertama
    const campaignId = campaigns[0].campaignId;

    console.log("Campaign ID:", campaignId);

    /* =========================
       GET PERFORMANCE REPORT
    ========================= */
    const perfRes = await fetch(
      `${BASE_URL}/PerformanceReport/${campaignId}`
    );

    if (!perfRes.ok) {
      throw new Error("Performance gagal");
    }

    const perfData = await perfRes.json();

    console.log(perfData);

    /* =========================
       GET ROAS
    ========================= */
    const roasRes = await fetch(
      `${BASE_URL}/roas/${campaignId}`
    );

    if (!roasRes.ok) {
      throw new Error("ROAS gagal");
    }

    const roasData = await roasRes.json();

    console.log(roasData);

    /* =========================
       PROCESS DATA
    ========================= */

    const performance = perfData.performance;

    let totalRevenue = 0;
    let totalSpend = 0;

    const labels = [];
    const revenueData = [];
    const spendData = [];

    performance.forEach(item => {

      totalRevenue += item.revenue;
      totalSpend += item.cost;

      labels.push(item.tanggal);
      revenueData.push(item.revenue);
      spendData.push(item.cost);

    });

    /* =========================
       UPDATE KPI
    ========================= */

    document.querySelector(".revenue-val").textContent =
      `Rp ${totalRevenue.toLocaleString("id-ID")}`;

    document.querySelector(".spend-val").textContent =
      `Rp ${totalSpend.toLocaleString("id-ID")}`;

    document.querySelector(".roas-val").textContent =
      `${roasData.roas}x`;

    /* =========================
       UPDATE CHART
    ========================= */

    areaChart.data.labels = labels;

    areaChart.data.datasets[0].data = revenueData;
    areaChart.data.datasets[1].data = spendData;

    areaChart.update();

    /* =========================
       UPDATE DONUT TEXT
    ========================= */

    document.querySelector(".donut-center-val").textContent =
      `${roasData.roas}x`;

    /* =========================
       UPDATE TABLE
    ========================= */

    const tbody = document.querySelector(
      ".campaign-table tbody"
    );

    tbody.innerHTML = "";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="camp-name">
          ${perfData.campaign.namaCampaign}
        </div>

        <div class="camp-sub">
          Campaign ID : ${campaignId}
        </div>
      </td>

      <td>
        <span class="channel-badge tiktok-badge">
          Platform ${perfData.campaign.platformId}
        </span>
      </td>

      <td>
        Rp ${totalSpend.toLocaleString("id-ID")}
      </td>

      <td>
        Rp ${(totalRevenue * 2).toLocaleString("id-ID")}
      </td>

      <td class="revenue-green">
        Rp ${totalRevenue.toLocaleString("id-ID")}
      </td>

      <td>
        4.0x
      </td>

      <td class="roas-orange">
        ${roasData.roas}x
      </td>
    `;

    tbody.appendChild(tr);

  } catch (err) {

    console.error(err);

    alert("API Error");

  }
}

loadDashboard();