import * as React from 'react'
import { KeyRound, Plus, ShieldAlert, Trash2, UserCog } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { access, people } from '@/lib/api'
import { date, number, relativeTime, initials } from '@/lib/format'
import toast from 'react-hot-toast'

/* =====================================================================
   Access — manager logins and admin accounts.

   Legacy version lived as the right half of the "Add Employee" page: a form
   that created a `pm_login_users` row AND a second `employees` row whose role
   was a concatenated string like "CO_FOUNDER- Mukul". Two records, one button,
   no way to see or fix the relationship afterwards.

   Split out here so access is its own concern. The employee record and the
   login are now created as an explicit pair, and the manager list shows what
   exists.

   The security reality is stated on the page rather than buried in a doc,
   because whoever manages access is the person who needs to know it:
   passwords are hashed with unsalted SHA-256 in the browser and the hash table
   is readable with the public anon key. That is SEC-13 and SEC-16 in the SRS
   and it needs a server-side fix; a UI restructure cannot solve it.
   ===================================================================== */

const CATEGORIES = ['PRIMARY_MANAGER', 'CO_FOUNDER', 'BOARD_OF_DIRECTORS', 'EMPLOYEE']

const EMPTY = { name: '', username: '', password: '', category: 'PRIMARY_MANAGER', under: '' }

function CreateLoginDialog({ open, onClose, onDone }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const save = useMutation(
    async () => {
      await access.createPmUser({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
      })
      // Matches the legacy pairing: a login always gets an employee record so
      // the person appears in People and can hold shares and a ledger.
      const role = form.under.trim() ? `${form.category}- ${form.under.trim()}` : form.category
      await people.create({ name: form.name.trim(), role })
    },
    {
      onSuccess: () => {
        toast.success('Login created')
        onDone?.()
        onClose()
      },
      onError: (e) =>
        toast.error(
          /duplicate key|unique/i.test(e.message) ? 'That username is already taken' : e.message
        ),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.username.trim()) next.username = 'Username is required'
    else if (/\s/.test(form.username)) next.username = 'Usernames cannot contain spaces'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create manager login"
      description="Creates both the login and the matching person record."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="login-form" disabled={save.busy}>
            {save.busy ? 'Creating…' : 'Create login'}
          </Button>
        </>
      }
    >
      <form id="login-form" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Full name" required htmlFor="al-name" error={errors.name}>
            <TextInput
              id="al-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ramesh Kumar"
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field label="Username" required htmlFor="al-user" error={errors.username}>
            <TextInput
              id="al-user"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="ramesh"
              autoComplete="off"
              invalid={Boolean(errors.username)}
            />
          </Field>
        </FieldGrid>

        <Field
          label="Password"
          required
          htmlFor="al-pass"
          error={errors.password}
          hint="Share it with the person directly. It cannot be read back later."
        >
          <TextInput
            id="al-pass"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            invalid={Boolean(errors.password)}
          />
        </Field>

        <FieldGrid cols={2}>
          <Field label="Category" htmlFor="al-cat">
            <Select id="al-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reports to" htmlFor="al-under" hint="Optional">
            <TextInput
              id="al-under"
              value={form.under}
              onChange={(e) => setForm({ ...form, under: e.target.value })}
              placeholder="Mukul"
            />
          </Field>
        </FieldGrid>

        <p className="rounded-[--radius] border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive-soft))] px-3 py-2 text-xs text-[hsl(var(--destructive))]">
          Passwords are currently hashed in the browser with unsalted SHA-256 and stored in a table the public key can
          read. Treat these credentials as low-assurance until authentication moves server-side.
        </p>
      </form>
    </Dialog>
  )
}

