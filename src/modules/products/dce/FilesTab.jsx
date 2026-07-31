import * as React from 'react'
import { ExternalLink, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select, Textarea } from '@/components/ui/field'
import { AsyncView, EmptyState, Spinner } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { FilterSelect, Toolbar, ToolbarSpacer } from '@/components/patterns/Page'
import { useQuery, useMutation } from '@/lib/useQuery'
import { dce } from '@/lib/api'
import { date, relativeTime, truncate, slug } from '@/lib/format'
import toast from 'react-hot-toast'

/* =====================================================================
   Files — the document vault for a business.

   Kept: the `dce-media` bucket, the status and confidentiality taxonomies,
   and per-document comments.

   Changed: the mobile app only let you attach an image with a title, while the
   desktop version had a nine-field form including an OCR pipeline. Uploading
   from one place produced records the other could not describe. This is one
   form with the full field set, where only title and file are required — the
   rest defaults sensibly.

   Not carried over yet: the tesseract.js OCR-to-PDF pipeline. It is a real
   feature, but it pulls a 200KB+ WASM worker into the bundle and belongs
   behind its own lazy entry point rather than in this shared upload form.
   ===================================================================== */

const DOC_TYPES = ['Contract', 'Invoice', 'Licence', 'Report', 'Identity', 'Photo', 'Other']
const STATUSES = ['Draft', 'Awaiting signature', 'Signed', 'Expired']
const CONFIDENTIALITY = ['Public', 'Restricted', 'Confidential', 'Privileged']

const EMPTY = {
  title: '',
  doc_type: 'Contract',
  owner: '',
  status: 'Draft',
  confidentiality: 'Restricted',
  description: '',
}

function isImage(doc) {
  if (doc.file_type === 'image') return true
  return /\.(png|jpe?g|gif|webp|avif)$/i.test(doc.file_url ?? '')
}

