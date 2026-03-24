import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingPage from '@/components/ShoppingPage'

export default async function Shopping({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single()

  if (!child) redirect('/dashboard')

  const { data: measurements } = await supabase
    .from('measurements')
    .select('*')
    .eq('child_id', childId)
    .order('measured_at', { ascending: false })

  const { data: wardrobe } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('child_id', childId)
    .eq('status', 'active')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <ShoppingPage
      child={child}
      measurements={measurements || []}
      wardrobe={wardrobe || []}
      initialSettings={settings}
      userId={user.id}
    />
  )
}