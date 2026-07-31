/* =====================================================================
   Data access layer — every Supabase call the console makes lives here.

   Why: the same queries were written inline in `js/app.js`, `pm.html`,
   `DceSimple.tsx` and `DceDashboard.tsx`, each with slightly different
   column lists and ordering. When a column moved, four places broke.

   Conventions:
   - Every function throws on error, so `useQuery` can surface it. No
     silent `catch {}` blocks — those hid the pool-ledger bug for months.
   - Reads return plain arrays/objects. No UI concerns in this file.
   - Writes that touch money keep the exact legacy sequence, because
     changing it would change balances. Ordering notes are inline.
   ===================================================================== */

import { supabase } from './supabase'

function db() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/** Unwrap a PostgrestResponse, throwing a readable error. */
async function run(builder, context) {
  const { data, error, count } = await builder
  if (error) {
    const err = new Error(error.message || `Query failed: ${context}`)
    err.code = error.code
    err.context = context
    throw err
  }
  return count != null ? { data: data ?? [], count } : (data ?? [])
}

/* ------------------------------------------------------------------ */
/* Businesses (projects)                                              */
/* ------------------------------------------------------------------ */

export const businesses = {
  list: () => run(db().from('businesses').select('*'), 'businesses.list'),
  listBasic: () =>
    run(db().from('businesses').select('id,name,type').order('name', { ascending: true }), 'businesses.listBasic'),
  get: (id) => run(db().from('businesses').select('*').eq('id', id).maybeSingle(), 'businesses.get'),
  create: ({ name, type, value }) =>
    run(
      db()
        .from('businesses')
        .insert([{ name, type: type ? String(type).trim().toLowerCase() : null, ...(value != null ? { value } : {}) }])
        .select()
        .single(),
      'businesses.create'
    ),
  update: (id, patch) => run(db().from('businesses').update(patch).eq('id', id), 'businesses.update'),

  /**
   * Delete cascades manually because the schema has no FKs from these
   * tables back to `businesses`. Order matters: children first.
   * Ported from deleteBusiness in app.js.
   */
  async remove(id) {
    const client = db()
    for (const table of ['reports', 'work_logs', 'tasks']) {
      const { error } = await client.from(table).delete().eq('business_id', id)
      // A missing table is fine (42P01); anything else is a real failure.
      if (error && error.code !== '42P01') throw new Error(`${table}: ${error.message}`)
    }
    return run(client.from('businesses').delete().eq('id', id), 'businesses.remove')
  },
}

/* ------------------------------------------------------------------ */
/* Daily reports                                                      */
/* ------------------------------------------------------------------ */

export const reports = {
  list: () => run(db().from('reports').select('*').order('created_at', { ascending: false }), 'reports.list'),
  listForBusiness: (businessId) =>
    run(
      db().from('reports').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
      'reports.listForBusiness'
    ),

  /**
   * Save with the legacy three-tier fallback intact.
   *
   * The `reports` table's real shape is unknown (no DDL in backend/sql — see
   * SRS D-9), so the legacy code tried progressively smaller payloads and
   * only retried on schema-shaped errors. Removing that would break saves on
   * whatever the live schema actually is, so it is preserved verbatim here
   * and documented rather than "cleaned up".
   */
  async save({ businessId, date, income, expense, poolTaken = 0 }) {
    const client = db()
    const month = typeof date === 'string' && date.includes('-') ? date.slice(0, 7) : null
    const profit = Number(income) - Number(expense)

    // Tier 1: server-side RPC, if it exists in this project.
    try {
      const { error } = await client.rpc('save_daily_report_backend', {
        p_business_id: businessId,
        p_date: date,
        p_income: Number(income),
        p_expense: Number(expense),
        p_pool_taken: Number(poolTaken),
      })
      if (!error) return { via: 'rpc' }
    } catch {
      /* RPC absent — fall through */
    }

    // Tier 2: direct insert with shrinking payloads.
    const candidates = [
      { business_id: businessId, report_date: date, month, income, expense, pool_taken: poolTaken, profit },
      { business_id: businessId, month, income, expense, profit },
      { business_id: businessId, income, expense },
    ]
    let lastError = null
    for (const payload of candidates) {
      const { error } = await client.from('reports').insert([payload])
      if (!error) return { via: 'insert' }
      lastError = error
      if (/column .* does not exist|invalid input syntax|violates not-null constraint/i.test(error.message ?? '')) {
        continue
      }
      break
    }
    throw new Error(lastError?.message ?? 'Could not save the report.')
  },
}

