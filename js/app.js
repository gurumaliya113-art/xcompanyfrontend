
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

  content.innerHTML = `
    <div class="container">

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
        <div class="card">
          Employees<br>
          <b>${empRes.count ?? (empRes.data || []).length}</b>
        </div>

        <div class="card">
          Businesses<br>
          <b>${bizRes.count ?? (bizRes.data || []).length}</b>
        </div>

        <div class="card">
          Company Value<br>
          <b>₹${companyValue.toFixed(2)}</b>
        </div>

        <div class="card">
          Share Price<br>
          <b>₹${sharePrice.toFixed(2)}</b>
        </div>
      </div>

      <hr>

      <div class="card">
        <h3>Share Price Trend</h3>
        <canvas id="shareLineChart"></canvas>
      </div>

      <div class="card">
        <h2 style="margin-top:0;">Company Layers</h2>
        <div class="layerMapWrap">
          <div class="layerMapStage">
            <div class="layerRings">
              <div class="layerRing ring3">
                <div class="layerRing ring2">
                  <div class="layerRing ring1">
                    <div class="layerRing ring0">
                      <div class="layerCoreText">Layer 0<br>We All together</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="layerTag tag3">
              <div class="layerTitle">Layer 3 — Assets</div>
              <div class="layerDesc">Driven by Layer 1 &amp; 2 and Powered By Layer 1 &amp; 4</div>
            </div>
            <div class="layerTag tag2">
              <div class="layerTitle">Layer 2 — Product Based</div>
              <div class="layerDesc">Powered by Service based Layer 1</div>
            </div>
            <div class="layerTag tag1">
              <div class="layerTitle">Layer 1 — Service based</div>
              <div class="layerDesc">Powered by Hardwork &amp; Skills</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        Total Shares Used: <b>${totalSharesUsed}</b>
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
    // Fallback sample data
    labels = ["3 Jun", "4 Jun", "5 Jun", "6 Jun"];
    prices = [62.34, 64.35, 66.47, 70.34];
  }

  // Gold, green, red lines for premium look
  let datasets = [
    {
      label: "Share Price",
      data: prices,
      borderWidth: 4,
      borderColor: "#FFD700", // gold
      backgroundColor: "rgba(255,215,0,0.2)",
      fill: false,
      tension: 0.3,
      pointBackgroundColor: "#FFD700",
      pointBorderColor: "#FFD700"
    }
  ];
  if (prices.length >= 2) {
    let greenLine = prices.map((v, i, arr) => (i > 0 && v > arr[i-1]) ? v : null);
    let redLine = prices.map((v, i, arr) => (i > 0 && v < arr[i-1]) ? v : null);
    datasets.push({
      label: "Up Trend",
      data: greenLine,
      borderColor: "#22c55e",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      spanGaps: true,
      borderDash: [5,5],
      hidden: false
    });
    datasets.push({
      label: "Down Trend",
      data: redLine,
      borderColor: "#ef4444",
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      spanGaps: true,
      borderDash: [5,5],
      hidden: false
    });
  }

  const ctx = document.getElementById("shareLineChart");

  if(window.shareChart) window.shareChart.destroy();

  window.shareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        x: { 
          ticks: { color: "#222", font: { weight: "bold", size: 16 } }
        },
        y: { 
          ticks: { color: "#222", font: { weight: "bold", size: 16 } }
        }
      },
      plugins: {
        legend: { labels: { color: "#222", font: { weight: "bold", size: 16 } } }
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

  content.innerHTML = `
    <div class="container">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card" style="cursor:pointer" onclick="showMoneyPoolLedger('CASH')">Cash<br><b>₹${cash}</b></div>
        <div class="card" style="cursor:pointer" onclick="showMoneyPoolLedger('BANK')">Bank<br><b>₹${bank}</b></div>
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



