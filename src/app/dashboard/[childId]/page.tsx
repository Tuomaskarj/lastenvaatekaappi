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

  // Hae kaapit joihin lapsi on linkitetty
  const { data: wardrobeLinks } = await supabase
    .from('wardrobe_children')
    .select('wardrobe_id')
    .eq('child_id', childId)

  const wardrobeIds = wardrobeLinks?.map(w => w.wardrobe_id) || []

  // Hae vaatteet kaikista kaapit
  let wardrobeItems: unknown[] = []
  if (wardrobeIds.length > 0) {
    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('*')
      .in('wardrobe_id', wardrobeIds)
      .eq('status', 'active')
    wardrobeItems = items || []
  }

  // Hae myös vanhat lapsikohtaiset vaatteet (migraatio)
  const { data: legacyItems } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('child_id', childId)
    .is('wardrobe_id', null)
    .eq('status', 'active')

  const allItems = [...wardrobeItems, ...(legacyItems || [])]

  // Hae kaapit
  const { data: wardrobes } = await supabase
    .from('wardrobes')
    .select('*')
    .in('id', wardrobeIds.length > 0 ? wardrobeIds : ['none'])

  return (
    <ChildDashboard
      child={child}
      initialMeasurements={measurements || []}
      initialWardrobe={allItems as never[]}
      wardrobes={wardrobes || []}
      wardrobeIds={wardrobeIds}
    />
  )
}