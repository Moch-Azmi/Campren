const trackingData = [
  {
    campaign: "Ramadhan Sale - Handphones",
    product: "Samsung S24 Ultra",
    channel: "Tokopedia",
    adSpend: 1,
    targetRevenue: 4,
    revenue: 5,
    targetRoas: 4.0,
    roas: 4.1
  },
  {
    campaign: "Christmas Sale - Earbuds",
    product: "Airpods",
    channel: "Tiktok",
    adSpend: 2,
    targetRevenue: 10,
    revenue: 10,
    targetRoas: 4.1,
    roas: 5.0
  },
  {
    campaign: "Chinese New Year - Laptop",
    product: "Acer Swift X-14",
    channel: "Instagram",
    adSpend: 4,
    targetRevenue: 5,
    revenue: 10,
    targetRoas: 3.1,
    roas: 2.5
  }
];

const channelColors = {
  Tokopedia: "#8b5cf6",
  Tiktok: "#3b82f6",
  Instagram: "#ec4899"
};

function formatRupiahJt(value) {
  return `Rp. ${value}jt`;
}

function getStatus(item) {
  if (item.roas >= item.targetRoas) {
    return {
      text: "Above Target",
      className: "good"
    };
  }

  if (item.roas >= item.targetRoas * 0.8) {
    return {
      text: "Need Watch",
      className: "warning"
    };
  }

  return {
    text: "Below Target",
    className: "bad"
  };
}

function renderKpi() {
  const totalSpend = trackingData.reduce((sum, item) => sum + item.adSpend, 0);
  const totalRevenue = trackingData.reduce((sum, item) => sum + item.revenue, 0);
  const totalRoas = totalRevenue / totalSpend;

  const best = trackingData.reduce((prev, curr) => {
    return curr.roas > prev.roas ? curr : prev;
  });

  document.getElementById("totalSpend").textContent = formatRupiahJt(totalSpend);
  document.getElementById("totalRevenue").textContent = formatRupiahJt(totalRevenue);
  document.getElementById("totalRoas").textContent = `${totalRoas.toFixed(2)}x`;
  document.getElementById("bestChannel").textContent = best.channel;
}

function renderTable() {
  const tbody = document.getElementById("trackingTable");
  tbody.innerHTML = "";

  trackingData.forEach(item => {
    const status = getStatus(item);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="campaign-name">${item.campaign}</div>
        <div class="product-name">${item.product}</div>
      </td>
      <td>
        <span class="badge ${item.channel.toLowerCase()}">
          ${item.channel}
        </span>
      </td>
      <td>${formatRupiahJt(item.adSpend)}</td>
      <td>${formatRupiahJt(item.targetRevenue)}</td>
      <td class="${status.className}">${formatRupiahJt(item.revenue)}</td>
      <td>${item.targetRoas.toFixed(1)}x</td>
      <td class="${status.className}">${item.roas.toFixed(1)}x</td>
      <td>
        <span class="status ${status.className}">
          ${status.text}
        </span>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function renderRoasChart() {
  const ctx = document.getElementById("roasChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: trackingData.map(item => item.channel),
      datasets: [
        {
          label: "ROAS",
          data: trackingData.map(item => item.roas),
          backgroundColor: trackingData.map(item => channelColors[item.channel]),
          borderRadius: 10
        },
        {
          label: "Target ROAS",
          data: trackingData.map(item => item.targetRoas),
          backgroundColor: "#3f3f46",
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#d4d4d8"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#a1a1aa"
          },
          grid: {
            color: "#24242b"
          }
        },
        y: {
          ticks: {
            color: "#a1a1aa",
            callback: value => `${value}x`
          },
          grid: {
            color: "#24242b"
          }
        }
      }
    }
  });
}

function renderRevenueChart() {
  const ctx = document.getElementById("revenueChart");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: trackingData.map(item => item.channel),
      datasets: [
        {
          data: trackingData.map(item => item.revenue),
          backgroundColor: trackingData.map(item => channelColors[item.channel]),
          borderColor: "#18181d",
          borderWidth: 4
        }
      ]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#d4d4d8",
            padding: 18
          }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderKpi();
  renderTable();
  renderRoasChart();
  renderRevenueChart();
});