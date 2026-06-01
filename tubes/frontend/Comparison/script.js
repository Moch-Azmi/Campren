const comparisonData = [
  {
    campaign: "Ramadhan Sale",
    channel: "Tokopedia",
    targetRevenue: 4000000,
    actualRevenue: 5200000
  },
  {
    campaign: "Christmas Sale",
    channel: "Instagram",
    targetRevenue: 3500000,
    actualRevenue: 2800000
  },
  {
    campaign: "Flash Sale Gadget",
    channel: "TikTok",
    targetRevenue: 6000000,
    actualRevenue: 6100000
  },
  {
    campaign: "Promo Akhir Bulan",
    channel: "YouTube",
    targetRevenue: 5000000,
    actualRevenue: 3900000
  }
];

const formatRupiah = (value) => {
  return "Rp" + value.toLocaleString("id-ID");
};

function loadSummary() {
  const totalTarget = comparisonData.reduce((sum, item) => sum + item.targetRevenue, 0);
  const totalActual = comparisonData.reduce((sum, item) => sum + item.actualRevenue, 0);
  const achievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  document.getElementById("targetRevenue").textContent = formatRupiah(totalTarget);
  document.getElementById("actualRevenue").textContent = formatRupiah(totalActual);
  document.getElementById("achievement").textContent = achievement.toFixed(1) + "%";

  const statusText = document.getElementById("statusText");

  if (achievement >= 100) {
    statusText.textContent = "Tercapai";
    statusText.className = "success";
  } else if (achievement >= 75) {
    statusText.textContent = "Hampir";
    statusText.className = "warning";
  } else {
    statusText.textContent = "Kurang";
    statusText.className = "danger";
  }
}

function loadChart() {
  const ctx = document.getElementById("comparisonChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: comparisonData.map(item => item.campaign),
      datasets: [
        {
          label: "Target Revenue",
          data: comparisonData.map(item => item.targetRevenue),
          borderRadius: 10
        },
        {
          label: "Aktual Revenue",
          data: comparisonData.map(item => item.actualRevenue),
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#d7defa"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#aab3d6" },
          grid: { color: "rgba(255,255,255,0.06)" }
        },
        y: {
          ticks: {
            color: "#aab3d6",
            callback: value => "Rp" + value / 1000000 + "jt"
          },
          grid: { color: "rgba(255,255,255,0.06)" }
        }
      }
    }
  });
}

function loadProgress() {
  const progressList = document.getElementById("progressList");
  progressList.innerHTML = "";

  comparisonData.forEach(item => {
    const percent = item.targetRevenue > 0
      ? (item.actualRevenue / item.targetRevenue) * 100
      : 0;

    const progressWidth = Math.min(percent, 100);

    progressList.innerHTML += `
      <div class="progress-item">
        <div class="progress-info">
          <span>${item.campaign}</span>
          <strong>${percent.toFixed(1)}%</strong>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${progressWidth}%"></div>
        </div>

        <small>${formatRupiah(item.actualRevenue)} / ${formatRupiah(item.targetRevenue)}</small>
      </div>
    `;
  });
}

function loadTable() {
  const tbody = document.getElementById("comparisonTable");
  tbody.innerHTML = "";

  comparisonData.forEach(item => {
    const diff = item.actualRevenue - item.targetRevenue;
    const percent = item.targetRevenue > 0
      ? (item.actualRevenue / item.targetRevenue) * 100
      : 0;

    let status = "Kurang";
    let badge = "badge danger";

    if (percent >= 100) {
      status = "Tercapai";
      badge = "badge success";
    } else if (percent >= 75) {
      status = "Hampir";
      badge = "badge warning";
    }

    tbody.innerHTML += `
      <tr>
        <td>${item.campaign}</td>
        <td>${item.channel}</td>
        <td>${formatRupiah(item.targetRevenue)}</td>
        <td>${formatRupiah(item.actualRevenue)}</td>
        <td class="${diff >= 0 ? "success" : "danger"}">
          ${diff >= 0 ? "+" : ""}${formatRupiah(diff)}
        </td>
        <td>${percent.toFixed(1)}%</td>
        <td><span class="${badge}">${status}</span></td>
      </tr>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSummary();
  loadChart();
  loadProgress();
  loadTable();
});