function showAddEmployee(){
  title.innerText = "Add Employee";

  const todayISO = _toISODate(new Date());
  content.innerHTML = `
    <div class="card">
      <input id="emp_name" placeholder="Employee Name">
      <input id="emp_role" placeholder="Role">
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input id="emp_salary_fixed" type="checkbox" />
          <span>Salary Fixed</span>
        </label>
      </div>

      <input id="emp_basic_pay" type="number" placeholder="Basic Pay (₹)">
      <input id="emp_start_date" type="date" value="${todayISO}">
      <div style="font-size:12px;opacity:.8;margin-top:-4px">Annual rate: 6% (compounded monthly)</div>
      <button onclick="saveEmployee()">Save Employee</button>
    </div>
  `;
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
          <div class="bp-business-grid">
  `;

  (businesses || []).forEach(b => {
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
            <div class="bp-card-title">${String(b.name || '-')}</div>
            <span class="bp-badge">${String(b.type || 'Business')}</span>
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
            <button class="bp-btn" onclick="openBusiness('${b.id}','${String(b.name || '').replace(/"/g,'&quot;')}')">Open</button>
            <button class="bp-btn bp-btn-danger" onclick="deleteBusiness('${b.id}','${String(b.name || '').replace(/"/g,'&quot;')}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  });

  html += `
          </div>
        </div>
      </main>
    </div>
  `;

  content.innerHTML = html;
}

function showDataEntriesHome(){
  title.innerText = "Data Entries";
  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">Data Entries</h3>
        <div style="opacity:.85;margin-bottom:14px">Select entry type</div>
        <button onclick="showMeeshoEntries()">Meesho Entries</button>
      </div>
    </div>
  `;
}