/* ------------------------------------------------------------------ */
/* Money pool                                                         */
/* ------------------------------------------------------------------ */

export const pool = {
  /** Current balance = newest snapshot row. */
  async latest() {
    const rows = await run(
      db().from('company_money_pool').select('*').order('created_at', { ascending: false }).limit(1),
      'pool.latest'
    )
    return rows[0] ?? null
  },

  history: (limit = 200) =>
    run(
      db().from('company_money_pool').select('*').order('created_at', { ascending: false }).limit(limit),
      'pool.history'
    ),

  ledger: ({ source, ascending = false } = {}) => {
    let q = db()
      .from('money_pool_ledger')
      .select('id,created_at,source,type,amount,from_text,reason')
      .order('created_at', { ascending })
    if (source) q = q.eq('source', source)
    return run(q, 'pool.ledger')
  },

  /**
   * Append a new balance snapshot plus its audit row.
   *
   * The snapshot is written first so the balance is never wrong, then the
   * ledger row. If the ledger write fails we surface it instead of
   * swallowing it — the legacy `catch(_) {}` in the backend is exactly how
   * the 'PLUS' vs 'ADD' constraint mismatch went unnoticed (SRS D-6).
   *
   * NOTE: still not atomic. Two concurrent movements can both read the same
   * snapshot and one delta is lost. Fixing that needs a Postgres function
   * (SRS D-7/D-8) and is out of scope for a UI restructure.
   */
  async recordMovement({ cash, bank, source, type, amount, fromText, reason }) {
    const client = db()
    await run(
      client.from('company_money_pool').insert([{ layer1_amount: cash, layer2_amount: bank }]),
      'pool.recordMovement.snapshot'
    )
    await run(
      client.from('money_pool_ledger').insert([
        {
          source,
          type, // must be 'ADD' or 'MINUS' — enforced by a CHECK constraint
          amount,
          from_text: fromText || null,
          reason: reason || null,
        },
      ]),
      'pool.recordMovement.ledger'
    )
  },
}

/* ------------------------------------------------------------------ */
/* Equity                                                            */
/* ------------------------------------------------------------------ */

export const equity = {
  async companyValue() {
    const row = await run(db().from('company_live_value').select('*').maybeSingle(), 'equity.companyValue')
    return Number(row?.company_value ?? 0)
  },
  async totalShares() {
    const row = await run(db().from('company_shares_config').select('total_shares').maybeSingle(), 'equity.totalShares')
    return Number(row?.total_shares ?? 0)
  },
  ledger: () => run(db().from('shares_ledger').select('*'), 'equity.ledger'),
  ledgerFor: (employeeId) =>
    run(db().from('shares_ledger').select('*').eq('employee_id', employeeId), 'equity.ledgerFor'),
  priceHistory: (limit = 30) =>
    run(
      db().from('share_price_history').select('price,created_at').order('created_at', { ascending: true }).limit(limit),
      'equity.priceHistory'
    ),
  buyRequests: (status = 'PENDING') =>
    run(
      db().from('share_buy_requests').select('*').eq('status', status).order('created_at', { ascending: false }),
      'equity.buyRequests'
    ),
  createBuyRequest: (payload) =>
    run(db().from('share_buy_requests').insert([{ ...payload, status: 'PENDING' }]), 'equity.createBuyRequest'),
  setBuyRequestStatus: (id, status) =>
    run(db().from('share_buy_requests').update({ status }).eq('id', id), 'equity.setBuyRequestStatus'),
  grant: ({ employeeId, shares, locked = false }) =>
    run(db().from('shares_ledger').insert([{ employee_id: employeeId, shares, locked }]), 'equity.grant'),
  /**
   * Valuation and total shares are single-row config tables with no natural
   * key, so update the existing row when there is one and insert otherwise.
   * The legacy console had no UI for either — they were edited in Supabase.
   */
  async setCompanyValue(value) {
    const client = db()
    const row = await run(client.from('company_live_value').select('*').maybeSingle(), 'equity.readCompanyValue')
    if (row?.id != null) {
      return run(
        client.from('company_live_value').update({ company_value: Number(value) || 0 }).eq('id', row.id),
        'equity.setCompanyValue'
      )
    }
    return run(client.from('company_live_value').insert([{ company_value: Number(value) || 0 }]), 'equity.setCompanyValue')
  },

  async setTotalShares(total) {
    const client = db()
    const row = await run(client.from('company_shares_config').select('*').maybeSingle(), 'equity.readTotalShares')
    if (row?.id != null) {
      return run(
        client.from('company_shares_config').update({ total_shares: Number(total) || 0 }).eq('id', row.id),
        'equity.setTotalShares'
      )
    }
    return run(
      client.from('company_shares_config').insert([{ total_shares: Number(total) || 0 }]),
      'equity.setTotalShares'
    )
  },

  /** Append a price point so the trend chart has real history. */
  recordPricePoint: (price) =>
    run(db().from('share_price_history').insert([{ price: Number(price) || 0 }]), 'equity.recordPricePoint'),

  async payoutDetails(employeeId) {
    const row = await run(
      db().from('employee_payout_details').select('upi_id').eq('employee_id', employeeId).maybeSingle(),
      'equity.payoutDetails'
    )
    return row?.upi_id ?? null
  },
}

