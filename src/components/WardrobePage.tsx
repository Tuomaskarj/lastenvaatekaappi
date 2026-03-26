'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SIZE_STAGES = [
  { id: 'nb', label: '50', cm: 50 },
  { id: '56', label: '56', cm: 56 },
  { id: '62', label: '62', cm: 62 },
  { id: '68', label: '68', cm: 68 },
  { id: '74', label: '74', cm: 74 },
  { id: '80', label: '80', cm: 80 },
  { id: '86', label: '86', cm: 86 },
  { id: '92', label: '92', cm: 92 },
  { id: '98', label: '98', cm: 98 },
  { id: '104', label: '104', cm: 104 },
  { id: '110', label: '110', cm: 110 },
  { id: '116', label: '116', cm: 116 },
  { id: '122', label: '122', cm: 122 },
  { id: '128', label: '128', cm: 128 },
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

type Child = {
  id: string
  name: string
  date_of_birth: string | null
}

type Measurement = {
  child_id: string
  height_cm: number | null
  measured_at: string
}

type WardrobeItem = {
  id: string
  wardrobe_id: string | null
  child_id: string | null
  current_wearer_id: string | null
  size_label: string
  category_id: string
  name: string | null
  brand: string | null
  color: string | null
  quantity: number
  purchase_price: number | null
  selling_price: number | null
  status: string
  image_url: string | null
}

type Wardrobe = {
  id: string
  name: string
  description: string | null
  wardrobe_children: { child_id: string }[]
}

function getCurrentSizeLabel(measurements: Measurement[], childId: string): string | null {
  const childMeasurements = measurements
    .filter(m => m.child_id === childId && m.height_cm)
    .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())

  if (!childMeasurements[0]?.height_cm) return null
  const height = childMeasurements[0].height_cm

  for (let i = SIZE_STAGES.length - 1; i >= 0; i--) {
    if (height >= SIZE_STAGES[i].cm - 4) return SIZE_STAGES[i].label
  }
  return SIZE_STAGES[0].label
}

function getSuggestedWearers(sizeLabel: string, children: Child[], measurements: Measurement[]): Child[] {
  return children.filter(child => {
    const childSize = getCurrentSizeLabel(measurements, child.id)
    return childSize === sizeLabel
  })
}

