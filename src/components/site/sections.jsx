import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/* =====================================================================
   Marketing section primitives.

   Four pages (Enquire, Partner, Work Benefits, Partner Benefits) were written
   for the old slate layout and each repeated the same markup:

     • an identical hero block — pill label, h1, lead paragraph
     • an identical six-card benefit grid
     • an identical CTA band
     • form fields where every single input carried the same 200-character
       className, pasted six or seven times per page

   They also introduced a fifth accent colour into the site: `focus:ring-sky-100`
   and `text-sky-600` links, on a site whose accent is orange. Their CTAs were
   `bg-slate-900`, and they called the company "The X Company" while every other
   page says "excompany".

   These primitives replace that duplication. One definition of a hero, a card,
   a field and a button, in the site's actual brand.
   ===================================================================== */

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
}

/** Page hero. `label` is the small uppercase pill above the title. */
export function PageHero({ label, icon: Icon, title, highlight, description, children }) {
  return (
    <section className="bg-warm-cream bg-grid-pattern border-b border-black/[0.06] py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        {label && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600"
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-3xl font-extrabold leading-[1.1] tracking-tight text-black sm:text-4xl md:text-5xl"
        >
          {title} {highlight && <span className="text-orange-500">{highlight}</span>}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg"
          >
            {description}
          </motion.p>
        )}
        {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </section>
  )
}

export function Section({ children, className, tone = 'white' }) {
  const bg = tone === 'muted' ? 'bg-gray-50 border-y border-gray-100' : 'bg-white'
  return (
    <section className={`${bg} py-16 md:py-20 ${className ?? ''}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

export function SectionHeading({ label, title, description, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left' : 'mx-auto max-w-2xl text-center'
  return (
    <div className={`mb-10 ${alignment}`}>
      {label && <p className="mb-2 text-sm font-bold uppercase tracking-widest text-orange-500">{label}</p>}
      <h2 className="text-2xl font-extrabold text-black md:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-gray-600">{description}</p>}
    </div>
  )
}

/** Feature / benefit card. `items` is [{ icon, title, desc }]. */
export function FeatureGrid({ items, cols = 3 }) {
  const grid = cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <div className={`grid gap-5 ${grid}`}>
      {items.map((item, i) => (
        <motion.article
          key={item.title}
          {...fade}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-orange-200 hover:shadow-lg"
        >
          {item.icon && (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <item.icon className="h-5 w-5" />
            </span>
          )}
          <h3 className="mt-4 text-base font-bold text-black">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
          {item.points && (
            <ul className="mt-4 space-y-1.5">
              {item.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </motion.article>
      ))}
    </div>
  )
}

/** Primary and secondary buttons, so CTA styling is not re-invented per page. */
export function PrimaryButton({ to, href, onClick, children, className, type, disabled }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 disabled:opacity-60 ${className ?? ''}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

export function SecondaryButton({ to, href, onClick, children, className }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-7 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:border-orange-400 hover:text-orange-600 ${className ?? ''}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button type="button" onClick={onClick} className={cls}>{children}</button>
}

/**
 * Closing call to action.
 * `tone="dark"` is the high-contrast variant the Solutions page used — kept as
 * an option rather than as bespoke markup, so pages choose emphasis without
 * re-inventing the section.
 */
export function CtaBand({ title, highlight, description, tone = 'warm', children }) {
  const dark = tone === 'dark'
  return (
    <section
      className={
        dark
          ? 'relative overflow-hidden bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] py-16 md:py-20'
          : 'border-t border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 py-16'
      }
    >
      {dark && (
        <>
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
        </>
      )}
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className={`mb-3 text-2xl font-extrabold md:text-3xl ${dark ? 'text-white' : 'text-black'}`}>
          {title} {highlight && <span className={dark ? 'text-orange-400' : 'text-orange-500'}>{highlight}</span>}
        </h2>
        {description && (
          <p className={`mb-7 text-base md:text-lg ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Forms                                                              */
/* ------------------------------------------------------------------ */

const CONTROL =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100'

/**
 * One field definition for the whole marketing site.
 * Renders an input, textarea or select depending on `as`.
 */
export function Field({
  id,
  label,
  required,
  error,
  hint,
  as = 'input',
  options,
  className,
  full,
  ...props
}) {
  const invalid = Boolean(error)
  const control =
    as === 'textarea' ? (
      <textarea id={id} rows={props.rows ?? 5} aria-invalid={invalid || undefined} {...props} className={`${CONTROL} resize-y`} />
    ) : as === 'select' ? (
      <select id={id} aria-invalid={invalid || undefined} {...props} className={CONTROL}>
        <option value="">{props.placeholder ?? 'Select an option'}</option>
        {(options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    ) : (
      <input id={id} aria-invalid={invalid || undefined} {...props} className={CONTROL} />
    )

  return (
    <div className={`${full ? 'sm:col-span-2' : ''} ${className ?? ''}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-gray-800">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      {control}
      {error ? (
        <p className="mt-1 text-sm font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormCard({ title, description, onSubmit, children, footer }) {
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-gray-100 bg-gray-50 p-6 md:p-8">
      {title && <h2 className="text-xl font-extrabold text-black md:text-2xl">{title}</h2>}
      {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </form>
  )
}

/** Success panel shown after a form submits, so every form confirms the same way. */
export function FormSuccess({ title, description, onReset, resetLabel = 'Send another' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 px-8 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="mb-2 text-2xl font-extrabold text-black">{title}</h3>
      <p className="max-w-sm text-gray-600">{description}</p>
      {onReset && (
        <button type="button" onClick={onReset} className="mt-8 font-bold text-orange-500 hover:underline">
          {resetLabel}
        </button>
      )}
    </div>
  )
}

export { ArrowRight }