async function showMeeshoEntries(){
  title.innerText = "Meesho Entries";

  content.innerHTML = `
    <div class="container meesho-fullwidth">
      <div class="card meesho-card-full">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <h3 style="margin:0;">Meesho Entries</h3>
          <button onclick="showDataEntriesHome()">Back</button>
        </div>

        <div style="margin-top:18px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:18px;background:rgba(255,255,255,.55)">
          <div style="font-weight:700;margin-bottom:10px">Add Entry</div>
          <div class="meesho-form-grid">
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Date & Time</div>
              <input id="me_dt" type="datetime-local" />
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Sub Order ID</div>
              <input id="me_sub" placeholder="Manual number" />
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Cost Price</div>
              <input id="me_cost" type="number" placeholder="₹" />
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Meesho Selling Price</div>
              <input id="me_sell" type="number" placeholder="₹" />
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Dispatched</div>
              <select id="me_dispatched"><option value="NO">NO</option><option value="YES">YES</option></select>
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Delivered</div>
              <select id="me_delivered"><option value="NO">NO</option><option value="YES">YES</option></select>
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Return</div>
              <select id="me_return">
                <option value="NONE">NONE</option>
                <option value="RTO">RTO</option>
                <option value="RETURN">RETURN</option>
                <option value="REPLACE">REPLACE</option>
              </select>
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Cancelled</div>
              <select id="me_cancel">
                <option value="NONE">NONE</option>
                <option value="US">CANCELLED BY US</option>
                <option value="USER">CANCELLED BY USER</option>
              </select>
            </div>
            <div>
              <div style="font-size:12px;opacity:.75;margin-bottom:6px">Image</div>
              <input id="me_img" type="file" accept="image/*" />
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <button onclick="addMeeshoEntry()">Add</button>
            <div id="me_msg" style="margin-left:10px;opacity:.85"></div>
          </div>
        </div>

        <div style="margin-top:18px;overflow:auto">
          <div id="me_table"></div>
        </div>
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

async function loadMeeshoEntries(){
  const tableEl = document.getElementById("me_table");
  if(!tableEl) return;

  const { data, error } = await sb
    .from("meesho_entries")
    .select("*")
    .order("entry_datetime", { ascending: false });

  if(error){
    tableEl.innerHTML = `<div style="padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px">Failed to load. Run SQL: <b>backend/sql/meesho_entries.sql</b><br><div style="opacity:.8;margin-top:6px">${error.message || ""}</div></div>`;
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
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">
            <input id="me_e_dt" type="datetime-local" value="${_toDateTimeLocalValue(r.entry_datetime)}" />
          </td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">
            <input id="me_e_sub" value="${String(r.sub_order_id || "").replace(/"/g,'&quot;')}" />
          </td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">
            <input id="me_e_cost" type="number" value="${Number(r.cost_price || 0)}" />
          </td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">
            <input id="me_e_sell" type="number" value="${Number(r.selling_price || 0)}" />
          </td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${_boolSelect(!!r.dispatched, "me_e_dis")}</td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${_boolSelect(!!r.delivered, "me_e_del")}</td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${_selectOptions({ id: "me_e_ret", value: r.return_status, options: ["NONE","RTO","RETURN","REPLACE"] })}</td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${_selectOptions({ id: "me_e_can", value: r.cancelled_by, options: ["NONE","US","USER"] })}</td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">
            <div style="display:flex;flex-direction:column;gap:8px">
              ${viewBtn}
              <input id="me_e_img" type="file" accept="image/*" />
            </div>
          </td>
          <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08);white-space:nowrap">
            <button onclick="saveMeeshoEntry('${r.id}')">Save</button>
            <button style="margin-left:8px" onclick="cancelMeeshoEdit()">Cancel</button>
          </td>
        </tr>
      `;
    }

    const imgCell = r.image_url
      ? `<button type="button" onclick='openMeeshoImage(${JSON.stringify(r.image_url)})'>View Image</button>`
      : `<span style="opacity:.7">-</span>`;

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${_formatDateTime(r.entry_datetime)}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.sub_order_id || ""}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(Number(r.cost_price || 0))}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">₹${Math.round(Number(r.selling_price || 0))}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.dispatched ? "YES" : "NO"}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.delivered ? "YES" : "NO"}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.return_status || "NONE"}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.cancelled_by || "NONE"}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${imgCell}</td>
        <td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08);white-space:nowrap">
          <button onclick="editMeeshoEntry('${r.id}')">Edit</button>
          <button style="background:#ef4444;margin-left:8px" onclick="deleteMeeshoEntry('${r.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  tableEl.innerHTML = `
    <table style="width:100%;border-collapse:collapse;min-width:1450px">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">DATE & TIME</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">SUB ORDER ID</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">COST PRICE</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">MEESHO SELLING PRICE</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">DISPATCHED</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">DELIVERED</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">RETURN</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">CANCELLED</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">IMAGE</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid rgba(0,0,0,.12)">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="10" style="padding:12px;opacity:.8">No entries yet</td></tr>`}
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
async function openBusiness(businessId, businessName){
  title.innerText = businessName + " – Dashboard";

  // basic screen for now
  content.innerHTML = `
  <div class="container">

    <button onclick="showBusinesses()" style="margin-bottom:20px">
      ← Back to Businesses
    </button>

    <div class="card">
      <h3>${businessName} — Daily Report</h3>

      <input type="date" id="rep_date">

      <input type="number" id="rep_income" placeholder="Today Revenue (₹)">

      <input type="number" id="rep_pool" placeholder="Money Taken from Pool (₹)">

      <input type="number" id="rep_expense" placeholder="Today Expense (₹)">

      <button onclick="saveDailyReport('${businessId}')">
        Save Today Report
      </button>
    </div>

    <div id="reportList"></div>

  </div>
