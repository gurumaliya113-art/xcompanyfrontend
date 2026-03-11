
let currentEmployeeId = null;
let currentEmployeeName = null;
async function showEmployeeLogin(){
  title.innerText = "Login as Employee";

  const { data, error } = await sb
    .from("employees")
    .select("id,name")
    .order("name");

  if(error){
    content.innerHTML = "<div class='card'>Error loading employees</div>";
    return;
  }

  let html = "<div class='container'>";
  data.forEach(e=>{
    html += `
      <div class="card">
        <b>${e.name}</b><br><br>
        <button onclick="loginAsEmployee('${e.id}','${e.name}')">
          Continue as ${e.name}
        </button>
      </div>
    `;
  });
  html += "</div>";

  content.innerHTML = html;
}
function loginAsEmployee(id, name){
  currentEmployeeId = id;
  currentEmployeeName = name;

  alert("Logged in as " + name);

  showAvailableTasks();
}

async function loadUserPanel(){
  const { data: auth } = await sb.auth.getUser();
  if(!auth.user){
    window.location.href = "dashboard.html";
    return;
  }

  const email = auth.user.email;

  const { data: emp } = await sb
    .from("employees")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  if(!emp){
    const { data: adminUser } = await sb
      .from("admin_users")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if(adminUser){
      showDashboard();
      return;
    }

    alert("No role found");
    window.location.href = "dashboard.html";
    return;
  }

  if(emp.role === "FOUNDER"){
    showDashboard();
  }
  else if(emp.role === "HR"){
    showHRDashboard();
  }
  else{
    showEmployeeDashboard();
  }
}

console.log("APP JS LOADED");


async function showHRCreateTask(){
  title.innerText = "Create Task";

  content.innerHTML = `
    <div class="container">

      <div class="card">
        <h3>Create New Task</h3>

        <input id="task_title" placeholder="Task title">
        <textarea id="task_desc" placeholder="Task description"
          style="width:100%;height:80px;margin-bottom:12px;
          background:rgba(255,255,255,0.04);
          color:white;border:1px solid rgba(255,255,255,0.08);
          border-radius:12px;padding:10px;"></textarea>

        <input id="task_reward" type="number" placeholder="Reward amount (₹)">
        <input id="task_deadline" type="datetime-local">

        <button onclick="createTask()">Post Task</button>
      </div>

      <div id="hrTaskList"></div>

    </div>
  `;

  loadHRTasks();
}
async function createTask(){
  const titleVal = document.getElementById("task_title").value;
  const descVal = document.getElementById("task_desc").value;
  const rewardVal = document.getElementById("task_reward").value;
  const deadlineVal = document.getElementById("task_deadline").value;

  if(!titleVal || !rewardVal){
    alert("Title and reward required");
    return;
  }

  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user.id;

  const { error } = await sb.from("tasks").insert([{
    title: titleVal,
    description: descVal,
    reward_amount: rewardVal,
    deadline: deadlineVal,
    status: "OPEN",
    created_by: userId
  }]);

  if(error){
    alert("Error creating task");
    console.log(error);
    return;
  }

  alert("Task posted");
  showHRCreateTask();
}
async function loadHRTasks(){
  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user.id;

  const { data, error } = await sb
    .from("tasks")
    .select("*")
    .eq("created_by", userId)
    .order("created_at",{ascending:false});

  if(error){
    document.getElementById("hrTaskList").innerHTML = "Error loading tasks";
    return;
  }

  let html = `<div class="card"><h3>My Posted Tasks</h3></div>`;
  data.forEach(t=>{
    html += `
      <div class="card">
        <b>${t.title}</b><br>
        Reward: ₹${t.reward_amount}<br>
        Status: ${t.status}${t.accepted_by ? ` by ${t.accepted_by}` : ''}<br>
        Deadline: ${t.deadline || "-"}
      </div>
    `;
  });
  document.getElementById("hrTaskList").innerHTML =
    data.length ? html : `<div class="card">No tasks yet</div>`;
}

async function showDashboard(){
  title.innerText = "Dashboard";
  if(typeof subtitleEl !== 'undefined' && subtitleEl) subtitleEl.textContent = "Welcome back to The X Company";

  const empRes = await sb.from("employees").select("id", { count: "exact" });
  const bizRes = await sb.from("businesses").select("id", { count: "exact" });

  const shareRes = await sb.from("shares_ledger").select("shares");
  let totalSharesUsed = 0;
  (shareRes.data || []).forEach(s => {
    totalSharesUsed += Number(s.shares || 0);
  });

  const { data: companyData, error: companyErr } = await sb
    .from("company_live_value")
    .select("*")
    .single();

  if(companyErr){
    content.innerHTML = "<div class='card'>Company value error</div>";
    return;
  }

  const companyValue = Number(companyData.company_value || 0);

  const { data: shareCfg, error: shareErr } = await sb
    .from("company_shares_config")
    .select("total_shares")
    .single();

  if(shareErr){
    content.innerHTML = "<div class='card'>Share config error</div>";
    return;
  }

  const totalCompanyShares = Number(shareCfg.total_shares || 1);
  const sharePrice = companyValue / (totalCompanyShares || 1);

  const empCount = empRes.count ?? (empRes.data || []).length;
  const bizCount = bizRes.count ?? (bizRes.data || []).length;

  const iconUsers = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  const iconBuilding = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
  const iconDollar = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  const iconTrendUp = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>';
  const iconTrendUpSm = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>';
  const iconLayers = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>';

  const stats = [
    { title:'Employees', value: empCount, icon: iconUsers, bg:'#3B82F6', trend:'+active team', up:true },
    { title:'Businesses', value: bizCount, icon: iconBuilding, bg:'#A855F7', trend:'portfolio', up:true },
    { title:'Company Value', value: '\u20b9'+companyValue.toFixed(2), icon: iconDollar, bg:'#22C55E', trend:'total value', up:true },
    { title:'Share Price', value: '\u20b9'+sharePrice.toFixed(2), icon: iconTrendUp, bg:'#F59E0B', trend:'per share', up:true }
  ];

  let statsHtml = stats.map(s => `
    <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px;transition:box-shadow .2s;cursor:default" onmouseover="this.style.boxShadow='0 10px 25px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow='none'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div style="width:48px;height:48px;background:${s.bg};border-radius:12px;display:flex;align-items:center;justify-content:center">${s.icon}</div>
        ${iconTrendUpSm}
      </div>
      <div style="font-size:14px;font-weight:500;color:#6B7280;margin-bottom:4px">${s.title}</div>
      <div style="font-size:24px;font-weight:700;color:#111827;margin-bottom:8px">${s.value}</div>
      <div style="font-size:12px;color:#16A34A">${s.trend}</div>
    </div>
  `).join('');

  const bizValue = Math.round(companyValue * 0.609);
  const assetValue = Math.round(companyValue * 0.244);
  const investValue = companyValue - bizValue - assetValue;
  const bizPct = companyValue > 0 ? ((bizValue/companyValue)*100).toFixed(1) : 0;
  const assetPct = companyValue > 0 ? ((assetValue/companyValue)*100).toFixed(1) : 0;
  const investPct = companyValue > 0 ? ((investValue/companyValue)*100).toFixed(1) : 0;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:32px">
      ${statsHtml}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px">
        <div style="margin-bottom:24px">
          <div style="font-size:20px;font-weight:700;color:#111827">Share Price Trend</div>
          <div style="font-size:14px;color:#6B7280;margin-top:4px">Recent performance</div>
        </div>
        <canvas id="shareLineChart" style="width:100%!important;height:300px!important;border:none;margin:0;padding:0;background:transparent"></canvas>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px">
        <div style="margin-bottom:24px">
          <div style="font-size:20px;font-weight:700;color:#111827">Value Breakdown</div>
          <div style="font-size:14px;color:#6B7280;margin-top:4px">Distribution across departments</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:14px;font-weight:500;color:#374151">Businesses</span>
              <span style="font-size:14px;font-weight:700;color:#111827">\u20b9${bizValue.toLocaleString()}</span>
            </div>
            <div style="width:100%;height:8px;background:#E5E7EB;border-radius:999px;overflow:hidden">
              <div style="width:${bizPct}%;height:100%;background:#A855F7;border-radius:999px"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:14px;font-weight:500;color:#374151">Assets</span>
              <span style="font-size:14px;font-weight:700;color:#111827">\u20b9${assetValue.toLocaleString()}</span>
            </div>
            <div style="width:100%;height:8px;background:#E5E7EB;border-radius:999px;overflow:hidden">
              <div style="width:${assetPct}%;height:100%;background:#F59E0B;border-radius:999px"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:14px;font-weight:500;color:#374151">Investments</span>
              <span style="font-size:14px;font-weight:700;color:#111827">\u20b9${investValue.toLocaleString()}</span>
            </div>
            <div style="width:100%;height:8px;background:#E5E7EB;border-radius:999px;overflow:hidden">
              <div style="width:${investPct}%;height:100%;background:#22C55E;border-radius:999px"></div>
            </div>
          </div>
          <div style="padding-top:16px;border-top:1px solid #E5E7EB;margin-top:8px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:16px;font-weight:700;color:#111827">Total Value</span>
            <span style="font-size:18px;font-weight:700;color:#111827">\u20b9${companyValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
    <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:32px">
      <div style="margin-bottom:24px">
        <div style="font-size:20px;font-weight:700;color:#111827">Company Layers</div>
        <div style="font-size:14px;color:#6B7280;margin-top:4px">Organizational structure and hierarchy</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px" id="dashLayersGrid">
        <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            ${iconLayers}
            <span style="font-weight:700;color:#111827">Layer 1</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#1F2937;margin-bottom:12px">Foundation</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Core Business</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Infrastructure</div>
          </div>
        </div>
        <div style="background:#FAF5FF;border:2px solid #E9D5FF;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            ${iconLayers}
            <span style="font-weight:700;color:#111827">Layer 2</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#1F2937;margin-bottom:12px">Operations</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Human Resources</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Finance & Banking</div>
          </div>
        </div>
        <div style="background:#FFFBEB;border:2px solid #FDE68A;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            ${iconLayers}
            <span style="font-weight:700;color:#111827">Layer 3</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:#1F2937;margin-bottom:12px">Assets</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Physical Assets</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Digital Assets</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:#4B5563"><span style="width:6px;height:6px;background:#9CA3AF;border-radius:99px;flex-shrink:0"></span>Investments</div>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top:0">
      <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:16px">Quick Actions</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
        <div onclick="document.querySelector('.sidebar-nav a:nth-child(4)').click()" style="background:#fff;border:2px solid #E5E7EB;border-radius:12px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;color:#111827" onmouseover="this.style.borderColor='#F97316';this.style.background='#FFF7ED'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          <span style="font-size:14px;font-weight:500">Add Business</span>
        </div>
        <div onclick="document.querySelector('.sidebar-nav a:nth-child(6)').click()" style="background:#fff;border:2px solid #E5E7EB;border-radius:12px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;color:#111827" onmouseover="this.style.borderColor='#3B82F6';this.style.background='#EFF6FF'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          <span style="font-size:14px;font-weight:500">Add Employee</span>
        </div>
        <div onclick="document.querySelector('.sidebar-nav a:nth-child(9)').click()" style="background:#fff;border:2px solid #E5E7EB;border-radius:12px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;color:#111827" onmouseover="this.style.borderColor='#22C55E';this.style.background='#F0FDF4'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          <span style="font-size:14px;font-weight:500">View Reports</span>
        </div>
        <div onclick="document.querySelector('.sidebar-nav a:nth-child(8)').click()" style="background:#fff;border:2px solid #E5E7EB;border-radius:12px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;color:#111827" onmouseover="this.style.borderColor='#A855F7';this.style.background='#FAF5FF'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          <span style="font-size:14px;font-weight:500">Manage Assets</span>
        </div>
      </div>
    </div>
  `;

  loadSharePriceChart();
}

function renderPerfChart(income, expense, profit){
  const ctx = document.getElementById("perfChart");

  if(window.dashboardChart){
    window.dashboardChart.destroy();
  }

  window.dashboardChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expense", "Profit"],
      datasets: [{
        data: [income, expense, profit],
        backgroundColor: ["#22c55e", "#ef4444", "#3b82f6"]
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: "#222", font: { weight: "bold", size: 16 } } },
        y: { ticks: { color: "#222", font: { weight: "bold", size: 16 } } }
      }
    }
  });
}
async function renderSharePie(){
  const empRes = await sb.from("employees").select("id,name");
  const shareRes = await sb.from("shares_ledger").select("employee_id,shares");

  const map = {};
  empRes.data.forEach(e => map[e.id] = { name: e.name, shares: 0 });

  shareRes.data.forEach(s => {
    if(map[s.employee_id]){
      map[s.employee_id].shares += Number(s.shares);
    }
  });

  const labels = Object.values(map).map(e => e.name);
  const data = Object.values(map).map(e => e.shares);

  new Chart(document.getElementById("sharePie"), {
    type: "pie",
    data: {
      labels,
      datasets: [{ data }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "#222", font: { weight: "bold", size: 16 } } }
      }
    }
  });
}
renderSharePie();
async function showPayout(empId){
  const shareRes = await sb
    .from("shares_ledger")
    .select("shares")
    .eq("employee_id", empId);

  let totalShares = 0;
  shareRes.data.forEach(s => totalShares += Number(s.shares));

  content.innerHTML = `
    <div class="card">
      Total Shares: ${totalShares}<br><br>
      <button onclick="confirmPayout('${empId}', ${totalShares})">
        Payout
      </button>
    </div>
  `;
}
async function showCompanyShareMarket(){
  title.innerText = "Share Buy / Sell";

  const empRes = await sb.from("employees").select("id,name");

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <select id="sm_employee" onchange="window.updateShareInfo && window.updateShareInfo()">
          <option value="">Employee select karo</option>
          ${empRes.data.map(e=>`
            <option value="${e.id}">${e.name}</option>
          `).join("")}
        </select>
        <div id="sm_info" style="margin:10px 0 0 0;"></div>
        <input id="sm_qty" type="number" placeholder="Shares quantity">
        <div style="color:#ef4444;font-size:13px;margin-bottom:8px;">Max 500 shares can be bought per person per week.</div>
        <button onclick="openShareBuyPayment()">BUY</button>
        <button onclick="sellCompanyShares()" style="background:#ef4444">SELL</button>

        <div id="shareBuyPay" style="margin-top:14px;"></div>
      </div>

      <div id="shareBuyReq" class="card" style="display:none"></div>
    </div>
  `;

  // Add updateShareInfo to window for select onchange
  window.updateShareInfo = async function() {
    const empId = document.getElementById('sm_employee').value;
    if (!empId) {
      document.getElementById('sm_info').innerHTML = '';
      return;
    }
    // Get employee shares
    const shareRes = await sb.from('shares_ledger').select('shares,locked').eq('employee_id', empId);
    let total = 0, locked = 0;
    shareRes.data.forEach(s => {
      total += Number(s.shares);
      if (s.locked) locked += Number(s.shares);
    });
    const available = total - locked;
    // Get company available shares
    const cfg = await sb.from('company_shares_config').select('total_shares').single();
    const usedRes = await sb.from('shares_ledger').select('shares');
    let used = 0;
    usedRes.data.forEach(s => { used += Number(s.shares); });
    const companyAvailable = (cfg.data?.total_shares || 0) - used;
    document.getElementById('sm_info').innerHTML =
      `<b>Employee Available Shares (to sell):</b> ${available}<br>`+
      `<b>Company Available Shares (to buy):</b> ${companyAvailable}`;
  };
  // Call once to clear info
  window.updateShareInfo();

  // Founder approvals list
  loadShareBuyRequests();
}

// Backward compatibility if any older button still calls it
async function buyCompanyShares(){
  return openShareBuyPayment();
}

function _fmtInr(n){
  const num = Number(n || 0);
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function _makeTxnId(){
  return 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
}

async function openShareBuyPayment(){
  const empId = document.getElementById("sm_employee")?.value;
  const qty = Number(document.getElementById("sm_qty")?.value);

  if(!empId || qty <= 0){
    alert("Employee aur quantity sahi daal");
    return;
  }

  // 500/week cap (based on ledger entries in last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const buyRes = await sb
    .from('shares_ledger')
    .select('shares,created_at')
    .eq('employee_id', empId);

  let boughtThisWeek = 0;
  (buyRes.data || []).forEach(s => {
    if (s.created_at && new Date(s.created_at) > weekAgo && Number(s.shares) > 0) {
      boughtThisWeek += Number(s.shares);
    }
  });
  if (boughtThisWeek + qty > 500) {
    alert('Maximum 500 shares can be bought per person per week.');
    return;
  }

  // Company available shares
  const cfg = await sb.from('company_shares_config').select('total_shares').single();
  const usedRes = await sb.from('shares_ledger').select('shares');
  let used = 0;
  (usedRes.data || []).forEach(s => { used += Number(s.shares); });
  const companyAvailable = Number(cfg.data?.total_shares || 0) - used;
  if(qty > companyAvailable){
    alert('Company ke paas itne shares available nahi hain');
    return;
  }

  // Live share price
  const priceRes = await sb.from('company_live_value').select('company_value').single();
  const rate = Number(priceRes.data?.company_value || 0) / Number(cfg.data?.total_shares || 1);
  const amount = qty * rate;

  const emp = await sb.from('employees').select('name').eq('id', empId).single();
  const empName = emp.data?.name || empId;

  const txn = _makeTxnId();
  const el = document.getElementById('shareBuyPay');
  if(!el) return;

  el.innerHTML = `
    <div style="border-top:1px solid rgba(0,0,0,.08);padding-top:12px;">
      <h3 style="margin:0 0 10px 0;">Payment</h3>
      <div style="font-size:14px;line-height:1.4">
        <b>Employee:</b> ${empName}<br>
        <b>Qty:</b> ${qty}<br>
        <b>Rate:</b> ₹${rate.toFixed(2)}<br>
        <b>Total:</b> ₹${_fmtInr(amount)}
      </div>

      <div style="display:flex;gap:14px;align-items:flex-start;margin-top:12px;flex-wrap:wrap;">
        <div style="width:220px;min-width:200px;">
          <div style="font-size:13px;color:#555;margin-bottom:6px;">Scan QR and pay</div>
          <img src="assets/share-buy-qr.png" alt="Share Buy QR" style="width:220px;height:auto;border-radius:14px;border:1px solid rgba(0,0,0,.10);background:#fff;" onerror="this.style.display='none'" />
        </div>
        <div style="flex:1;min-width:240px;">
          <div style="font-size:13px;color:#555;margin-bottom:6px;">After payment, enter Transaction ID</div>
          <input id="sm_txn" placeholder="Transaction ID" value="${txn}" />
          <button onclick="submitShareBuyRequest()">Submit for Founder Approval</button>
          <div style="font-size:12px;color:#555;margin-top:6px;">Founder approve karega tab shares add honge.</div>
        </div>
      </div>
    </div>
  `;
}

async function submitShareBuyRequest(){
  const empId = document.getElementById("sm_employee")?.value;
  const qty = Number(document.getElementById("sm_qty")?.value);
  const txn = (document.getElementById("sm_txn")?.value || '').trim();

  if(!empId || qty <= 0 || !txn){
    alert('Employee, qty, aur transaction id required');
    return;
  }

  const cfg = await sb.from('company_shares_config').select('total_shares').single();
  const priceRes = await sb.from('company_live_value').select('company_value').single();
  const rate = Number(priceRes.data?.company_value || 0) / Number(cfg.data?.total_shares || 1);
  const amount = qty * rate;

  const { error } = await sb.from('share_buy_requests').insert([{
    employee_id: empId,
    qty: qty,
    rate: rate,
    amount: amount,
    transaction_id: txn,
    status: 'PENDING'
  }]);

  if(error){
    alert('Request submit failed: ' + error.message);
    console.log(error);
    return;
  }

  alert('Request submitted. Founder approval pending.');
  const pay = document.getElementById('shareBuyPay');
  if(pay) pay.innerHTML = '';
  loadShareBuyRequests();
}

async function loadShareBuyRequests(){
  const box = document.getElementById('shareBuyReq');
  if(!box) return;

  const { data, error } = await sb
    .from('share_buy_requests')
    .select('id, employee_id, qty, rate, amount, transaction_id, status, created_at')
    .eq('status','PENDING')
    .order('created_at',{ascending:false});

  if(error){
    box.style.display = 'block';
    box.innerHTML = '<h3 style="margin-top:0">Pending Buy Requests</h3><div>Unable to load: ' + error.message + '</div>';
    return;
  }

  if(!data || data.length === 0){
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  // map employee names
  const empIds = [...new Set(data.map(r => r.employee_id))];
  const empRes = await sb.from('employees').select('id,name').in('id', empIds);
  const empMap = {};
  (empRes.data || []).forEach(e => { empMap[e.id] = e.name; });

  box.style.display = 'block';
  box.innerHTML = `
    <h3 style="margin-top:0">Pending Buy Requests</h3>
    ${data.map(r => `
      <div style="border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:12px;margin-top:10px;">
        <div><b>${empMap[r.employee_id] || r.employee_id}</b></div>
        <div style="font-size:13px;color:#555;line-height:1.4;margin-top:6px;">
          Qty: <b>${r.qty}</b> | Rate: ₹${Number(r.rate).toFixed(2)} | Amount: ₹${_fmtInr(r.amount)}<br>
          Txn: <b>${r.transaction_id}</b>
        </div>
        <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
          <button onclick="approveShareBuyRequest('${r.id}')">Approve</button>
          <button style="background:#ef4444" onclick="rejectShareBuyRequest('${r.id}')">Reject</button>
        </div>
      </div>
    `).join('')}
  `;
}

async function approveShareBuyRequest(reqId){
  const { data: req, error: reqErr } = await sb
    .from('share_buy_requests')
    .select('*')
    .eq('id', reqId)
    .single();

  if(reqErr || !req){
    alert('Request load failed');
    console.log(reqErr);
    return;
  }
  if(req.status !== 'PENDING'){
    alert('Already processed');
    loadShareBuyRequests();
    return;
  }

  // Credit shares
  const { error: ledErr } = await sb.from('shares_ledger').insert([{
    employee_id: req.employee_id,
    shares: req.qty,
    locked: false
  }]);
  if(ledErr){
    alert('Ledger insert failed: ' + ledErr.message);
    console.log(ledErr);
    return;
  }

  // Add money to pool (BANK by default)
  const poolRes = await sb
    .from('company_money_pool')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(1);
  const cash = Number(poolRes.data?.[0]?.layer1_amount || 0);
  const bank = Number(poolRes.data?.[0]?.layer2_amount || 0);
  const { error: poolErr } = await sb.from('company_money_pool').insert([{
    layer1_amount: cash,
    layer2_amount: bank + Number(req.amount || 0)
  }]);
  if(poolErr){
    alert('Pool update failed: ' + poolErr.message);
    console.log(poolErr);
    return;
  }

  const { error: upErr } = await sb.from('share_buy_requests')
    .update({ status: 'APPROVED' })
    .eq('id', reqId);
  if(upErr){
    alert('Approve status update failed: ' + upErr.message);
    console.log(upErr);
    return;
  }

  alert('Approved ✅ Shares credited');
  loadShareBuyRequests();
  window.updateShareInfo && window.updateShareInfo();
}

async function rejectShareBuyRequest(reqId){
  const { error } = await sb.from('share_buy_requests')
    .update({ status: 'REJECTED' })
    .eq('id', reqId);
  if(error){
    alert('Reject failed: ' + error.message);
    console.log(error);
    return;
  }
  alert('Rejected');
  loadShareBuyRequests();
}
async function loadSharePriceChart(){
  const res = await sb
    .from("share_price_history")
    .select("price, created_at")
    .order("created_at", { ascending: true })
    .limit(30);

  let labels, prices;
  if (res.data && res.data.length > 0) {
    labels = res.data.map(r =>
      new Date(r.created_at).toLocaleDateString()
    );
    prices = res.data.map(r => r.price);
  } else {
    labels = ["3 Jun", "4 Jun", "5 Jun", "6 Jun"];
    prices = [62.34, 64.35, 66.47, 70.34];
  }

  let datasets = [
    {
      label: "Share Price",
      data: prices,
      borderWidth: 2,
      borderColor: "#F59E0B",
      backgroundColor: "rgba(245,158,11,0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#F59E0B",
      pointBorderColor: "#F59E0B",
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ];

  const ctx = document.getElementById("shareLineChart");
  if(window.shareChart) window.shareChart.destroy();

  window.shareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: "#E5E7EB" },
          ticks: { color: "#6B7280", font: { size: 12 } }
        },
        y: {
          grid: { color: "#E5E7EB" },
          ticks: { color: "#6B7280", font: { size: 12 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#111827",
          bodyColor: "#111827",
          borderColor: "#E5E7EB",
          borderWidth: 1
        }
      }
    }
  });
}

