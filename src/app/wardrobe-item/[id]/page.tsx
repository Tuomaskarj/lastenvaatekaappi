import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WardrobeItemPage from '@/components/WardrobeItemPage'

export default async function ItemPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ childId?: string }>
}) {
  const { id } = await params
  const { childId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) redirect('/dashboard')

  // Hae kaikki käyttäjän kaapit
  const { data: wardrobes } = await supabase
    .from('wardrobes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Hae kaikki lapset
  const { data: allChildren } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', user.id)

  const resolvedChildId = childId || item.current_wearer_id || item.child_id

  if (!resolvedChildId) {
    const { data: firstChild } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!firstChild) redirect('/dashboard')
    return (
      <WardrobeItemPage
        child={firstChild!}
        item={item}
        wardrobes={wardrobes || []}
        allChildren={allChildren || []}
      />
    )
  }

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', resolvedChildId)
    .single()

  if (!child) redirect('/dashboard')

  return (
    <WardrobeItemPage
      child={child}
      item={item}
      wardrobes={wardrobes || []}
      allChildren={allChildren || []}
    />
  )
}