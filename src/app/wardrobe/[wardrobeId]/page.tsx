import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WardrobePage from '@/components/WardrobePage'

export default async function WardrobeDetailPage({ params }: { params: Promise<{ wardrobeId: string }> }) {
  const { wardrobeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: wardrobe } = await supabase
    .from('wardrobes')
    .select('*, wardrobe_children(child_id)')
    .eq('id', wardrobeId)
    .single()

  if (!wardrobe) redirect('/dashboard')

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', user.id)

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('wardrobe_id', wardrobeId)

  // Hae myös lapsikohtaiset mitat
  const childIds = wardrobe.wardrobe_children.map((wc: { child_id: string }) => wc.child_id)
  const { data: measurements } = await supabase
    .from('measurements')
    .select('*')
    .in('child_id', childIds.length > 0 ? childIds : ['none'])
    .order('measured_at', { ascending: false })

  return (
    <WardrobePage
      wardrobe={wardrobe}
      allChildren={children || []}
      initialItems={items || []}
      measurements={measurements || []}
      userId={user.id}
    />
  )
}