import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHome from '@/components/DashboardHome'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: wardrobes } = await supabase
    .from('wardrobes')
    .select('*, wardrobe_children(child_id)')
    .order('created_at', { ascending: true })

  return (
    <DashboardHome
      user={user}
      initialChildren={children || []}
      initialWardrobes={wardrobes || []}
    />
  )
}