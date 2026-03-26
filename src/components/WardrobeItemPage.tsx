'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SIZE_STAGES = [
  { id: 'nb', label: '50' }, { id: '56', label: '56' }, { id: '62', label: '62' },
  { id: '68', label: '68' }, { id: '74', label: '74' }, { id: '80', label: '80' },
  { id: '86', label: '86' }, { id: '92', label: '92' }, { id: '98', label: '98' },
  { id: '104', label: '104' }, { id: '110', label: '110' }, { id: '116', label: '116' },
  { id: '122', label: '122' }, { id: '128', label: '128' },
]

const CATEGORIES = [
  { id: 'bodysuit', label: 'Body', icon: '👶' },
  { id: 'onesie', label: 'Romppari/haalari', icon: '🐣' },
  { id: 'top', label: 'Paita/pusero', icon: '👕' },
  { id: 'pants', label: 'Housut', icon: '👖' },
  { id: 'outerwear', label: 'Takki/haalarit', icon: '🧥' },
  { id: 'sleepsuit', label: 'Unipuku', icon: '😴' },
  { id: 'socks', label: 'Sukat', icon: '🧦' },
  { id: 'shoes', label: 'Kengät', icon: '👟' },
  { id: 'hat', label: 'Pipo/hattu', icon: '🧢' },
  { id: 'mittens', label: 'Lapaset', icon: '🧤' },
  { id: 'dress', label: 'Mekko/hame', icon: '👗' },
  { id: 'swimwear', label: 'Uima-asu', icon: '🏊' },
]

type WardrobeItem = {
  id: string
  child_id: string | null
  wardrobe_id: string | null
  current_wearer_id: string | null
  size_label: string
  category_id: string
  name: string | null
  brand: string | null
  color: string | null
  quantity: number
  purchase_price: number | null
  selling_price: number | null
  sold_at: string | null
  status: string
  image_url: string | null
  archived_at: string | null
}

type Event = {
  id: string
  event_type: string
  description: string | null
  created_at: string
}

type Child = { id: string; name: string }