/* ------------------------------------------------------------------ */
/* People                                                            */
/* ------------------------------------------------------------------ */

export const people = {
  list: () => run(db().from('employees').select('*'), 'people.list'),
  listBasic: () => run(db().from('employees').select('id,name,role').order('name'), 'people.listBasic'),
  get: (id) => run(db().from('employees').select('*').eq('id', id).maybeSingle(), 'people.get'),
  create: ({ name, role }) =>
    run(db().from('employees').insert([{ name, role, active: true }]).select().single(), 'people.create'),
  update: (id, patch) => run(db().from('employees').update(patch).eq('id', id), 'people.update'),

  /** Best-effort cascade. Missing tables are ignored, as in deleteEmployee. */
  async remove(id) {
    const client = db()
    const children = [
      'shares_ledger',
      'work_logs',
      'employee_payout_details',
      'payouts',
      'locked_bonus_ledger',
      'employee_salary_config',
      'employee_ledger',
    ]
    for (const table of children) {
      const { error } = await client.from(table).delete().eq('employee_id', id)
      if (error && error.code !== '42P01' && !/does not exist/i.test(error.message ?? '')) {
        throw new Error(`${table}: ${error.message}`)
      }
    }
    return run(client.from('employees').delete().eq('id', id), 'people.remove')
  },

  salaryConfigs: () =>
    run(
      db().from('employee_salary_config').select('employee_id,salary_fixed,basic_pay,start_date,annual_rate,created_at'),
      'people.salaryConfigs'
    ),

  /** Newest config wins — the table has no unique constraint (SRS FR-G15). */
  async salaryConfig(employeeId) {
    const rows = await run(
      db()
        .from('employee_salary_config')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(1),
      'people.salaryConfig'
    )
    return rows[0] ?? null
  },

  saveSalaryConfig: ({ employeeId, salaryFixed, basicPay, startDate, annualRate }) =>
    run(
      db().from('employee_salary_config').insert([
        {
          employee_id: employeeId,
          salary_fixed: Boolean(salaryFixed),
          basic_pay: Number(basicPay) || 0,
          start_date: startDate,
          annual_rate: Number(annualRate) || 0.06,
        },
      ]),
      'people.saveSalaryConfig'
    ),

  workHours: (employeeId) =>
    run(db().from('work_logs').select('hours').eq('employee_id', employeeId), 'people.workHours'),

  ledger: (employeeId) =>
    run(
      db().from('employee_ledger').select('*').eq('employee_id', employeeId).order('date', { ascending: false }),
      'people.ledger'
    ),
  addLedgerEntry: ({ employeeId, type, description, amount, date }) =>
    run(
      db().from('employee_ledger').insert([{ employee_id: employeeId, type, description, amount: Number(amount) || 0, date }]),
      'people.addLedgerEntry'
    ),
  updateLedgerEntry: (id, patch) => run(db().from('employee_ledger').update(patch).eq('id', id), 'people.updateLedgerEntry'),
  removeLedgerEntry: (id) => run(db().from('employee_ledger').delete().eq('id', id), 'people.removeLedgerEntry'),
}