export default function AccessPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(async () => {
    const [pmUsers, admins] = await Promise.all([access.pmUsers(), access.admins().catch(() => [])])
    return { pmUsers, admins }
  }, [])

  const remove = useMutation((id) => access.removePmUser(id), {
    onSuccess: () => {
      toast.success('Login removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const pmUsers = query.data?.pmUsers ?? []
  const admins = query.data?.admins ?? []

  return (
    <Page>
      <PageHeader
        title="Access"
        description="Who can sign in, and with what level of control"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Create login
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={3}>
          <StatCard label="Manager logins" value={number(pmUsers.length)} hint="Username and password" icon={KeyRound} />
          <StatCard label="Admin accounts" value={number(admins.length)} hint="Full console access" icon={UserCog} />
          <StatCard
            label="Sign-in methods"
            value="3"
            hint="Admin auth, manager login, legacy founder flag"
            icon={ShieldAlert}
          />
        </StatGrid>

        <SplitLayout
          main={
            <SectionCard title="Manager logins" description="Sign in with a username and password" flush>
              <AsyncView
                query={query}
                skeletonProps={{ columns: 4 }}
                empty={{
                  icon: KeyRound,
                  title: 'No manager logins',
                  description: 'Create one so a project manager can log daily entries and request money.',
                  action: <Button onClick={() => setDialogOpen(true)}>Create login</Button>,
                }}
              >
                {() =>
                  pmUsers.length === 0 ? (
                    <EmptyState compact icon={KeyRound} title="No manager logins yet" />
                  ) : (
                    <TableWrap>
                      <Table>
                        <THead>
                          <TR>
                            <TH>Person</TH>
                            <TH>Username</TH>
                            <TH>Created</TH>
                            <TH className="w-10" />
                          </TR>
                        </THead>
                        <TBody>
                          {pmUsers.map((u) => (
                            <TR key={u.id}>
                              <TD>
                                <div className="flex items-center gap-2.5">
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                                    {initials(u.name)}
                                  </span>
                                  <span className="font-medium">{u.name}</span>
                                </div>
                              </TD>
                              <TD>
                                <span className="font-mono text-[13px]">{u.username}</span>
                              </TD>
                              <TD>
                                <span
                                  className="whitespace-nowrap text-[13px] text-muted-foreground"
                                  title={date(u.created_at)}
                                >
                                  {relativeTime(u.created_at)}
                                </span>
                              </TD>
                              <TD>
                                <ActionMenu
                                  items={[
                                    {
                                      label: 'Remove login',
                                      icon: Trash2,
                                      destructive: true,
                                      onSelect: () => setPendingDelete(u),
                                    },
                                  ]}
                                />
                              </TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    </TableWrap>
                  )
                }
              </AsyncView>
            </SectionCard>
          }
          aside={
            <>
              <SectionCard title="Admin accounts" description="Created by invite code" flush>
                {admins.length === 0 ? (
                  <EmptyState
                    compact
                    icon={UserCog}
                    title="No admins listed"
                    description="Either none exist, or the table is not readable with the current key."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {admins.map((a) => (
                      <li key={a.user_id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <span className="min-w-0 truncate font-mono text-xs">{a.user_id}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-border bg-muted/40 px-4 py-2.5 text-[13px] text-muted-foreground">
                  Admins sign up at /admin-login with an invite code. Codes carry an expiry and a use limit.
                </div>
              </SectionCard>

              <SectionCard title="Known limitations" bodyClassName="p-4">
                <ul className="space-y-2.5 text-[13px] text-muted-foreground">
                  <li>
                    <Badge size="sm" tone="danger" className="mr-1.5">
                      High
                    </Badge>
                    Manager passwords use unsalted SHA-256, hashed in the browser.
                  </li>
                  <li>
                    <Badge size="sm" tone="danger" className="mr-1.5">
                      High
                    </Badge>
                    The password-hash table is readable with the public key.
                  </li>
                  <li>
                    <Badge size="sm" tone="warning" className="mr-1.5">
                      Medium
                    </Badge>
                    Role checks happen in the browser, so they shape the interface but do not restrict the database.
                  </li>
                  <li>
                    <Badge size="sm" tone="warning" className="mr-1.5">
                      Medium
                    </Badge>
                    Removing a login does not remove the person's employee record.
                  </li>
                </ul>
              </SectionCard>
            </>
          }
        />
      </PageBody>

      <CreateLoginDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove ${pendingDelete?.name}'s login?`}
        description="They will no longer be able to sign in. Their person record, ledger and shares are kept."
        confirmLabel="Remove login"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
