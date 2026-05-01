import React from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Folder, CreditCard, FileText, Users, Search, Bell, Filter, ChevronRight, CheckCircle, X } from 'lucide-react'

const revenueData = [
  { month: 'Jan', value: 4000 },
  { month: 'Feb', value: 4500 },
  { month: 'Mar', value: 5200 },
  { month: 'Apr', value: 4800 },
  { month: 'May', value: 6100 },
  { month: 'Jun', value: 7000 },
  { month: 'Jul', value: 8500 },
]

const expensesData = [
  { quarter: 'Q1', value: 1200 },
  { quarter: 'Q2', value: 1400 },
  { quarter: 'Q3', value: 1100 },
  { quarter: 'Q4', value: 1600 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{`${label}: $${payload[0].value.toLocaleString()}`}</p>
      </div>
    )
  }
  return null
}

export default function DashboardMockup() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] text-sm">
      {/* Sidebar */}
      <div className="w-64 bg-muted/30 border-r border-border/50 p-4 hidden md:flex flex-col">
        {/* Workspace header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            AC
          </div>
          <div>
            <div className="font-semibold text-sm">Acme Corp</div>
            <div className="text-xs text-muted-foreground">workspace</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files, notes…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
        </div>

        {/* Navigation */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Core Modules</div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <Folder className="w-4 h-4" />
              <span>Documents</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <CreditCard className="w-4 h-4" />
              <span>Financials</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <FileText className="w-4 h-4" />
              <span>Notes & KB</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <Users className="w-4 h-4" />
              <span>Meetings</span>
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3 mt-6">Administration</div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <div className="w-4 h-4" />
              <span>Settings & RBAC</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50">
              <div className="w-4 h-4" />
              <span>Audit Logs</span>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="mt-auto flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
            JD
          </div>
          <div>
            <div className="font-semibold text-sm">John Doe</div>
            <div className="text-xs text-muted-foreground">Admin Access</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-background/50 overflow-y-auto">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6">
          <h1 className="font-semibold">Executive Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
              <Filter className="w-4 h-4" />
              This Quarter
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-2xl font-bold">$428,500</div>
            <div className="text-sm text-emerald-500">+12.5%</div>
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="text-sm text-muted-foreground mb-1">Active Partners</div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-sm text-emerald-500">+3 this month</div>
          </div>
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="text-sm text-muted-foreground mb-1">Pending Approvals</div>
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm text-muted-foreground">−2 since yesterday</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 px-6 mb-6">
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <h3 className="font-semibold mb-4">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <h3 className="font-semibold mb-4">Expenses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expensesData}>
                <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <button className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">Q2 Financial Projections.xlsx</span> — Updated by Sarah Jenkins (Finance Head)
                  </div>
                  <div className="text-xs text-muted-foreground">10 mins ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">SOP - Partner Onboarding</span> — Approved by John Doe (Admin)
                  </div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mt-0.5">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">Strategic Planning Q3</span> — Meeting notes added by Michael Chen
                  </div>
                  <div className="text-xs text-muted-foreground">Yesterday</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}