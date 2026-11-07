import { createClient } from '@/utils/supabase/server'
import { deleteJob } from '@/app/actions'
import JobCreateForm from '@/components/admin/JobCreateForm'
import DeleteButton from '@/components/admin/DeleteButton'

export default async function AdminJobs() {
  const s = await createClient()
  const { data: jobs } = await s.from('jobs').select('*').order('created_at', { ascending: false })

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Jobs</h1>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Post a new job</h2>
        <JobCreateForm />
      </div>

      <h2 style={{ fontSize: 26, marginBottom: 16 }}>Existing jobs</h2>
      {(jobs ?? []).length === 0 && (
        <div className="empty">No jobs posted yet. Use the form above to add one.</div>
      )}

      {(jobs ?? []).map((j) => (
        <div key={j.id} className="job">
          <h3>{j.title}</h3>
          <div className="meta">
            {[j.type, j.location, j.deadline && `Deadline: ${j.deadline}`].filter(Boolean).join(' · ')}
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{j.description}</p>
          <div style={{ marginTop: 14 }}>
            <DeleteButton
              onDelete={async () => {
                'use server'
                return await deleteJob(j.id)
              }}
              label="Delete job"
              confirmMessage={`Are you sure you want to delete "${j.title}"?`}
            />
          </div>
        </div>
      ))}
    </>
  )
}