`;
  // fetch reports for this business
  const { data, error } = await sb
    .from("reports")
    .select("*")
    .eq("business_id", businessId);

  if(error){
    content.innerHTML += `
      <div class="card">Failed to load business data</div>
    `;
    console.error(error);
    return;
  }

  // show reports
  const listEl = document.getElementById("reportList");
  let reportHtml = `<div class="card"><h3 style="margin-top:0;">Reports</h3>`;

  if(!data || data.length === 0){
    reportHtml += `<div style="opacity:.8">No reports yet</div>`;
  } else {
    (data || [])
      .slice()
      .sort((a,b) => {
        const ad = new Date(a.report_date || a.date || a.created_at || 0).getTime();
        const bd = new Date(b.report_date || b.date || b.created_at || 0).getTime();
        return bd - ad;
      })
      .forEach(r=>{
        const date = r.report_date || r.date || (r.created_at ? String(r.created_at).slice(0,10) : "-");
        const income = Number(r.income || 0);
        const expense = Number(r.expense || 0);
        const poolTaken = Number(r.pool_taken ?? r.pool ?? 0);
        const profit = Number(r.profit ?? (income - expense));
        const profitColor = profit >= 0 ? "#22c55e" : "#ef4444";

        reportHtml += `
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

  reportHtml += `</div>`;
  if(listEl) listEl.innerHTML = reportHtml;
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

  content.innerHTML = `
    <div class="card">
      <input id="biz_name" placeholder="Business Name">
      <input id="biz_type" placeholder="Business Type">
      <button onclick="saveBusiness()">Save Business</button>
    </div>
  `;
}
async function saveBusiness(){
  const name = document.getElementById("biz_name").value;
  const type = document.getElementById("biz_type").value;

  if(!name || !type){
    alert("Name aur Type bhar");
    return;
  }

  const { error } = await sb.from("businesses").insert([
    { name, type }
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

  const empRes = await sb.from("employees").select("id,name,role");
  const salRes = await sb.from("employee_salary_config").select("employee_id,salary_fixed,basic_pay,start_date,annual_rate");

  if(empRes.error){
    content.innerHTML = "<div class='card'>Error loading employees</div>";
    console.error(empRes.error);
    return;
  }

  const salaryMap = {};
  if(!salRes?.error && Array.isArray(salRes.data)){
    salRes.data.forEach(r => { salaryMap[r.employee_id] = r; });
  }

  let html = "<div class='container'>";

  empRes.data.forEach(e=>{

    const cfg = salaryMap[e.id];
    let salaryHtml = "";
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

      salaryHtml = `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,.08)">
          <div style="font-size:13px;opacity:.85">Salary Fixed • Start: <b>${cfg.start_date || "-"}</b> • Months: <b>${proj.months}</b></div>
          <div style="margin-top:6px">
            Gross (current): <b>₹${Math.round(proj.current.gross)}</b><br>
            Accumulated (approx): <b>₹${Math.round(proj.accumulated)}</b>
          </div>

          <details style="margin-top:10px">
            <summary style="cursor:pointer;font-weight:600">View Breakdowns</summary>
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

    html += `
      <div class="card">
        <b>${e.name}</b> – ${e.role}
        <div style="margin-top:10px">
          <button onclick="openEmployeeProfile('${e.id}')">View Profile</button>
          <button style="background:#ef4444;margin-left:10px" onclick="deleteEmployee('${e.id}')">Delete</button>
          <button style="margin-left:10px" onclick="saveEmployeePayslipPDF('${e.id}')">Payslip PDF</button>
        </div>
        ${salaryHtml}
      </div>
    `;
  });

  html += "</div>";
  content.innerHTML = html;
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

  content.innerHTML = `
    <div class="container">
      <div class="card">
        <h3 style="margin-top:0;">${emp?.data?.name || "Employee"}</h3>
        Role: <b>${emp?.data?.role || "-"}</b><br>
        Joined on: ${joined}
      </div>

      <div class="card"><b>Total Work:</b> ${totalHours} hours</div>

      ${salaryBlock}

      <div class="card"><button onclick="showEmployees()">Back</button></div>
    </div>
  `;
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
      alert('Update failed: ' + (upErr.message || ''));
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

  // Try newer schema first; fallback to older schema.
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
    const attempt2 = await sb.from("company_assets").insert([{
      name,
      // legacy schemas might only have one value column
      current_value: todayValue
    }]);
    if(attempt2?.error){
      console.error(attempt1.error, attempt2.error);
      alert("Asset add nahi hua");
      return;
    }
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

