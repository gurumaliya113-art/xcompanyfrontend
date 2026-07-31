import {
  Activity,
  Banknote,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  Coins,
  FileText,
  Gauge,
  Gavel,
  Handshake,
  KeyRound,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Mail,
  PieChart,
  Receipt,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

/* =====================================================================
   ExFlow console — information architecture.

   This file is the single source of truth for navigation. Sidebar, command
   palette, breadcrumbs and the mobile nav all read from it, so a route can
   never appear in one place and be missing from another.

   Before: 11 flat sidebar items in founder.html with no grouping, plus
   `Add Business` / `Add Employee` as their own nav entries (create actions
   do not belong in navigation), plus four screens that existed only as
   direct function calls and were unreachable from the UI at all
   (Share Market, per-business dashboard, Cash ledger, Statements).

   After: 10 top-level groups, one level of nesting maximum. Create actions
   live on their list page. Every screen is reachable.

   `roles` gates visibility. `legacy` marks a route that still hands off to
   an old HTML page, so the remaining migration surface is always visible.
   ===================================================================== */

export const ROLES = {
  FOUNDER: 'FOUNDER',
  ADMIN: 'ADMIN',
  PM: 'PM',
  HR: 'HR',
  EMPLOYEE: 'EMPLOYEE',
  DATA_ENTRY: 'DATA_ENTRY',
}

const ALL = Object.values(ROLES)
const LEADERSHIP = [ROLES.FOUNDER, ROLES.ADMIN]
const OPS = [ROLES.FOUNDER, ROLES.ADMIN, ROLES.PM]

export const NAV_GROUPS = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        label: 'Overview',
        to: '/app/overview',
        icon: LayoutDashboard,
        roles: ALL,
        description: 'What needs attention today',
        keywords: ['dashboard', 'home', 'today', 'summary'],
      },
      {
        label: 'Activity',
        to: '/app/activity',
        icon: Activity,
        roles: ALL,
        description: 'Audit trail across every business',
        keywords: ['audit', 'log', 'history', 'events'],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    items: [
      {
        label: 'Enquiries',
        to: '/app/clients/enquiries',
        icon: Mail,
        roles: LEADERSHIP,
        description: 'Inbound leads from the website',
        keywords: ['leads', 'quote', 'requests', 'inbound', 'enquiry'],
      },
      {
        label: 'Partners',
        to: '/app/clients/partners',
        icon: Handshake,
        roles: LEADERSHIP,
        description: 'Partner and investor interest',
        keywords: ['collaborators', 'referral', 'investor interest'],
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    items: [
      {
        label: 'All Projects',
        to: '/app/projects',
        icon: Briefcase,
        roles: ALL,
        description: 'Every venture and its performance',
        keywords: ['businesses', 'ventures', 'portfolio', 'companies'],
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    items: [
      {
        label: 'DCE Workspace',
        to: '/app/products/dce',
        icon: Boxes,
        roles: ALL,
        description: 'Notes, spends, files and meetings per business',
        keywords: [
          'dce',
          'notes',
          'command centre',
          'workspace',
          'meetings',
          'calendar',
          'agenda',
          'documents',
          'files',
          'contracts',
          'vault',
          'spends',
          'expenses',
        ],
      },
      {
        label: 'Meesho Orders',
        to: '/app/products/meesho',
        icon: ShoppingBag,
        roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.DATA_ENTRY],
        description: 'Order tracker with margin',
        keywords: ['ecommerce', 'orders', 'meesho', 'data entry'],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        label: 'Daily Entry',
        to: '/app/ops/daily-entry',
        icon: ClipboardList,
        roles: OPS,
        description: 'Log today’s income and expense',
        keywords: ['pm', 'income', 'expense', 'report', 'submit'],
      },
      {
        label: 'Daily Reports',
        to: '/app/ops/reports',
        icon: FileText,
        roles: OPS,
        description: 'Every report submitted by managers',
        keywords: ['pm reports', 'submissions', 'history'],
      },
      {
        label: 'Tasks',
        to: '/app/ops/tasks',
        icon: ListChecks,
        roles: ALL,
        description: 'Assign and pick up work',
        keywords: ['hr', 'todo', 'assignments', 'points'],
      },
      {
        label: 'Decisions',
        to: '/app/ops/decisions',
        icon: Gavel,
        roles: LEADERSHIP,
        description: 'Proposals, voting and the audit trail',
        keywords: ['voting', 'approval', 'board', 'governance', 'proposal'],
      },
      /* Meetings and Documents deliberately do NOT appear here.
         They are per-business surfaces and live as tabs inside the DCE
         Workspace, alongside the notes and spends they relate to. Listing them
         twice was the duplication this restructure exists to remove — the
         command palette still finds them via the workspace keywords, and the
         old /app/ops/meetings and /app/ops/documents paths redirect. */
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        label: 'Money Pool',
        to: '/app/finance/pool',
        icon: Wallet,
        roles: LEADERSHIP,
        description: 'Central cash and bank balance',
        keywords: ['cash', 'bank', 'balance', 'treasury', 'pool'],
      },
      {
        label: 'Statements',
        to: '/app/finance/statements',
        icon: Receipt,
        roles: LEADERSHIP,
        description: 'Full money-in / money-out ledger',
        keywords: ['ledger', 'transactions', 'reconcile', 'passbook'],
      },
      {
        label: 'Pool Requests',
        to: '/app/finance/requests',
        icon: KeyRound,
        roles: OPS,
        description: 'Request or submit money with founder OTP',
        keywords: ['otp', 'approval', 'withdraw', 'deposit'],
      },
      {
        label: 'Assets',
        to: '/app/finance/assets',
        icon: Landmark,
        roles: LEADERSHIP,
        description: 'Asset register and depreciation',
        keywords: ['equipment', 'depreciation', 'register', 'property'],
      },
      {
        label: 'Equity',
        to: '/app/finance/equity',
        icon: TrendingUp,
        roles: LEADERSHIP,
        description: 'Share price, cap table, buy and sell',
        keywords: ['shares', 'stock', 'cap table', 'share market', 'valuation'],
      },
      {
        label: 'Investors',
        to: '/app/finance/investors',
        icon: Coins,
        roles: LEADERSHIP,
        description: 'Layer 4 capital and accrued interest',
        keywords: ['layer 4', 'funding', 'interest', 'lenders'],
      },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    items: [
      {
        label: 'People',
        to: '/app/team',
        icon: Users,
        roles: LEADERSHIP,
        description: 'Employees, salary and ledgers',
        keywords: ['employees', 'staff', 'salary', 'payslip', 'ledger'],
      },
      {
        label: 'Access',
        to: '/app/team/access',
        icon: KeyRound,
        roles: LEADERSHIP,
        description: 'Manager logins and admin accounts',
        keywords: ['pm login', 'admins', 'permissions', 'accounts'],
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      {
        label: 'X-Ai',
        to: '/app/ai',
        icon: Bot,
        roles: ALL,
        description: 'Ask anything about a business',
        keywords: ['assistant', 'gemini', 'chat', 'ask', 'xai'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      {
        label: 'Report Centre',
        to: '/app/reports',
        icon: PieChart,
        roles: LEADERSHIP,
        description: 'Every export in one place',
        keywords: ['export', 'pdf', 'download', 'p&l', 'payslip'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        label: 'Organisation',
        to: '/app/settings',
        icon: Settings,
        roles: LEADERSHIP,
        description: 'Valuation, shares and categories',
        keywords: ['company value', 'total shares', 'categories', 'config'],
      },
      {
        label: 'Cap Table Layers',
        to: '/app/settings/layers',
        icon: Building2,
        roles: LEADERSHIP,
        description: 'Founders, members and ventures',
        keywords: ['layer 1', 'layer 2', 'layer 3', 'founders', 'structure'],
      },
      {
        label: 'Notifications',
        to: '/app/settings/notifications',
        icon: SlidersHorizontal,
        roles: LEADERSHIP,
        description: 'Approval email and alert routing',
        keywords: ['otp config', 'email', 'cofounders', 'alerts'],
      },
    ],
  },
]

/** Flat list of every navigable item — used by the command palette and breadcrumbs. */
export const NAV_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label, groupId: group.id }))
)

/** Groups filtered to what a role may see. Empty groups are dropped. */
export function navForRole(role) {
  const effective = role ?? ROLES.EMPLOYEE
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(effective)),
  })).filter((group) => group.items.length > 0)
}

