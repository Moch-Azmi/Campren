const BASE_URL = "https://camprentelu.azurewebsites.net/api";

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

const barClassMap = {
  1: "instagram-bar",
  2: "tiktok-bar",
  3: "youtube-bar"
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

const areaCanvas = document.getElementById("areaChart");
let areaChart = null;

if (areaCanvas) {
  areaChart = new Chart(areaCanvas, {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: "Revenue",
          data: [],
          borderColor: "#34D399",
          backgroundColor: "rgba(52,211,153,0.15)",
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: "Spend",
          data: [],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.15)",
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#8B8FA8"
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        },
        y: {
          ticks: {
            color: "#8B8FA8"
          },
          grid: {
            color: "rgba(255,255,255,0.06)"
          }
        }
      }
    }
  });
}

const donutCanvas = document.getElementById("donutChart");
let donutChart = null;

if (donutCanvas) {
  donutChart = new Chart(donutCanvas, {
    type: "doughnut",

    data: {
      labels: ["No Data"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["#1E293B"],
          borderWidth: 0
        }
      ]
    },

    options: {
      responsive: true,
      cutout: "75%",
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

async function safeJsonFetch(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.warn("API error:", url, text);
      return null;
    }

    if (!text) {
      return null;
    }

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

async function loadDashboard() {
  try {
    console.log("LOAD DASHBOARD");

    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
      alert("User belum login");
      return;
    }

    const userId = userData.userId || userData.id || 3;

    const campaignListResult = await safeJsonFetch(
      `${BASE_URL}/GetUserCampaigns/${userId}`
    );

    const campaigns = normalizeArray(campaignListResult);

    console.log("CAMPAIGNS:", campaigns);

    if (campaigns.length === 0) {
      alert("Campaign kosong");
      return;
    }

    let totalRevenue = 0;
    let totalSpend = 0;

    const chartMap = {};

    const channelTotals = {
      1: { revenue: 0, spend: 0 },
      2: { revenue: 0, spend: 0 },
      3: { revenue: 0, spend: 0 }
    };

    const tbody = document.querySelector(".campaign-table tbody");
    const targetRoasList = document.getElementById("targetRoasList");

    if (tbody) tbody.innerHTML = "";
    if (targetRoasList) targetRoasList.innerHTML = "";

    for (const campaignItem of campaigns) {
      const campaignId = getVal(
        campaignItem,
        ["campaign_id", "campaignId", "CampaignId"],
        null
      );

      if (!campaignId) continue;

      const perfData = await safeJsonFetch(
        `${BASE_URL}/PerformanceReport/${campaignId}`
      );

      const roasData =
        (await safeJsonFetch(`${BASE_URL}/roas/${campaignId}`)) || {};

      const campaignInfo =
        perfData?.campaign || campaignItem || {};

      const performance =
        normalizeArray(perfData?.performance || perfData);

      const campaignName =
        campaignInfo.namaCampaign || "Campaign";

      const platformId =
        campaignInfo.platformId || 1;

      const targetRevenue =
        Number(
          campaignInfo.targetIncome
        ) || 0;

      /* total spend dari cost */
      const campaignSpend =
        performance.reduce(
          (sum,item)=>
            sum + (Number(item.cost)||0),
          0
        );

      /* total revenue */
      const actualRevenue =
        performance.reduce(
          (sum,item)=>
            sum + (Number(item.revenue)||0),
          0
        );

        const roasValue =
        campaignSpend > 0
          ? actualRevenue / campaignSpend
          : 0;

      const apiRoas =
        Number(
          roasData.roas ??
          roasData.Roas ??
          roasData.ROAS ??
          roasValue
        );

      totalRevenue += actualRevenue;
      totalSpend += campaignSpend;

      performance.forEach(item=>{

        const revenue =
          Number(item.revenue)||0;

        const cost =
          Number(item.cost)||0;

        const tanggal =
          item.Tanggal || "-";

        if(!channelTotals[platformId]){

          channelTotals[platformId]={
            revenue:0,
            spend:0
          };

        }

        channelTotals[
          platformId
        ].revenue += revenue;

        channelTotals[
          platformId
        ].spend += cost;

        if(!chartMap[tanggal]){

          chartMap[tanggal]={
            revenue:0,
            spend:0
          };

        }

        chartMap[
          tanggal
        ].revenue += revenue;

        chartMap[
          tanggal
        ].spend += cost;

      });
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="camp-name">${campaignName}</div>
          <div class="camp-sub">Campaign ID : ${campaignId}</div>
        </td>

        <td>
          <span class="channel-badge ${badgeClassMap[platformId] || ""}">
            ${platformMap[platformId] || "Unknown"}
          </span>
        </td>

        <td>
        Rp ${campaignSpend.toLocaleString("id-ID")}
        </td>
        <td>Rp ${targetRevenue.toLocaleString("id-ID")}</td>

        <td class="revenue-green">
          Rp ${actualRevenue.toLocaleString("id-ID")}
        </td>

        <td>${roasValue.toFixed(2)}x</td>

        <td class="roas-orange">
          ${apiRoas.toFixed(2)}x
        </td>
      `;

      if (tbody) tbody.appendChild(tr);

      const percent = Math.min((roasValue / 5) * 100, 100);

      const targetItem = document.createElement("div");
      targetItem.className = "troas-item";

      targetItem.innerHTML = `
        <div class="troas-header">
          <span class="troas-name">
            ${platformMap[platformId] || "Platform"} - ${campaignName}
          </span>

          <span class="troas-val">
            ${roasValue.toFixed(2)}x
          </span>
        </div>

        <div class="troas-bar-wrap">
          <div
            class="troas-bar ${barClassMap[platformId] || ""}"
            style="width:${percent}%"
          ></div>
        </div>
      `;

      if (targetRoasList) {
        targetRoasList.appendChild(targetItem);
      }
    }

    const labels = Object.keys(chartMap).sort();

    if (labels.length === 0) {
      labels.push("-");
      chartMap["-"] = {
        revenue: 0,
        spend: 0
      };
    }

    const revenueData = labels.map(label => chartMap[label].revenue);
    const spendData = labels.map(label => chartMap[label].spend);

    const spendEl = document.querySelector(".spend-val");
    const revenueEl = document.querySelector(".revenue-val");
    const roasEl = document.querySelector(".roas-val");
    const donutCenter = document.querySelector(".donut-center-val");

    if (spendEl) {
      spendEl.textContent = `Rp ${totalSpend.toLocaleString("id-ID")}`;
    }

    if (revenueEl) {
      revenueEl.textContent = `Rp ${totalRevenue.toLocaleString("id-ID")}`;
    }

    const finalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    if (roasEl) {
      roasEl.textContent = `${finalRoas.toFixed(2)}x`;
    }

    if (donutCenter) {
      donutCenter.textContent = `${finalRoas.toFixed(2)}x`;
    }

    const roasProgress = document.getElementById("roasProgress");
    updateAreaChart(chartMap);
    if (roasProgress) {
      roasProgress.style.width =
        `${Math.min((finalRoas / 5) * 100, 100)}%`;
    }

  function updateAreaChart(chartMap) {
  const labels = Object.keys(chartMap).sort();

  if (labels.length === 0) {
    labels.push("-");
    chartMap["-"] = {
      revenue: 0,
      spend: 0
    };
  }

  const revenueData = labels.map(label => chartMap[label].revenue);
  const spendData = labels.map(label => chartMap[label].spend);

  if (areaChart) {
    areaChart.data.labels = labels;
    areaChart.data.datasets[0].data = revenueData;
    areaChart.data.datasets[1].data = spendData;

    areaChart.update();
  }
}

    updateDonutChart(channelTotals);

    const targetInput = document.getElementById("targetRevenue");
    const pencapaian = document.getElementById("pencapaianPct");

    if (targetInput && pencapaian) {
      targetInput.addEventListener("input", () => {
        const target = Number(targetInput.value) || 0;

        const percent =
          target > 0
            ? (totalRevenue / target) * 100
            : 0;

        pencapaian.textContent = `${percent.toFixed(1)}%`;
      });
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  }


function updateDonutChart(channelTotals) {
  const donutData = [];
  const donutLabels = [];
  const donutColors = [];

  const oldLegend = document.querySelector(".donut-legend");

  if (oldLegend) {
    oldLegend.remove();
  }

  const donutLegend = document.createElement("ul");
  donutLegend.className = "donut-legend";

  Object.keys(channelTotals).forEach(key => {
    const channel = channelTotals[key];

    const roas =
      channel.spend > 0
        ? channel.revenue / channel.spend
        : 0;

    if (roas <= 0) return;

    donutData.push(roas);
    donutLabels.push(platformMap[key] || "Unknown");

    let color = "#A78BFA";

    if (Number(key) === 1) color = "#FBBF24";
    else if (Number(key) === 2) color = "#3B82F6";
    else if (Number(key) === 3) color = "#F87171";

    donutColors.push(color);

    const li = document.createElement("li");

    li.innerHTML = `
      <span class="dot ${
        Number(key) === 1
          ? "instagram"
          : Number(key) === 2
          ? "tiktok"
          : "youtube"
      }"></span>

      ${platformMap[key] || "Unknown"}

      <span class="legend-val ${
        Number(key) === 1
          ? "instagram-col"
          : Number(key) === 2
          ? "tiktok-col"
          : "youtube-col"
      }">
        ${roas.toFixed(2)}x
      </span>
    `;

    donutLegend.appendChild(li);
  });

  const donutWrap = document.querySelector(".donut-wrap");

  if (donutWrap) {
    donutWrap.appendChild(donutLegend);
  }

  if (donutChart) {
    donutChart.data.labels =
      donutLabels.length > 0 ? donutLabels : ["No Data"];

    donutChart.data.datasets[0].data =
      donutData.length > 0 ? donutData : [1];

    donutChart.data.datasets[0].backgroundColor =
      donutColors.length > 0 ? donutColors : ["#1E293B"];

    donutChart.update();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();

  setInterval(() => {
    loadDashboard();
  }, 5000);
});
}
