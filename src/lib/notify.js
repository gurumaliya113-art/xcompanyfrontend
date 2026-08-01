/**
 * Owner notifications for public lead forms.
 *
 * Enquiries are stored in Supabase (the record) and also emailed to the owner
 * so a lead never sits unseen. Email goes through Web3Forms, which needs no
 * backend: paste the free access key you get after registering with
 * azadgupta1010@gmail.com at https://web3forms.com, and every submission is
 * emailed to that inbox.
 *
 * Left empty, email is skipped and only the Supabase insert runs, so nothing
 * breaks in dev or tests until the key is set.
 */
export const WEB3FORMS_ACCESS_KEY = '95672216-f949-4727-a357-0c62ba632285'

/**
 * Best-effort email of a lead to the owner. Never throws and never blocks the
 * caller's own success/failure handling.
 * @param {string} subject
 * @param {Record<string, any>} fields
 */
export async function emailLeadToOwner(subject, fields) {
  if (!WEB3FORMS_ACCESS_KEY || typeof fetch !== 'function') return
  // Never perform network I/O under test (keeps form tests hermetic).
  if (import.meta.env?.MODE === 'test') return
  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: fields?.name || 'ExCompany website',
        ...fields,
      }),
    })
  } catch {
    /* email is best-effort; the Supabase record is the source of truth */
  }
}