/** Longest-prefix match, so `/app/team/abc` still resolves to the People item. */
export function findNavItem(pathname) {
  return (
    NAV_ITEMS.filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)).sort(
      (a, b) => b.to.length - a.to.length
    )[0] ?? null
  )
}

/** Breadcrumb trail for any console path. */
export function breadcrumbsFor(pathname, extra = []) {
  const item = findNavItem(pathname)
  const trail = [{ label: 'ExFlow', to: '/app/overview' }]
  if (item) {
    trail.push({ label: item.group })
    trail.push({ label: item.label, to: item.to })
  }
  return [...trail, ...extra]
}

/* Quick actions offered in the command palette and on the Overview page.
   These are verbs, deliberately kept out of the sidebar. */
export const QUICK_ACTIONS = [
  { label: 'Log daily entry', to: '/app/ops/daily-entry', icon: ClipboardList, roles: OPS },
  { label: 'Request money from pool', to: '/app/finance/requests', icon: KeyRound, roles: OPS },
  { label: 'Add a project', to: '/app/projects?new=1', icon: Briefcase, roles: LEADERSHIP },
  { label: 'Add a person', to: '/app/team?new=1', icon: Users, roles: LEADERSHIP },
  { label: 'Record an asset', to: '/app/finance/assets?new=1', icon: Landmark, roles: LEADERSHIP },
  { label: 'Record pool movement', to: '/app/finance/pool?new=1', icon: Banknote, roles: LEADERSHIP },
  { label: 'Create a task', to: '/app/ops/tasks?new=1', icon: ListChecks, roles: [ROLES.FOUNDER, ROLES.ADMIN, ROLES.HR] },
  { label: 'Schedule a meeting', to: '/app/ops/meetings?new=1', icon: CalendarClock, roles: ALL },
  { label: 'Ask X-Ai', to: '/app/ai', icon: Sparkles, roles: ALL },
  { label: 'Open reports', to: '/app/reports', icon: Gauge, roles: LEADERSHIP },
]

export function quickActionsForRole(role) {
  const effective = role ?? ROLES.EMPLOYEE
  return QUICK_ACTIONS.filter((a) => a.roles.includes(effective))
}