export default function WardrobePage({ wardrobe, allChildren, initialItems, measurements, userId }: {
  wardrobe: Wardrobe
  allChildren: Child[]
  initialItems: WardrobeItem[]
  measurements: Measurement[]
  userId: string
}) {
  const [items, setItems] = useState(initialItems)
  const [addingItem, setAddingItem] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [filterSize, setFilterSize] = useState<string>('all')
  const [filterChild, setFilterChild] = useState<string>('all')
  const [newItem, setNewItem] = useState({
    name: '', brand: '', color: '', qty: '1',
    purchasePrice: '', sizeLabel: '68', categoryId: 'bodysuit',
    currentWearerId: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const wardrobeChildren = allChildren.filter(c =>
    wardrobe.wardrobe_children.some(wc => wc.child_id === c.id)
  )

  const activeItems = items.filter(w => w.status === 'active')
  const archivedItems = items.filter(w => w.status === 'archived')

  const filteredItems = activeItems.filter(item => {
    if (filterSize !== 'all' && item.size_label !== filterSize) return false
    if (filterChild !== 'all' && item.current_wearer_id !== filterChild) return false
    return true
  })

  const saveItem = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('wardrobe_items').insert({
      wardrobe_id: wardrobe.id,
      child_id: null,
      current_wearer_id: newItem.currentWearerId || null,
      size_label: newItem.sizeLabel,
      category_id: newItem.categoryId,
      name: newItem.name || CATEGORIES.find(c => c.id === newItem.categoryId)?.label,
      brand: newItem.brand || null,
      color: newItem.color || null,
      quantity: parseInt(newItem.qty) || 1,
      purchase_price: newItem.purchasePrice ? parseFloat(newItem.purchasePrice) : null,
      status: 'active',
    }).select().single()

    if (!error && data) {
      setItems(prev => [...prev, data])
      setNewItem({ name: '', brand: '', color: '', qty: '1', purchasePrice: '', sizeLabel: '68', categoryId: 'bodysuit', currentWearerId: '' })
      setAddingItem(false)
    }
    setLoading(false)
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
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard" style={{ color: 'white', fontSize: 22, textDecoration: 'none' }}>←</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>👗 {wardrobe.name}</div>
            <div style={{ fontSize: 12, color: '#a8d8a4' }}>
              {wardrobeChildren.map(c => c.name).join(' · ')}
              {wardrobe.description ? ` · ${wardrobe.description}` : ''}
            </div>
          </div>
          <button onClick={() => setAddingItem(true)} style={{
            background: '#ffffff20', border: 'none', borderRadius: 20,
            padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>
            + Vaate
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 40px' }}>

        {/* Lisää vaate */}
        {addingItem && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Lisää vaate kaappiin</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>KOKO</label>
                  <select style={inputStyle} value={newItem.sizeLabel} onChange={e => setNewItem(p => ({ ...p, sizeLabel: e.target.value }))}>
                    {SIZE_STAGES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>KATEGORIA</label>
                  <select style={inputStyle} value={newItem.categoryId} onChange={e => setNewItem(p => ({ ...p, categoryId: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>NIMI</label>
                <input style={inputStyle} value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="esim. Reima Tippy" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>MERKKI</label>
                  <input style={inputStyle} value={newItem.brand} onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))} placeholder="Reima" />
                </div>
                <div>
                  <label style={labelStyle}>VÄRI</label>
                  <input style={inputStyle} value={newItem.color} onChange={e => setNewItem(p => ({ ...p, color: e.target.value }))} placeholder="sininen" />
                </div>
                <div>
                  <label style={labelStyle}>MÄÄRÄ</label>
                  <input type="number" min="1" style={inputStyle} value={newItem.qty} onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>OSTOHINTA (€)</label>
                  <input type="number" step="0.01" style={inputStyle} value={newItem.purchasePrice} onChange={e => setNewItem(p => ({ ...p, purchasePrice: e.target.value }))} placeholder="29.90" />
                </div>
                <div>
                  <label style={labelStyle}>KÄYTTÄJÄ NYT</label>
                  <select style={inputStyle} value={newItem.currentWearerId} onChange={e => setNewItem(p => ({ ...p, currentWearerId: e.target.value }))}>
                    <option value="">Ei määritetty</option>
                    {wardrobeChildren.map(c => {
                      const size = getCurrentSizeLabel(measurements, c.id)
                      const fits = size === newItem.sizeLabel
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name}{fits ? ' ✓ sopii' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              

              {/* AI-ehdotus kenelle sopii */}
              {(() => {
                const suggested = getSuggestedWearers(newItem.sizeLabel, wardrobeChildren, measurements)
                if (suggested.length === 0) return null
                return (
                  <div style={{ background: '#f0f9ee', border: '1px solid #c8e6c4', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#2d5a27' }}>
                    ✨ Koko {newItem.sizeLabel} sopii nyt: <strong>{suggested.map(c => c.name).join(', ')}</strong>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveItem} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                  {loading ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button onClick={() => setAddingItem(false)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                  Peruuta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Budjetti */}
{activeItems.length > 0 && (
  <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16, border: '1.5px solid #e8f0e7' }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 12 }}>💰 Vaatebudjetti</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700, marginBottom: 2 }}>OSTETTU</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18' }}>
          {[...activeItems, ...archivedItems]
            .filter(w => w.purchase_price)
            .reduce((s, w) => s + (w.purchase_price || 0), 0)
            .toFixed(0)}€
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700, marginBottom: 2 }}>MYYTY</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#2d5a27' }}>
          {archivedItems
            .filter(w => w.selling_price)
            .reduce((s, w) => s + (w.selling_price || 0), 0)
            .toFixed(0)}€
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 700, marginBottom: 2 }}>NETTO</div>
        {(() => {
          const spent = [...activeItems, ...archivedItems]
            .filter(w => w.purchase_price)
            .reduce((s, w) => s + (w.purchase_price || 0), 0)
          const earned = archivedItems
            .filter(w => w.selling_price)
            .reduce((s, w) => s + (w.selling_price || 0), 0)
          const net = spent - earned
          return (
            <div style={{ fontSize: 18, fontWeight: 900, color: net > 0 ? '#e07070' : '#2d5a27' }}>
              {net.toFixed(0)}€
            </div>
          )
        })()}
      </div>
    </div>
    <div style={{ marginTop: 10, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
      {activeItems.length} aktiivista · {archivedItems.length} arkistoitua vaatetta
    </div>
  </div>
)}

        {/* Suodattimet */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <select
            value={filterSize}
            onChange={e => setFilterSize(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid #d0dece', background: 'white', fontSize: 12, fontWeight: 700, color: '#1a2e18', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <option value="all">Kaikki koot</option>
            {SIZE_STAGES.map(s => <option key={s.id} value={s.label}>Koko {s.label}</option>)}
          </select>

          {wardrobeChildren.length > 1 && (
            <select
              value={filterChild}
              onChange={e => setFilterChild(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid #d0dece', background: 'white', fontSize: 12, fontWeight: 700, color: '#1a2e18', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <option value="all">Kaikki lapset</option>
              {wardrobeChildren.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Yhteenveto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {wardrobeChildren.map(child => {
            const size = getCurrentSizeLabel(measurements, child.id)
            const childItems = activeItems.filter(i => i.current_wearer_id === child.id)
            return (
              <div key={child.id} style={{ background: 'white', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #e8f0e7', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a2e18' }}>{child.name}</div>
                <div style={{ fontSize: 10, color: '#7a9a78' }}>Koko {size || '?'}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#2d5a27', marginTop: 2 }}>{childItems.length}</div>
                <div style={{ fontSize: 9, color: '#aaa' }}>vaatetta</div>
              </div>
            )
          })}
          <div style={{ background: 'white', borderRadius: 12, padding: '10px 12px', border: '1.5px solid #e8f0e7', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#1a2e18' }}>Yhteensä</div>
            <div style={{ fontSize: 10, color: '#7a9a78' }}>kaikki koot</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#2d5a27', marginTop: 2 }}>{activeItems.length}</div>
            <div style={{ fontSize: 9, color: '#aaa' }}>vaatetta</div>
          </div>
        </div>

        {/* Vaatelista */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👚</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Ei vaatteita</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Lisää vaatteita yllä olevasta napista</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredItems.map(item => {
              const cat = CATEGORIES.find(c => c.id === item.category_id)
              const wearer = allChildren.find(c => c.id === item.current_wearer_id)
              const suggested = getSuggestedWearers(item.size_label, wardrobeChildren, measurements)

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/wardrobe-item/${item.id}?childId=${wardrobeChildren[0]?.id}`)}
                  style={{ background: 'white', border: '1.5px solid #e8f0e7', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>{cat?.icon}</span>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e18' }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: '#7a9a78' }}>
                          Koko {item.size_label}{item.brand ? ` · ${item.brand}` : ''}{item.quantity > 1 ? ` · ×${item.quantity}` : ''}
                        </div>
                        {wearer && (
                          <div style={{ fontSize: 11, color: '#2d5a27', fontWeight: 700, marginTop: 2 }}>
                            👤 {wearer.name}
                          </div>
                        )}
                        {!wearer && suggested.length > 0 && (
                          <div style={{ fontSize: 11, color: '#7a9a78', marginTop: 2 }}>
                            ✨ Sopii: {suggested.map(c => c.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#aaa', fontSize: 20 }}>›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Arkisto */}
        {archivedItems.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button onClick={() => setShowArchived(s => !s)} style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, color: '#7a9a78', fontWeight: 700, fontSize: 13, padding: 0,
            }}>
              <span style={{ transform: showArchived ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</span>
              Arkisto ({archivedItems.length} vaatetta)
            </button>
            {showArchived && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {archivedItems.map(item => {
                  const cat = CATEGORIES.find(c => c.id === item.category_id)
                  return (
                    <div key={item.id} style={{ background: '#f8f8f8', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '12px 14px', opacity: 0.8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{cat?.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#555' }}>{item.name} · Koko {item.size_label}</div>
                          {item.purchase_price && <div style={{ fontSize: 11, color: '#999' }}>Ostettu: {item.purchase_price}€{item.selling_price ? ` · Myyty: ${item.selling_price}€` : ''}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}