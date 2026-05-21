const BASE_URL = "https://camprentelu.azurewebsites.net/api";

/* =========================
   PLATFORM
========================= */

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


/* =========================
   HELPERS
========================= */

function getVal(obj, keys, fallback = 0){

    for(const key of keys){

        if(
            obj &&
            obj[key] !== undefined &&
            obj[key] !== null
        ){
            return obj[key];
        }

    }

    return fallback;
}


function normalizeArray(data){

    if(Array.isArray(data))
        return data;

    if(Array.isArray(data?.$values))
        return data.$values;

    if(Array.isArray(data?.data))
        return data.data;

    if(Array.isArray(data?.data?.$values))
        return data.data.$values;

    if(Array.isArray(data?.performance))
        return data.performance;

    if(Array.isArray(data?.performance?.$values))
        return data.performance.$values;

    return [];

}


/* =========================
   CHARTS
========================= */

const areaCanvas=document.getElementById("areaChart");

let areaChart=null;

if(areaCanvas){

areaChart=new Chart(areaCanvas,{

type:"line",

data:{
labels:[],
datasets:[

{
label:"Revenue",
data:[],
borderColor:"#34D399",
fill:true,
tension:0.4
},

{
label:"Spend",
data:[],
borderColor:"#3B82F6",
fill:true,
tension:0.4
}

]
},

options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
display:false
}
}
}

});

}


const donutCanvas=
document.getElementById("donutChart");

let donutChart=null;

if(donutCanvas){

donutChart=new Chart(
donutCanvas,
{

type:"doughnut",

data:{

labels:["No Data"],

datasets:[{

data:[1],

backgroundColor:[
"#1E293B"
]

}]

},

options:{
responsive:true,
cutout:"75%"
}

}

);

}



/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard(){

try{

console.log("LOAD DASHBOARD");


const userData=
JSON.parse(
localStorage.getItem("user")
);


if(!userData){

alert("User belum login");
return;

}


const userId=
userData.userId||
userData.id||
3;


const campaignRes=
await fetch(
`${BASE_URL}/GetUserCampaigns/${userId}`
);


if(!campaignRes.ok){

throw new Error(
"Gagal ambil campaign"
);

}


const result=
await campaignRes.json();


const campaigns=
normalizeArray(result);


console.log(
"Campaign:",
campaigns
);


if(campaigns.length===0){

alert(
"Campaign kosong"
);

return;

}


let totalRevenue=0;
let totalSpend=0;

const chartMap={};


const channelTotals={

1:{
revenue:0,
spend:0
},

2:{
revenue:0,
spend:0
},

3:{
revenue:0,
spend:0
}

};


const tbody=
document.querySelector(
".campaign-table tbody"
);

tbody.innerHTML="";


const targetRoasList=
document.getElementById(
"targetRoasList"
);

targetRoasList.innerHTML="";


/* =========================
   LOOP CAMPAIGN
========================= */

for(const campaign of campaigns){

try{

const campaignId=
getVal(
campaign,
[
"campaign_id",
"campaignId"
],
null
);


if(!campaignId)
continue;


const platformId=
Number(
getVal(
campaign,
[
"platform_id",
"platformId"
],
1
)
);


const campaignName=
getVal(
campaign,
[
"nama_campaign",
"namaCampaign"
],
"Campaign"
);


const budget=
Number(
getVal(
campaign,
[
"budget"
],
0
)
);


const targetRevenue=
Number(
getVal(
campaign,
[
"target_income",
"targetIncome"
],
0
)
);



let perfData=[];
let roasData={};


try{

const perfRes=
await fetch(
`${BASE_URL}/PerformanceReport/${campaignId}`
);

if(perfRes.ok){

perfData=
await perfRes.json();

}

}catch(err){

console.log(err);

}


try{

const roasRes=
await fetch(
`${BASE_URL}/roas/${campaignId}`
);

if(roasRes.ok){

roasData=
await roasRes.json();

}

}catch(err){

console.log(err);

}



const performance=
normalizeArray(
perfData
);


const actualRevenue=
performance.reduce(

(sum,item)=>

sum+
Number(
item.revenue||0
)

,0

);



totalRevenue+=
actualRevenue;

totalSpend+=
budget;



channelTotals[platformId]
.revenue+=
actualRevenue;


channelTotals[platformId]
.spend+=
budget;



performance.forEach(

item=>{

const tanggal=
item.tanggal||"-";

if(
!chartMap[tanggal]
){

chartMap[tanggal]={

revenue:0,
spend:0

};

}

chartMap[tanggal]
.revenue+=
Number(
item.revenue||0
);


chartMap[tanggal]
.spend+=
Number(
item.cost||0
);

}

);



const roas=

budget>0
?
actualRevenue/
budget
:
0;



const tr=
document.createElement(
"tr"
);


tr.innerHTML=`

<td>

<div class="camp-name">
${campaignName}
</div>

<div class="camp-sub">
Campaign ID :
${campaignId}
</div>

</td>

<td>

<span class="
channel-badge
${badgeClassMap[platformId]||""}
">

${platformMap[platformId]}

</span>

</td>

<td>
Rp ${budget.toLocaleString("id-ID")}
</td>

<td>
Rp ${targetRevenue.toLocaleString("id-ID")}
</td>

<td class="revenue-green">
Rp ${actualRevenue.toLocaleString("id-ID")}
</td>

<td>
${roas.toFixed(2)}x
</td>

<td class="roas-orange">
${Number(
roasData.roas||roas
).toFixed(2)}x
</td>

`;

tbody.appendChild(
tr
);



const percent=
Math.min(
(roas/5)*100,
100
);


const targetItem=
document.createElement(
"div"
);


targetItem.className=
"troas-item";


targetItem.innerHTML=`

<div class="troas-header">

<span class="troas-name">

${platformMap[platformId]}
-
${campaignName}

</span>

<span class="troas-val">
${roas.toFixed(2)}x
</span>

</div>

<div class="troas-bar-wrap">

<div
class="troas-bar ${barClassMap[platformId]}"
style="width:${percent}%"
></div>

</div>

`;

targetRoasList.appendChild(
targetItem
);


}catch(err){

console.log(
"campaign error",
err
);

}

}


/* =========================
   KPI
========================= */

document.querySelector(
".spend-val"
).textContent=
`Rp ${totalSpend.toLocaleString("id-ID")}`;


document.querySelector(
".revenue-val"
).textContent=
`Rp ${totalRevenue.toLocaleString("id-ID")}`;


const finalRoas=

totalSpend>0
?
totalRevenue/totalSpend
:
0;


document.querySelector(
".roas-val"
).textContent=
`${finalRoas.toFixed(2)}x`;


document.querySelector(
".donut-center-val"
).textContent=
`${finalRoas.toFixed(2)}x`;



/* =========================
   UPDATE CHART
========================= */

const labels=
Object.keys(
chartMap
).sort();


if(labels.length===0){

labels.push("-");

chartMap["-"]={

revenue:0,
spend:0

};

}


const revenueData=
labels.map(
x=>chartMap[x].revenue
);

const spendData=
labels.map(
x=>chartMap[x].spend
);


if(areaChart){

areaChart.data.labels=
labels;

areaChart.data.datasets[0]
.data=
revenueData;

areaChart.data.datasets[1]
.data=
spendData;

areaChart.update();

}


}catch(err){

console.error(err);

alert(
err.message
);

}

}

document.addEventListener(
"DOMContentLoaded",
loadDashboard
);