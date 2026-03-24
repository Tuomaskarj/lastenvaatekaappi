import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChildrenList from '@/components/ChildrenList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: '#f4faf3', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2e18 0%, #2d5a27 100%)',
        padding: '20px 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>🌱 Lastenvaatekaappi</div>
            <div style={{ fontSize: 12, color: '#a8d8a4', marginTop: 2 }}>{user.email}</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
        <ChildrenList initialChildren={children || []} userId={user.id} />
      </div>
    </div>
  )
}