async function sellCompanyShares(){
  const empId = document.getElementById("sm_employee").value;
  const qty = Number(document.getElementById("sm_qty").value);

  if(!empId || qty <= 0){
    alert("Employee aur quantity sahi daal");
    return;
  }

  // Check employee available shares (exclude locked)
  const shareRes = await sb
    .from('shares_ledger')
    .select('shares,locked')
    .eq('employee_id', empId);
  let total = 0, locked = 0;
  (shareRes.data || []).forEach(s => {
    total += Number(s.shares);
    if(s.locked) locked += Number(s.shares);
  });
  const available = total - locked;
  if(qty > available){
    alert('Employee ke paas itne available shares nahi hain');
    return;
  }

  // Price
  const cfg = await sb.from('company_shares_config').select('total_shares').single();
  const priceRes = await sb.from('company_live_value').select('company_value').single();
  const rate = Number(priceRes.data?.company_value || 0) / Number(cfg.data?.total_shares || 1);
  const amount = qty * rate;

  // Pool snapshot (deduct from cash then bank)
  const poolRes = await sb
    .from('company_money_pool')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(1);
  let cash = Number(poolRes.data?.[0]?.layer1_amount || 0);
  let bank = Number(poolRes.data?.[0]?.layer2_amount || 0);
  let remaining = amount;

  if(remaining > (cash + bank)){
    alert('Company pool me itna paisa nahi hai payout ke liye');
    return;
  }

  const fromCash = Math.min(cash, remaining);
  cash -= fromCash;
  remaining -= fromCash;
  if(remaining > 0){
    bank -= remaining;
    remaining = 0;
  }

  // Ledger -shares
  const { error: ledErr } = await sb.from('shares_ledger').insert([{
    employee_id: empId,
    shares: -qty,
    locked: false
  }]);
  if(ledErr){
    alert('Sell failed: ' + ledErr.message);
    console.log(ledErr);
    return;
  }

  // Pool update
  const { error: poolErr } = await sb.from('company_money_pool').insert([{
    layer1_amount: cash,
    layer2_amount: bank
  }]);
  if(poolErr){
    alert('Pool update failed: ' + poolErr.message);
    console.log(poolErr);
    return;
  }

  // Show UPI payout link
  const emp = await sb.from('employees').select('name').eq('id', empId).single();
  const upiRes = await sb.from('employee_payout_details').select('upi_id').eq('employee_id', empId).single();
  if(!upiRes.data?.upi_id){
    alert('Employee ka UPI saved nahi hai (employee_payout_details)');
    showCompanyShareMarket();
    return;
  }

  const upiLink = `upi://pay?pa=${upiRes.data.upi_id}&pn=${encodeURIComponent(emp.data?.name || empId)}&am=${amount.toFixed(2)}&cu=INR&tn=Share%20Sell%20Payout`;
  alert('Sell successful ✅ Payout link shown');
  showCompanyShareMarket();
  const pay = document.getElementById('shareBuyPay');
  if(pay){
    pay.innerHTML = `
      <div style="border-top:1px solid rgba(0,0,0,.08);padding-top:12px;">
        <h3 style="margin:0 0 10px 0;">UPI Payout</h3>
        <div style="font-size:14px;line-height:1.4">
          Amount: <b>₹${_fmtInr(amount)}</b><br>
          <a href="${upiLink}" style="color:#22c55e;font-weight:700">👉 Click to receive payment</a>
        </div>
      </div>
    `;
  }
}

async function showMoneyPool(){
  title.innerText = "Money Pool (Cash + Bank)";

  // latest pool
  const { data } = await sb
    .from("company_money_pool")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const cash = data[0]?.layer1_amount || 0;
  const bank = data[0]?.layer2_amount || 0;

  const total = Number(cash) + Number(bank);

  content.innerHTML = `
    <div class="container">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card" style="cursor:pointer" onclick="showMoneyPoolLedger('CASH')">Cash<br><b>₹${cash}</b></div>
        <div class="card" style="cursor:pointer" onclick="showMoneyPoolLedger('BANK')">Bank<br><b>₹${bank}</b></div>
      </div>

      <div class="card" style="text-align:center;margin-top:12px">
        <div style="font-size:14px;opacity:.7">Total Balance</div>
        <div style="font-size:24px;font-weight:900">₹${total}</div>
      </div>

      <div style="text-align:center;margin-top:12px">
        <button onclick="showMoneyPoolStatements()" style="padding:10px 28px;font-size:15px;font-weight:600;background:#111827;color:#fff;border:none;border-radius:8px;cursor:pointer">📊 View Statements</button>
      </div>

      <hr>

      <div class="card">
        <h3>Add / Minus Money</h3>

        <select id="mp_type">
          <option value="ADD">Add</option>
          <option value="MINUS">Minus</option>
        </select>

        <select id="mp_source">
          <option value="CASH">Cash</option>
          <option value="BANK">Bank</option>
        </select>

        <input id="mp_from" placeholder="From (e.g. Client / Investor / Self)">
        <input id="mp_reason" placeholder="Reason (optional)">
        <input id="mp_amount" placeholder="Amount">

        <button onclick="updateMoneyPool()">Submit</button>
      </div>

    </div>
  `;
}
async function updateMoneyPool(){
  const type = document.getElementById("mp_type").value;
  const source = document.getElementById("mp_source").value;
  const fromText = (document.getElementById("mp_from")?.value || "").trim();
  const reason = (document.getElementById("mp_reason")?.value || "").trim();
  const amt = Number(document.getElementById("mp_amount").value);

  if(!amt || amt <= 0){
    alert("Amount sahi daal");
    return;
  }

  // current balance
  const { data } = await sb
    .from("company_money_pool")
    .select("*")
    .order("created_at",{ascending:false})
    .limit(1);

  let cash = data[0]?.layer1_amount || 0;
  let bank = data[0]?.layer2_amount || 0;

  if(type === "ADD"){
    if(source === "CASH") cash += amt;
    else bank += amt;
  }

  if(type === "MINUS"){
    if(source === "CASH"){
      if(amt > cash){ alert("Cash kam hai"); return; }
      cash -= amt;
    } else {
      if(amt > bank){ alert("Bank kam hai"); return; }
      bank -= amt;
    }
  }

  await sb.from("company_money_pool").insert([{
    layer1_amount: cash,
    layer2_amount: bank
  }]);

  // Ledger entry (date/time auto via created_at)
  const ledRes = await sb.from("money_pool_ledger").insert([{
    source,
    type,
    amount: amt,
    from_text: fromText || null,
    reason: reason || null
  }]);
  if(ledRes?.error){
    // Keep main balance update working, but tell user ledger table needs setup.
    console.error(ledRes.error);
    alert("Money pool updated, but ledger save failed: " + (ledRes.error.message || ""));
    showMoneyPool();
    return;
  }

  alert("Money pool update ho gaya");
  showMoneyPool();
}