/* ------------------------------------------------------------------ */
/* Access (PM logins)                                                */
/* ------------------------------------------------------------------ */

/** SHA-256 hex. Matches the legacy `_hashPw`, so existing logins keep working.
 *  NOTE: unsalted and computed client-side. See SRS SEC-16 — this must move
 *  server-side with a real KDF. Kept identical here so no one is locked out. */
export async function hashPassword(plain) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const access = {
  pmUsers: () =>
    run(
      db().from('pm_login_users').select('id,name,username,created_at').order('created_at', { ascending: false }),
      'access.pmUsers'
    ),
  async createPmUser({ name, username, password }) {
    const password_hash = await hashPassword(password)
    return run(db().from('pm_login_users').insert([{ name, username, password_hash }]), 'access.createPmUser')
  },
  removePmUser: (id) => run(db().from('pm_login_users').delete().eq('id', id), 'access.removePmUser'),
  admins: () => run(db().from('admin_users').select('user_id,created_at'), 'access.admins'),
}

/* ------------------------------------------------------------------ */
/* Assets                                                            */
/* ------------------------------------------------------------------ */

export const assets = {
  list: () => run(db().from('company_assets').select('*').order('created_at', { ascending: false }), 'assets.list'),
  create: (payload) => run(db().from('company_assets').insert([payload]), 'assets.create'),
  update: (id, patch) => run(db().from('company_assets').update(patch).eq('id', id), 'assets.update'),
  remove: (id) => run(db().from('company_assets').delete().eq('id', id), 'assets.remove'),
}

/* ------------------------------------------------------------------ */
/* Cap-table layers                                                  */
/* ------------------------------------------------------------------ */

const layerTable = { 1: 'layer1_founders', 2: 'layer2_members', 4: 'layer4_investors' }

export const layers = {
  list: (layer) =>
    run(db().from(layerTable[layer]).select('*').order('created_at', { ascending: false }), `layers.list.${layer}`),
  addMember: (layer, { name, shareValue }) =>
    run(db().from(layerTable[layer]).insert([{ name, share_value: Number(shareValue) || 0 }]), `layers.add.${layer}`),
  remove: (layer, id) => run(db().from(layerTable[layer]).delete().eq('id', id), `layers.remove.${layer}`),

  /** Layer 4 has extra columns added later, so fall back if they are absent. */
  async addInvestor({ name, amount, investedOn, annualRate = 0.12 }) {
    const client = db()
    const full = { name, amount: Number(amount) || 0, invested_on: investedOn, annual_rate: annualRate, layer_tag: 'LAYER 4' }
    const { error } = await client.from('layer4_investors').insert([full])
    if (!error) return
    if (/column .* does not exist/i.test(error.message ?? '')) {
      return run(client.from('layer4_investors').insert([{ name, amount: full.amount }]), 'layers.addInvestor.fallback')
    }
    throw new Error(error.message)
  },
}

/* ------------------------------------------------------------------ */
/* Tasks                                                             */
/* ------------------------------------------------------------------ */

export const tasks = {
  list: () => run(db().from('tasks').select('*').order('created_at', { ascending: false }), 'tasks.list'),

  /** `status`/`deadline`/`accepted_by` may not exist on older schemas. */
  async create({ title, description, points, deadline }) {
    const client = db()
    const full = {
      title,
      description,
      points: Number(points) || 0,
      deadline: deadline || null,
      status: 'OPEN',
      accepted_by: null,
    }
    const { error } = await client.from('tasks').insert([full])
    if (!error) return
    if (/column .*(status|accepted_by|deadline)/i.test(error.message ?? '')) {
      return run(
        client.from('tasks').insert([{ title, description, points: Number(points) || 0 }]),
        'tasks.create.fallback'
      )
    }
    throw new Error(error.message)
  },

  /**
   * Claim a task. The `.is('accepted_by', null)` guard is optimistic locking:
   * a second claimer updates zero rows instead of stealing the task.
   */
  async accept(id, employeeId) {
    const client = db()
    const { data, error } = await client
      .from('tasks')
      .update({ accepted_by: employeeId, status: 'ACCEPTED' })
      .eq('id', id)
      .is('accepted_by', null)
      .select('id')
    if (error) {
      if (/column .*status/i.test(error.message ?? '')) {
        const retry = await client
          .from('tasks')
          .update({ accepted_by: employeeId })
          .eq('id', id)
          .is('accepted_by', null)
          .select('id')
        if (retry.error) throw new Error(retry.error.message)
        if (!retry.data?.length) throw new Error('Someone else picked up this task first.')
        return
      }
      throw new Error(error.message)
    }
    if (!data?.length) throw new Error('Someone else picked up this task first.')
  },

  release: (id) => run(db().from('tasks').update({ accepted_by: null, status: 'OPEN' }).eq('id', id), 'tasks.release'),
  complete: (id) => run(db().from('tasks').update({ status: 'COMPLETED' }).eq('id', id), 'tasks.complete'),
  remove: (id) => run(db().from('tasks').delete().eq('id', id), 'tasks.remove'),
}

