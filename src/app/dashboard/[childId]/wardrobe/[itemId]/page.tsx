import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WardrobeItemPage from '@/components/WardrobeItemPage'

export default async function ItemPage({ params }: { params: Promise<{ childId: string; itemId: string }> }) {
  const { childId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single()

  if (!child) redirect('/dashboard')

  const { data: item } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (!item) redirect(`/dashboard/${childId}`)

  return <WardrobeItemPage child={child} item={item} />
}