async function showMoneyPoolLedger(source){
  const label = source === "BANK" ? "Bank" : "Cash";
  title.innerText = `${label} Ledger`;

  const { data, error } = await sb
    .from("money_pool_ledger")
    .select("id,created_at,source,type,amount,from_text,reason")
    .eq("source", source)
    .order("created_at", { ascending: false });

  if(error){
    console.error(error);
    content.innerHTML = `
      <div class="container">
        <div class="card">
          Failed to load ledger.<br>
          <div style="margin-top:10px;font-size:14px;opacity:.85"><b>Error:</b> ${error.message || ""}</div>
          <div style="margin-top:10px;font-size:14px;opacity:.85">
            Create table <b>money_pool_ledger</b> in Supabase (SQL file can be added).
          </div>
        </div>
        <div class="card"><button onclick="showMoneyPool()">Back</button></div>
      </div>
    `;
    return;
  }

  const rows = data || [];

  let html = `
    <div class="container">
      <div class="card">
        <button onclick="showMoneyPool()">← Back</button>
        <button style="margin-left:10px" onclick="saveMoneyPoolLedgerPDF('${source}')">Save PDF</button>
      </div>

      <div class="card" id="mpLedgerContainer">
        <h3 style="margin-top:0;">${label} Entries</h3>
  `;

  if(rows.length === 0){
    html += `<div style="opacity:.85">No entries yet.</div>`;
  } else {
    rows.forEach(r => {
      const dt = r.created_at ? new Date(r.created_at).toLocaleString() : "-";
      const amt = Number(r.amount || 0);
      const sign = r.type === "MINUS" ? "-" : "+";
      html += `
        <div style="padding:14px 0;border-top:1px solid rgba(0,0,0,.08)">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div>
              <div style="font-weight:800">${dt}</div>
              <div style="opacity:.85;font-size:14px">Type: <b>${r.type || "-"}</b></div>
              <div style="opacity:.85;font-size:14px">From: <b>${r.from_text || "-"}</b></div>
              <div style="opacity:.85;font-size:14px">Reason: <b>${r.reason || "-"}</b></div>
            </div>
            <div style="font-weight:900;font-size:18px;">${sign}₹${amt}</div>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  content.innerHTML = html;
}

function saveMoneyPoolLedgerPDF(source){
  const label = source === "BANK" ? "Bank" : "Cash";
  const element = document.getElementById("mpLedgerContainer");
  if(!element){
    alert("Nothing to export");
    return;
  }

  const opt = {
    margin: 0.4,
    filename: `${label}_MoneyPool_Ledger.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

async function showMoneyPoolStatements(){
  title.innerText = "Money Pool — Statements";

  // fetch ALL ledger entries (both CASH and BANK)
  const { data, error } = await sb
    .from("money_pool_ledger")
    .select("id,created_at,source,type,amount,from_text,reason")
    .order("created_at", { ascending: true });

  // fetch actual current pool balances
  const { data: poolData } = await sb
    .from("company_money_pool")
    .select("layer1_amount,layer2_amount")
    .order("created_at", { ascending: false })
    .limit(1);

  const actualCash = Number(poolData?.[0]?.layer1_amount || 0);
  const actualBank = Number(poolData?.[0]?.layer2_amount || 0);

  if(error){
    console.error(error);
    content.innerHTML = `
      <div class="container">
        <div class="card">Failed to load statements.<br><span style="font-size:14px;opacity:.85">${error.message || ''}</span></div>
        <div class="card"><button onclick="showMoneyPool()">← Back</button></div>
      </div>
    `;
    return;
  }

  const rows = data || [];

  // compute totals
  let totalIn = 0, totalOut = 0;
  rows.forEach(r => {
    const a = Number(r.amount || 0);
    if(r.type === 'ADD') totalIn += a;
    else totalOut += a;
  });

  // compute raw cash/bank sums from ledger to find offset
  let rawCash = 0, rawBank = 0;
  rows.forEach(r => {
    const a = Number(r.amount || 0);
    if(r.source === 'CASH'){
      if(r.type === 'ADD') rawCash += a; else rawCash -= a;
    } else {
      if(r.type === 'ADD') rawBank += a; else rawBank -= a;
    }
  });
  const cashOffset = actualCash - rawCash;
  const bankOffset = actualBank - rawBank;

  // build separate cash & bank running balances with offset (chronological)
  let cashBal = cashOffset, bankBal = bankOffset;
  const enriched = rows.map(r => {
    const a = Number(r.amount || 0);
    if(r.source === 'CASH'){
      if(r.type === 'ADD') cashBal += a; else cashBal -= a;
    } else {
      if(r.type === 'ADD') bankBal += a; else bankBal -= a;
    }
    return { ...r, cashBal, bankBal };
  });

  // reverse for display (newest first)
  const displayRows = enriched.slice().reverse();

  let html = `
    <div class="container">

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
        <button onclick="showMoneyPool()" style="padding:8px 16px;border:1px solid #D1D5DB;background:#fff;border-radius:8px;cursor:pointer;font-weight:600">← Back</button>
        <button onclick="exportStatementsPDF()" style="padding:8px 20px;background:#111827;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">📥 Export PDF</button>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <div style="flex:1;min-width:130px">
          <label style="font-size:12px;font-weight:600;opacity:.7">From Date</label>
          <input type="date" id="stmt_from" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:6px" onchange="filterStatements()">
        </div>
        <div style="flex:1;min-width:130px">
          <label style="font-size:12px;font-weight:600;opacity:.7">To Date</label>
          <input type="date" id="stmt_to" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:6px" onchange="filterStatements()">
        </div>
        <div style="flex:1;min-width:130px">
          <label style="font-size:12px;font-weight:600;opacity:.7">Source</label>
          <select id="stmt_source" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:6px" onchange="filterStatements()">
            <option value="ALL">All</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
          </select>
        </div>
        <div style="flex:1;min-width:130px">
          <label style="font-size:12px;font-weight:600;opacity:.7">Type</label>
          <select id="stmt_type" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:6px" onchange="filterStatements()">
            <option value="ALL">All</option>
            <option value="ADD">Money In</option>
            <option value="MINUS">Money Out</option>
          </select>
        </div>
      </div>

      <div id="stmtSummary" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="card" style="text-align:center;border-left:4px solid #22c55e">
          <div style="font-size:12px;opacity:.7;font-weight:600">Total In</div>
          <div style="font-size:20px;font-weight:900;color:#22c55e">+₹${totalIn}</div>
        </div>
        <div class="card" style="text-align:center;border-left:4px solid #ef4444">
          <div style="font-size:12px;opacity:.7;font-weight:600">Total Out</div>
          <div style="font-size:20px;font-weight:900;color:#ef4444">-₹${totalOut}</div>
        </div>
        <div class="card" style="text-align:center;border-left:4px solid #3b82f6">
          <div style="font-size:12px;opacity:.7;font-weight:600">Net</div>
          <div style="font-size:20px;font-weight:900;color:#3b82f6">₹${totalIn - totalOut}</div>
        </div>
      </div>

      <div id="stmtPdfArea">
        <div id="stmtHeader" style="display:none;text-align:center;padding:16px 0;border-bottom:2px solid #111">
          <div style="font-size:20px;font-weight:900">The X-Company</div>
          <div style="font-size:14px;opacity:.7">Money Pool Statement</div>
          <div id="stmtDateRange" style="font-size:12px;opacity:.6;margin-top:4px"></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px" id="stmtTable">
          <thead>
            <tr style="background:#F9FAFB;text-align:left">
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700">#</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700">Date</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700">Source</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700">From / To</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700">Reason</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700;text-align:right">In</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700;text-align:right">Out</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700;text-align:right">Cash Bal</th>
              <th style="padding:10px 8px;border-bottom:2px solid #E5E7EB;font-weight:700;text-align:right">Bank Bal</th>
            </tr>
          </thead>
          <tbody id="stmtBody">
  `;

  if(displayRows.length === 0){
    html += `<tr><td colspan="9" style="padding:20px;text-align:center;opacity:.6">No entries yet.</td></tr>`;
  } else {
    displayRows.forEach((r, idx) => {
      const dt = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' + new Date(r.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '-';
      const amt = Number(r.amount || 0);
      const isIn = r.type === 'ADD';
      const rowBg = idx % 2 === 0 ? '#fff' : '#F9FAFB';
      html += `
        <tr style="background:${rowBg}" data-date="${r.created_at || ''}" data-source="${r.source}" data-type="${r.type}">
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${displayRows.length - idx}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;white-space:nowrap">${dt}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6"><span style="padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${r.source==='CASH'?'#FEF3C7':'#DBEAFE'};color:${r.source==='CASH'?'#92400E':'#1E40AF'}">${r.source}</span></td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${r.from_text || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${r.reason || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;color:#22c55e;font-weight:700">${isIn ? '+₹'+amt : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;color:#ef4444;font-weight:700">${!isIn ? '-₹'+amt : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:800;color:#92400E">₹${r.cashBal}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:800;color:#1E40AF">₹${r.bankBal}</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>

    </div>
  `;

  content.innerHTML = html;

  // store enriched data for filtering
  window._stmtAllRows = displayRows;
  window._stmtCashOffset = cashOffset;
  window._stmtBankOffset = bankOffset;
}

function filterStatements(){
  const fromDate = document.getElementById('stmt_from')?.value || '';
  const toDate = document.getElementById('stmt_to')?.value || '';
  const srcFilter = document.getElementById('stmt_source')?.value || 'ALL';
  const typeFilter = document.getElementById('stmt_type')?.value || 'ALL';

  const allRows = window._stmtAllRows || [];
  const tbody = document.getElementById('stmtBody');
  const summary = document.getElementById('stmtSummary');
  if(!tbody) return;

  let filteredIn = 0, filteredOut = 0;

  // re-compute running balance on filtered set (chronological order)
  const chronoFiltered = allRows.slice().reverse().filter(r => {
    if(srcFilter !== 'ALL' && r.source !== srcFilter) return false;
    if(typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if(fromDate && r.created_at){
      const d = r.created_at.slice(0,10);
      if(d < fromDate) return false;
    }
    if(toDate && r.created_at){
      const d = r.created_at.slice(0,10);
      if(d > toDate) return false;
    }
    return true;
  });

  let cashBal = window._stmtCashOffset || 0, bankBal = window._stmtBankOffset || 0;
  chronoFiltered.forEach(r => {
    const a = Number(r.amount || 0);
    if(r.source === 'CASH'){
      if(r.type === 'ADD'){ cashBal += a; filteredIn += a; }
      else { cashBal -= a; filteredOut += a; }
    } else {
      if(r.type === 'ADD'){ bankBal += a; filteredIn += a; }
      else { bankBal -= a; filteredOut += a; }
    }
    r._filteredCashBal = cashBal;
    r._filteredBankBal = bankBal;
  });

  const displayFiltered = chronoFiltered.slice().reverse();

  let html = '';
  if(displayFiltered.length === 0){
    html = `<tr><td colspan="9" style="padding:20px;text-align:center;opacity:.6">No entries match filters.</td></tr>`;
  } else {
    displayFiltered.forEach((r, idx) => {
      const dt = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' + new Date(r.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '-';
      const amt = Number(r.amount || 0);
      const isIn = r.type === 'ADD';
      const rowBg = idx % 2 === 0 ? '#fff' : '#F9FAFB';
      html += `
        <tr style="background:${rowBg}">
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${displayFiltered.length - idx}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;white-space:nowrap">${dt}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6"><span style="padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${r.source==='CASH'?'#FEF3C7':'#DBEAFE'};color:${r.source==='CASH'?'#92400E':'#1E40AF'}">${r.source}</span></td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${r.from_text || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6">${r.reason || '-'}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;color:#22c55e;font-weight:700">${isIn ? '+₹'+amt : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;color:#ef4444;font-weight:700">${!isIn ? '-₹'+amt : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:800;color:#92400E">₹${r._filteredCashBal}</td>
          <td style="padding:8px;border-bottom:1px solid #F3F4F6;text-align:right;font-weight:800;color:#1E40AF">₹${r._filteredBankBal}</td>
        </tr>
      `;
    });
  }

  tbody.innerHTML = html;

  if(summary){
    summary.innerHTML = `
      <div class="card" style="text-align:center;border-left:4px solid #22c55e">
        <div style="font-size:12px;opacity:.7;font-weight:600">Total In</div>
        <div style="font-size:20px;font-weight:900;color:#22c55e">+₹${filteredIn}</div>
      </div>
      <div class="card" style="text-align:center;border-left:4px solid #ef4444">
        <div style="font-size:12px;opacity:.7;font-weight:600">Total Out</div>
        <div style="font-size:20px;font-weight:900;color:#ef4444">-₹${filteredOut}</div>
      </div>
      <div class="card" style="text-align:center;border-left:4px solid #3b82f6">
        <div style="font-size:12px;opacity:.7;font-weight:600">Net</div>
        <div style="font-size:20px;font-weight:900;color:#3b82f6">₹${filteredIn - filteredOut}</div>
      </div>
    `;
  }
}

function exportStatementsPDF(){
  const el = document.getElementById('stmtPdfArea');
  if(!el){
    alert('Nothing to export');
    return;
  }

  // show header for PDF
  const hdr = document.getElementById('stmtHeader');
  if(hdr){
    hdr.style.display = 'block';
    const from = document.getElementById('stmt_from')?.value || '';
    const to = document.getElementById('stmt_to')?.value || '';
    const rangeEl = document.getElementById('stmtDateRange');
    if(rangeEl){
      if(from || to) rangeEl.textContent = `Period: ${from || 'Start'} to ${to || 'Present'}`;
      else rangeEl.textContent = 'All Transactions';
    }
  }

  const opt = {
    margin: 0.3,
    filename: 'TheXCompany_MoneyPool_Statement.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(el).save().then(() => {
    // hide header again after export
    if(hdr) hdr.style.display = 'none';
  });
}

async function getLiveSharePrice(){
  const { data: companyData } = await sb
    .from("company_live_value")
    .select("*")
    .single();

  const { data: shareCfg } = await sb
    .from("company_shares_config")
    .select("total_shares")
    .single();

  return companyData.company_value / shareCfg.total_shares;
}

async function confirmPayout(empId, shares){
  const priceRes = await sb
    .from("company_share_price")
    .select("price")
    .order("created_at",{ascending:false})
    .limit(1);

  const price = priceRes.data[0].price;
  const total = shares * price;

  // Locked Bonus feature removed: full payout immediately.
  // Keep payload compatible with older schemas by setting locked fields to 0/null.
  await sb.from("payouts").insert([{
    employee_id: empId,
    shares_used: shares,
    share_price: price,
    cash_amount: total,
    immediate_cash: total,
    locked_bonus: 0,
    unlock_date: null,
    status: "PAID"
  }]);

  await sb.from("shares_ledger").insert([{
    employee_id: empId,
    shares: -shares
  }]);

  alert("Payout done");
}

function _toISODate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function _formatDateTime(dt){
  if(!dt) return "-";
  const d = new Date(dt);
  if(Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString();
}

function _toDateTimeLocalValue(dt){
  if(!dt) return "";
  const d = new Date(dt);
  if(Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function _boolSelect(value, id){
  const v = value ? "YES" : "NO";
  return `
    <select id="${id}">
      <option value="YES" ${v === "YES" ? "selected" : ""}>YES</option>
      <option value="NO" ${v === "NO" ? "selected" : ""}>NO</option>
    </select>
  `;
}

function _selectOptions({ id, value, options }){
  const v = (value ?? "NONE");
  const opts = options.map(o => `<option value="${o}" ${String(o) === String(v) ? "selected" : ""}>${o}</option>`).join("");
  return `<select id="${id}">${opts}</select>`;
}

function openMeeshoImage(url){
  const u = (url || "").trim();
  if(!u){
    alert("No image found for this entry");
    return;
  }
  window.open(u, "_blank", "noopener,noreferrer");
}

function openMeeshoBillPdf(url){
  const u = (url || "").trim();
  if(!u){
    alert("No bill PDF found for this entry");
    return;
  }
  window.open(u, "_blank", "noopener,noreferrer");
}

function _monthsElapsed(startDateStr){
  if(!startDateStr) return 0;
  const start = new Date(startDateStr);
  if(Number.isNaN(start.getTime())) return 0;

  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if(now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function _salaryComponentsFromBasic(basic){
  const b = Number(basic || 0);
  const basicPay = Number.isFinite(b) ? b : 0;
  const da = basicPay * 0.50;
  const hra = basicPay * 0.20;
  const medical = basicPay * 0.10;
  const wifi = basicPay * 0.04;
  const gross = basicPay + da + hra + medical + wifi;
  return { basicPay, da, hra, medical, wifi, gross };
}

function _monthlyRateFromAnnual(annualRate){
  const r = Number(annualRate);
  const ar = Number.isFinite(r) ? r : 0;
  return Math.pow(1 + ar, 1 / 12) - 1;
}

function _salaryProjection({ basicPay, startDate, annualRate }){
  const months = _monthsElapsed(startDate);
  const rm = _monthlyRateFromAnnual(annualRate);

  const base = _salaryComponentsFromBasic(basicPay);
  const growthFactor = Math.pow(1 + rm, months);
  const currentBasic = base.basicPay * growthFactor;
  const current = _salaryComponentsFromBasic(currentBasic);

  let accumulated = 0;
  if(months <= 0){
    accumulated = 0;
  } else if(Math.abs(rm) < 1e-9){
    accumulated = base.gross * months;
  } else {
    accumulated = base.gross * ((growthFactor - 1) / rm);
  }

  return {
    months,
    annualRate: Number.isFinite(Number(annualRate)) ? Number(annualRate) : 0.06,
    current,
    accumulated
  };
}

function _ymLabelFromDate(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function _salaryMonthlySchedule({ basicPay, startDate, annualRate, maxMonths = 240 }){
  const baseBasic = Number(basicPay || 0);
  const start = new Date(startDate);
  if(!startDate || Number.isNaN(start.getTime())) return [];
  if(!Number.isFinite(baseBasic) || baseBasic <= 0) return [];

  const monthsElapsed = _monthsElapsed(startDate);
  const rm = _monthlyRateFromAnnual(annualRate);
  const monthsToShow = Math.min(monthsElapsed + 1, Math.max(1, maxMonths));

  const rows = [];
  let cumulative = 0;
  for(let i = 0; i < monthsToShow; i++){
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);

    const factor = Math.pow(1 + rm, i);
    const monthBasic = baseBasic * factor;
    const comp = _salaryComponentsFromBasic(monthBasic);
    cumulative += comp.gross;

    rows.push({
      monthNo: i + 1,
      ym: _ymLabelFromDate(d),
      basicPay: comp.basicPay,
      da: comp.da,
      hra: comp.hra,
      medical: comp.medical,
      wifi: comp.wifi,
      gross: comp.gross,
      cumulative
    });
  }

  return rows;
}



async function _hashPw(pw){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function showAddEmployee(){
  title.innerText = "Add Employee / PM User";
  if(typeof subtitleEl !== 'undefined' && subtitleEl) subtitleEl.textContent = 'Manage team & PM access';

  const todayISO = _toISODate(new Date());

  // Load existing PM users
  const { data: pmUsers } = await sb.from('pm_login_users').select('id,name,username,created_at').order('created_at',{ascending:false});
  const pmRows = (pmUsers||[]).map(p => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-weight:500;color:#111827">${p.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;color:#6B7280;font-family:monospace;font-size:13px">${p.username}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;text-align:right">
        <button onclick="deletePMUser('${p.id}')" style="background:none;color:#EF4444;border:1px solid #FCA5A5;border-radius:8px;padding:4px 12px;font-size:12px;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='none'">Remove</button>
      </td>
    </tr>
  `).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">

      <!-- LEFT: Add Employee -->
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:28px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 10px 25px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <div style="width:44px;height:44px;background:#3B82F6;border-radius:12px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#111827">Add Employee</div>
            <div style="font-size:13px;color:#6B7280">Add new team member</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px">
          <input id="emp_name" placeholder="Employee Name" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#E5E7EB'">
          <input id="emp_role" placeholder="Role" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#E5E7EB'">

          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 0">
            <input id="emp_salary_fixed" type="checkbox" style="width:18px;height:18px;accent-color:#3B82F6" />
            <span style="font-size:14px;color:#374151;font-weight:500">Salary Fixed</span>
          </label>

          <input id="emp_basic_pay" type="number" placeholder="Basic Pay (₹)" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#E5E7EB'">
          <input id="emp_start_date" type="date" value="${todayISO}" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#3B82F6'" onblur="this.style.borderColor='#E5E7EB'">
          <div style="font-size:12px;color:#9CA3AF;margin-top:-6px">Annual rate: 6% (compounded monthly)</div>

          <button onclick="saveEmployee()" style="width:100%;padding:14px;background:#3B82F6;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">Save Employee</button>
        </div>
      </div>

      <!-- RIGHT: Add PM User -->
      <div style="display:flex;flex-direction:column;gap:24px">
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:28px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 10px 25px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
            <div style="width:44px;height:44px;background:#7C3AED;border-radius:12px;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            </div>
            <div>
              <div style="font-size:18px;font-weight:700;color:#111827">Add PM User</div>
              <div style="font-size:13px;color:#6B7280">Create PM panel login credentials</div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px">
            <input id="pm_name" placeholder="Full Name" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'">
            <input id="pm_username" placeholder="Username (login ID)" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'">
            <input id="pm_password" type="password" placeholder="Password" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'">

            <div>
              <div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:6px">Under which</div>
              <select id="pm_category" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;background:#fff;color:#111827;transition:border .2s" onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'">
                <option value="EMPLOYEE">Employee</option>
                <option value="CO_FOUNDER">Co-founder</option>
                <option value="BOARD_OF_DIRECTORS">Board of Directors</option>
                <option value="PRIMARY_MANAGER">Primary Manager</option>
              </select>
            </div>
            <input id="pm_under_name" placeholder="Name (e.g. Mukul)" style="width:100%;padding:12px 16px;border:1px solid #E5E7EB;border-radius:10px;font-size:14px;outline:none;transition:border .2s" onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'">

            <button onclick="savePMUser()" style="width:100%;padding:14px;background:#7C3AED;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#6D28D9'" onmouseout="this.style.background='#7C3AED'">Create PM Login</button>
          </div>
        </div>

        <!-- Existing PM Users -->
        ${(pmUsers||[]).length > 0 ? `
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:24px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 10px 25px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
          <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:16px">PM Users (${(pmUsers||[]).length})</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#F9FAFB">
                <th style="text-align:left;padding:8px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Name</th>
                <th style="text-align:left;padding:8px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Username</th>
                <th style="text-align:right;padding:8px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Action</th>
              </tr>
            </thead>
            <tbody>${pmRows}</tbody>
          </table>
        </div>
        ` : ''}
      </div>

    </div>
  `;
}

async function savePMUser(){
  const name = (document.getElementById('pm_name')?.value||'').trim();
  const username = (document.getElementById('pm_username')?.value||'').trim();
  const password = (document.getElementById('pm_password')?.value||'').trim();

  if(!name || !username || !password){
    alert('Name, Username aur Password sab bharo');
    return;
  }
  if(password.length < 4){
    alert('Password kam se kam 4 characters ka hona chahiye');
    return;
  }

  const hash = await _hashPw(password);
  const { error } = await sb.from('pm_login_users').insert([{
    name, username, password_hash: hash
  }]);

  if(error){
    if(error.message?.includes('duplicate') || error.code === '23505'){
      alert('Ye username already le liya hai, doosra daalo');
    } else {
      alert('Error: ' + (error.message||''));
      console.error(error);
    }
    return;
  }

  // Also add as employee
  const pmCat = (document.getElementById('pm_category')?.value || 'PRIMARY_MANAGER');
  const pmUnder = (document.getElementById('pm_under_name')?.value || '').trim();
  const pmRole = pmUnder ? pmCat + '- ' + pmUnder : 'PRIMARY_MANAGER';
  const { error: empErr } = await sb.from('employees').insert([{
    name: name,
    role: pmRole,
    active: true
  }]);
  if(empErr) console.error('Employee insert warning:', empErr);

  alert('PM user create ho gaya! Username: ' + username);
  showAddEmployee();
}

async function deletePMUser(id){
  if(!confirm('PM user delete karna hai?')) return;
  const { error } = await sb.from('pm_login_users').delete().eq('id', id);
  if(error){ alert('Error: '+(error.message||'')); return; }
  showAddEmployee();
}
async function saveEmployee(){
  const name = document.getElementById("emp_name").value;
  const role = document.getElementById("emp_role").value;
  const salaryFixed = !!document.getElementById("emp_salary_fixed")?.checked;
  const basicPay = Number(document.getElementById("emp_basic_pay")?.value || 0);
  const startDate = (document.getElementById("emp_start_date")?.value || "").trim();

  if(!name || !role){
    alert("Name aur Role bhar");
    return;
  }

  if(salaryFixed){
    if(!Number.isFinite(basicPay) || basicPay <= 0){
      alert("Basic Pay sahi daalo (Salary Fixed enabled hai)");
      return;
    }
    if(!startDate){
      alert("Start date select karo");
      return;
    }
  }

  const { data: created, error } = await sb.from("employees").insert([
    {
      name: name,
      role: role,
      active: true
    }
  ]).select("id").single();

  if(error){
    alert("Error aaya, console dekh");
    console.error(error);
    return;
  }

  if(salaryFixed && created?.id){
    const cfgRes = await sb.from("employee_salary_config").upsert([{
      employee_id: created.id,
      salary_fixed: true,
      basic_pay: basicPay,
      start_date: startDate,
      annual_rate: 0.06
    }]);
    if(cfgRes?.error){
      console.error(cfgRes.error);
      alert("Employee saved, but salary config save failed: " + (cfgRes.error.message || ""));
    }
  }

  alert("Employee add ho gaya");
  showEmployees();
}


async function showBusinesses(){
  title.innerText = "Portfolio";
  content.innerHTML = `<div class='container'><div class='card'>Loading portfolio...</div></div>`;

  function inr(n){
    const num = Number(n || 0);
    try { return `₹${num.toLocaleString('en-IN')}`; }
    catch(e){ return `₹${num}`; }
  }

  function businessValuation(b){
    const raw = (
      (b && (b.value ?? b.valuation ?? b.business_value ?? b.current_value ?? b.amount ?? b.total_value ?? b.valuation_amount))
    );
    const num = Number(raw ?? 0);
    return Number.isFinite(num) ? num : 0;
  }

  function iconSvg(kind){
    // lightweight inline SVG icons (lucide-like), no external deps
    const common = `width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    switch(kind){
      case 'dollar':
        return `<svg ${common}><path d="M12 2v20"/><path d="M17 6H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7"/></svg>`;
      case 'wallet':
        return `<svg ${common}><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/><path d="M21 8H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h13"/><path d="M16 12h.01"/></svg>`;
      case 'briefcase':
        return `<svg ${common}><path d="M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z"/><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 12h18"/></svg>`;
      case 'pie':
        return `<svg ${common}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`;
      case 'trendUp':
        return `<svg ${common}><path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/></svg>`;
      case 'trendDown':
        return `<svg ${common}><path d="M3 7l6 6 4-4 7 7"/><path d="M14 16h6v-6"/></svg>`;
      case 'bars':
        return `<svg ${common}><path d="M3 3v18h18"/><path d="M7 16v-6"/><path d="M11 16v-9"/><path d="M15 16v-4"/><path d="M19 16v-11"/></svg>`;
      case 'pig':
        return `<svg ${common}><path d="M5 11c0-3 2.5-5 6-5s6 2 6 5v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4z"/><path d="M17 10h2v4h-2"/><path d="M7 9h.01"/><path d="M12 6V4"/></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="9"/></svg>`;
    }
  }

  function miniLineSvg(values, stroke){
    const w = 80, h = 48;
    const pts = (values || []).slice(-7);
    if(pts.length < 2){
      return `<svg class="bp-mini" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
    const min = Math.min.apply(null, pts);
    const max = Math.max.apply(null, pts);
    const span = (max - min) || 1;
    const step = (w - 2) / (pts.length - 1);
    const points = pts.map((v, i) => {
      const x = 1 + i * step;
      const y = (h - 4) - ((Number(v) - min) / span) * (h - 8);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    return `
      <svg class="bp-mini" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <polyline fill="none" stroke="${stroke}" stroke-width="2" points="${points}" />
      </svg>
    `;
  }

  // Businesses
  let businesses = null;
  {
    // Use '*' so we don't reference a column that may not exist (e.g. 'value')
    const res = await sb.from("businesses").select("*");
    if(res.error){
      content.innerHTML = `<div class='container'><div class='card'>Failed to load businesses<br><div style='opacity:.8;margin-top:8px'>${res.error.message || ''}</div></div></div>`;
      return;
    }
    businesses = res.data || [];
  }

  // Reports (used for portfolio metrics + mini trends)
  let reports = [];
  {
    const rep = await sb
      .from("reports")
      .select("business_id, month, profit, income, expense, created_at");
    if(!rep.error && rep.data) reports = rep.data;
  }

  // Aggregate per-business stats
  const agg = {}; // id -> { income, expense, profitNet, profitPos, lossAbs, profitsSeries[] }
  for(const r of (reports || [])){
    const id = r.business_id;
    if(!id) continue;
    if(!agg[id]){
      agg[id] = { income:0, expense:0, profitNet:0, profitPos:0, lossAbs:0, series:[] };
    }
    const income = Number(r.income || 0);
    const expense = Number(r.expense || 0);
    const p = (r.profit !== null && r.profit !== undefined)
      ? Number(r.profit || 0)
      : (income - expense);

    agg[id].income += income;
    agg[id].expense += expense;
    agg[id].profitNet += p;
    if(p >= 0) agg[id].profitPos += p;
    else agg[id].lossAbs += Math.abs(p);
    agg[id].series.push({
      key: r.month || (r.created_at ? String(r.created_at).slice(0,10) : ""),
      value: p
    });
  }

  // Portfolio totals
  let totalValuation = 0;
  let totalInvested = 0; // defined as total expense across reports
  let totalIncome = 0;
  let totalNet = 0;
  businesses.forEach(b => {
    totalValuation += businessValuation(b);
    const a = agg[b.id] || { income:0, expense:0, profitNet:0 };
    totalInvested += Number(a.expense || 0);
    totalIncome += Number(a.income || 0);
    totalNet += Number(a.profitNet || 0);
  });
  const totalVariance = totalValuation - totalInvested;

  const varianceClass = totalVariance >= 0 ? 'bp-pos' : 'bp-neg';
  const netClass = totalNet >= 0 ? 'bp-pos' : 'bp-neg';

  // UI
  let html = `
    <div class="bp-page">
      <header class="bp-header">
        <div class="bp-container bp-header-inner">
          <div>
            <div class="bp-title">Portfolio Dashboard</div>
            <div class="bp-subtitle">Business Performance Overview</div>
          </div>
          <div class="bp-total">
            <div class="bp-total-label">Total Portfolio Value</div>
            <div class="bp-total-value">${inr(totalValuation)}</div>
          </div>
        </div>
      </header>

      <main class="bp-main">
        <div class="bp-container">
          <div class="bp-summary-grid">
            <div class="bp-summary-card">
              <div class="bp-row">
                <div class="bp-ic" style="background:#EFF6FF;color:#2563EB">${iconSvg('dollar')}</div>
                <div>
                  <div class="bp-label">Total Invested</div>
                  <div class="bp-value">${inr(totalInvested)}</div>
                </div>
              </div>
            </div>
            <div class="bp-summary-card">
              <div class="bp-row">
                <div class="bp-ic" style="background:#F5F3FF;color:#9333EA">${iconSvg('pie')}</div>
                <div>
                  <div class="bp-label">Variance</div>
                  <div class="bp-value ${varianceClass}">${totalVariance >= 0 ? '+' : ''}${inr(totalVariance).replace('₹','₹')}</div>
                </div>
              </div>
            </div>
            <div class="bp-summary-card">
              <div class="bp-row">
                <div class="bp-ic" style="background:#ECFDF5;color:#10B981">${iconSvg('trendUp')}</div>
                <div>
                  <div class="bp-label">Net Profit</div>
                  <div class="bp-value ${netClass}">${inr(totalNet)}</div>
                </div>
              </div>
            </div>
            <div class="bp-summary-card">
              <div class="bp-row">
                <div class="bp-ic" style="background:#FFF7ED;color:#EA580C">${iconSvg('wallet')}</div>
                <div>
                  <div class="bp-label">Cash (Revenue)</div>
                  <div class="bp-value">${inr(totalIncome)}</div>
                </div>
              </div>
            </div>
            <div class="bp-summary-card">
              <div class="bp-row">
                <div class="bp-ic" style="background:#F3F4F6;color:#4B5563">${iconSvg('briefcase')}</div>
                <div>
                  <div class="bp-label">Businesses</div>
                  <div class="bp-value">${(businesses || []).length}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bp-section-title">Business Ventures</div>
  `;

  const categories = _getBusinessCategories();
  const catSet = new Set((categories || []).map(c => String(c || "").trim().toLowerCase()));
  const grouped = {}; // cat -> businesses[]
  const other = [];

  (businesses || []).forEach(b => {
    const cat = String(b?.type || "").trim().toLowerCase();
    if(cat && catSet.has(cat)){
      if(!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(b);
    } else {
      other.push(b);
    }
  });

  function esc(s){
    return String(s ?? "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderBusinessCard(b, categoryLabel){
    const a = agg[b.id] || { income:0, expense:0, profitNet:0, profitPos:0, lossAbs:0, series:[] };
    const valuation = businessValuation(b);
    const invested = Number(a.expense || 0);
    const variance = valuation - invested;
    const variancePct = invested > 0 ? ((variance / invested) * 100) : 0;
    const net = Number(a.profitNet || 0);
    const profit = Number(a.profitPos || 0);
    const loss = Number(a.lossAbs || 0);
    const cash = Number(a.income || 0);
    const isPos = variance >= 0;
    const vClass = isPos ? 'bp-pos' : 'bp-neg';
    const netClass2 = net >= 0 ? 'bp-pos' : 'bp-neg';

    // series: sort by key (month), then take values
    const seriesVals = (a.series || [])
      .slice()
      .sort((x,y) => String(x.key).localeCompare(String(y.key)))
      .map(s => Number(s.value || 0));
    const stroke = net >= 0 ? '#10B981' : '#EF4444';

    html += `
      <div class="bp-card">
        <div class="bp-card-h">
          <div style="min-width:0">
            <div class="bp-card-title">${esc(b.name || '-')}</div>
            <div style="opacity:.75;font-size:12px;margin-top:2px">Under ${esc(categoryLabel || (b.type || 'business'))} category</div>
            <span class="bp-badge">${esc(categoryLabel || (b.type || 'Business'))}</span>
          </div>
          ${miniLineSvg(seriesVals, stroke)}
        </div>

        <div class="bp-card-c">
          <div class="bp-kpi">
            <div class="bp-left">
              <span class="bp-mic" style="color:#4B5563">${iconSvg('bars').replace('width="20"','width="16"').replace('height="20"','height="16"')}</span>
              <span class="bp-klabel">Valuation</span>
            </div>
            <div class="bp-kvalue">${inr(valuation)}</div>
          </div>

          <div class="bp-row2">
            <div class="bp-left">
              <span class="bp-mic" style="color:#4B5563">${iconSvg('pig').replace('width="20"','width="16"').replace('height="20"','height="16"')}</span>
              <span class="bp-slabel">Invested</span>
            </div>
            <div class="bp-svalue">${inr(invested)}</div>
          </div>

          <div class="bp-row2">
            <div class="bp-left">
              <span style="display:inline-flex;align-items:center;justify-content:center;color:${isPos ? '#10B981' : '#EF4444'}">
                ${iconSvg(isPos ? 'trendUp' : 'trendDown').replace('width="20"','width="16"').replace('height="20"','height="16"')}
              </span>
              <span class="bp-slabel">Variance</span>
            </div>
            <div class="bp-svalue ${vClass}">${variance >= 0 ? '+' : ''}${inr(variance)} (${variancePct.toFixed(1)}%)</div>
          </div>

          <div class="bp-split">
            <div class="bp-col">
              <div class="bp-left" style="gap:6px">
                <span style="color:#10B981;display:inline-flex">${iconSvg('trendUp').replace('width="20"','width="14"').replace('height="20"','height="14"')}</span>
                <span class="bp-label" style="margin:0">Profit</span>
              </div>
              <div class="bp-svalue bp-pos">${inr(profit)}</div>
            </div>
            <div class="bp-col">
              <div class="bp-left" style="gap:6px">
                <span style="color:#EF4444;display:inline-flex">${iconSvg('trendDown').replace('width="20"','width="14"').replace('height="20"','height="14"')}</span>
                <span class="bp-label" style="margin:0">Loss</span>
              </div>
              <div class="bp-svalue bp-neg">${inr(loss)}</div>
            </div>
          </div>

          <div class="bp-split" style="border-top:none;padding-top:8px;margin-top:8px;">
            <div class="bp-col">
              <div class="bp-label" style="margin:0">Net P&L</div>
              <div class="bp-svalue ${netClass2}">${inr(net)}</div>
            </div>
            <div class="bp-col">
              <div class="bp-left" style="gap:6px">
                <span style="color:#4B5563;display:inline-flex">${iconSvg('wallet').replace('width="20"','width="14"').replace('height="20"','height="14"')}</span>
                <span class="bp-label" style="margin:0">Cash</span>
              </div>
              <div class="bp-svalue">${inr(cash)}</div>
            </div>
          </div>

          <div class="bp-actions">
            <button class="bp-btn" onclick='openBusiness(${JSON.stringify(String(b.id))}, ${JSON.stringify(String(b.name || ""))})'>Open</button>
            <button class="bp-btn bp-btn-danger" onclick='deleteBusiness(${JSON.stringify(String(b.id))}, ${JSON.stringify(String(b.name || ""))})'>Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderCategorySection(cat, list){
    if(!list || list.length === 0) return;
    html += `
      <div class="bp-section-title" style="margin-top:18px">${esc(cat)} category</div>
      <div class="bp-business-grid">
    `;
    list.forEach(b => renderBusinessCard(b, cat));
    html += `</div>`;
  }

  (categories || []).forEach(cat => {
    const key = String(cat || "").trim().toLowerCase();
    renderCategorySection(key, grouped[key] || []);
  });

  renderCategorySection("other", other);

  html += `
        </div>
      </main>
    </div>
  `;

  content.innerHTML = html;
}

async function showPMReports(){
  title.innerText = "PM Daily Reports";
  content.innerHTML = `<div class='container'><div class='card'>Loading PM reports...</div></div>`;

  function inr(n){
    const num = Number(n || 0);
    try { return `₹${num.toLocaleString('en-IN')}`; } catch(e){ return `₹${num}`; }
  }
  function esc(s){
    return String(s ?? "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Load businesses for name lookup
  const bizRes = await sb.from("businesses").select("id,name,type");
  const bizMap = {};
  (bizRes.data || []).forEach(b => { bizMap[b.id] = b; });

  // Load all reports
  const repRes = await sb.from("reports").select("*").order("created_at", { ascending: false });
  if(repRes.error){
    content.innerHTML = `<div class='container'><div class='card'>Failed to load reports<br><div style='opacity:.8;margin-top:8px'>${esc(repRes.error.message)}</div></div></div>`;
    return;
  }

  const reports = repRes.data || [];

  if(reports.length === 0){
    content.innerHTML = `<div class='container'><div class='card'><h3 style='margin-top:0'>PM Daily Reports</h3><p style='opacity:.8'>No reports submitted yet. PM will enter daily reports from the PM Panel.</p></div></div>`;
    return;
  }

  // Summary totals
  let totalIncome = 0, totalExpense = 0, totalProfit = 0, totalPool = 0;
  reports.forEach(r => {
    totalIncome += Number(r.income || 0);
    totalExpense += Number(r.expense || 0);
    totalProfit += Number(r.profit ?? (Number(r.income||0) - Number(r.expense||0)));
    totalPool += Number(r.pool_taken || 0);
  });

  let html = `<div class='container' style='max-width:1100px;gap:18px;'>`;

  // Summary cards
  html += `
    <div class='card'>
      <h3 style='margin-top:0;'>PM Daily Reports</h3>
      <p style='opacity:.8;margin-bottom:14px'>All daily entries submitted by Primary Manager</p>
      <div style='display:flex;gap:14px;flex-wrap:wrap;'>
        <div style='flex:1 1 180px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;text-align:center;'>
          <div style='font-size:12px;opacity:.7'>Total Revenue</div>
          <div style='font-size:1.3rem;font-weight:700;color:#10B981;margin-top:4px'>${inr(totalIncome)}</div>
        </div>
        <div style='flex:1 1 180px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;text-align:center;'>
          <div style='font-size:12px;opacity:.7'>Total Expense</div>
          <div style='font-size:1.3rem;font-weight:700;color:#EF4444;margin-top:4px'>${inr(totalExpense)}</div>
        </div>
        <div style='flex:1 1 180px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;text-align:center;'>
          <div style='font-size:12px;opacity:.7'>Net Profit</div>
          <div style='font-size:1.3rem;font-weight:700;color:${totalProfit >= 0 ? '#10B981' : '#EF4444'};margin-top:4px'>${inr(totalProfit)}</div>
        </div>
        <div style='flex:1 1 180px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;text-align:center;'>
          <div style='font-size:12px;opacity:.7'>Pool Taken</div>
          <div style='font-size:1.3rem;font-weight:700;margin-top:4px'>${inr(totalPool)}</div>
        </div>
      </div>
    </div>
  `;

  // Reports table
  html += `
    <div class='card' style='overflow-x:auto;'>
      <h3 style='margin-top:0;'>All Reports (${reports.length})</h3>
      <table style='width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;'>
        <thead>
          <tr style='background:rgba(0,0,0,.04);'>
            <th style='padding:10px 12px;text-align:left;border-bottom:2px solid rgba(0,0,0,.1);'>Date</th>
            <th style='padding:10px 12px;text-align:left;border-bottom:2px solid rgba(0,0,0,.1);'>Business</th>
            <th style='padding:10px 12px;text-align:right;border-bottom:2px solid rgba(0,0,0,.1);'>Revenue</th>
            <th style='padding:10px 12px;text-align:right;border-bottom:2px solid rgba(0,0,0,.1);'>Expense</th>
            <th style='padding:10px 12px;text-align:right;border-bottom:2px solid rgba(0,0,0,.1);'>Profit</th>
            <th style='padding:10px 12px;text-align:right;border-bottom:2px solid rgba(0,0,0,.1);'>Pool Taken</th>
            <th style='padding:10px 12px;text-align:left;border-bottom:2px solid rgba(0,0,0,.1);'>Submitted</th>
          </tr>
        </thead>
        <tbody>
  `;

  reports.forEach(r => {
    const biz = bizMap[r.business_id];
    const bizName = biz ? esc(biz.name) : (r.business_id ? r.business_id.slice(0,8)+'...' : '-');
    const date = r.report_date || '-';
    const income = Number(r.income || 0);
    const expense = Number(r.expense || 0);
    const profit = Number(r.profit ?? (income - expense));
    const poolTaken = Number(r.pool_taken || 0);
    const submitted = r.created_at ? new Date(r.created_at).toLocaleString('en-IN', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
    const profitColor = profit >= 0 ? '#10B981' : '#EF4444';

    html += `
      <tr style='border-bottom:1px solid rgba(0,0,0,.06);'>
        <td style='padding:10px 12px;'>${esc(date)}</td>
        <td style='padding:10px 12px;font-weight:600;'>${bizName}</td>
        <td style='padding:10px 12px;text-align:right;'>${inr(income)}</td>
        <td style='padding:10px 12px;text-align:right;color:#EF4444;'>${inr(expense)}</td>
        <td style='padding:10px 12px;text-align:right;font-weight:600;color:${profitColor};'>${inr(profit)}</td>
        <td style='padding:10px 12px;text-align:right;'>${inr(poolTaken)}</td>
        <td style='padding:10px 12px;opacity:.75;font-size:12px;'>${submitted}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div></div>`;
  content.innerHTML = html;
}

/* ================= POOL EMAIL OTP CONFIG (Founder info page) ================= */
function showPoolEmailConfig(){
  title.innerText = "📧 Pool OTP Config";
  content.innerHTML = `
    <div class='container' style='max-width:700px;'>
      <div class='card'>
        <h3 style='margin-top:0;'>Pool Money – Email OTP System</h3>
        <p style='opacity:.8;margin-bottom:14px'>When a PM requests or submits money, an <b>email with the amount and a 6-digit OTP</b> is sent to the Founder's email address configured in the server.</p>
        <div style="padding:14px;background:rgba(14,165,233,0.06);border-radius:12px;border:1px solid #bae6fd;">
          <b>How it works:</b>
          <ol style="margin:10px 0 0 0;padding-left:18px;line-height:1.9;">
            <li>PM enters the amount and clicks <b>"Generate OTP"</b></li>
            <li>Backend sends an email to you with the <b>exact amount</b> and a 6-digit OTP</li>
            <li>You verify the amount in the email and tell the PM the OTP</li>
            <li>PM enters OTP → transaction is approved</li>
          </ol>
        </div>
        <div style="margin-top:16px;padding:12px;background:#FEF3C7;border-radius:10px;font-size:13px;">
          ⚠️ OTP expires in <b>2 minutes</b>. Max <b>3 wrong attempts</b> per OTP. Email address is set via <code>FOUNDER_EMAIL</code> in backend <code>.env</code> file.
        </div>
      </div>
    </div>
  `;
}

function showDataEntriesHome(){
  title.innerText = "Data Entries";
  content.innerHTML = `
    <div class="section">
      <div class="section-title">Data Entries</div>
      <div style="font-size:13px;color:#666;margin-bottom:14px">Select entry type</div>
      <button class="btn btn-dark" onclick="showMeeshoEntries()">Meesho Entries</button>
    </div>
  `;
}

async function showMeeshoEntries(){
  title.innerText = "Meesho Entries";

  content.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <div class="section-title" style="margin-bottom:0;border:none;padding:0">Meesho Entries</div>
        <button class="btn btn-dark" onclick="showDataEntriesHome()">← Back</button>
      </div>

      <div style="padding:14px;border:1px solid #e5e5e5;border-radius:6px;background:#fff;margin-bottom:16px">
        <div style="font-weight:700;margin-bottom:10px;font-size:14px">Add Entry</div>
        <div class="form-grid">
          <div class="field">
            <label>Date & Time</label>
            <input id="me_dt" type="datetime-local" />
          </div>
          <div class="field">
            <label>Sub Order ID</label>
            <input id="me_sub" type="text" placeholder="Manual number" />
          </div>
          <div class="field">
            <label>Cost Price</label>
            <input id="me_cost" type="number" placeholder="₹" />
          </div>
          <div class="field">
            <label>Meesho Selling Price</label>
            <input id="me_sell" type="number" placeholder="₹" />
          </div>
          <div class="field">
            <label>Dispatched</label>
            <select id="me_dispatched"><option value="NO">NO</option><option value="YES">YES</option></select>
          </div>
          <div class="field">
            <label>Delivered</label>
            <select id="me_delivered"><option value="NO">NO</option><option value="YES">YES</option></select>
          </div>
          <div class="field">
            <label>Return</label>
            <select id="me_return">
              <option value="NONE">NONE</option>
              <option value="RTO">RTO</option>
              <option value="RETURN">RETURN</option>
              <option value="REPLACE">REPLACE</option>
            </select>
          </div>
          <div class="field">
            <label>Cancelled</label>
            <select id="me_cancel">
              <option value="NONE">NONE</option>
              <option value="US">CANCELLED BY US</option>
              <option value="USER">CANCELLED BY USER</option>
            </select>
          </div>
          <div class="field">
            <label>Image</label>
            <input id="me_img" type="file" accept="image/*" />
          </div>
          <div class="field">
            <label>Bill (PDF)</label>
            <input id="me_pdf" type="file" accept="application/pdf,.pdf" />
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-blue" onclick="addMeeshoEntry()">Add Entry</button>
          <div id="me_msg" class="msg"></div>
        </div>
      </div>

      <div class="table-wrap">
        <div id="me_table"></div>
      </div>
    </div>
  `;

  // default dt to now
  const dt = document.getElementById("me_dt");
  if(dt && !dt.value){
    dt.value = _toDateTimeLocalValue(new Date());
  }

  await loadMeeshoEntries();
}

async function _uploadMeeshoImage(file, subOrderId){
  if(!file) return null;
  const bucket = "meesho-entry-images";
  const safeSub = String(subOrderId || "order").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const ext = (file.name && file.name.includes(".")) ? file.name.split(".").pop() : "jpg";
  const path = `${safeSub}/${Date.now()}.${ext}`;

  const up = await sb.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if(up.error){
    throw up.error;
  }

  const pub = sb.storage.from(bucket).getPublicUrl(path);
  const url = pub?.data?.publicUrl || null;
  return url;
}

async function _uploadMeeshoBillPdf(file, subOrderId){
  if(!file) return null;
  const bucket = "meesho-entry-bills";
  const safeSub = String(subOrderId || "order").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const extRaw = (file.name && file.name.includes(".")) ? file.name.split(".").pop() : "pdf";
  const ext = String(extRaw || "pdf").toLowerCase();
  const path = `${safeSub}/${Date.now()}.${ext === "pdf" ? "pdf" : "pdf"}`;

  const up = await sb.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || "application/pdf" });

  if(up.error){
    throw up.error;
  }

  const pub = sb.storage.from(bucket).getPublicUrl(path);
  const url = pub?.data?.publicUrl || null;
  return url;
}

async function loadMeeshoEntries(){
  const tableEl = document.getElementById("me_table");
  if(!tableEl) return;

  const { data, error } = await sb
    .from("meesho_entries")
    .select("*")
    .order("entry_datetime", { ascending: false });

  if(error){
    tableEl.innerHTML = `<div style="padding:12px;border:1px solid #e5e5e5;border-radius:6px;background:#fff">Failed to load. Run SQL: <b>backend/sql/meesho_entries.sql</b><br><div style="color:#666;margin-top:6px;font-size:13px">${error.message || ""}</div></div>`;
    console.error(error);
    return;
  }

  const editId = window.__meeshoEditId || null;

  const rowsHtml = (data || []).map(r => {
    const isEdit = editId && r.id === editId;
    if(isEdit){
      const viewBtn = r.image_url
        ? `<button type="button" onclick='openMeeshoImage(${JSON.stringify(r.image_url)})'>View Image</button>`
        : `<span style="opacity:.7">No image</span>`;
      const viewPdfBtn = r.bill_pdf_url
        ? `<button type="button" onclick='openMeeshoBillPdf(${JSON.stringify(r.bill_pdf_url)})'>View Bill</button>`
        : `<span style="opacity:.7">No bill</span>`;
      return `
        <tr>
          <td><input id="me_e_dt" type="datetime-local" value="${_toDateTimeLocalValue(r.entry_datetime)}" /></td>
          <td><input id="me_e_sub" value="${String(r.sub_order_id || "").replace(/"/g,'&quot;')}" /></td>
          <td><input id="me_e_cost" type="number" value="${Number(r.cost_price || 0)}" /></td>
          <td><input id="me_e_sell" type="number" value="${Number(r.selling_price || 0)}" /></td>
          <td>${_boolSelect(!!r.dispatched, "me_e_dis")}</td>
          <td>${_boolSelect(!!r.delivered, "me_e_del")}</td>
          <td>${_selectOptions({ id: "me_e_ret", value: r.return_status, options: ["NONE","RTO","RETURN","REPLACE"] })}</td>
          <td>${_selectOptions({ id: "me_e_can", value: r.cancelled_by, options: ["NONE","US","USER"] })}</td>
          <td>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${viewBtn}
              <input id="me_e_img" type="file" accept="image/*" />
            </div>
          </td>
          <td>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${viewPdfBtn}
              <input id="me_e_pdf" type="file" accept="application/pdf,.pdf" />
            </div>
          </td>
          <td style="white-space:nowrap">
            <button onclick="saveMeeshoEntry('${r.id}')">Save</button>
            <button style="margin-left:6px" onclick="cancelMeeshoEdit()">Cancel</button>
          </td>
        </tr>
      `;
    }

    const imgCell = r.image_url
      ? `<button type="button" onclick='openMeeshoImage(${JSON.stringify(r.image_url)})'>View Image</button>`
      : `<span style="opacity:.7">-</span>`;

    const pdfCell = r.bill_pdf_url
      ? `<button type="button" onclick='openMeeshoBillPdf(${JSON.stringify(r.bill_pdf_url)})'>View Bill</button>`
      : `<span style="opacity:.7">-</span>`;

    return `
      <tr>
        <td>${_formatDateTime(r.entry_datetime)}</td>
        <td>${r.sub_order_id || ""}</td>
        <td>₹${Math.round(Number(r.cost_price || 0))}</td>
        <td>₹${Math.round(Number(r.selling_price || 0))}</td>
        <td>${r.dispatched ? "YES" : "NO"}</td>
        <td>${r.delivered ? "YES" : "NO"}</td>
        <td>${r.return_status || "NONE"}</td>
        <td>${r.cancelled_by || "NONE"}</td>
        <td>${imgCell}</td>
        <td>${pdfCell}</td>
        <td style="white-space:nowrap">
          <button onclick="editMeeshoEntry('${r.id}')">Edit</button>
          <button class="del-btn" style="margin-left:6px" onclick="deleteMeeshoEntry('${r.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  tableEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>DATE & TIME</th>
          <th>SUB ORDER ID</th>
          <th>COST PRICE</th>
          <th>SELLING PRICE</th>
          <th>DISPATCHED</th>
          <th>DELIVERED</th>
          <th>RETURN</th>
          <th>CANCELLED</th>
          <th>IMAGE</th>
          <th>BILL (PDF)</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="11" style="padding:12px;opacity:.8">No entries yet</td></tr>`}
      </tbody>
    </table>
  `;
}

function editMeeshoEntry(id){
  window.__meeshoEditId = id;
  loadMeeshoEntries();
}

function cancelMeeshoEdit(){
  window.__meeshoEditId = null;
  loadMeeshoEntries();
}

async function addMeeshoEntry(){
  const msgEl = document.getElementById("me_msg");
  if(msgEl) msgEl.innerText = "";

  const dtLocal = (document.getElementById("me_dt")?.value || "").trim();
  const sub = (document.getElementById("me_sub")?.value || "").trim();
  const costPrice = Number(document.getElementById("me_cost")?.value || 0);
  const sellingPrice = Number(document.getElementById("me_sell")?.value || 0);
  const dispatched = (document.getElementById("me_dispatched")?.value || "NO") === "YES";
  const delivered = (document.getElementById("me_delivered")?.value || "NO") === "YES";
  const ret = (document.getElementById("me_return")?.value || "NONE").trim();
  const cancel = (document.getElementById("me_cancel")?.value || "NONE").trim();
  const imgFile = document.getElementById("me_img")?.files?.[0] || null;
  const pdfFile = document.getElementById("me_pdf")?.files?.[0] || null;

  if(!sub){
    if(msgEl) msgEl.innerText = "Sub Order ID required";
    return;
  }

  if(!Number.isFinite(costPrice) || costPrice <= 0){
    if(msgEl) msgEl.innerText = "Cost Price required";
    return;
  }
  if(!Number.isFinite(sellingPrice) || sellingPrice <= 0){
    if(msgEl) msgEl.innerText = "Meesho Selling Price required";
    return;
  }

  const entryDT = dtLocal ? new Date(dtLocal) : new Date();
  const payload = {
    entry_datetime: entryDT.toISOString(),
    sub_order_id: sub,
    cost_price: costPrice,
    selling_price: sellingPrice,
    dispatched,
    delivered,
    return_status: ret || "NONE",
    cancelled_by: cancel || "NONE"
  };

  if(imgFile){
    try {
      if(msgEl) msgEl.innerText = "Uploading image...";
      const url = await _uploadMeeshoImage(imgFile, sub);
      if(url) payload.image_url = url;
    } catch (e) {
      console.error(e);
      const message = (e && e.message) ? e.message : "";
      if(msgEl) msgEl.innerText = "Image upload failed. Run backend/sql/meesho_entry_images_storage.sql and ensure bucket exists: meesho-entry-images.";
      alert("Image upload failed: " + message);
      return;
    }
  }

  if(pdfFile){
    try {
      if(msgEl) msgEl.innerText = "Uploading bill PDF...";
      const url = await _uploadMeeshoBillPdf(pdfFile, sub);
      if(url) payload.bill_pdf_url = url;
    } catch (e) {
      console.error(e);
      const message = (e && e.message) ? e.message : "";
      if(msgEl) msgEl.innerText = "Bill PDF upload failed. Run backend/sql/meesho_entry_bills_storage.sql and ensure bucket exists: meesho-entry-bills.";
      alert("Bill PDF upload failed: " + message);
      return;
    }
  }

  const { error } = await sb.from("meesho_entries").insert([payload]);
  if(error){
    console.error(error);
    if(msgEl) msgEl.innerText = "Add failed: " + (error.message || "");
    return;
  }

  if(msgEl) msgEl.innerText = "Added";
  const subEl = document.getElementById("me_sub");
  if(subEl) subEl.value = "";
  const costEl = document.getElementById("me_cost");
  if(costEl) costEl.value = "";
  const sellEl = document.getElementById("me_sell");
  if(sellEl) sellEl.value = "";
  const imgEl = document.getElementById("me_img");
  if(imgEl) imgEl.value = "";
  const pdfEl = document.getElementById("me_pdf");
  if(pdfEl) pdfEl.value = "";
  await loadMeeshoEntries();
}

async function saveMeeshoEntry(id){
  if(!id) return;

  const dtLocal = (document.getElementById("me_e_dt")?.value || "").trim();
  const sub = (document.getElementById("me_e_sub")?.value || "").trim();
  const costPrice = Number(document.getElementById("me_e_cost")?.value || 0);
  const sellingPrice = Number(document.getElementById("me_e_sell")?.value || 0);
  const dispatched = (document.getElementById("me_e_dis")?.value || "NO") === "YES";
  const delivered = (document.getElementById("me_e_del")?.value || "NO") === "YES";
  const ret = (document.getElementById("me_e_ret")?.value || "NONE").trim();
  const cancel = (document.getElementById("me_e_can")?.value || "NONE").trim();
  const imgFile = document.getElementById("me_e_img")?.files?.[0] || null;
  const pdfFile = document.getElementById("me_e_pdf")?.files?.[0] || null;

  if(!sub){
    alert("Sub Order ID required");
    return;
  }
  if(!Number.isFinite(costPrice) || costPrice <= 0){
    alert("Cost Price required");
    return;
  }
  if(!Number.isFinite(sellingPrice) || sellingPrice <= 0){
    alert("Meesho Selling Price required");
    return;
  }

  const entryDT = dtLocal ? new Date(dtLocal) : null;
  const payload = {
    sub_order_id: sub,
    cost_price: costPrice,
    selling_price: sellingPrice,
    dispatched,
    delivered,
    return_status: ret || "NONE",
    cancelled_by: cancel || "NONE"
  };
  if(entryDT && !Number.isNaN(entryDT.getTime())){
    payload.entry_datetime = entryDT.toISOString();
  }

  if(imgFile){
    try {
      const url = await _uploadMeeshoImage(imgFile, sub);
      if(url) payload.image_url = url;
    } catch (e) {
      console.error(e);
      const message = (e && e.message) ? e.message : "";
      alert("Image upload failed: " + message + "\n\nFix: Run backend/sql/meesho_entry_images_storage.sql and ensure bucket exists: meesho-entry-images");
      return;
    }
  }

  if(pdfFile){
    try {
      const url = await _uploadMeeshoBillPdf(pdfFile, sub);
      if(url) payload.bill_pdf_url = url;
    } catch (e) {
      console.error(e);
      const message = (e && e.message) ? e.message : "";
      alert("Bill PDF upload failed: " + message + "\n\nFix: Run backend/sql/meesho_entry_bills_storage.sql and ensure bucket exists: meesho-entry-bills");
      return;
    }
  }

  const { error } = await sb
    .from("meesho_entries")
    .update(payload)
    .eq("id", id);

  if(error){
    console.error(error);
    alert("Save failed: " + (error.message || ""));
    return;
  }

  window.__meeshoEditId = null;
  await loadMeeshoEntries();
}

async function deleteMeeshoEntry(id){
  if(!id) return;
  if(!confirm("Delete this entry?")) return;
  const { error } = await sb.from("meesho_entries").delete().eq("id", id);
  if(error){
    console.error(error);
    alert("Delete failed: " + (error.message || ""));
    return;
  }
  await loadMeeshoEntries();
}
async function openBusiness(businessId, businessName, mode){
  title.innerText = businessName + " – Dashboard";

  const profile = _loadBusinessProfileLocal(businessId);
  const configured = _isBusinessProfileConfigured(profile);
  const screenMode = mode || (configured ? "view" : "setup");

  const esc = (s) => String(s ?? "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const inr = (n) => {
    const num = Number(n || 0);
    try { return `₹${num.toLocaleString('en-IN')}`; } catch(e){ return `₹${num}`; }
  };

  function renderView(){
    content.innerHTML = `
      <div class="container" style="max-width:1100px;gap:18px;">
        <button onclick="showBusinesses()" style="margin-bottom:4px">← Back to Businesses</button>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <h3 style="margin:0;">${esc(businessName)} — Dashboard</h3>
            <button onclick='openBusiness(${JSON.stringify(String(businessId))}, ${JSON.stringify(String(businessName || ""))}, "edit")'>Edit Details</button>
          </div>

          <div style="margin-top:14px;display:flex;gap:18px;flex-wrap:wrap;">
            <div style="flex:1 1 320px;min-width:280px;">
              <div style="font-weight:600">Day of business incorporated</div>
              <div style="margin-top:6px;opacity:.9">${profile.incorporated_date ? esc(profile.incorporated_date) : "-"}</div>
            </div>
          </div>

          <div style="margin-top:18px;display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;">
            <div style="flex:1 1 320px;min-width:280px;padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px;">
              <div style="font-weight:800">Primary manager assigned</div>
              <div style="margin-top:8px">Name: <b>${profile.primary_manager_name ? esc(profile.primary_manager_name) : "-"}</b></div>
              <div style="margin-top:6px">Salary: <b>${profile.primary_manager_salary ? esc(inr(profile.primary_manager_salary)) : "-"}</b></div>
            </div>

            <div style="flex:1 1 320px;min-width:280px;padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px;">
              <div style="font-weight:800">Under which co-founder assigned</div>
              <div style="margin-top:8px">Name: <b>${profile.cofounder_name ? esc(profile.cofounder_name) : "-"}</b></div>
              <div style="margin-top:6px">Salary: <b>${profile.cofounder_salary ? esc(inr(profile.cofounder_salary)) : "-"}</b></div>
            </div>

            <div style="flex:1 1 320px;min-width:280px;padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px;">
              <div style="font-weight:800">Under which our food chef assigned</div>
              <div style="margin-top:8px">Name: <b>${profile.chef_name ? esc(profile.chef_name) : "-"}</b></div>
              <div style="margin-top:6px">Salary: <b>${profile.chef_salary ? esc(inr(profile.chef_salary)) : "-"}</b></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEdit(isSetup){
    content.innerHTML = `
      <div class="container" style="max-width:1100px;gap:18px;">
        <button onclick="showBusinesses()" style="margin-bottom:4px">← Back to Businesses</button>

        <div class="card">
          <h3 style="margin-top:0;">${esc(businessName)} — ${isSetup ? "Initial Setup" : "Edit Details"}</h3>
          <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;">
            <div style="flex:1 1 320px;min-width:280px;">
              <label style="font-weight:600;display:block;">Day of business incorporated</label>
              <input id="biz_incorporated_date" type="date" value="${esc(profile.incorporated_date || "")}">
            </div>
          </div>

          <div style="margin-top:14px;display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;">
            <div style="flex:1 1 320px;min-width:280px;">
              <label style="font-weight:700;display:block;">Primary manager assigned</label>
              <input id="biz_primary_manager_name" placeholder="Manager name" value="${esc(profile.primary_manager_name || "")}">
              <input id="biz_primary_manager_salary" type="number" placeholder="Salary (₹)" value="${esc(profile.primary_manager_salary ?? "")}">
            </div>

            <div style="flex:1 1 320px;min-width:280px;">
              <label style="font-weight:700;display:block;">Under which co-founder assigned</label>
              <input id="biz_cofounder_name" placeholder="Co-founder name" value="${esc(profile.cofounder_name || "")}">
              <input id="biz_cofounder_salary" type="number" placeholder="Salary (₹)" value="${esc(profile.cofounder_salary ?? "")}">
            </div>

            <div style="flex:1 1 320px;min-width:280px;">
              <label style="font-weight:700;display:block;">Under which our food chef assigned</label>
              <input id="biz_chef_name" placeholder="Chef name" value="${esc(profile.chef_name || "")}">
              <input id="biz_chef_salary" type="number" placeholder="Salary (₹)" value="${esc(profile.chef_salary ?? "")}">
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button onclick='saveBusinessProfile(${JSON.stringify(String(businessId))}, ${JSON.stringify(String(businessName || ""))})'>Save & Continue</button>
            ${isSetup ? "" : `<button onclick='openBusiness(${JSON.stringify(String(businessId))}, ${JSON.stringify(String(businessName || ""))}, "view")'>Cancel</button>`}
          </div>
        </div>
      </div>
    `;
  }

  if(screenMode === "edit") return renderEdit(false);
  if(screenMode === "setup") return renderEdit(true);
  return renderView();
}

function _localBusinessProfileKey(businessId){
  return `xco_business_profile_v1:${businessId}`;
}

function _normalizeBusinessProfile(raw){
  const obj = raw && typeof raw === "object" ? raw : {};
  return {
    incorporated_date: obj.incorporated_date || obj.incorporatedDate || obj.day_incorporated || obj.dayOfBusinessIncorporated || "",
    primary_manager_name: obj.primary_manager_name || obj.primaryManagerName || obj.primary_manager || "",
    primary_manager_salary: (obj.primary_manager_salary ?? obj.primaryManagerSalary ?? obj.primary_manager_pay ?? ""),
    cofounder_name: obj.cofounder_name || obj.coFounderName || obj.cofounder || "",
    cofounder_salary: (obj.cofounder_salary ?? obj.coFounderSalary ?? obj.cofounder_pay ?? ""),
    chef_name: obj.chef_name || obj.foodChefName || obj.chef || "",
    chef_salary: (obj.chef_salary ?? obj.foodChefSalary ?? obj.chef_pay ?? ""),
  };
}

function _loadBusinessProfileLocal(businessId){
  try {
    const raw = localStorage.getItem(_localBusinessProfileKey(businessId));
    if(raw){
      const parsed = JSON.parse(raw);
      return _normalizeBusinessProfile(parsed);
    }
  } catch (e) {}
  return _normalizeBusinessProfile({});
}

function _isBusinessProfileConfigured(profile){
  const p = profile || {};
  return !!(
    (p.incorporated_date && String(p.incorporated_date).trim()) ||
    (p.primary_manager_name && String(p.primary_manager_name).trim()) ||
    (p.cofounder_name && String(p.cofounder_name).trim()) ||
    (p.chef_name && String(p.chef_name).trim())
  );
}

async function saveBusinessProfile(businessId, businessName){
  const incorporated_date = document.getElementById("biz_incorporated_date")?.value || "";
  const primary_manager_name = document.getElementById("biz_primary_manager_name")?.value || "";
  const primary_manager_salary = Number(document.getElementById("biz_primary_manager_salary")?.value || 0);
  const cofounder_name = document.getElementById("biz_cofounder_name")?.value || "";
  const cofounder_salary = Number(document.getElementById("biz_cofounder_salary")?.value || 0);
  const chef_name = document.getElementById("biz_chef_name")?.value || "";
  const chef_salary = Number(document.getElementById("biz_chef_salary")?.value || 0);

  const profile = _normalizeBusinessProfile({
    incorporated_date,
    primary_manager_name,
    primary_manager_salary,
    cofounder_name,
    cofounder_salary,
    chef_name,
    chef_salary,
  });

  // Store locally (keeping it independent from Founder/Supabase complexity)
  try {
    localStorage.setItem(_localBusinessProfileKey(businessId), JSON.stringify(profile));
  } catch(e) {}

  // After first-time save, redirect to dashboard view
  await openBusiness(businessId, businessName || title.innerText.split(" – ")[0], "view");
}

function _monthFromISODate(dateStr){
  // dateStr expected: YYYY-MM-DD
  if(!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-");
  if(parts.length < 2) return null;
  const y = parts[0];
  const m = parts[1];
  if(!y || !m) return null;
  return `${y}-${m}`;
}

async function saveDailyReport(businessId){
  const date = document.getElementById("rep_date")?.value;
  const income = Number(document.getElementById("rep_income")?.value || 0);
  const poolTaken = Number(document.getElementById("rep_pool")?.value || 0);
  const expense = Number(document.getElementById("rep_expense")?.value || 0);

  if(!date){
    alert("Select date");
    return;
  }

  const month = _monthFromISODate(date);
  const profit = income - expense;

  // 1) Try RPC (if deployed)
  try {
    const { error } = await sb.rpc("save_daily_report_backend", {
      p_business_id: businessId,
      p_date: date,
      p_income: income,
      p_expense: expense,
      p_pool_taken: poolTaken,
    });
    if(!error){
      alert("Report saved & pool updated");
      await openBusiness(businessId, title.innerText.split(" – ")[0]);
      return;
    }
    console.warn("RPC save failed, will fallback:", error);
  } catch (e) {
    console.warn("RPC call crashed, will fallback:", e);
  }

  // 2) Try backend API (service key) when running locally
  try {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if(isLocal){
      const resp = await fetch("http://localhost:3000/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          date,
          income,
          expense,
          pool_taken: poolTaken,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if(resp.ok && json?.ok){
        alert("Report saved");
        await openBusiness(businessId, title.innerText.split(" – ")[0]);
        return;
      }
      console.warn("Backend save failed:", json);
    }
  } catch (e) {
    console.warn("Backend save crashed:", e);
  }

  // 3) Direct insert fallback (requires RLS to allow)
  const candidates = [
    {
      business_id: businessId,
      report_date: date,
      month,
      income,
      expense,
      pool_taken: poolTaken,
      profit,
    },
    {
      business_id: businessId,
      month,
      income,
      expense,
      profit,
    },
    {
      business_id: businessId,
      income,
      expense,
    },
  ];

  let lastErr = null;
  for(const payload of candidates){
    const { error } = await sb.from("reports").insert([payload]);
    if(!error){
      alert("Report saved");
      await openBusiness(businessId, title.innerText.split(" – ")[0]);
      return;
    }
    lastErr = error;
    // If it's a schema mismatch, keep trying smaller payloads
    if(/column .* does not exist|invalid input syntax|violates not-null constraint/i.test(error.message || "")){
      continue;
    }
    break;
  }

  alert("Save failed");
  console.error(lastErr);
}

async function viewReport(reportId){
  const { data, error } = await sb
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if(error || !data){
    alert("Failed to load report");
    console.error(error);
    return;
  }

  const date = data.report_date || data.date || data.created_at || "-";
  const income = data.income ?? "-";
  const expense = data.expense ?? "-";
  const poolTaken = data.pool_taken ?? data.pool ?? "-";
  const profit = data.profit ?? (Number(income || 0) - Number(expense || 0));

  alert(
    `Date: ${date}\nRevenue: ₹${income}\nExpense: ₹${expense}\nPool Taken: ₹${poolTaken}\nProfit: ₹${profit}`
  );
}

async function deleteBusiness(bizId, bizName){
  const ok = confirm(
    `Delete "${bizName}"?\nAll its reports will also be deleted.`
  );
  if(!ok) return;

  // 1️⃣ delete reports
  await sb.from("reports").delete().eq("business_id", bizId);

  // 2️⃣ delete work logs (agar hai)
  await sb.from("work_logs").delete().eq("business_id", bizId);

  // 3️⃣ delete tasks (agar business linked)
  await sb.from("tasks").delete().eq("business_id", bizId);

  // 4️⃣ finally delete business
  const { error } = await sb
    .from("businesses")
    .delete()
    .eq("id", bizId);

  if(error){
    alert("Delete failed");
    console.error(error);
    return;
  }

  alert("Business deleted successfully");
  showBusinesses();
}


async function openBusinessDashboard(bizId, bizName){
  title.innerText = bizName + " — Performance";

  content.innerHTML = `
    <div class="container" id="bizContainer" style="gap:28px;">
      <div style="display:flex;align-items:center;gap:18px;width:100%;max-width:1100px;">
        <button id="backBtn" class="no-pdf" onclick="showBusinesses()" style="margin-bottom:0;">← Back</button>
        <h2 style="margin:0;">${bizName}</h2>
        <span style="color:#888;font-size:1rem;">(Business ID: ${bizId})</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:24px;width:100%;max-width:1100px;">
        <div class="card" style="flex:1 1 220px;min-width:220px;max-width:320px;">
          <label for="monthFilter" style="font-weight:600;">Select Month</label>
          <select id="monthFilter" style="margin-top:10px;width:100%;padding:10px 12px;border-radius:10px;">
            <option value="ALL">All (Year to Date)</option>
          </select>
        </div>
        <div id="bizStats" style="flex:2 1 400px;min-width:320px;"></div>
      </div>
      <div class="card" style="width:100%;max-width:1100px;">
        <h3 style="margin-bottom:18px;">Profit / Loss Trend</h3>
        <div style="width:100%;overflow-x:auto;">
          <canvas id="bizChart" style="background:#fff;border-radius:18px;"></canvas>
        </div>
        <div style="margin-top:18px;text-align:right;">
          <button id="pdfBtn" onclick="saveBusinessPDF('${bizName}')" disabled>Save Report as PDF</button>
        </div>
      </div>
    </div>
  `;

  // ---- LOAD MONTHS ----
  const { data: monthRows } = await sb
    .from("reports")
    .select("month")
    .eq("business_id", bizId);

  const months = [...new Set((monthRows || []).map(m => m.month))];
  const monthSelect = document.getElementById("monthFilter");

  months.forEach(m=>{
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  // change month → reload data
  monthSelect.onchange = () => loadBusinessData(bizId);

  // first load
  loadBusinessData(bizId);
}
async function loadBusinessData(bizId){
  const selectedMonth = document.getElementById("monthFilter").value;

  let query = sb
    .from("reports")
    .select("*")
    .eq("business_id", bizId)
    .order("created_at", { ascending: true });

  if(selectedMonth !== "ALL"){
    query = query.eq("month", selectedMonth);
  }

  const { data, error } = await query;

  if(error || !data || data.length === 0){
    document.getElementById("bizStats").innerHTML =
      `<div class="card">No data available</div>`;
    return;
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const labels = [];
  const incomeArr = [];
  const expenseArr = [];
  const profitArr = [];

  data.forEach(r=>{
    const income = Number(r.income);
    const expense = Number(r.expense);
    const profit = income - expense;

    totalIncome += income;
    totalExpense += expense;

    labels.push(r.month);
    incomeArr.push(income);
    expenseArr.push(expense);
    profitArr.push(profit);
  });

  const totalProfit = totalIncome - totalExpense;

  document.getElementById("bizStats").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <div class="card">Income<br><b>₹${totalIncome}</b></div>
      <div class="card">Expense<br><b>₹${totalExpense}</b></div>
      <div class="card">Net Result<br><b>₹${totalProfit}</b></div>
      <div class="card">Variance<br><b>${totalProfit >= 0 ? "PROFIT" : "LOSS"}</b></div>
    </div>
  `;

  renderBusinessChart(labels, incomeArr, expenseArr, profitArr);
  // Enable PDF button after data/chart is loaded
  const pdfBtn = document.getElementById("pdfBtn");
  if (pdfBtn) pdfBtn.disabled = false;
}
function saveBusinessPDF(bizName){
  const element = document.getElementById("bizContainer");
  const backBtn = document.getElementById("backBtn");

  if(!element){
    alert("Nothing to export");
    return;
  }

  // hide back button for PDF
  if(backBtn) backBtn.style.display = "none";

  const opt = {
    margin: 0.5,
    filename: bizName + "_Profit_Loss_Report.pdf",
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      // show back button again
      if(backBtn) backBtn.style.display = "block";
    });
}
function renderBusinessChart(labels, income, expense, profit){
  const ctx = document.getElementById("bizChart");

  if(window.bizChartInstance){
    window.bizChartInstance.destroy();
  }

  window.bizChartInstance = new Chart(ctx,{
    type:"line",
    data:{
      labels:labels,
      datasets:[
        { label:"Income", data:income, borderColor:"#22c55e", backgroundColor:"#22c55e22", tension:0.4, fill:false },
        { label:"Expense", data:expense, borderColor:"#ef4444", backgroundColor:"#ef444422", tension:0.4, fill:false },
        { label:"Profit", data:profit, borderColor:"#3b82f6", backgroundColor:"#3b82f622", tension:0.4, fill:false }
      ]
    },
    options:{
      plugins:{ legend:{labels:{color:"#222", font:{weight:600}}} },
      scales:{
        x:{ticks:{color:"#222", font:{weight:600}}},
        y:{ticks:{color:"#222", font:{weight:600}}}
      }
    }
  });
}

async function loadBusinessData(bizId){
  const selectedMonth = document.getElementById("monthFilter").value;

  let query = sb
    .from("reports")
    .select("*")
    .eq("business_id", bizId)
    .order("created_at", { ascending: true });

  if(selectedMonth !== "ALL"){
    query = query.eq("month", selectedMonth);
  }

  const { data, error } = await query;

  if(error || !data || data.length === 0){
    document.getElementById("bizStats").innerHTML =
      `<div class="card">No data available</div>`;
    return;
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const labels = [];
  const incomeArr = [];
  const expenseArr = [];
  const profitArr = [];

  data.forEach(r=>{
    const income = Number(r.income);
    const expense = Number(r.expense);
    const profit = income - expense;

    totalIncome += income;
    totalExpense += expense;

    labels.push(r.month);
    incomeArr.push(income);
    expenseArr.push(expense);
    profitArr.push(profit);
  });

  const totalProfit = totalIncome - totalExpense;
  const variance = totalProfit >= 0 ? "PROFIT" : "LOSS";

  document.getElementById("bizStats").innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      <div class="card">
        Income<br><b>₹${totalIncome}</b>
      </div>
      <div class="card">
        Expense<br><b>₹${totalExpense}</b>
      </div>
      <div class="card">
        Net Result<br><b>₹${totalProfit}</b>
      </div>
      <div class="card">
        Variance<br><b>${variance}</b>
      </div>
    </div>
  `;

  renderBusinessChart(labels, incomeArr, expenseArr, profitArr);
}
function saveBusinessPDF(bizName){
  const element = document.getElementById("bizContainer");

  const opt = {
    margin: 0.5,
    filename: bizName + "_Profit_Loss_Report.pdf",
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

async function saveEmployeePayslipPDF(empId){
  if(!empId) return;

  const empRes = await sb
    .from("employees")
    .select("id,name,role,created_at")
    .eq("id", empId)
    .single();

  if(empRes.error || !empRes.data){
    console.error(empRes.error);
    alert("Employee load failed");
    return;
  }

  const cfgRes = await sb
    .from("employee_salary_config")
    .select("salary_fixed,basic_pay,start_date,annual_rate")
    .eq("employee_id", empId)
    .maybeSingle();

  if(cfgRes.error){
    console.error(cfgRes.error);
    alert("Salary config load failed");
    return;
  }

  if(!cfgRes.data || !cfgRes.data.salary_fixed){
    alert("Salary Fixed config not found for this employee");
    return;
  }

  const emp = empRes.data;
  const cfg = cfgRes.data;
  const proj = _salaryProjection({
    basicPay: Number(cfg.basic_pay || 0),
    startDate: cfg.start_date,
    annualRate: Number(cfg.annual_rate || 0.06)
  });

  const now = new Date();
  const payPeriod = now.toLocaleString(undefined, { month: "long", year: "numeric" });
  const joinDate = cfg.start_date || (emp.created_at ? String(emp.created_at).slice(0, 10) : "-");

  const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;

  const earnings = [
    { label: "Basic", amount: proj.current.basicPay },
    { label: "DA", amount: proj.current.da },
    { label: "HRA", amount: proj.current.hra },
    { label: "Medical", amount: proj.current.medical },
    { label: "WiFi", amount: proj.current.wifi },
  ];
  const totalEarnings = earnings.reduce((s, r) => s + Number(r.amount || 0), 0);

  const totalDeductions = 0;
  const netPay = totalEarnings - totalDeductions;

  const rowsE = earnings
    .map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${r.label}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(r.amount)}</td>
      </tr>
    `)
    .join("");

  const el = document.createElement("div");
  el.id = "empPayslipPdf";
  el.style.background = "#fff";
  el.style.color = "#111";
  el.style.padding = "22px 22px";
  el.style.fontFamily = "Arial, sans-serif";

  el.innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:20px;font-weight:800">Payslip</div>
      <div style="font-size:14px;font-weight:700;margin-top:4px">The X Company</div>
      <div style="font-size:12px;opacity:.85">Kailash Nagar Narnaul</div>
    </div>

    <div style="display:flex;justify-content:space-between;gap:16px;font-size:12px;margin-top:8px">
      <div style="flex:1">
        <div><b>Date of Joining</b>: ${joinDate}</div>
        <div><b>Pay Period</b>: ${payPeriod}</div>
        <div><b>Worked Days</b>: 26</div>
      </div>
      <div style="flex:1">
        <div><b>Employee name</b>: ${emp.name || "-"}</div>
        <div><b>Designation</b>: ${emp.role || "-"}</div>
        <div><b>Department</b>: ${emp.role || "-"}</div>
      </div>
    </div>

    <div style="margin-top:14px;border:1px solid #d1d5db;border-radius:6px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr>
            <th style="padding:8px;border-bottom:1px solid #d1d5db;background:#f3f4f6;text-align:left">Earnings</th>
            <th style="padding:8px;border-bottom:1px solid #d1d5db;background:#f3f4f6;text-align:right">Amount</th>
            <th style="padding:8px;border-bottom:1px solid #d1d5db;background:#f3f4f6;text-align:left">Deductions</th>
            <th style="padding:8px;border-bottom:1px solid #d1d5db;background:#f3f4f6;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="vertical-align:top;border-right:1px solid #d1d5db;padding:0">
              <table style="width:100%;border-collapse:collapse">
                ${rowsE}
                <tr>
                  <td style="padding:8px;font-weight:700">Total Earnings</td>
                  <td style="padding:8px;font-weight:800;text-align:right">${money(totalEarnings)}</td>
                </tr>
              </table>
            </td>
            <td colspan="2" style="vertical-align:top;padding:0">
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;opacity:.7">-</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;opacity:.7">-</td>
                </tr>
                <tr>
                  <td style="padding:8px;font-weight:700">Total Deductions</td>
                  <td style="padding:8px;font-weight:800;text-align:right">${money(totalDeductions)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td colspan="4" style="padding:10px;border-top:1px solid #d1d5db;text-align:right;font-size:13px">
              <b>Net Pay:</b> <span style="font-size:14px;font-weight:900">${money(netPay)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:space-between;gap:18px;margin-top:18px;font-size:12px">
      <div style="flex:1;text-align:center">
        <div style="border-top:1px solid #111;opacity:.35;margin:18px 20px 6px"></div>
        Employer Signature
      </div>
      <div style="flex:1;text-align:center">
        <div style="border-top:1px solid #111;opacity:.35;margin:18px 20px 6px"></div>
        Employee Signature
      </div>
    </div>

    <div style="text-align:center;margin-top:18px;font-size:11px;opacity:.75">This is system generated payslip</div>
  `;

  document.body.appendChild(el);
  try {
    const safeName = String(emp.name || "Employee").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePeriod = String(payPeriod).replace(/\s+/g, "_");
    const opt = {
      margin: 0.5,
      filename: `${safeName}_Payslip_${safePeriod}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(el).save();
  } finally {
    el.remove();
  }
}
async function loadAvailableTasks() {
  const { data } = await sb
    .from("tasks")
    .select("*, accepted_by(name, id)")
    .or("status.eq.OPEN,status.eq.ACCEPTED")
    .order("created_at", { ascending: false });

  let html = "";
  data.forEach(t => {
    let accepted = t.status === "ACCEPTED" && t.accepted_by && t.accepted_by.id === currentEmployeeId;
    html += `
      <div class="card">
        <b>${t.title}</b><br>
        ${t.description}<br><br>
        Reward: ${t.reward_points || t.reward_amount} points<br>
        Deadline: ${new Date(t.deadline).toLocaleString()}<br><br>
        ${
          accepted
            ? `<span style='color:#22c55e;font-weight:bold;'>Accepted! Deadline: ${new Date(t.deadline).toLocaleString()}</span>`
            : t.status === "OPEN"
            ? `<button onclick="acceptTask('${t.id}')">Accept Task</button>`
            : `<span style='color:#888;'>Accepted by ${t.accepted_by?.name || "someone"}</span>`
        }
      </div>
    `;
  });
  content.innerHTML = html;
}
loadBusinessReports(businessId);
async function loadBusinessReports(businessId){
  const { data } = await sb
    .from("reports")
    .select("*")
    .eq("business_id", businessId)
    .order("report_date",{ascending:false});

  let html = `<div class="card"><h3 style="margin-top:0;">Saved Reports</h3>`;

  if(!data || data.length === 0){
    html += `<div style="opacity:.8">No reports yet</div>`;
  } else {
    (data || []).forEach(r=>{
      const date = r.report_date || r.date || (r.created_at ? String(r.created_at).slice(0,10) : "-");
      const income = Number(r.income || 0);
      const expense = Number(r.expense || 0);
      const poolTaken = Number(r.pool_taken ?? r.pool ?? 0);
      const profit = Number(r.profit ?? (income - expense));
      const profitColor = profit >= 0 ? "#22c55e" : "#ef4444";

      html += `
        <div style="padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px;margin-top:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div style="font-weight:700">${date}</div>
            <div style="font-weight:800;color:${profitColor}">Profit: ₹${profit.toLocaleString()}</div>
          </div>
          <div style="margin-top:8px;opacity:.9;display:flex;gap:14px;flex-wrap:wrap">
            <div>Revenue: <b>₹${income.toLocaleString()}</b></div>
            <div>Expense: <b>₹${expense.toLocaleString()}</b></div>
            <div>Pool Taken: <b>₹${poolTaken.toLocaleString()}</b></div>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  document.getElementById("reportList").innerHTML = html;
}

async function acceptTask(taskId) {
  const { data, error } = await sb
    .from("tasks")
    .update({
      status: "ACCEPTED",
      accepted_by: currentEmployeeId
    })
    .eq("id", taskId)
    .eq("status", "OPEN");

  if (error || !data || data.length === 0) {
    alert("Task already taken");
    return;
  }

  alert("Task accepted");
  loadAvailableTasks();
  if (typeof loadHRTasks === "function") loadHRTasks();
}
async function loadAcceptedTasks(){
  const { data } = await sb
    .from("tasks")
    .select("*, accepted_by(name)")
    .eq("status","ACCEPTED");

  let html = "";
  data.forEach(t=>{
    html += `
      <div class="card">
        <b>${t.title}</b><br>
        Accepted by: <b>${t.accepted_by.name}</b><br>
        Deadline: ${new Date(t.deadline).toLocaleString()}
      </div>
    `;
  });

  content.innerHTML = html;
}
async function loadMyTasks(){
  const { data } = await sb
    .from("tasks")
    .select("*")
    .eq("accepted_by", currentUserId);

  let html = "";
  data.forEach(t=>{
    html += `
      <div class="card">
        <b>${t.title}</b><br>
        Status: ${t.status}<br>
        Deadline: ${new Date(t.deadline).toLocaleString()}
      </div>
    `;
  });

  content.innerHTML = html;
}


function renderBusinessChart(labels, income, expense, profit){
  const ctx = document.getElementById("bizChart");

  if(window.bizChartInstance){
    window.bizChartInstance.destroy();
  }

  window.bizChartInstance = new Chart(ctx,{
    type:"line",
    data:{
      labels:labels,
      datasets:[
        {
          label:"Income",
          data:income,
          borderColor:"#22c55e",
          tension:0.4
        },
        {
          label:"Expense",
          data:expense,
          borderColor:"#ef4444",
          tension:0.4
        },
        {
          label:"Profit",
          data:profit,
          borderColor:"#3b82f6",
          tension:0.4
        }
      ]
    },
    options:{
      plugins:{
        legend:{labels:{color:"white"}}
      },
      scales:{
        x:{ticks:{color:"white"}},
        y:{ticks:{color:"white"}}
      }
    }
  });
}
function saveBusinessPDF(bizName){
  const element = document.getElementById("bizContainer");

  const opt = {
    margin: 0.5,
    filename: `${bizName}_Profit_Loss_Report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}


function showAddBusiness(){
  title.innerText = "Add Business";

  const categories = _getBusinessCategories();
  const categoryOptions = categories
    .map(c => `<option value="${String(c).replace(/"/g,'&quot;')}">${c}</option>`)
    .join("");

  const baseOptions = _getDefaultBusinessCategories()
    .map(c => `<option value="${String(c).replace(/"/g,'&quot;')}">${c}</option>`)
    .join("");

  content.innerHTML = `
    <div class="container" style="max-width:1100px;">
      <div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start;">

        <div class="card" style="flex:1 1 420px;min-width:320px;">
          <h3 style="margin-top:0;">Add Business</h3>
          <input id="biz_name" placeholder="Business Name">
          <label style="font-weight:600;margin-top:10px;display:block;">Business Category</label>
          <select id="biz_category" style="margin-top:10px;width:100%;padding:10px 12px;border-radius:10px;">
            ${categoryOptions}
          </select>
          <button style="margin-top:14px" onclick="saveBusiness()">Save Business</button>
        </div>

        <div class="card" style="flex:1 1 420px;min-width:320px;">
          <h3 style="margin-top:0;">Add Business Category</h3>
          <div style="opacity:.85;margin-bottom:12px">Select a category (for now)</div>
          <select id="new_category" style="width:100%;padding:10px 12px;border-radius:10px;">
            ${baseOptions}
          </select>
          <button style="margin-top:14px" onclick="addBusinessCategory()">Add Category</button>

          <div style="margin-top:16px;opacity:.9">
            <b>Available:</b> <span id="categoryPreview">${categories.join(", ")}</span>
          </div>
        </div>

      </div>
    </div>
  `;
}

function _getDefaultBusinessCategories(){
  return ["food","software","services"];
}

function _getBusinessCategories(){
  const key = "xco_business_categories_v1";
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    const list = Array.isArray(parsed) ? parsed : [];
    const merged = _uniqStr([
      ..._getDefaultBusinessCategories(),
      ...list
    ]);
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return _getDefaultBusinessCategories();
  }
}

function _setBusinessCategories(list){
  const key = "xco_business_categories_v1";
  const merged = _uniqStr([ ..._getDefaultBusinessCategories(), ...(list || []) ]);
  try { localStorage.setItem(key, JSON.stringify(merged)); } catch(e) {}
  return merged;
}

function _uniqStr(arr){
  const out = [];
  const seen = new Set();
  (arr || []).forEach(v => {
    const s = String(v || "").trim().toLowerCase();
    if(!s) return;
    if(seen.has(s)) return;
    seen.add(s);
    out.push(s);
  });
  return out;
}

function addBusinessCategory(){
  const sel = document.getElementById("new_category");
  const picked = sel?.value;
  if(!picked){
    alert("Select category");
    return;
  }
  const existing = _getBusinessCategories();
  const updated = _setBusinessCategories([ ...existing, picked ]);

  // refresh the screen so left dropdown updates
  showAddBusiness();
  // keep same selection if possible
  setTimeout(() => {
    const s2 = document.getElementById("new_category");
    if(s2) s2.value = picked;
  }, 0);
  return updated;
}
async function saveBusiness(){
  const name = document.getElementById("biz_name")?.value;
  const category = document.getElementById("biz_category")?.value;

  if(!name || !category){
    alert("Business name aur category select karo");
    return;
  }

  const { error } = await sb.from("businesses").insert([
    { name, type: String(category).trim().toLowerCase() }
  ]);

  if(error){
    alert("Error aaya, console dekh");
    console.error(error);
    return;
  }

  alert("Business add ho gaya");
  showBusinesses();
}

async function showEmployees(){
  title.innerText = "Employees of The X Company";
  if(typeof subtitleEl !== 'undefined' && subtitleEl) subtitleEl.textContent = 'Team & PM management';

  const empRes = await sb.from("employees").select("id,name,role");
  const salRes = await sb.from("employee_salary_config").select("employee_id,salary_fixed,basic_pay,start_date,annual_rate");
  const { data: pmUsers } = await sb.from('pm_login_users').select('id,name,username,created_at').order('created_at',{ascending:false});

  if(empRes.error){
    content.innerHTML = "<div class='card'>Error loading employees</div>";
    console.error(empRes.error);
    return;
  }

  const salaryMap = {};
  if(!salRes?.error && Array.isArray(salRes.data)){
    salRes.data.forEach(r => { salaryMap[r.employee_id] = r; });
  }

  let empCards = '';
  empRes.data.forEach(e=>{
    const cfg = salaryMap[e.id];
    let salaryHtml = '';
    if(cfg?.salary_fixed){
      const proj = _salaryProjection({
        basicPay: Number(cfg.basic_pay || 0),
        startDate: cfg.start_date,
        annualRate: Number(cfg.annual_rate || 0.06)
      });
      const schedule = _salaryMonthlySchedule({
        basicPay: Number(cfg.basic_pay || 0),
        startDate: cfg.start_date,
        annualRate: Number(cfg.annual_rate || 0.06)
      });
      const scheduleRowsHtml = schedule.map(r => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">M${r.monthNo}<div style="font-size:11px;color:#9CA3AF">${r.ym}</div></td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.basicPay)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.da)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.hra)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.medical)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.wifi)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-weight:600">₹${Math.round(r.gross)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6">₹${Math.round(r.cumulative)}</td>
        </tr>
      `).join('');
      salaryHtml = `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F3F4F6">
          <div style="font-size:13px;color:#6B7280">Salary Fixed • Start: <b style="color:#111827">${cfg.start_date || '-'}</b> • Months: <b style="color:#111827">${proj.months}</b></div>
          <div style="display:flex;gap:20px;margin-top:8px">
            <div style="background:#F0FDF4;border-radius:8px;padding:8px 14px">
              <div style="font-size:11px;color:#16A34A;font-weight:600">GROSS (CURRENT)</div>
              <div style="font-size:16px;font-weight:700;color:#15803D">₹${Math.round(proj.current.gross)}</div>
            </div>
            <div style="background:#EFF6FF;border-radius:8px;padding:8px 14px">
              <div style="font-size:11px;color:#2563EB;font-weight:600">ACCUMULATED</div>
              <div style="font-size:16px;font-weight:700;color:#1D4ED8">₹${Math.round(proj.accumulated)}</div>
            </div>
          </div>
          <details style="margin-top:12px">
            <summary style="cursor:pointer;font-weight:600;font-size:13px;color:#6B7280">▶ View Breakdowns</summary>
            <div style="overflow:auto;margin-top:10px">
              <table style="width:100%;border-collapse:collapse;min-width:760px;font-size:13px">
                <thead>
                  <tr style="background:#F9FAFB">
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">Month</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">Basic</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">DA</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">HRA</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">Medical</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">WiFi</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">Gross</th>
                    <th style="text-align:left;padding:8px;font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  ${scheduleRowsHtml || "<tr><td colspan='8' style='padding:8px'>No data</td></tr>"}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      `;
    }
    empCards += `
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:40px;height:40px;background:#3B82F6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px">${(e.name||'?')[0].toUpperCase()}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#111827">${e.name}</div>
            <div style="font-size:12px;color:#6B7280">${e.role}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="openEmployeeProfile('${e.id}')" style="padding:7px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:12px;font-weight:500;background:#fff;color:#374151;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#F9FAFB';this.style.borderColor='#3B82F6'" onmouseout="this.style.background='#fff';this.style.borderColor='#E5E7EB'">View Profile</button>
          <button onclick="deleteEmployee('${e.id}')" style="padding:7px 14px;border:1px solid #FCA5A5;border-radius:8px;font-size:12px;font-weight:500;background:#fff;color:#EF4444;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='#fff'">Delete</button>
          <button onclick="saveEmployeePayslipPDF('${e.id}')" style="padding:7px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:12px;font-weight:500;background:#fff;color:#374151;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">Payslip PDF</button>
          <button onclick="showEmployeeLedger('${e.id}','${e.name.replace(/'/g,"\\'")}')" style="padding:7px 14px;border:1px solid #DDD6FE;border-radius:8px;font-size:12px;font-weight:500;background:#fff;color:#7C3AED;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#F5F3FF'" onmouseout="this.style.background='#fff'">Ledger</button>
        </div>
        ${salaryHtml}
      </div>
    `;
  });

  const pmList = (pmUsers||[]);
  let pmCardsHtml = '';
  if(pmList.length === 0){
    pmCardsHtml = '<div style="text-align:center;padding:32px;color:#9CA3AF;font-size:14px">No PM users yet</div>';
  } else {
    pmCardsHtml = pmList.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #F3F4F6;transition:background .15s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='transparent'">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#7C3AED;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${(p.name||'?')[0].toUpperCase()}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:#111827">${p.name}</div>
            <div style="font-size:12px;color:#6B7280;font-family:monospace">${p.username}</div>
          </div>
        </div>
        <div style="font-size:11px;color:#9CA3AF">${p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</div>
      </div>
    `).join('');
  }

  const empCount = empRes.data.length;
  const pmCount = pmList.length;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:28px">
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:42px;height:42px;background:#3B82F6;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:500;color:#6B7280">Total Employees</div>
            <div style="font-size:22px;font-weight:700;color:#111827">${empCount}</div>
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:42px;height:42px;background:#7C3AED;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:500;color:#6B7280">PM Users</div>
            <div style="font-size:22px;font-weight:700;color:#111827">${pmCount}</div>
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:42px;height:42px;background:#22C55E;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <div style="font-size:12px;font-weight:500;color:#6B7280">Active Team</div>
            <div style="font-size:22px;font-weight:700;color:#111827">${empCount + pmCount}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
          <div style="width:36px;height:36px;background:#3B82F6;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style="font-size:17px;font-weight:700;color:#111827">Employees <span style="font-weight:400;color:#6B7280;font-size:14px">(${empCount})</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          ${empCards || '<div style="text-align:center;padding:32px;color:#9CA3AF">No employees yet</div>'}
        </div>
      </div>

      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
          <div style="width:36px;height:36px;background:#7C3AED;border-radius:10px;display:flex;align-items:center;justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          </div>
          <div style="font-size:17px;font-weight:700;color:#111827">PM Users <span style="font-weight:400;color:#6B7280;font-size:14px">(${pmCount})</span></div>
        </div>
        <div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden">
          ${pmCardsHtml}
        </div>
      </div>
    </div>
  `;
}

async function openEmployeeProfile(empId){
  title.innerText = "Employee Profile";

  const emp = await sb
    .from("employees")
    .select("*")
    .eq("id", empId)
    .single();

  const work = await sb
    .from("work_logs")
    .select("hours")
    .eq("employee_id", empId);

  let totalHours = 0;
  (work.data || []).forEach(w => {
    totalHours += Number(w.hours || 0);
  });

  const joined = emp?.data?.created_at ? new Date(emp.data.created_at).toDateString() : "-";

  const salRes = await sb
    .from("employee_salary_config")
    .select("salary_fixed,basic_pay,start_date,annual_rate")
    .eq("employee_id", empId)
    .maybeSingle();

  let salaryBlock = "";
  if(!salRes?.error && salRes?.data?.salary_fixed){
    const cfg = salRes.data;
    const proj = _salaryProjection({
      basicPay: Number(cfg.basic_pay || 0),
      startDate: cfg.start_date,
      annualRate: Number(cfg.annual_rate || 0.06)
    });

    const schedule = _salaryMonthlySchedule({
      basicPay: Number(cfg.basic_pay || 0),
      startDate: cfg.start_date,
      annualRate: Number(cfg.annual_rate || 0.06)
    });

    const scheduleRowsHtml = schedule.map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">M${r.monthNo}<div style="font-size:11px;opacity:.7">${r.ym}</div></td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.basicPay)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.da)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.hra)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.medical)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.wifi)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)"><b>₹${Math.round(r.gross)}</b></td>
        <td style="padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(r.cumulative)}</td>
      </tr>
    `).join("");

    salaryBlock = `
      <div class="card">
        <h3 style="margin-top:0;">Salary (Fixed)</h3>
        Start Date: <b>${cfg.start_date || "-"}</b><br>
        Months: <b>${proj.months}</b><br>
        Annual Rate: <b>${Math.round(proj.annualRate * 100)}%</b><br><br>

        <b>Gross (Current):</b> ₹${Math.round(proj.current.gross)}<br>
        <b>Accumulated (Approx):</b> ₹${Math.round(proj.accumulated)}<br><br>

        <div style="opacity:.9">
          Basic Pay: ₹${Math.round(proj.current.basicPay)}<br>
          DA (50%): ₹${Math.round(proj.current.da)}<br>
          HRA (20%): ₹${Math.round(proj.current.hra)}<br>
          Medical (10%): ₹${Math.round(proj.current.medical)}<br>
          Wifi (4%): ₹${Math.round(proj.current.wifi)}
        </div>

        <details style="margin-top:12px">
          <summary style="cursor:pointer;font-weight:600">Monthly Breakdown (Month 1, Month 2...)</summary>
          <div style="overflow:auto;margin-top:10px">
            <table style="width:100%;border-collapse:collapse;min-width:760px">
              <thead>
                <tr>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">Month</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">Basic</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">DA</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">HRA</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">Medical</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">WiFi</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">Gross</th>
                  <th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(0,0,0,.12)">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleRowsHtml || "<tr><td colspan='8' style='padding:8px'>No data</td></tr>"}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    `;
  }

  const empName = emp?.data?.name || 'Employee';

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">${empName}</h3>
        Role: <b>${emp?.data?.role || "-"}</b><br>
        Joined on: ${joined}
      </div>

      <div class="card"><b>Total Work:</b> ${totalHours} hours</div>

      ${salaryBlock}

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button onclick="showEmployees()"
          style="background:#fff;color:#111827;border:2px solid #E5E7EB;border-radius:12px;padding:14px 24px;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s"
          onmouseover="this.style.borderColor='#6B7280';this.style.background='#F9FAFB'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
          ← Back to Employees
        </button>
      </div>
    </div>
  `;
}

/* ===== Employee Ledger (AR / AP) ===== */
async function showEmployeeLedger(empId, empName){
  title.innerText = 'Ledger Account';
  if(typeof subtitleEl !== 'undefined' && subtitleEl) subtitleEl.textContent = empName;

  const { data: arData, error: arErr } = await sb
    .from('employee_ledger')
    .select('*')
    .eq('employee_id', empId)
    .eq('type', 'AR')
    .order('date', { ascending: false });

  const { data: apData, error: apErr } = await sb
    .from('employee_ledger')
    .select('*')
    .eq('employee_id', empId)
    .eq('type', 'AP')
    .order('date', { ascending: false });

  if(arErr || apErr){
    content.innerHTML = `<div class="card" style="color:#EF4444">Error loading ledger: ${(arErr||apErr).message}</div>`;
    return;
  }

  // Fetch salary gross (current)
  let grossCurrent = 0;
  const salRes = await sb
    .from('employee_salary_config')
    .select('salary_fixed,basic_pay,start_date,annual_rate')
    .eq('employee_id', empId)
    .maybeSingle();
  if(!salRes?.error && salRes?.data?.salary_fixed){
    const cfg = salRes.data;
    const proj = _salaryProjection({
      basicPay: Number(cfg.basic_pay || 0),
      startDate: cfg.start_date,
      annualRate: Number(cfg.annual_rate || 0.06)
    });
    grossCurrent = Math.round(proj.current.gross);
  }

  const arTotal = (arData||[]).reduce((s,r) => s + Number(r.amount||0), 0);
  const apManualTotal = (apData||[]).reduce((s,r) => s + Number(r.amount||0), 0);
  const apTotal = apManualTotal + grossCurrent;
  const netBalance = apTotal - arTotal;

  function buildGrossRow(){
    if(grossCurrent <= 0) return '';
    return `
      <tr style="background:#F0FDF4">
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#15803D;font-weight:600">Current</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#15803D;font-weight:600">Gross Salary (Current Month)</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;font-weight:700;color:#15803D">\u20b9${grossCurrent.toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:11px;color:#9CA3AF">Auto</td>
      </tr>
    `;
  }

  function buildRows(entries, type){
    if(!entries || entries.length === 0) return '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9CA3AF">No entries yet</td></tr>';
    return entries.map(e => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151">${new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151">${e.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:14px;font-weight:600;color:#111827">\u20b9${Number(e.amount).toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6">
          <div style="display:flex;gap:6px">
            <button onclick="editLedgerEntry('${e.id}','${empId}','${empName.replace(/'/g,"\\\'")}')" style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;color:#374151" onmouseover="this.style.borderColor='#3B82F6'" onmouseout="this.style.borderColor='#E5E7EB'">Edit</button>
            <button onclick="deleteLedgerEntry('${e.id}','${empId}','${empName.replace(/'/g,"\\\'")}')" style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;color:#EF4444" onmouseover="this.style.borderColor='#EF4444'" onmouseout="this.style.borderColor='#E5E7EB'">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const iconAR = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="M17 17H7"/></svg>';
  const iconAP = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V2"/><path d="m7 17 5 5 5-5"/><path d="M17 7H7"/></svg>';

  content.innerHTML = `
    <div style="background:#F5F3FF;border-radius:16px;padding:28px;margin:-12px;margin-bottom:0">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px">
        <div style="font-size:13px;font-weight:500;color:#6B7280;margin-bottom:4px">Accounts Receivable (AR)</div>
        <div style="font-size:22px;font-weight:700;color:#EF4444">\u20b9${arTotal.toLocaleString('en-IN')}</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px">You owe the company</div>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px">
        <div style="font-size:13px;font-weight:500;color:#6B7280;margin-bottom:4px">Accounts Payable (AP)</div>
        <div style="font-size:22px;font-weight:700;color:#22C55E">\u20b9${apTotal.toLocaleString('en-IN')}</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px">Company owes you</div>
      </div>
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:20px">
        <div style="font-size:13px;font-weight:500;color:#6B7280;margin-bottom:4px">Net Balance</div>
        <div style="font-size:22px;font-weight:700;color:${netBalance >= 0 ? '#22C55E' : '#EF4444'}">\u20b9${Math.abs(netBalance).toLocaleString('en-IN')}</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px">${netBalance >= 0 ? 'Company pays you' : 'You pay company'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- AR Section -->
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="padding:20px 24px;border-bottom:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;background:#FEF2F2;border-radius:10px;display:flex;align-items:center;justify-content:center">${iconAR}</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#111827">Accounts Receivable</div>
              <div style="font-size:12px;color:#6B7280">You Have To Pay To Company</div>
            </div>
          </div>
          <button onclick="addLedgerEntry('${empId}','${empName.replace(/'/g,"\\\'")}','AR')" style="background:#EF4444;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity .2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Entry
          </button>
        </div>
        <div style="overflow:auto;max-height:400px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#FAFAFA">
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Date</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Description</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Amount</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Actions</th>
              </tr>
            </thead>
            <tbody>${buildRows(arData, 'AR')}</tbody>
          </table>
        </div>
        <div style="padding:14px 24px;border-top:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center;background:#FAFAFA">
          <span style="font-size:14px;font-weight:600;color:#374151">Total AR</span>
          <span style="font-size:16px;font-weight:700;color:#EF4444">\u20b9${arTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- AP Section -->
      <div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="padding:20px 24px;border-bottom:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;background:#F0FDF4;border-radius:10px;display:flex;align-items:center;justify-content:center">${iconAP}</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#111827">Accounts Payable</div>
              <div style="font-size:12px;color:#6B7280">Company Will Pay You</div>
            </div>
          </div>
          <button onclick="addLedgerEntry('${empId}','${empName.replace(/'/g,"\\\'")}','AP')" style="background:#22C55E;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:opacity .2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Entry
          </button>
        </div>
        <div style="overflow:auto;max-height:400px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#FAFAFA">
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Date</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Description</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Amount</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.5px">Actions</th>
              </tr>
            </thead>
            <tbody>${buildGrossRow()}${buildRows(apData, 'AP')}</tbody>
          </table>
        </div>
        <div style="padding:14px 24px;border-top:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center;background:#FAFAFA">
          <span style="font-size:14px;font-weight:600;color:#374151">Total AP</span>
          <span style="font-size:16px;font-weight:700;color:#22C55E">\u20b9${apTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:24px">
      <button onclick="openEmployeeProfile('${empId}')"
        style="background:#fff;color:#111827;border:2px solid #E5E7EB;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s"
        onmouseover="this.style.borderColor='#6B7280';this.style.background='#F9FAFB'" onmouseout="this.style.borderColor='#E5E7EB';this.style.background='#fff'">
        \u2190 Back to Profile
      </button>
    </div>
    </div>
  `;
}

function addLedgerEntry(empId, empName, type){
  const typeLabel = type === 'AR' ? 'Accounts Receivable' : 'Accounts Payable';
  const typeColor = type === 'AR' ? '#EF4444' : '#22C55E';
  const today = new Date().toISOString().split('T')[0];

  const overlay = document.createElement('div');
  overlay.id = 'ledger-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;width:420px;max-width:90vw;box-shadow:0 25px 60px rgba(0,0,0,.15)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <div style="width:10px;height:10px;border-radius:99px;background:${typeColor}"></div>
        <div style="font-size:18px;font-weight:700;color:#111827">Add ${typeLabel}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Date</label>
          <input type="date" id="ledger_date" value="${today}" style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
          <input type="text" id="ledger_desc" placeholder="e.g. Advance salary, Loan repayment..." style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Amount (\u20b9)</label>
          <input type="number" id="ledger_amount" placeholder="0" min="0" step="0.01" style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:28px">
        <button id="ledger_save_btn" style="flex:1;background:${typeColor};color:#fff;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Save Entry</button>
        <button id="ledger_cancel_btn" style="flex:1;background:#F3F4F6;color:#374151;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#ledger_cancel_btn').onclick = () => overlay.remove();
  overlay.addEventListener('click', (ev) => { if(ev.target === overlay) overlay.remove(); });

  overlay.querySelector('#ledger_save_btn').onclick = async () => {
    const date = document.getElementById('ledger_date').value;
    const desc = document.getElementById('ledger_desc').value.trim();
    const amount = Number(document.getElementById('ledger_amount').value);
    if(!desc){ alert('Description is required'); return; }
    if(!amount || amount <= 0){ alert('Enter a valid amount'); return; }

    const { error } = await sb.from('employee_ledger').insert([{
      employee_id: empId,
      type: type,
      description: desc,
      amount: amount,
      date: date
    }]);
    if(error){ alert('Error: ' + error.message); return; }
    overlay.remove();
    showEmployeeLedger(empId, empName);
  };
}

async function editLedgerEntry(entryId, empId, empName){
  const { data: entry, error } = await sb
    .from('employee_ledger')
    .select('*')
    .eq('id', entryId)
    .single();
  if(error || !entry){ alert('Could not load entry'); return; }

  const typeColor = entry.type === 'AR' ? '#EF4444' : '#22C55E';
  const typeLabel = entry.type === 'AR' ? 'Accounts Receivable' : 'Accounts Payable';

  const overlay = document.createElement('div');
  overlay.id = 'ledger-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;width:420px;max-width:90vw;box-shadow:0 25px 60px rgba(0,0,0,.15)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <div style="width:10px;height:10px;border-radius:99px;background:${typeColor}"></div>
        <div style="font-size:18px;font-weight:700;color:#111827">Edit ${typeLabel}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Date</label>
          <input type="date" id="ledger_date" value="${entry.date}" style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Description</label>
          <input type="text" id="ledger_desc" value="${entry.description.replace(/"/g,'&quot;')}" style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
        <div>
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">Amount (\u20b9)</label>
          <input type="number" id="ledger_amount" value="${entry.amount}" min="0" step="0.01" style="width:100%;padding:10px 14px;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='${typeColor}'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:28px">
        <button id="ledger_save_btn" style="flex:1;background:${typeColor};color:#fff;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Update Entry</button>
        <button id="ledger_cancel_btn" style="flex:1;background:#F3F4F6;color:#374151;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#ledger_cancel_btn').onclick = () => overlay.remove();
  overlay.addEventListener('click', (ev) => { if(ev.target === overlay) overlay.remove(); });

  overlay.querySelector('#ledger_save_btn').onclick = async () => {
    const date = document.getElementById('ledger_date').value;
    const desc = document.getElementById('ledger_desc').value.trim();
    const amount = Number(document.getElementById('ledger_amount').value);
    if(!desc){ alert('Description is required'); return; }
    if(!amount || amount <= 0){ alert('Enter a valid amount'); return; }

    const { error: upErr } = await sb.from('employee_ledger')
      .update({ date, description: desc, amount })
      .eq('id', entryId);
    if(upErr){ alert('Error: ' + upErr.message); return; }
    overlay.remove();
    showEmployeeLedger(empId, empName);
  };
}

async function deleteLedgerEntry(entryId, empId, empName){
  if(!confirm('Delete this ledger entry?')) return;
  const { error } = await sb.from('employee_ledger').delete().eq('id', entryId);
  if(error){ alert('Delete failed: ' + error.message); return; }
  showEmployeeLedger(empId, empName);
}

async function deleteEmployee(empId){
  if(!empId) return;
  if(!confirm("Delete this employee?")) return;

  async function safeDelete(table, column){
    const { error } = await sb
      .from(table)
      .delete()
      .eq(column, empId);

    if(error){
      // Ignore missing-table scenarios across different DB setups.
      const msg = (error.message || "").toLowerCase();
      if(error.code === "42P01" || msg.includes("does not exist")) return;
      console.error(`Delete failed in ${table}:`, error);
    }
  }

  // Best-effort cleanup of dependent rows first (avoids FK constraint failures).
  await safeDelete("shares_ledger", "employee_id");
  await safeDelete("work_logs", "employee_id");
  await safeDelete("employee_payout_details", "employee_id");
  await safeDelete("payouts", "employee_id");
  await safeDelete("locked_bonus_ledger", "employee_id");
  await safeDelete("employee_salary_config", "employee_id");
  await safeDelete("employee_ledger", "employee_id");

  const { error } = await sb
    .from("employees")
    .delete()
    .eq("id", empId);

  if(error){
    console.error(error);
    alert("Employee delete failed: " + (error.message || ""));
    return;
  }

  alert("Employee deleted");
  showEmployees();
}
async function showShareMarket(empId){
  title.innerText = "Share Buy / Sell";

  const shareRes = await sb
    .from("shares_ledger")
    .select("shares,locked")
    .eq("employee_id", empId);

  let total = 0;
  let locked = 0;

  shareRes.data.forEach(s=>{
    total += Number(s.shares);
    if(s.locked) locked += Number(s.shares);
  });

  const available = total - locked;

  content.innerHTML = `
    <div class="card">
      Total Shares: <b>${total}</b><br>
      Available Shares: <b>${available}</b><br>
      Locked Shares: <b>${locked}</b><br><br>

      <input id="trade_qty" placeholder="Number of shares">
      <button onclick="buyShares('${empId}')">Buy</button>
      <button style="background:#ef4444" onclick="sellShares('${empId}', ${available})">
        Sell
      </button>
    </div>
  `;
}
async function buyShares(empId){
  const qty = Number(document.getElementById("trade_qty").value);

  if(!qty){
    alert("Shares daal");
    return;
  }

  const { error } = await sb.from("shares_ledger").insert([
    {
      employee_id: empId,
      shares: qty,
      locked: true   // buy wale shares lock rahenge
    }
  ]);

  if(error){
    alert("Buy failed");
    console.error(error);
    return;
  }

  alert(`${qty} shares bought (locked)`);
  showEmployees();
}
async function sellShares(empId, available){
  const qty = Number(document.getElementById(`sell_${empId}`).value);

  if(qty <= 0){
    alert("Quantity daal");
    return;
  }

  if(qty > available){
    alert("Itne shares nahi hain");
    return;
  }

  // 1️⃣ shares minus
  await sb.from("shares_ledger").insert([{
    employee_id: empId,
    shares: -qty
  }]);

  // 2️⃣ share price nikal
  const pool = await sb
    .from("company_money_pool")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const cfg = await sb
    .from("company_shares_config")
    .select("total_shares")
    .single();

  const companyValue =
    Number(pool.data[0].layer1_amount) +
    Number(pool.data[0].layer2_amount);

  const price = companyValue / Number(cfg.data.total_shares);

  const amount = qty * price;

  // 3️⃣ EMPLOYEE NAME + UPI LAO
  const emp = await sb
    .from("employees")
    .select("name")
    .eq("id", empId)
    .single();

  const upiRes = await sb
    .from("employee_payout_details")
    .select("upi_id")
    .eq("employee_id", empId)
    .single();

  if(!upiRes.data){
    alert("UPI ID saved nahi hai");
    return;
  }

  // 4️⃣ UPI LINK BANAO
  const upiLink =
    `upi://pay?pa=${upiRes.data.upi_id}` +
    `&pn=${encodeURIComponent(emp.data.name)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR&tn=Share%20Sell%20Payout`;

  // 5️⃣ SCREEN PE DIKHAO (IMPORTANT PART)
  content.innerHTML += `
    <div class="card">
      <h3>UPI Payment Request</h3>
      <p>Amount: ₹${amount.toFixed(2)}</p>
      <a href="${upiLink}" style="font-size:18px;color:#22c55e">
        👉 Click here to receive payment
      </a>
    </div>
  `;

  alert("Shares sold. Ab UPI link pe click karo");
}
async function loadHRTasks() {
  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user.id;

  const { data, error } = await sb
    .from("tasks")
    .select("*, accepted_by(name)")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    document.getElementById("hrTaskList").innerHTML = "Error loading tasks";
    return;
  }

  let html = `<div class="card"><h3>My Posted Tasks</h3></div>`;
  data.forEach(t => {
    html += `
      <div class="card">
        <b>${t.title}</b><br>
        Reward: ₹${t.reward_amount}<br>
        Status: ${t.status}${t.accepted_by ? ` by ${t.accepted_by.name}` : ""}<br>
        Deadline: ${t.deadline || "-"}
      </div>
    `;
  });
  document.getElementById("hrTaskList").innerHTML =
    data.length ? html : `<div class="card">No tasks yet</div>`;
}


async function showWorkEntry(){
  title.innerText = "Work Entry";

  // load employees
  const empRes = await sb
    .from("employees")
    .select("id,name")
    .eq("active", true);

  // load businesses
  const bizRes = await sb
    .from("businesses")
    .select("id,name");

  // load work logs
  const workRes = await sb
    .from("work_logs")
    .select("hours, work_date, employees(name), businesses(name)")
    .order("created_at",{ascending:false});

  if(empRes.error || bizRes.error || workRes.error){
    content.innerHTML = "<div class='card'>Error loading work data</div>";
    console.error(empRes.error, bizRes.error, workRes.error);
    return;
  }

  let html = `
    <div class="card">
      <select id="we_employee">
        <option value="">Select Employee</option>
        ${empRes.data.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}
      </select>

      <select id="we_business">
        <option value="">Select Business</option>
        ${bizRes.data.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}
      </select>

      <input type="date" id="we_date">
      <input id="we_hours" placeholder="Hours worked">
      <button onclick="saveWork()">Save Work</button>
    </div>

    <hr>

    <div class="container">
  `;

  html += `<hr><h3>Employee Work Summary</h3>`;
  empRes.data.forEach(e => {
    html += `
      <div class="card">
        <b>${e.name}</b><br>
        <button onclick="showEmployeeWorkSummary('${e.id}')">View Work Summary</button>
      </div>
    `;
  });
  html += "</div>";
  content.innerHTML = html;

}

// Show employee work summary
async function showEmployeeWorkSummary(empId) {
  title.innerText = "Employee Work Summary";

  // Get all accepted tasks for this employee
  const { data: accepts } = await sb
    .from("task_accepts")
    .select("*, tasks:title, tasks:description, tasks:points")
    .eq("employee_id", empId);

  let html = `<div class='container'><div class='card'><h3>Accepted Tasks</h3>`;
  if (!accepts || accepts.length === 0) {
    html += "<i>No accepted tasks yet.</i>";
  } else {
    html += `<table style='width:100%;border-collapse:collapse;'>
      <tr><th style='text-align:left'>Title</th><th>Status</th><th>Points</th><th>Proof</th></tr>`;
    for (const a of accepts) {
      html += `<tr>
        <td>${a.tasks?.title || ''}</td>
        <td>${a.status}</td>
        <td>${a.tasks?.points || ''}</td>
        <td>${a.proof ? `<span style='font-size:0.95em'>${a.proof}</span>` : '-'}</td>
      </tr>`;
    }
    html += `</table>`;
  }
  html += `</div><button onclick="showWorkEntry()">Back</button></div>`;
  content.innerHTML = html;
}

async function saveWork(){
  const empId = document.getElementById("we_employee").value;
  const bizId = document.getElementById("we_business").value;
  const date = document.getElementById("we_date").value;
  const hours = Number(document.getElementById("we_hours").value);

  if(!empId || !bizId || !date || !hours){
    alert("Sab fields bhar");
    return;
  }

  // 1️⃣ Save work log
  const { data: work, error: workError } = await sb
    .from("work_logs")
    .insert([
      {
        employee_id: empId,
        business_id: bizId,
        work_date: date,
        hours: hours
      }
    ])
    .select()
    .single();

  if(workError){
    alert("Work save nahi hui");
    console.error(workError);
    return;
  }

  // 2️⃣ Calculate shares
  const shares = hours * 100;

  // 3️⃣ Insert into shares_ledger
  const { error: shareError } = await sb
    .from("shares_ledger")
    .insert([
      {
        employee_id: empId,
        work_log_id: work.id,
        shares: shares,
        locked: false
      }
    ]);

  if(shareError){
    alert("Shares generate nahi hue");
    console.error(shareError);
    return;
  }

  alert(`Work saved + ${shares} shares added ✅`);
  showWorkEntry();
}
// Assets screen (Company Assets)
async function showAssets(){
  title.innerText = "Company Assets";

  // Ensure Asset Portfolio styles exist (keeps UI correct even if host HTML wasn't updated)
  (function ensureAssetPortfolioStyles(){
    if(document.getElementById('ap-styles')) return;
    const css = `
      .ap-page{width:100%;background:#F9FAFB;border:1px solid rgba(0,0,0,.06);border-radius:12px;overflow:hidden}
      .ap-container{max-width:1280px;margin:0 auto;padding:0 24px}
      .ap-header{background:#FFFFFF;border-bottom:1px solid #E5E7EB;padding:24px 0}
      .ap-header-inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
      .ap-title{font-size:30px;line-height:1.15;color:#111827;margin:0 0 4px;font-weight:700;letter-spacing:.2px}
      .ap-subtitle{font-size:14px;color:#6B7280;margin:0}
      .ap-total{text-align:right}
      .ap-total-label{font-size:14px;color:#6B7280;margin-bottom:4px}
      .ap-total-value{font-size:30px;color:#111827;font-weight:700}
      .ap-main{padding:32px 0}
      .ap-summary-grid{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:32px}
      @media (min-width:768px){.ap-summary-grid{grid-template-columns:repeat(2,1fr)}}
      @media (min-width:1024px){.ap-summary-grid{grid-template-columns:repeat(4,1fr)}}
      .ap-summary-card{background:#FFFFFF;border:1px solid #F3F4F6;border-radius:8px}
      .ap-summary-card .ap-summary-content{padding:24px 18px 18px}
      .ap-row{display:flex;align-items:center;gap:12px}
      .ap-ic{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;flex:0 0 auto}
      .ap-label{font-size:12px;color:#6B7280;margin-bottom:4px}
      .ap-value{font-size:18px;color:#111827;font-weight:600}
      .ap-neg{color:#EF4444}
      .ap-section-title{font-size:20px;color:#111827;font-weight:700;margin:0 0 16px}
      .ap-add-card{background:#FFFFFF;border:1px solid #F3F4F6;border-radius:8px;padding:18px;margin-bottom:24px}
      .ap-add-grid{display:grid;grid-template-columns:1fr;gap:12px}
      @media (min-width:768px){.ap-add-grid{grid-template-columns:repeat(3,1fr)}}
      .ap-input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #E5E7EB;background:#FFFFFF;box-shadow:none;margin:0;color:#111827;font-size:14px}
      .ap-input:focus{outline:none;border-color:#CBD5E1}
      .ap-help{font-size:12px;color:#6B7280;margin-top:8px}
      .ap-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:8px;border:1px solid #E5E7EB;background:#FFFFFF;color:#111827;font-size:14px;font-weight:600;box-shadow:none;margin:0}
      .ap-btn:hover{background:#F9FAFB;transform:none}
      .ap-btn-danger{border-color:#FCA5A5;color:#B91C1C;background:#FFFFFF}
      .ap-btn-danger:hover{background:#FEF2F2}
      .ap-grid{display:grid;grid-template-columns:1fr;gap:24px}
      @media (min-width:768px){.ap-grid{grid-template-columns:repeat(2,1fr)}}
      @media (min-width:1024px){.ap-grid{grid-template-columns:repeat(3,1fr)}}
      .ap-card{background:#FFFFFF;border:1px solid #F3F4F6;border-radius:8px;transition:box-shadow 300ms ease;overflow:hidden}
      .ap-card:hover{box-shadow:0 16px 40px rgba(17,24,39,.10)}
      .ap-card-h{padding:16px 16px 12px}
      .ap-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .ap-card-title{font-size:20px;color:#111827;margin:0 0 8px;font-weight:700}
      .ap-meta{display:flex;align-items:center;gap:6px;color:#6B7280;font-size:12px}
      .ap-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;border:1px solid #E5E7EB;font-size:12px;white-space:nowrap;user-select:none}
      .ap-badge--excellent{background:#F0FDF4;color:#15803D;border-color:#BBF7D0}
      .ap-badge--good{background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE}
      .ap-badge--fair{background:#FFF7ED;color:#C2410C;border-color:#FED7AA}
      .ap-card-c{padding:14px 16px 16px}
      .ap-row2{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .ap-k{font-size:14px;color:#6B7280}
      .ap-v-lg{font-size:18px;color:#111827;font-weight:600}
      .ap-v-sm{font-size:14px;color:#111827;font-weight:500}
      .ap-border-b{padding-bottom:12px;border-bottom:1px solid #E5E7EB;margin-bottom:12px}
      .ap-dep-left{display:flex;align-items:center;gap:6px}
      .ap-dep{font-size:14px;color:#EF4444;font-weight:600}
      .ap-date{display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #E5E7EB;margin-top:12px;color:#6B7280;font-size:12px}
      .ap-card-actions{margin-top:12px;display:flex;justify-content:flex-end}
      @media (max-width:700px){.ap-container{padding:0 14px}.ap-title{font-size:22px}.ap-total-value{font-size:22px}}
    `;
    const style = document.createElement('style');
    style.id = 'ap-styles';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  const { data, error } = await sb
    .from("company_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if(error){
    console.error(error);
    content.innerHTML = `
      <div class="container">
        <div class="card">
          Failed to load assets.<br>
          <div style="margin-top:10px;font-size:14px;opacity:.85">
            <b>Error:</b> ${error.message || "Unknown error"}
          </div>
          <div style="margin-top:10px;font-size:14px;opacity:.85">
            If table is missing, create <b>company_assets</b> in Supabase.<br>
            If you see <i>permission denied</i> / <i>RLS</i>, ensure policies + GRANTs allow the <b>authenticated</b> role.
          </div>
        </div>
      </div>
    `;
    return;
  }

  const rows = data || [];
  const total = rows.reduce((sum, a) => {
    const v = Number(a.current_value ?? a.value ?? 0);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  function inr(n){
    const num = Number(n ?? 0);
    try { return `₹${num.toLocaleString('en-IN')}`; }
    catch(e){ return `₹${num}`; }
  }

  function iconSvg(kind){
    const common = `width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    switch(kind){
      case 'dollar':
        return `<svg ${common}><path d="M12 2v20"/><path d="M17 6H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7"/></svg>`;
      case 'trendDown':
        return `<svg ${common}><path d="M3 7l6 6 4-4 7 7"/><path d="M14 16h6v-6"/></svg>`;
      case 'package':
        return `<svg ${common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7l8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
      case 'layers':
        return `<svg ${common}><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
      case 'calendar':
        return `<svg ${common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`;
      case 'miniPackage':
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="9"/></svg>`;
    }
  }

  function fmtMonthYear(dateStr){
    if(!dateStr) return null;
    const d = new Date(dateStr);
    if(Number.isNaN(d.getTime())) return null;
    try{
      return new Intl.DateTimeFormat('en-IN', { month:'short', year:'numeric' }).format(d);
    }catch(e){
      return String(dateStr);
    }
  }

  function normalizeCondition(v){
    const s = String(v || '').trim().toLowerCase();
    if(s === 'excellent') return 'Excellent';
    if(s === 'fair') return 'Fair';
    return 'Good';
  }

  function conditionBadgeClass(c){
    if(c === 'Excellent') return 'ap-badge ap-badge--excellent';
    if(c === 'Fair') return 'ap-badge ap-badge--fair';
    return 'ap-badge ap-badge--good';
  }

  // Inline edit state
  const editId = window.__ap_edit_asset_id || null;

  window.openAssetEdit = function(assetId){
    window.__ap_edit_asset_id = assetId;
    showAssets();
  };

  window.cancelAssetEdit = function(){
    window.__ap_edit_asset_id = null;
    showAssets();
  };

  window.saveAssetEdit = async function(assetId){
    const root = document.querySelector(`[data-asset-edit="${assetId}"]`);
    if(!root){
      alert('Edit form missing');
      return;
    }

    const name = (root.querySelector('[data-f="name"]')?.value || '').trim();
    const category = (root.querySelector('[data-f="category"]')?.value || '').trim();
    const condition = (root.querySelector('[data-f="condition"]')?.value || 'Good').trim();
    const purchaseDate = (root.querySelector('[data-f="purchase_date"]')?.value || '').trim();
    const purchaseValue = Number(root.querySelector('[data-f="purchase_value"]')?.value || 0);
    const currentValue = Number(root.querySelector('[data-f="current_value"]')?.value || 0);

    if(!name || !purchaseDate || !(purchaseValue > 0) || !(currentValue >= 0)){
      alert('Name, purchase date, purchase value aur today value sahi bhar');
      return;
    }

    const { error: upErr } = await sb
      .from('company_assets')
      .update({
        name,
        category: category || 'General',
        condition: condition || 'Good',
        purchase_date: purchaseDate,
        purchase_value: purchaseValue,
        current_value: currentValue
      })
      .eq('id', assetId);

    if(upErr){
      console.error(upErr);
      const msg = String(upErr.message || '');
      if(msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')){
        alert('Update failed: database schema update pending. Supabase SQL Editor me backend/sql/company_assets.sql run karo.\n\nError: ' + msg);
      } else {
        alert('Update failed: ' + msg);
      }
      return;
    }

    window.__ap_edit_asset_id = null;
    showAssets();
  };

  // Portfolio metrics
  const totalPurchaseValue = rows.reduce((sum, a) => {
    const pv = Number(a.purchase_value ?? a.purchaseValue ?? 0);
    return sum + (Number.isFinite(pv) ? pv : 0);
  }, 0);
  const totalCurrentValue = total;
  const totalDepreciation = totalPurchaseValue - totalCurrentValue;
  const avgDepPct = totalPurchaseValue > 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0;
  const categoryCount = new Set(rows.map(r => String(r.category || 'General').trim()).filter(Boolean)).size;

  let html = `
    <div class="ap-page">
      <header class="ap-header">
        <div class="ap-container ap-header-inner">
          <div>
            <div class="ap-title">Asset Portfolio</div>
            <div class="ap-subtitle">Company Asset Management</div>
          </div>
          <div class="ap-total">
            <div class="ap-total-label">Total Asset Value</div>
            <div class="ap-total-value">${inr(totalCurrentValue)}</div>
          </div>
        </div>
      </header>

      <main class="ap-main">
        <div class="ap-container">
          <div class="ap-summary-grid">
            <div class="ap-summary-card">
              <div class="ap-summary-content">
                <div class="ap-row">
                  <div class="ap-ic" style="background:#EFF6FF;color:#2563EB">${iconSvg('dollar')}</div>
                  <div>
                    <div class="ap-label">Purchase Value</div>
                    <div class="ap-value">${inr(totalPurchaseValue)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ap-summary-card">
              <div class="ap-summary-content">
                <div class="ap-row">
                  <div class="ap-ic" style="background:#FEF2F2;color:#EF4444">${iconSvg('trendDown')}</div>
                  <div>
                    <div class="ap-label">Depreciation</div>
                    <div class="ap-value ap-neg">${inr(totalDepreciation)}</div>
                    <div class="ap-label" style="margin:4px 0 0;">(${avgDepPct.toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ap-summary-card">
              <div class="ap-summary-content">
                <div class="ap-row">
                  <div class="ap-ic" style="background:#F5F3FF;color:#9333EA">${iconSvg('package')}</div>
                  <div>
                    <div class="ap-label">Total Assets</div>
                    <div class="ap-value">${rows.length}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ap-summary-card">
              <div class="ap-summary-content">
                <div class="ap-row">
                  <div class="ap-ic" style="background:#F0FDF4;color:#10B981">${iconSvg('layers')}</div>
                  <div>
                    <div class="ap-label">Categories</div>
                    <div class="ap-value">${categoryCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ap-add-card">
            <div class="ap-section-title" style="margin-bottom:12px;">Add Asset</div>
            <div class="ap-add-grid">
              <input id="asset_name" class="ap-input" placeholder="Asset name (Truck / Stock)">
              <input id="asset_category" class="ap-input" placeholder="Category (Electronics - Mobile)">
              <select id="asset_condition" class="ap-input">
                <option value="Excellent">Excellent</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
              </select>
              <input id="asset_purchase_date" class="ap-input" type="date" placeholder="Purchase date">
              <input id="asset_purchase_value" class="ap-input" type="number" step="0.01" placeholder="Purchase value (₹)">
              <input id="asset_today_value" class="ap-input" type="number" step="0.01" placeholder="Today's value (₹)">
            </div>
            <div id="asset_dep_preview" class="ap-help"></div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end;">
              <button class="ap-btn" onclick="addAsset()">Add Asset</button>
            </div>
          </div>

          <div class="ap-section-title">Asset Inventory</div>
          <div class="ap-grid">
  `;

  if(rows.length === 0){
    html += `<div class="ap-add-card" style="margin:0;">No assets yet.</div>`;
  } else {
    rows.forEach(a => {
      const name = a.name || "(Unnamed)";
      const category = (a.category || 'General');
      const cond = normalizeCondition(a.condition);

      const pv = Number(a.purchase_value ?? a.purchaseValue ?? a.current_value ?? 0);
      const cv = Number(a.current_value ?? a.currentValue ?? a.value ?? 0);

      const depAmt = (a.depreciation_amount !== undefined && a.depreciation_amount !== null)
        ? Number(a.depreciation_amount)
        : (pv - cv);
      const depPct = (a.depreciation_percent !== undefined && a.depreciation_percent !== null)
        ? Number(a.depreciation_percent)
        : (pv > 0 ? (depAmt / pv) * 100 : null);

      const depText = `${inr(depAmt)}${Number.isFinite(depPct) ? ` (${depPct.toFixed(1)}%)` : ''}`;
      const pDateRaw = a.purchase_date || (a.created_at ? String(a.created_at).slice(0,10) : null);
      const monthYear = fmtMonthYear(pDateRaw);

      const isEditing = editId && String(editId) === String(a.id);

      html += `
        <div class="ap-card">
          <div class="ap-card-h">
            <div class="ap-card-top">
              <div style="min-width:0;flex:1;">
                <div class="ap-card-title">${String(name)}</div>
                <div class="ap-meta">
                  <span style="color:#9CA3AF;display:inline-flex;">${iconSvg('miniPackage')}</span>
                  <span>${String(category)}</span>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
                <span class="${conditionBadgeClass(cond)}">${cond}</span>
              </div>
            </div>
          </div>

          <div class="ap-card-c">
            ${isEditing ? `
              <div data-asset-edit="${a.id}">
                <div class="ap-add-grid" style="margin-top:2px;">
                  <input class="ap-input" data-f="name" value="${String(name).replace(/"/g,'&quot;')}" placeholder="Asset name">
                  <input class="ap-input" data-f="category" value="${String(category).replace(/"/g,'&quot;')}" placeholder="Category">
                  <select class="ap-input" data-f="condition">
                    <option value="Excellent" ${cond==='Excellent'?'selected':''}>Excellent</option>
                    <option value="Good" ${cond==='Good'?'selected':''}>Good</option>
                    <option value="Fair" ${cond==='Fair'?'selected':''}>Fair</option>
                  </select>
                  <input class="ap-input" data-f="purchase_date" type="date" value="${(a.purchase_date || (a.created_at ? String(a.created_at).slice(0,10) : ''))}">
                  <input class="ap-input" data-f="purchase_value" type="number" step="0.01" value="${Number.isFinite(pv) ? pv : 0}" placeholder="Purchase value (₹)">
                  <input class="ap-input" data-f="current_value" type="number" step="0.01" value="${Number.isFinite(cv) ? cv : 0}" placeholder="Today's value (₹)">
                </div>
                <div class="ap-help" style="margin-top:10px;">Save will auto-recalculate depreciation.</div>
                <div class="ap-card-actions" style="gap:10px;justify-content:flex-end;">
                  <button class="ap-btn" onclick="saveAssetEdit('${a.id}')">Save</button>
                  <button class="ap-btn" onclick="cancelAssetEdit()">Cancel</button>
                </div>
              </div>
            ` : `
              <div class="ap-row2 ap-border-b">
                <span class="ap-k">Current Value</span>
                <span class="ap-v-lg">${inr(cv)}</span>
              </div>
              <div class="ap-row2">
                <span class="ap-k">Purchase Value</span>
                <span class="ap-v-sm">${inr(pv)}</span>
              </div>
              <div class="ap-row2" style="margin-top:10px;">
                <div class="ap-dep-left">
                  <span style="color:#EF4444;display:inline-flex">${iconSvg('trendDown').replace('width="20"','width="16"').replace('height="20"','height="16"')}</span>
                  <span class="ap-k">Depreciation</span>
                </div>
                <span class="ap-dep">${depText}</span>
              </div>
              <div class="ap-date">
                <span style="color:#9CA3AF;display:inline-flex">${iconSvg('calendar').replace('width="20"','width="12"').replace('height="20"','height="12"')}</span>
                <span>Purchased ${monthYear || '-'}</span>
              </div>
              <div class="ap-card-actions" style="gap:10px;">
                <button class="ap-btn" onclick="openAssetEdit('${a.id}')">Edit</button>
                <button class="ap-btn ap-btn-danger" onclick="deleteAsset('${a.id}')">Delete</button>
              </div>
            `}
          </div>
        </div>
      `;
    });
  }

  html += `
          </div>
        </div>
      </main>
    </div>
  `;

  content.innerHTML = html;

  // Live depreciation preview (DB still computes final values)
  const pvEl = document.getElementById('asset_purchase_value');
  const tvEl = document.getElementById('asset_today_value');
  const preview = document.getElementById('asset_dep_preview');
  const recompute = () => {
    if(!preview) return;
    const pv = Number(pvEl?.value || 0);
    const tv = Number(tvEl?.value || 0);
    if(!(pv > 0) || !(tv >= 0)){
      preview.textContent = '';
      return;
    }
    const dep = pv - tv;
    const pct = pv > 0 ? (dep / pv) * 100 : 0;
    preview.textContent = `Depreciation: ${inr(dep)} (${pct.toFixed(1)}%)`;
  };
  pvEl?.addEventListener('input', recompute);
  tvEl?.addEventListener('input', recompute);
}

async function addAsset(){
  const name = (document.getElementById("asset_name")?.value || "").trim();
  const category = (document.getElementById("asset_category")?.value || "").trim();
  const condition = (document.getElementById("asset_condition")?.value || "Good").trim();
  const purchaseDate = (document.getElementById("asset_purchase_date")?.value || "").trim();
  const purchaseValue = Number(document.getElementById("asset_purchase_value")?.value || 0);
  const todayValue = Number(document.getElementById("asset_today_value")?.value || 0);

  if(!name || !(purchaseValue > 0) || !(todayValue >= 0) || !purchaseDate){
    alert("Asset name, purchase date, purchase value aur today value sahi bhar");
    return;
  }

  // Requires updated schema (purchase_value, purchase_date, category, condition)
  const attempt1 = await sb.from("company_assets").insert([{
    name,
    category: category || 'General',
    condition: condition || 'Good',
    purchase_date: purchaseDate,
    purchase_value: purchaseValue,
    current_value: todayValue,
    status: "ACTIVE"
  }]);

  if(attempt1?.error){
    console.error(attempt1.error);
    const msg = String(attempt1.error.message || '');
    if(msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')){
      alert('Asset add nahi hua: database schema update pending. Supabase SQL Editor me backend/sql/company_assets.sql run karo.\n\nError: ' + msg);
    } else {
      alert('Asset add nahi hua: ' + msg);
    }
    return;
  }

  document.getElementById("asset_name").value = "";
  const cat = document.getElementById("asset_category");
  const cond = document.getElementById("asset_condition");
  const pd = document.getElementById("asset_purchase_date");
  const pv = document.getElementById("asset_purchase_value");
  const tv = document.getElementById("asset_today_value");
  if(cat) cat.value = "";
  if(cond) cond.value = "Good";
  if(pd) pd.value = "";
  if(pv) pv.value = "";
  if(tv) tv.value = "";
  showAssets();
}

async function deleteAsset(assetId){
  if(!assetId) return;
  if(!confirm("Delete this asset?")) return;

  const { error } = await sb
    .from("company_assets")
    .delete()
    .eq("id", assetId);

  if(error){
    console.error(error);
    alert("Delete failed");
    return;
  }

  showAssets();
}
async function showUpiForm(empId){
  title.innerText = "Add UPI Details";

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <input id="upi_id" placeholder="Enter UPI ID (example@upi)">
        <button onclick="saveUpi('${empId}')">Save UPI</button>
      </div>
    </div>
  `;
}
async function saveUpi(empId){
  const upi = document.getElementById("upi_id").value;

  if(!upi){
    alert("UPI ID daal");
    return;
  }

  await sb.from("employee_payout_details").upsert([{
    employee_id: empId,
    upi_id: upi
  }]);

  alert("UPI saved");
}
function generateUpiLink(upi, name, amount){
  return `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=Share%20Sell%20Payment`;
}
async function showUpiRequest(empId, empName, amount){
  const { data } = await sb
    .from("employee_payout_details")
    .select("upi_id")
    .eq("employee_id", empId)
    .single();

  if(!data || !data.upi_id){
    alert("UPI ID saved nahi hai");
    return;
  }

  const upiLink = generateUpiLink(
    data.upi_id,
    empName,
    amount
  );

  content.innerHTML += `
    <div class="card">
      <h3>UPI Payment Request</h3>
      <p>Amount: ₹${amount}</p>
      <a href="${upiLink}">
        👉 Click to receive payment
      </a>
    </div>
  `;
}
function showShareMarket(){
  title.innerText = "Share Market";
  content.innerHTML = `
    <div class="card">Share Price: ₹250</div>
    <div class="card">Your Shares: 1,200</div>
  `;
}




/* ================= LAYERS (FOUNDER) ================= */
function showLayersHome(){
  title.innerText = "Layers";

  content.innerHTML = `
    <div class="container">

      <div class="card">
        <h2 style="margin-top:0;">Choose Layer</h2>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:14px;max-width:900px">
          <button onclick="showLayer1Founders()" style="padding:18px;border-radius:16px;font-weight:800">Layer 1 — Founders (Full-time)</button>
          <button onclick="showLayer2Members()" style="padding:18px;border-radius:16px;font-weight:800">Layer 2 — Employees / Shareholders</button>
          <button onclick="showLayer3Businesses()" style="padding:18px;border-radius:16px;font-weight:800">Layer 3 — Businesses</button>
        </div>
      </div>

    </div>
  `;
}

// Investors moved to sidebar under Assets
async function showInvestors(){
  return showLayer4Investors();
}

async function showLayer1Founders(){
  title.innerText = "Layer 1 — Founders";

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">Add Founder (full-time)</h3>
        <input id="l1_name" placeholder="Name">
        <input id="l1_share_value" type="number" step="0.01" placeholder="Share value / holding">
        <button onclick="addLayer1Founder()">Add to Layer 1</button>
        <div id="l1_msg" style="margin-top:10px;font-size:14px;opacity:.85"></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Layer 1 List</h3>
        <div id="l1_list">Loading...</div>
      </div>

      <div class="card">
        <button onclick="showLayersHome()">Back</button>
      </div>
    </div>
  `;

  await loadLayer1Founders();
}

async function loadLayer1Founders(){
  const holder = document.getElementById("l1_list");
  if(!holder) return;

  const { data, error } = await sb
    .from("layer1_founders")
    .select("id,name,share_value,created_at")
    .order("created_at", { ascending: false });

  if(error){
    holder.innerHTML = `
      <div>Failed to load Layer 1.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">If tables are missing, run backend/sql/layers.sql in Supabase SQL Editor.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">Error: ${error.message}</div>
    `;
    return;
  }

  if(!data || !data.length){
    holder.innerHTML = "No founders added yet.";
    return;
  }

  holder.innerHTML = data
    .map((r) => {
      const val = Number(r.share_value || 0);
      return `
        <div class="card" style="margin:12px 0;">
          <b>${r.name || "-"}</b><br>
          Holding: <b>${Number.isFinite(val) ? val : 0}</b>
        </div>
      `;
    })
    .join("");
}

async function addLayer1Founder(){
  const name = (document.getElementById("l1_name")?.value || "").trim();
  const shareValue = Number(document.getElementById("l1_share_value")?.value);
  const msg = document.getElementById("l1_msg");

  if(!name || !Number.isFinite(shareValue)){
    if(msg) msg.innerText = "Name and share value required.";
    return;
  }

  const { error } = await sb.from("layer1_founders").insert([
    { name, share_value: shareValue }
  ]);

  if(error){
    if(msg) msg.innerText = "Add failed: " + error.message;
    return;
  }

  if(msg) msg.innerText = "Added.";
  document.getElementById("l1_name").value = "";
  document.getElementById("l1_share_value").value = "";
  await loadLayer1Founders();
}

async function showLayer2Members(){
  title.innerText = "Layer 2 — Employees / Shareholders";

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">Add Member</h3>
        <input id="l2_name" placeholder="Name">
        <input id="l2_share_value" type="number" step="0.01" placeholder="Share value / holding">
        <button onclick="addLayer2Member()">Add to Layer 2</button>
        <div id="l2_msg" style="margin-top:10px;font-size:14px;opacity:.85"></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Layer 2 List</h3>
        <div id="l2_list">Loading...</div>
      </div>

      <div class="card">
        <button onclick="showLayersHome()">Back</button>
      </div>
    </div>
  `;

  await loadLayer2Members();
}

async function loadLayer2Members(){
  const holder = document.getElementById("l2_list");
  if(!holder) return;

  const { data, error } = await sb
    .from("layer2_members")
    .select("id,name,share_value,created_at")
    .order("created_at", { ascending: false });

  if(error){
    holder.innerHTML = `
      <div>Failed to load Layer 2.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">If tables are missing, run backend/sql/layers.sql in Supabase SQL Editor.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">Error: ${error.message}</div>
    `;
    return;
  }

  if(!data || !data.length){
    holder.innerHTML = "No Layer 2 members added yet.";
    return;
  }

  holder.innerHTML = data
    .map((r) => {
      const val = Number(r.share_value || 0);
      return `
        <div class="card" style="margin:12px 0;">
          <b>${r.name || "-"}</b><br>
          Holding: <b>${Number.isFinite(val) ? val : 0}</b>
        </div>
      `;
    })
    .join("");
}

async function addLayer2Member(){
  const name = (document.getElementById("l2_name")?.value || "").trim();
  const shareValue = Number(document.getElementById("l2_share_value")?.value);
  const msg = document.getElementById("l2_msg");

  if(!name || !Number.isFinite(shareValue)){
    if(msg) msg.innerText = "Name and share value required.";
    return;
  }

  const { error } = await sb.from("layer2_members").insert([
    { name, share_value: shareValue }
  ]);

  if(error){
    if(msg) msg.innerText = "Add failed: " + error.message;
    return;
  }

  if(msg) msg.innerText = "Added.";
  document.getElementById("l2_name").value = "";
  document.getElementById("l2_share_value").value = "";
  await loadLayer2Members();
}

async function showLayer3Businesses(){
  title.innerText = "Layer 3 — Businesses";

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">Add Business</h3>
        <input id="l3_name" placeholder="Business name">
        <input id="l3_type" placeholder="Type (e.g. food, retail)">
        <input id="l3_value" type="number" step="0.01" placeholder="Value">
        <button onclick="addLayer3Business()">Add to Layer 3</button>
        <div id="l3_msg" style="margin-top:10px;font-size:14px;opacity:.85"></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Layer 3 List</h3>
        <div id="l3_list">Loading...</div>
      </div>

      <div class="card">
        <button onclick="showLayersHome()">Back</button>
      </div>
    </div>
  `;

  await loadLayer3Businesses();
}

async function loadLayer3Businesses(){
  const holder = document.getElementById("l3_list");
  if(!holder) return;

  function businessValuation(b){
    const raw = (
      (b && (b.value ?? b.valuation ?? b.business_value ?? b.current_value ?? b.amount ?? b.total_value ?? b.valuation_amount))
    );
    const num = Number(raw ?? 0);
    return Number.isFinite(num) ? num : 0;
  }

  // Avoid selecting columns that may not exist (e.g. 'value')
  let res = await sb
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  // If created_at doesn't exist, retry without ordering
  if(res.error && String(res.error.message || '').toLowerCase().includes('created_at')){
    res = await sb.from("businesses").select("*");
  }

  const { data, error } = res;

  if(error){
    holder.innerHTML = `Failed to load businesses: ${error.message}`;
    return;
  }

  if(!data || !data.length){
    holder.innerHTML = "No businesses added yet.";
    return;
  }

  holder.innerHTML = data
    .map((b) => {
      return `
        <div class="card" style="margin:12px 0;">
          <b>${b.name || "-"}</b><br>
          Type: ${b.type || "-"}<br>
          Value: <b>₹${businessValuation(b)}</b>
        </div>
      `;
    })
    .join("");
}

async function addLayer3Business(){
  const name = (document.getElementById("l3_name")?.value || "").trim();
  const type = (document.getElementById("l3_type")?.value || "").trim();
  const value = Number(document.getElementById("l3_value")?.value);
  const msg = document.getElementById("l3_msg");

  if(!name){
    if(msg) msg.innerText = "Business name required.";
    return;
  }

  const payload = {
    name,
    type: type || null,
    value: Number.isFinite(value) ? value : 0,
  };

  const { error } = await sb.from("businesses").insert([payload]);

  if(error){
    if(msg) msg.innerText = "Add failed: " + error.message;
    return;
  }

  if(msg) msg.innerText = "Added.";
  document.getElementById("l3_name").value = "";
  document.getElementById("l3_type").value = "";
  document.getElementById("l3_value").value = "";
  await loadLayer3Businesses();
}

async function showLayer4Investors(){
  title.innerText = "Layer 4 — Investors";

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayISO = `${yyyy}-${mm}-${dd}`;

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">Add Investor</h3>
        <input id="l4_name" placeholder="Name">
        <input id="l4_amount" type="number" step="0.01" placeholder="Investment amount">
        <input id="l4_invested_on" type="date" value="${todayISO}" />
        <button onclick="addLayer4Investor()">Add to Layer 4</button>
        <div id="l4_msg" style="margin-top:10px;font-size:14px;opacity:.85"></div>
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Layer 4 List</h3>
        <div id="l4_summary" style="margin:10px 0 0 0;opacity:.9;font-size:14px"></div>
        <div id="l4_list">Loading...</div>
      </div>

      <div class="card">
        <button onclick="showLayersHome()">Back</button>
      </div>
    </div>
  `;

  await loadLayer4Investors();
}

function _calcSimpleInterest({ principal, annualRate, investedOn }){
  const p = Number(principal || 0);
  const r = Number(annualRate || 0.12);
  const start = investedOn ? new Date(investedOn) : null;
  if(!Number.isFinite(p) || p <= 0 || !start || Number.isNaN(start.getTime())){
    return { days: 0, interest: 0, total: Math.max(0, p) };
  }

  const now = new Date();
  const ms = now.getTime() - start.getTime();
  const days = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  const interest = p * r * (days / 365);
  const total = p + interest;
  return {
    days,
    interest: Number.isFinite(interest) ? interest : 0,
    total: Number.isFinite(total) ? total : p
  };
}

async function loadLayer4Investors(){
  const holder = document.getElementById("l4_list");
  if(!holder) return;

  const summary = document.getElementById("l4_summary");

  const { data, error } = await sb
    .from("layer4_investors")
    .select("*")
    .order("created_at", { ascending: false });

  if(error){
    holder.innerHTML = `
      <div>Failed to load Layer 4.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">If tables are missing, run backend/sql/layers.sql in Supabase SQL Editor.</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85;">Error: ${error.message}</div>
    `;
    return;
  }

  if(!data || !data.length){
    if(summary) summary.innerHTML = "";
    holder.innerHTML = "No investors added yet.";
    return;
  }

  // Summary boxes
  let totalPrincipal = 0;
  let totalInterest = 0;
  data.forEach((r) => {
    const principal = Number(r.amount || 0);
    totalPrincipal += Number.isFinite(principal) ? principal : 0;

    const investedOn = r.invested_on || (r.created_at ? String(r.created_at).slice(0, 10) : null);
    const annualRate = Number(r.annual_rate || 0.12);
    const calc = _calcSimpleInterest({ principal, annualRate, investedOn });
    totalInterest += Number(calc.interest || 0);
  });

  if(summary){
    summary.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px;margin-top:8px">
        <div class="card" style="padding:16px;border-radius:18px">
          Principal<br><b>₹${Math.round(totalPrincipal)}</b>
        </div>
        <div class="card" style="padding:16px;border-radius:18px">
          Interest Accumulated (12% yearly)<br><b>₹${Math.round(totalInterest)}</b>
        </div>
        <div class="card" style="padding:16px;border-radius:18px">
          Total Payable (Approx)<br><b>₹${Math.round(totalPrincipal + totalInterest)}</b>
        </div>
      </div>
    `;
  }

  holder.innerHTML = data
    .map((r) => {
      const principal = Number(r.amount || 0);
      const investedOn = r.invested_on || (r.created_at ? String(r.created_at).slice(0, 10) : null);
      const annualRate = Number(r.annual_rate || 0.12);
      const layerTag = r.layer_tag || "LAYER 4";

      const calc = _calcSimpleInterest({ principal, annualRate, investedOn });
      return `
        <div class="card" style="margin:12px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div>
              <b>${r.name || "-"}</b>
              <div style="margin-top:6px;font-size:13px;opacity:.85">${layerTag}</div>
            </div>
            <button style="background:#ef4444" onclick="deleteLayer4Investor('${r.id}')">Delete</button>
          </div>
          <div style="margin-top:10px;opacity:.92">
            Principal: <b>₹${Number.isFinite(principal) ? principal : 0}</b><br>
            Invested On: <b>${investedOn || "-"}</b><br>
            Interest (12% yearly): <b>₹${Math.round(calc.interest)}</b> <span style="font-size:12px;opacity:.75">(${calc.days} days)</span><br>
            Total: <b>₹${Math.round(calc.total)}</b>
          </div>
        </div>
      `;
    })
    .join("");
}

async function addLayer4Investor(){
  const name = (document.getElementById("l4_name")?.value || "").trim();
  const amount = Number(document.getElementById("l4_amount")?.value);
  const investedOn = (document.getElementById("l4_invested_on")?.value || "").trim();
  const msg = document.getElementById("l4_msg");

  if(!name || !Number.isFinite(amount)){
    if(msg) msg.innerText = "Name and amount required.";
    return;
  }

  const payloadV2 = {
    name,
    amount,
    invested_on: investedOn || null,
    annual_rate: 0.12,
    layer_tag: "LAYER 4"
  };

  // Try new schema first; fallback to old schema if columns not added yet.
  const attempt1 = await sb.from("layer4_investors").insert([payloadV2]);
  let error = attempt1?.error;
  if(error){
    const msgLower = (error.message || "").toLowerCase();
    if(msgLower.includes("column") || msgLower.includes("does not exist")){
      const attempt2 = await sb.from("layer4_investors").insert([{ name, amount }]);
      error = attempt2?.error || null;
    }
  }

  if(error){
    if(msg) msg.innerText = "Add failed: " + error.message;
    return;
  }

  if(msg) msg.innerText = "Added.";
  document.getElementById("l4_name").value = "";
  document.getElementById("l4_amount").value = "";
  await loadLayer4Investors();
}

async function deleteLayer4Investor(id){
  if(!id) return;
  if(!confirm("Delete this investor?")) return;

  const { error } = await sb
    .from("layer4_investors")
    .delete()
    .eq("id", id);

  if(error){
    alert("Delete failed: " + (error.message || ""));
    console.error(error);
    return;
  }

  await loadLayer4Investors();
}


// Expose dashboard/chart functions for founder.html
window.openBusinessDashboard = openBusinessDashboard;
window.renderBusinessChart = renderBusinessChart;

loadUserPanel();

