const BASE_URL =
  "https://camprentelu.azurewebsites.net/api";

/* =========================
   AREA CHART
========================= */

const areaCtx =
  document
    .getElementById("areaChart")
    .getContext("2d");

const areaChart =
  new Chart(areaCtx, {

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

          tension: 0.4,

          fill: true
        },

        {
          label: "Spend",

          data: [],

          borderColor: "#3B82F6",

          backgroundColor:
            "rgba(59,130,246,0.15)",

          tension: 0.4,

          fill: true
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
            color: "rgba(255,255,255,0.05)"
          }

        },

        y: {

          ticks: {
            color: "#8B8FA8"
          },

          grid: {
            color: "rgba(255,255,255,0.05)"
          }

        }

      }

    }

  });

/* =========================
   DONUT CHART
========================= */

const donutCtx =
  document
    .getElementById("donutChart")
    .getContext("2d");

const donutChart =
  new Chart(donutCtx, {

    type: "doughnut",

    data: {

      labels: [
        "ROAS",
        "Remaining"
      ],

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

      cutout: "75%",

      plugins: {

        legend: {
          display: false
        }

      }

    }

  });

/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

  try {

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

    /* =========================
       GET CAMPAIGNS
    ========================= */

    const campaignRes =
      await fetch(
        `${BASE_URL}/GetUserCampaigns/${userId}`
      );

    const campaigns =
      await campaignRes.json();

    if (!campaigns.length) {

      alert("Campaign kosong");

      return;

    }

    /* =========================
       LOOP SEMUA CAMPAIGN
    ========================= */

    let totalRevenue = 0;

    let totalSpend = 0;

    let allLabels = [];

    let allRevenue = [];

    let allSpend = [];

    const tbody =
      document.querySelector(
        ".campaign-table tbody"
      );

    tbody.innerHTML = "";

    for (const campaign of campaigns) {

      const campaignId =
        campaign.campaignId;

      const [perfRes, roasRes] =
        await Promise.all([

          fetch(
            `${BASE_URL}/PerformanceReport/${campaignId}`
          ),

          fetch(
            `${BASE_URL}/roas/${campaignId}`
          )

        ]);

      const perfData =
        await perfRes.json();

      const roasData =
        await roasRes.json();

      const performance =
        perfData.performance || [];

      let campaignRevenue = 0;

      let campaignSpend = 0;

      performance.forEach(item => {

        const revenue =
          Number(item.revenue) || 0;

        const cost =
          Number(item.cost) || 0;

        campaignRevenue += revenue;

        campaignSpend += cost;

        totalRevenue += revenue;

        totalSpend += cost;

        allLabels.push(
          item.tanggal || "-"
        );

        allRevenue.push(revenue);

        allSpend.push(cost);

      });

      const tr =
        document.createElement("tr");

      tr.innerHTML = `

        <td>
          <div class="camp-name">
            ${perfData.campaign?.namaCampaign || "-"}
          </div>

          <div class="camp-sub">
            Campaign ID : ${campaignId}
          </div>
        </td>

        <td>
          <span class="channel-badge tiktok-badge">
            Platform ${perfData.campaign?.platformId || "-"}
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
            ? (campaignRevenue / campaignSpend).toFixed(2)
            : 0}x
        </td>

        <td class="roas-orange">
          ${Number(roasData.roas || 0).toFixed(2)}x
        </td>

      `;

      tbody.appendChild(tr);

    }

    /* =========================
       UPDATE KPI
    ========================= */

    document.querySelector(
      ".revenue-val"
    ).textContent =
      `Rp ${totalRevenue.toLocaleString("id-ID")}`;

    document.querySelector(
      ".spend-val"
    ).textContent =
      `Rp ${totalSpend.toLocaleString("id-ID")}`;

    const finalRoas =
      totalSpend > 0
        ? totalRevenue / totalSpend
        : 0;

    document.querySelector(
      ".roas-val"
    ).textContent =
      `${finalRoas.toFixed(2)}x`;

    document.querySelector(
      ".donut-center-val"
    ).textContent =
      `${finalRoas.toFixed(2)}x`;

    /* =========================
       UPDATE AREA CHART
    ========================= */

    areaChart.data.labels =
      allLabels;

    areaChart.data.datasets[0].data =
      allRevenue;

    areaChart.data.datasets[1].data =
      allSpend;

    areaChart.update();

    /* =========================
       UPDATE DONUT
    ========================= */

    donutChart.data.datasets[0].data =
      [
        finalRoas,
        Math.max(5 - finalRoas, 0)
      ];

    donutChart.update();

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

    targetInput.addEventListener(
      "input",

      () => {

        const target =
          Number(targetInput.value) || 0;

        const percent =
          target > 0
            ? (totalRevenue / target) * 100
            : 0;

        pencapaian.textContent =
          `${percent.toFixed(1)}%`;

      }

    );

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