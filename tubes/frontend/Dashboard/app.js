const BASE_URL =
  "https://camprentelu.azurewebsites.net/api";

/* =========================
   PLATFORM MAP
========================= */

const platformMap = {
  1: "Tokopedia",
  2: "YouTube",
  3: "Google",
  4: "TikTok"
};
const badgeClassMap = {

  1: "tokopedia-badge",
  2: "youtube-badge",
  3: "google-badge",
  4: "tiktok-badge"

};

const barClassMap = {

  1: "tokopedia-bar",
  2: "youtube-bar",
  3: "google-bar",
  4: "tiktok-bar"

};

/* =========================
   AREA CHART
========================= */

const areaCanvas =
  document.getElementById("areaChart");

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

          backgroundColor:
            "rgba(52,211,153,0.15)",

          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,

          fill: true,
          backgroundColor: (context) => {

            const ctx = context.chart.ctx;

            const gradient =
              ctx.createLinearGradient(0,0,0,300);

            gradient.addColorStop(
              0,
              "rgba(52,211,153,0.35)"
            );

            gradient.addColorStop(
              1,
              "rgba(52,211,153,0)"
            );

            return gradient;
          },

          tension: 0.4
        },

        {
          label: "Spend",

          data: [],

          borderColor: "#3B82F6",

          backgroundColor:
            "rgba(59,130,246,0.15)",

          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,

          fill: true,
        backgroundColor: (context) => {

          const ctx = context.chart.ctx;

          const gradient =
            ctx.createLinearGradient(0,0,0,300);

          gradient.addColorStop(
            0,
            "rgba(99,102,241,0.35)"
          );

          gradient.addColorStop(
            1,
            "rgba(99,102,241,0)"
          );

          return gradient;
        },

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

/* =========================
   DONUT CHART
========================= */

const donutCanvas =
  document.getElementById("donutChart");

let donutChart = null;

if (donutCanvas) {

  donutChart = new Chart(donutCanvas, {

    type: "doughnut",

    data: {

      labels: ["ROAS", "Remaining"],

      datasets: [{

        data: [0, 5],

        backgroundColor: [
          "#8B5CF6",
          "#1E293B"
        ],

        borderWidth: 0

      }]

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

/* =========================
   DONUT PER CHANNEL
========================= */

const channelTotals = {

  1: {
    revenue: 0,
    spend: 0
  },

  2: {
    revenue: 0,
    spend: 0
  },

  3: {
    revenue: 0,
    spend: 0
  },

  4: {
    revenue: 0,
    spend: 0
  }

};

/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

  try {

    console.log("LOAD DASHBOARD");

    const userData =
      JSON.parse(
        localStorage.getItem("user")
      );

    if (!userData) {

      alert("User belum login");

      return;

    }

    const userId =
      userData.userId ||
      userData.id ||
      3;

    console.log("USER ID:", userId);

    /* =========================
       GET CAMPAIGNS
    ========================= */

    const campaignRes =
      await fetch(
        `${BASE_URL}/GetUserCampaigns/${userId}`
      );

    if (!campaignRes.ok) {

      throw new Error(
        "Gagal ambil campaign"
      );

    }

    const result =
    await campaignRes.json();

    console.log(result);

    const campaigns =
      result.$values ||
      result.data ||
      result;

    console.log("CAMPAIGNS:", campaigns);

    if (!Array.isArray(campaigns) || campaigns.length === 0) {

      alert("Campaign kosong");

      return;

    }

    /* =========================
       INIT
    ========================= */

    let totalRevenue = 0;
    let totalSpend = 0;

    const chartMap = {};

    const tbody =
      document.querySelector(
        ".campaign-table tbody"
      );

    tbody.innerHTML = "";

    const targetRoasList =
      document.getElementById(
        "targetRoasList"
      );

    if (targetRoasList) {

      targetRoasList.innerHTML = "";

    }

    /* =========================
       LOOP CAMPAIGNS
    ========================= */

    for (const campaign of campaigns) {

      try {

        const campaignId =
          campaign.campaignId;

        console.log(
          "PROCESS CAMPAIGN:",
          campaignId
        );

        const [perfRes, roasRes] =
          await Promise.all([

            fetch(
              `${BASE_URL}/PerformanceReport/${campaignId}`
            ),

            fetch(
              `${BASE_URL}/roas/${campaignId}`
            )

          ]);

        if (!perfRes.ok) {

          console.log(
            "Performance error"
          );

          continue;

        }

        if (!roasRes.ok) {

          console.log(
            "ROAS error"
          );

          continue;

        }

        const perfData =
          await perfRes.json();

        const roasData =
          await roasRes.json();

        console.log(perfData);
        console.log(roasData);

        const performance =
  perfData.performance || [];

          /* =========================
            PLATFORM
          ========================= */

          const platformId =

            perfData.campaign?.platformId ||

            perfData.campaign?.platform_id ||

            campaign.platformId ||

            campaign.platform_id ||

            1;

          let campaignRevenue = 0;
          let campaignSpend = 0;

          performance.forEach(item => {

          const revenue =
            Number(item.revenue) || 0;

          const cost =
            Number(item.cost) || 0;

          const tanggal =
            item.tanggal || "-";

          campaignRevenue += revenue;
          campaignSpend += cost;

          totalRevenue += revenue;
          totalSpend += cost;

          if (!channelTotals[platformId]) {

            channelTotals[platformId] = {

            revenue: 0,
            spend: 0

          };

          }

          channelTotals[platformId].revenue += revenue;

          channelTotals[platformId].spend += cost;

          if (!chartMap[tanggal]) {

            chartMap[tanggal] = {

              revenue: 0,
              spend: 0

            };

          }

          chartMap[tanggal].revenue += revenue;
          chartMap[tanggal].spend += cost;

        });

       
        /* =========================
           TABLE
        ========================= */

        const tr =
          document.createElement("tr");

        tr.innerHTML = `

          <td>

            <div class="camp-name">
              ${perfData.campaign?.namaCampaign || "-"}

            </div>

            <div class="camp-sub">

              Campaign ID :
              ${campaignId}

            </div>

          </td>

          <td>

            <span class="channel-badge ${
              badgeClassMap[platformId] || ""
            }">

              ${platformMap[platformId] || "Unknown"}

            </span>

          </td>

          <td>

            Rp ${campaignSpend.toLocaleString("id-ID")}

          </td>

          <td>

            Rp ${campaignRevenue.toLocaleString("id-ID")}

          </td>

          <td class="revenue-green">

            Rp ${campaignRevenue.toLocaleString("id-ID")}

          </td>

          <td>

            ${campaignSpend > 0

              ? (
                  campaignRevenue /
                  campaignSpend
                ).toFixed(2)

              : 0}x

          </td>

          <td class="roas-orange">

            ${Number(
              roasData.roas || 0
            ).toFixed(2)}x

          </td>

        `;

        tbody.appendChild(tr);

        /* =========================
           TARGET ROAS
        ========================= */

        const roasValue =

          campaignSpend > 0

            ? campaignRevenue /
              campaignSpend

            : 0;

        const percent = Math.min(

          (roasValue / 5) * 100,

          100

        );

        const targetItem =
          document.createElement("div");

        targetItem.className =
          "troas-item";

        targetItem.innerHTML = `

          <div class="troas-header">

            <span class="troas-name">

              ${
                platformMap[platformId] ||
                "Platform"
              }

              -

              ${
                perfData.campaign?.namaCampaign ||
                "Campaign"
              }

            </span>

            <span class="troas-val">

              ${roasValue.toFixed(2)}x

            </span>

          </div>

          <div class="troas-bar-wrap">

            <div

              class="troas-bar ${
                barClassMap[platformId] || ""
              }"

              style="width:${percent}%"

            ></div>

          </div>

        `;

        if (targetRoasList) {

          targetRoasList.appendChild(
            targetItem
          );

        }

      }

      catch (err) {

        console.log(
          "ERROR CAMPAIGN:",
          err
        );

      }

    }

    /* =========================
       GRAPH DATA
    ========================= */

    const labels =

      Object.keys(chartMap).sort();

    const revenueData = labels.map(

      label =>
        chartMap[label].revenue

    );

    const spendData = labels.map(

      label =>
        chartMap[label].spend

    );

    console.log("LABELS:", labels);
    console.log("REVENUE:", revenueData);
    console.log("SPEND:", spendData);

    /* =========================
       KPI
    ========================= */

    const spendEl =
      document.querySelector(".spend-val");

    const revenueEl =
      document.querySelector(".revenue-val");

    const roasEl =
      document.querySelector(".roas-val");

    const donutCenter =
      document.querySelector(
        ".donut-center-val"
      );

    if (spendEl) {

      spendEl.textContent =

        `Rp ${totalSpend.toLocaleString("id-ID")}`;

    }

    if (revenueEl) {

      revenueEl.textContent =

        `Rp ${totalRevenue.toLocaleString("id-ID")}`;

    }

    const finalRoas =

      totalSpend > 0

        ? totalRevenue / totalSpend

        : 0;

    if (roasEl) {

      roasEl.textContent =

        `${finalRoas.toFixed(2)}x`;

    }

    if (donutCenter) {

      donutCenter.textContent =

        `${finalRoas.toFixed(2)}x`;

    }

    /* =========================
       ROAS PROGRESS
    ========================= */

    const roasProgress =
      document.getElementById(
        "roasProgress"
      );

    if (roasProgress) {

      const progressWidth =
        Math.min(
          (finalRoas / 5) * 100,
          100
        );

      roasProgress.style.width =
        `${progressWidth}%`;

    }

    /* =========================
       UPDATE AREA CHART
    ========================= */

    if (areaChart) {

      areaChart.data.labels =
        labels;

      areaChart.data.datasets[0].data =
        revenueData;

      areaChart.data.datasets[1].data =
        spendData;

      areaChart.update();

    }

    /* =========================
          DONUT PER CHANNEL
    ========================= */

      const donutData = [];

      const donutLabels = [];

      const donutColors = [];

      const oldLegend =
        document.querySelector(
          ".donut-legend"
        );

      if (oldLegend) {

        oldLegend.remove();

      }

      const donutLegend =
        document.createElement("ul");

      donutLegend.className =
        "donut-legend";

      Object.keys(channelTotals).forEach(

        key => {

          const channel =
            channelTotals[key];

          const roas =

            channel.spend > 0

              ? channel.revenue /
                channel.spend

              : 0;

          if (roas <= 0) return;

          donutData.push(roas);

          donutLabels.push(
            platformMap[key]
          );

          let color = "#A78BFA";

          if (Number(key) === 1) {

            color = "#FBBF24";

          }

          else if (Number(key) === 2) {

            color = "#3B82F6";

          }

          else if (Number(key) === 3) {

            color = "#F87171";

          }

          donutColors.push(color);

        }

      );

      const totalDonut =
        donutData.reduce(
          (a, b) => a + b,
          0
        );

      Object.keys(channelTotals).forEach(

        key => {

          const channel =
            channelTotals[key];

          const roas =

            channel.spend > 0

              ? channel.revenue /
                channel.spend

              : 0;

          if (roas <= 0) return;

          const percent =

            totalDonut > 0

              ? (
                  (roas / totalDonut) * 100
                ).toFixed(0)

              : 0;

          const li =
            document.createElement("li");

          li.innerHTML = `

            <span class="dot ${

              Number(key) === 1
                ? "instagram"

              : Number(key) === 2
                ? "tiktok"

              : Number(key) === 3
                ? "youtube"

              : "tokopedia"

            }"></span>

            ${platformMap[key]}

            <span class="legend-val ${

              Number(key) === 1
                ? "instagram-col"

              : Number(key) === 2
                ? "tiktok-col"

              : Number(key) === 3
                ? "youtube-col"

              : "tokopedia-col"

            }">

              ${roas.toFixed(2)}x

            </span>

            <span class="legend-pct">

              ${percent}%

            </span>

          `;

          donutLegend.appendChild(li);

        }

      );

      const donutWrap =
        document.querySelector(
          ".donut-wrap"
        );

      if (donutWrap) {

        donutWrap.appendChild(
          donutLegend
        );

      }

      if (donutChart) {

        donutChart.data.labels =
          donutLabels;

        donutChart.data.datasets[0].data =
          donutData;

        donutChart.data.datasets[0].backgroundColor =
          donutColors;

        donutChart.update();

      }

    /* =========================
       TARGET %
    ========================= */

    const targetInput =
      document.getElementById(
        "targetRevenue"
      );

    const pencapaian =
      document.getElementById(
        "pencapaianPct"
      );

    if (targetInput && pencapaian) {

      targetInput.addEventListener(

        "input",

        () => {

          const target =
            Number(
              targetInput.value
            ) || 0;

          const percent =

            target > 0

              ? (
                  totalRevenue / target
                ) * 100

              : 0;

          pencapaian.textContent =
            `${percent.toFixed(1)}%`;

        }

      );

    }

  }

  catch (err) {

    console.error(err);

    alert(err.message);

  }

}

document.addEventListener(
  "DOMContentLoaded",
  loadDashboard
);