/* ------------------------------------------------------------------ */
/* Leads                                                             */
/* ------------------------------------------------------------------ */

export const leads = {
  enquiries: () => run(db().from('enquiries').select('*').order('created_at', { ascending: false }), 'leads.enquiries'),
  partners: () => run(db().from('partners').select('*').order('created_at', { ascending: false }), 'leads.partners'),
  removeEnquiry: (id) => run(db().from('enquiries').delete().eq('id', id), 'leads.removeEnquiry'),
  removePartner: (id) => run(db().from('partners').delete().eq('id', id), 'leads.removePartner'),
  async counts() {
    const client = db()
    const [e, p] = await Promise.all([
      client.from('enquiries').select('id', { count: 'exact', head: true }),
      client.from('partners').select('id', { count: 'exact', head: true }),
    ])
    return { enquiries: e.count ?? 0, partners: p.count ?? 0 }
  },
}

/* ------------------------------------------------------------------ */
/* DCE — notes, spends, files, meetings, decisions, audit            */
/* ------------------------------------------------------------------ */

export const dce = {
  notes: (businessId) =>
    run(
      db().from('dce_notes').select('*').eq('business_id', businessId).order('updated_at', { ascending: false }),
      'dce.notes'
    ),
  createNote: (payload) => run(db().from('dce_notes').insert([payload]).select().single(), 'dce.createNote'),
  updateNote: (id, patch) => run(db().from('dce_notes').update(patch).eq('id', id), 'dce.updateNote'),
  removeNote: (id) => run(db().from('dce_notes').delete().eq('id', id), 'dce.removeNote'),

  spends: (businessId) =>
    run(
      db().from('dce_expenditures').select('*').eq('business_id', businessId).order('spend_date', { ascending: false }),
      'dce.spends'
    ),
  createSpend: (payload) => run(db().from('dce_expenditures').insert([payload]), 'dce.createSpend'),
  updateSpend: (id, patch) => run(db().from('dce_expenditures').update(patch).eq('id', id), 'dce.updateSpend'),
  removeSpend: (id) => run(db().from('dce_expenditures').delete().eq('id', id), 'dce.removeSpend'),

  documents: (businessId) =>
    run(
      db().from('dce_documents').select('*').eq('business_id', businessId).order('updated_at', { ascending: false }),
      'dce.documents'
    ),
  createDocument: (payload) => run(db().from('dce_documents').insert([payload]), 'dce.createDocument'),
  updateDocument: (id, patch) => run(db().from('dce_documents').update(patch).eq('id', id), 'dce.updateDocument'),
  removeDocument: (id) => run(db().from('dce_documents').delete().eq('id', id), 'dce.removeDocument'),
  comments: (documentIds) =>
    documentIds.length === 0
      ? Promise.resolve([])
      : run(
          db().from('dce_document_comments').select('*').in('document_id', documentIds).order('inserted_at'),
          'dce.comments'
        ),
  addComment: ({ documentId, commenter, text }) =>
    run(
      db().from('dce_document_comments').insert([{ document_id: documentId, commenter, comment_text: text }]),
      'dce.addComment'
    ),

  meetings: (businessId) =>
    run(
      db().from('dce_meetings').select('*').eq('business_id', businessId).order('meeting_date', { ascending: false }),
      'dce.meetings'
    ),
  createMeeting: (payload) => run(db().from('dce_meetings').insert([payload]).select().single(), 'dce.createMeeting'),
  updateMeeting: (id, patch) => run(db().from('dce_meetings').update(patch).eq('id', id), 'dce.updateMeeting'),
  removeMeeting: (id) => run(db().from('dce_meetings').delete().eq('id', id), 'dce.removeMeeting'),

  decisions: (businessId) =>
    run(
      db()
        .from('dce_financial_decisions')
        .select('*')
        .eq('business_id', businessId)
        .order('inserted_at', { ascending: false }),
      'dce.decisions'
    ),
  createDecision: (payload) => run(db().from('dce_financial_decisions').insert([payload]), 'dce.createDecision'),
  updateDecision: (id, patch) =>
    run(db().from('dce_financial_decisions').update(patch).eq('id', id), 'dce.updateDecision'),
  removeDecision: (id) => run(db().from('dce_financial_decisions').delete().eq('id', id), 'dce.removeDecision'),
  votes: (decisionIds) =>
    decisionIds.length === 0
      ? Promise.resolve([])
      : run(db().from('dce_votes').select('*').in('decision_id', decisionIds), 'dce.votes'),
  castVote: ({ decisionId, voter, option }) =>
    run(db().from('dce_votes').insert([{ decision_id: decisionId, voter, vote_option: option }]), 'dce.castVote'),

  auditLogs: ({ businessId, limit = 100 } = {}) => {
    let q = db().from('dce_audit_logs').select('*').order('inserted_at', { ascending: false }).limit(limit)
    if (businessId) q = q.eq('business_id', businessId)
    return run(q, 'dce.auditLogs')
  },

  /** Fire-and-forget audit write. A failed log must never block the action. */
  async logEvent({ businessId, businessName, event, category = 'Activity', actor = 'Console' }) {
    try {
      await db()
        .from('dce_audit_logs')
        .insert([{ business_id: businessId, business_name: businessName, event_text: event, category, actor }])
    } catch {
      /* intentionally ignored — logging is not the user's problem */
    }
  },

  /** Upload to the `dce-media` bucket and return a public URL. */
  async upload(file, path) {
    const client = db()
    const { error } = await client.storage.from('dce-media').upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) throw new Error(error.message)
    const { data } = client.storage.from('dce-media').getPublicUrl(path)
    return data.publicUrl
  },
}

