import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChildDashboard from '@/components/ChildDashboard'

export default async function ChildPage({ params }: { params: Promise<{ childId: string }> }) {
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

  const { data: wardrobeItems } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('child_id', childId)

  return (
    <ChildDashboard
      child={child}
      initialMeasurements={measurements || []}
      initialWardrobe={wardrobeItems || []}
    />
  )
}