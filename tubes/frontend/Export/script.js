const reportData = [
  {
    campaign: "Ramadhan Sale",
    channel: "Tiktok",
    spend: 1200000,
    revenue: 5800000,
    roas: 4.8,
    date: "2026-05-01"
  },
  {
    campaign: "Samsung Launch",
    channel: "Youtube",
    spend: 2100000,
    revenue: 7200000,
    roas: 3.4,
    date: "2026-05-03"
  },
  {
    campaign: "Tokopedia Flash Sale",
    channel: "Tokopedia",
    spend: 900000,
    revenue: 4500000,
    roas: 5.0,
    date: "2026-05-08"
  },
  {
    campaign: "Google Ads Awareness",
    channel: "Google",
    spend: 1500000,
    revenue: 2500000,
    roas: 1.7,
    date: "2026-05-12"
  },
  {
    campaign: "Instagram Fashion Ads",
    channel: "Instagram",
    spend: 800000,
    revenue: 2800000,
    roas: 3.5,
    date: "2026-05-15"
  }
];

let filteredData = [...reportData];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
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

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Data tidak ditemukan. Filter lu terlalu brutal, santai dikit.
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
      <td>${item.campaign}</td>
      <td>${item.channel}</td>
      <td>${formatRupiah(item.spend)}</td>
      <td>${formatRupiah(item.revenue)}</td>
      <td>${item.roas.toFixed(1)}x</td>
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
    const matchStartDate = !startDate || item.date >= startDate;
    const matchEndDate = !endDate || item.date <= endDate;

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
  alert(`Export ${type} berhasil dibuat. Bohongan dulu ya, tinggal sambungin ke backend.`);
}

function goBack() {
  window.location.href = "../Dashboard/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  renderKPI(filteredData);
  renderTable(filteredData);
});