function UploadDialog({ open, onClose, business, onDone }) {
  const [form, setForm] = React.useState(EMPTY)
  const [file, setFile] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const [stage, setStage] = React.useState(null)

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setFile(null)
      setErrors({})
      setStage(null)
    }
  }, [open])

  const save = useMutation(
    async () => {
      setStage('uploading')
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `documents/${business.id}/${Date.now()}-${slug(form.title)}.${ext}`
      const url = await dce.upload(file, path)
      setStage('saving')
      await dce.createDocument({
        business_id: business.id,
        business_name: business.name,
        title: form.title.trim(),
        doc_type: form.doc_type,
        owner: form.owner.trim() || null,
        status: form.status,
        confidentiality: form.confidentiality,
        description: form.description.trim() || null,
        file_url: url,
        file_type: file.type.startsWith('image/') ? 'image' : 'file',
        updated_at: new Date().toISOString(),
      })
    },
    {
      onSuccess: () => {
        toast.success('File uploaded')
        dce.logEvent({
          businessId: business.id,
          businessName: business.name,
          event: `Uploaded document "${form.title.trim()}"`,
          category: 'Documents',
        })
        onDone?.()
        onClose()
      },
      onError: (e) => {
        setStage(null)
        toast.error(e.message)
      },
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'Give the file a title'
    if (!file) next.file = 'Choose a file to upload'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Upload file"
      description={business?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="file-form" disabled={save.busy}>
            {save.busy ? (
              <>
                <Spinner />
                {stage === 'uploading' ? 'Uploading…' : 'Saving…'}
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </>
      }
    >
      <form id="file-form" onSubmit={submit} className="space-y-5">
        <Field label="Title" required htmlFor="f-title" error={errors.title}>
          <TextInput
            id="f-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="GTC service agreement"
            invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <Field label="File" required htmlFor="f-file" error={errors.file} hint="Images and PDFs are previewable">
          <TextInput
            id="f-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            invalid={Boolean(errors.file)}
            className="cursor-pointer py-1.5 file:mr-3 file:rounded-[--radius-sm] file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[13px]"
          />
        </Field>

        <FieldGrid cols={2}>
          <Field label="Type" htmlFor="f-type">
            <Select id="f-type" value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner" htmlFor="f-owner" hint="Who is responsible for it">
            <TextInput
              id="f-owner"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Mukul"
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Status" htmlFor="f-status">
            <Select id="f-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Confidentiality" htmlFor="f-conf">
            <Select
              id="f-conf"
              value={form.confidentiality}
              onChange={(e) => setForm({ ...form, confidentiality: e.target.value })}
            >
              {CONFIDENTIALITY.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <Field label="Description" htmlFor="f-desc">
          <Textarea
            id="f-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What this document covers and why it matters."
          />
        </Field>

        <p className="rounded-[--radius] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning-soft))] px-3 py-2 text-xs text-[hsl(var(--warning))]">
          Files in this bucket are publicly readable by URL. Do not upload anything that must stay private until storage
          policies are tightened.
        </p>
      </form>
    </Dialog>
  )
}

export default function FilesTab({ business, search }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [preview, setPreview] = React.useState(null)
  const [type, setType] = React.useState('all')

  const query = useQuery(() => dce.documents(business.id), [business.id])

  const remove = useMutation((id) => dce.removeDocument(id), {
    onSuccess: () => {
      toast.success('File removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (type !== 'all') list = list.filter((d) => (d.doc_type ?? 'Other') === type)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((d) => `${d.title ?? ''} ${d.description ?? ''} ${d.owner ?? ''}`.toLowerCase().includes(q))
    }
    return list
  }, [query.data, type, search])

  return (
    <>
      <SectionCard
        title="Files"
        description={`${rows.length} in ${business.name}`}
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Upload aria-hidden="true" />
            Upload
          </Button>
        }
        flush
      >
        <div className="px-4 pt-4 sm:px-5">
          <Toolbar>
            <FilterSelect
              label="Type"
              value={type}
              onChange={setType}
              options={[{ value: 'all', label: 'All types' }, ...DOC_TYPES.map((t) => ({ value: t, label: t }))]}
            />
            <ToolbarSpacer />
          </Toolbar>
        </div>

        <AsyncView
          query={query}
          skeletonProps={{ columns: 5 }}
          empty={{
            icon: FileText,
            title: 'No files yet',
            description: 'Upload contracts, invoices and photos for this business.',
            action: <Button onClick={() => setDialogOpen(true)}>Upload file</Button>,
          }}
        >
          {() =>
            rows.length === 0 ? (
              <EmptyState compact icon={FileText} title="No files match these filters" />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>File</TH>
                      <TH>Type</TH>
                      <TH>Status</TH>
                      <TH>Access</TH>
                      <TH>Owner</TH>
                      <TH>Updated</TH>
                      <TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((d) => (
                      <TR key={d.id}>
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-[--radius-sm] border border-border bg-muted text-muted-foreground">
                              {isImage(d) ? (
                                <ImageIcon className="size-4" aria-hidden="true" />
                              ) : (
                                <FileText className="size-4" aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{d.title}</p>
                              {d.description && (
                                <p className="truncate text-[13px] text-muted-foreground">
                                  {truncate(d.description, 60)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <Badge size="sm">{d.doc_type ?? 'Other'}</Badge>
                        </TD>
                        <TD>
                          <StatusBadge status={d.status} />
                        </TD>
                        <TD>
                          <StatusBadge status={d.confidentiality} />
                        </TD>
                        <TD>
                          <span className="text-[13px] text-muted-foreground">{d.owner || '—'}</span>
                        </TD>
                        <TD>
                          <span
                            className="whitespace-nowrap text-[13px] text-muted-foreground"
                            title={date(d.updated_at)}
                          >
                            {relativeTime(d.updated_at ?? d.inserted_at)}
                          </span>
                        </TD>
                        <TD>
                          <ActionMenu
                            items={[
                              d.file_url &&
                                isImage(d) && {
                                  label: 'Preview',
                                  icon: ImageIcon,
                                  onSelect: () => setPreview(d),
                                },
                              d.file_url && {
                                label: 'Open in new tab',
                                icon: ExternalLink,
                                onSelect: () => window.open(d.file_url, '_blank', 'noopener'),
                              },
                              { separator: true },
                              { label: 'Remove file', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(d) },
                            ].filter(Boolean)}
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

      <UploadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} business={business} onDone={query.refetch} />

      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title}
        description={preview?.doc_type}
        size="lg"
        footer={
          preview?.file_url && (
            <Button variant="outline" asChild>
              <a href={preview.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                Open original
              </a>
            </Button>
          )
        }
      >
        {preview?.file_url && (
          <img
            src={preview.file_url}
            alt={preview.title}
            className="mx-auto max-h-[60vh] w-auto rounded-[--radius] border border-border"
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove "${pendingDelete?.title}"?`}
        description="The record is deleted. The stored file may remain in the bucket."
        confirmLabel="Remove"
        destructive
        busy={remove.busy}
      />
    </>
  )
}