/* ------------------------------------------------------------------ */
/* Meesho                                                            */
/* ------------------------------------------------------------------ */

export const meesho = {
  list: () =>
    run(db().from('meesho_entries').select('*').order('entry_datetime', { ascending: false }), 'meesho.list'),
  create: (payload) => run(db().from('meesho_entries').insert([payload]), 'meesho.create'),
  update: (id, patch) => run(db().from('meesho_entries').update(patch).eq('id', id), 'meesho.update'),
  remove: (id) => run(db().from('meesho_entries').delete().eq('id', id), 'meesho.remove'),
  async upload(file, bucket, subOrderId) {
    const client = db()
    const ext = file.name.split('.').pop() ?? 'bin'
    const safe = String(subOrderId).replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${safe}/${Date.now()}.${ext}`
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    return client.storage.from(bucket).getPublicUrl(path).data.publicUrl
  },
}

/* ------------------------------------------------------------------ */
/* Backend API (Express)                                             */
/* ------------------------------------------------------------------ */

export const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL?.trim() ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : typeof window !== 'undefined'
      ? window.location.origin
      : '')

async function post(path, body) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) throw new Error(json.error || `Request failed (${res.status})`)
  return json
}

export const backend = {
  pmLogin: (payload) => post('/pm-login', payload),
  generateOtp: (payload) => post('/generate-otp', payload),
  verifyOtp: (payload) => post('/verify-otp', payload),
  sendMeetingEmail: (payload) => post('/send-meeting-email', payload),
  sendPriorityNote: (payload) => post('/send-priority-note', payload),
  ask: (payload) => post('/dce-ask', payload),
  submitMeetingScore: (payload) => post('/api/meeting-scores', payload),
  async meetingScores(meetingId) {
    const res = await fetch(`${BACKEND_URL}/api/meeting-scores/${meetingId}`)
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.ok === false) throw new Error(json.error || 'Could not load scores')
    return json
  },
}