export default function WardrobeItemPage({
  child,
  item: initialItem,
  wardrobes = [],
  allChildren = [],
}: {
  child: Child
  item: WardrobeItem
  wardrobes?: { id: string; name: string }[]
  allChildren?: { id: string; name: string }[]
}) {
  const [item, setItem] = useState(initialItem)
  const [form, setForm] = useState({
    name: initialItem.name || '',
    brand: initialItem.brand || '',
    color: initialItem.color || '',
    qty: String(initialItem.quantity),
    purchasePrice: initialItem.purchase_price != null ? String(initialItem.purchase_price) : '',
    sellingPrice: initialItem.selling_price != null ? String(initialItem.selling_price) : '',
    soldAt: initialItem.sold_at || '',
    sizeLabel: initialItem.size_label,
    categoryId: initialItem.category_id,
    wardrobeId: initialItem.wardrobe_id || '',
    currentWearerId: initialItem.current_wearer_id || '',
  })
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const cat = CATEGORIES.find(c => c.id === item.category_id)

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    const { data } = await supabase
      .from('wardrobe_events')
      .select('*')
      .eq('item_id', item.id)
      .order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  const addEvent = async (type: string, description: string) => {
    const { data } = await supabase
      .from('wardrobe_events')
      .insert({ item_id: item.id, event_type: type, description })
      .select()
      .single()
    if (data) setEvents(prev => [data, ...prev])
  }

  const save = async () => {
    setLoading(true)
    const updates: Record<string, unknown> = {
      name: form.name || null,
      brand: form.brand || null,
      color: form.color || null,
      quantity: parseInt(form.qty) || 1,
      size_label: form.sizeLabel,
      category_id: form.categoryId,
      sold_at: form.soldAt || null,
      purchase_price: form.purchasePrice !== '' ? parseFloat(form.purchasePrice) : null,
      selling_price: form.sellingPrice !== '' ? parseFloat(form.sellingPrice) : null,
      wardrobe_id: form.wardrobeId || null,
      current_wearer_id: form.currentWearerId || null,
    }

    const { data, error } = await supabase
      .from('wardrobe_items')
      .update(updates)
      .eq('id', item.id)
      .select()
      .single()

    if (!error && data) {
      setItem(data)
      const changes: string[] = []

      if (form.name !== (item.name || '') && form.name)
        changes.push(`Nimi: "${item.name || '—'}" → "${form.name}"`)
      
      if (form.brand !== (item.brand || '') && form.brand)
        changes.push(`Merkki: ${item.brand || '—'} → ${form.brand}`)
      
      if (form.color !== (item.color || '') && form.color)
        changes.push(`Väri: ${item.color || '—'} → ${form.color}`)
      
      if (form.sizeLabel !== item.size_label)
        changes.push(`Koko: ${item.size_label} → ${form.sizeLabel}`)
      
      if (form.categoryId !== item.category_id) {
        const oldCat = CATEGORIES.find(c => c.id === item.category_id)?.label || item.category_id
        const newCat = CATEGORIES.find(c => c.id === form.categoryId)?.label || form.categoryId
        changes.push(`Kategoria: ${oldCat} → ${newCat}`)
      }
      
      if (parseInt(form.qty) !== item.quantity)
        changes.push(`Määrä: ${item.quantity} → ${form.qty} kpl`)
      
      if (form.purchasePrice !== '' && item.purchase_price === null)
        changes.push(`${cat?.label} ostettu, ostohinta ${parseFloat(form.purchasePrice).toFixed(2)}€`)
      else if (form.purchasePrice !== '' && Math.abs(parseFloat(form.purchasePrice) - (item.purchase_price ?? 0)) > 0.001)
        changes.push(`Ostohinta muutettu: ${item.purchase_price}€ → ${parseFloat(form.purchasePrice).toFixed(2)}€`)
      else if (form.purchasePrice === '' && item.purchase_price !== null)
        changes.push(`Ostohinta poistettu`)
      
      if (form.sellingPrice !== '' && item.selling_price === null) {
        const dateStr = form.soldAt ? new Date(form.soldAt).toLocaleDateString('fi-FI') : new Date().toLocaleDateString('fi-FI')
        changes.push(`${cat?.label} myyty ${dateStr}, myyntihinta ${parseFloat(form.sellingPrice).toFixed(2)}€`)
      } else if (form.sellingPrice !== '' && Math.abs(parseFloat(form.sellingPrice) - (item.selling_price ?? 0)) > 0.001)
        changes.push(`Myyntihinta muutettu: ${item.selling_price}€ → ${parseFloat(form.sellingPrice).toFixed(2)}€`)
      else if (form.sellingPrice === '' && item.selling_price !== null)
        changes.push(`Myyntihinta poistettu`)
      
      if (form.soldAt !== (item.sold_at || '') && form.soldAt)
        changes.push(`Myyntipäivä: ${new Date(form.soldAt).toLocaleDateString('fi-FI')}`)
      
      if (form.wardrobeId !== (item.wardrobe_id || '')) {
        const wardrobeName = wardrobes.find(w => w.id === form.wardrobeId)?.name || 'Ei kaappia'
        changes.push(`Kaappi vaihdettu: ${wardrobeName}`)
      }
      
      if (form.currentWearerId !== (item.current_wearer_id || '')) {
        const wearerName = allChildren.find(c => c.id === form.currentWearerId)?.name || 'Ei käyttäjää'
        changes.push(`Käyttäjä vaihdettu: ${wearerName}`)
      }
      await addEvent('updated', changes.length > 0 ? changes.join('\n') : 'Tiedot päivitetty')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setLoading(false)
  }

  const archive = async () => {
    setLoading(true)
    const updates: Record<string, unknown> = {
      status: 'archived',
      archived_at: new Date().toISOString(),
    }
    if (form.sellingPrice !== '') updates.selling_price = parseFloat(form.sellingPrice)
    if (form.soldAt) updates.sold_at = form.soldAt
    await supabase.from('wardrobe_items').update(updates).eq('id', item.id)
    const dateStr = form.soldAt ? new Date(form.soldAt).toLocaleDateString('fi-FI') : new Date().toLocaleDateString('fi-FI')
    const desc = form.sellingPrice ? `${cat?.label} arkistoitu ${dateStr}, myyntihinta ${parseFloat(form.sellingPrice).toFixed(2)}€` : `${cat?.label} arkistoitu ${dateStr}`
    await addEvent('archived', desc)
    router.push(`/dashboard/${child.id}`)
    setLoading(false)
  }

  const restore = async () => {
    setLoading(true)
    await supabase.from('wardrobe_items').update({ status: 'active', archived_at: null }).eq('id', item.id)
    await addEvent('restored', 'Palautettu kaappiin')
    setItem(prev => ({ ...prev, status: 'active', archived_at: null }))
    setLoading(false)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${child.id}/${item.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('wardrobe-images').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('wardrobe-images').getPublicUrl(path)
      await supabase.from('wardrobe_items').update({ image_url: urlData.publicUrl }).eq('id', item.id)
      setItem(prev => ({ ...prev, image_url: urlData.publicUrl }))
      await addEvent('updated', 'Kuva lisätty')
    }
    setUploading(false)
  }

  const profit = form.purchasePrice && form.sellingPrice
    ? (parseFloat(form.sellingPrice) - parseFloat(form.purchasePrice)).toFixed(2)
    : null

  const eventIcon: Record<string, string> = {
    created: '✨', updated: '✏️', archived: '📦', restored: '↩️', price_updated: '💰',
  }

  const inputStyle = {
    padding: '10px 13px', borderRadius: 10, border: '1.5px solid #d0dece',
    fontSize: 14, background: '#fafffe', width: '100%',
    boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#1a2e18',
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#5a7a58', display: 'block', marginBottom: 3 } as const

  return (
    <div style={{ minHeight: '100vh', background: '#f4faf3', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2e18 0%, #2d5a27 100%)', padding: '20px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ color: 'white', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{cat?.icon} {item.name || cat?.label}</div>
            <div style={{ fontSize: 12, color: '#a8d8a4' }}>
              {child.name} · Koko {item.size_label}
              {item.status === 'archived' && ' · Arkistoitu'}
            </div>
          </div>
          {item.status === 'archived' && (
            <span style={{ fontSize: 11, background: '#ffffff30', color: 'white', padding: '3px 10px', borderRadius: 10, fontWeight: 700 }}>ARKISTOITU</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 12px 40px' }}>

        {saved && (
          <div style={{ background: '#f0f9ee', border: '1.5px solid #c8e6c4', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#2d5a27', textAlign: 'center' }}>
            ✅ Tallennettu!
          </div>
        )}

        {profit !== null && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16, border: '1.5px solid #e8f0e7', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700 }}>OSTOHINTA</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18' }}>{form.purchasePrice}€</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700 }}>MYYNTIHINTA</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18' }}>{form.sellingPrice}€</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700 }}>TULOS</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: parseFloat(profit) >= 0 ? '#2d5a27' : '#e07070' }}>
                {parseFloat(profit) >= 0 ? '+' : ''}{profit}€
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

          {/* Vasen — lomake */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Kuva */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #e8f0e7' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 12 }}>🖼️ Kuva</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: 100, height: 100, borderRadius: 14,
                  background: item.image_url ? 'transparent' : '#f0f9ee',
                  border: '2px dashed #c8e6c4', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {item.image_url
                    ? <img src={item.image_url} alt="Vaate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center', color: '#7a9a78' }}>
                        <div style={{ fontSize: 28 }}>{cat?.icon}</div>
                        <div style={{ fontSize: 10, marginTop: 4 }}>Lisää kuva</div>
                      </div>
                  }
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                    padding: '8px 16px', borderRadius: 10, background: '#f0f9ee',
                    border: '1.5px solid #c8e6c4', color: '#2d5a27', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6,
                  }}>
                    {uploading ? 'Ladataan...' : item.image_url ? '🔄 Vaihda kuva' : '📷 Lisää kuva'}
                  </button>
                  <div style={{ fontSize: 11, color: '#aaa' }}>JPG, PNG · max 5MB</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]) }} />
              </div>
            </div>

            {/* Perustiedot */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #e8f0e7' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 12 }}>📋 Perustiedot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>KOKO</label>
                    <select style={inputStyle} value={form.sizeLabel} onChange={e => setForm(p => ({ ...p, sizeLabel: e.target.value }))}>
                      {SIZE_STAGES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>KATEGORIA</label>
                    <select style={inputStyle} value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>NIMI</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="esim. Reima Tippy" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>MERKKI</label>
                    <input style={inputStyle} value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Reima" />
                  </div>
                  <div>
                    <label style={labelStyle}>VÄRI</label>
                    <input style={inputStyle} value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="sininen" />
                  </div>
                  <div>
                    <label style={labelStyle}>MÄÄRÄ</label>
                    <input type="number" min="1" style={inputStyle} value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sijainti */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #e8f0e7' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 12 }}>📦 Sijainti</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>KAAPPI</label>
                  <select style={inputStyle} value={form.wardrobeId} onChange={e => setForm(p => ({ ...p, wardrobeId: e.target.value }))}>
                    <option value="">Ei kaappia</option>
                    {wardrobes.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>KÄYTTÄJÄ NYT</label>
                  <select style={inputStyle} value={form.currentWearerId} onChange={e => setForm(p => ({ ...p, currentWearerId: e.target.value }))}>
                    <option value="">Ei määritetty</option>
                    {allChildren.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hintatiedot */}
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #e8f0e7' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 12 }}>💰 Hintatiedot</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>OSTOHINTA (€)</label>
                    <input type="number" step="0.01" style={inputStyle} value={form.purchasePrice}
                      onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} placeholder="29.90" />
                  </div>
                  <div>
                    <label style={labelStyle}>MYYNTIHINTA (€)</label>
                    <input type="number" step="0.01" style={inputStyle} value={form.sellingPrice}
                      onChange={e => setForm(p => ({ ...p, sellingPrice: e.target.value }))} placeholder="15.00" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>MYYNTIPÄIVÄ</label>
                  <input type="date" style={inputStyle} value={form.soldAt} onChange={e => setForm(p => ({ ...p, soldAt: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Tallenna */}
            <button onClick={save} disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: 'linear-gradient(135deg, #2d5a27, #4a8a42)', color: 'white',
              border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 15,
              boxShadow: '0 4px 12px #2d5a2740',
            }}>
              {loading ? 'Tallennetaan...' : '✓ Tallenna muutokset'}
            </button>

            {/* Arkistointi */}
            <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1.5px solid #e8f0e7' }}>
              {item.status === 'active' ? (
                <button onClick={archive} disabled={loading} style={{
                  width: '100%', padding: '11px', borderRadius: 12,
                  background: 'white', color: '#b85c00', border: '1.5px solid #fde9c2',
                  fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }}>📦 Arkistoi vaate</button>
              ) : (
                <button onClick={restore} disabled={loading} style={{
                  width: '100%', padding: '11px', borderRadius: 12,
                  background: 'white', color: '#2d5a27', border: '1.5px solid #c8e6c4',
                  fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }}>↩️ Palauta kaappiin</button>
              )}
            </div>
          </div>

          {/* Oikea — tapahtumafeedi */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #e8f0e7', position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 16 }}>📋 Tapahtumat</div>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>
                Ei tapahtumia vielä
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map((event, i) => (
                  <div key={event.id} style={{ display: 'flex', gap: 10, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f9ee', border: '2px solid #c8e6c4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {eventIcon[event.event_type] || '•'}
                      </div>
                      {i < events.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: '#e8f0e7', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4, paddingBottom: i < events.length - 1 ? 8 : 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2e18' }}>
                        {event.event_type === 'created' ? 'Lisätty kaappiin' :
                         event.event_type === 'updated' ? 'Päivitetty' :
                         event.event_type === 'archived' ? 'Arkistoitu' :
                         event.event_type === 'restored' ? 'Palautettu' : 'Muutos'}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: 11, color: '#7a9a78', marginTop: 2 }}>
                          {event.description.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>
                        {new Date(event.created_at).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}