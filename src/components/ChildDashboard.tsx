'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GrowthChart from './GrowthChart'
import { useRouter } from 'next/navigation'

const SIZE_STAGES = [
  { id: 'nb', label: '50', months: 0, cm: '44–56', weight: '2–4kg', ageLabel: 'Vastasyntynyt' },
  { id: '56', label: '56', months: 1, cm: '56', weight: '4–5kg', ageLabel: '1 kk' },
  { id: '62', label: '62', months: 2, cm: '62', weight: '5–6kg', ageLabel: '2 kk' },
  { id: '68', label: '68', months: 4, cm: '68', weight: '6–8kg', ageLabel: '4 kk' },
  { id: '74', label: '74', months: 6, cm: '74', weight: '8–9kg', ageLabel: '6 kk' },
  { id: '80', label: '80', months: 9, cm: '80', weight: '9–10kg', ageLabel: '9 kk' },
  { id: '86', label: '86', months: 12, cm: '86', weight: '10–11kg', ageLabel: '12 kk' },
  { id: '92', label: '92', months: 18, cm: '92', weight: '12–13kg', ageLabel: '1,5 v' },
  { id: '98', label: '98', months: 24, cm: '98', weight: '13–15kg', ageLabel: '2 v' },
  { id: '104', label: '104', months: 36, cm: '104', weight: '15–17kg', ageLabel: '3 v' },
  { id: '110', label: '110', months: 48, cm: '110', weight: '17–19kg', ageLabel: '4 v' },
  { id: '116', label: '116', months: 60, cm: '116', weight: '19–21kg', ageLabel: '5 v' },
  { id: '122', label: '122', months: 72, cm: '122', weight: '21–24kg', ageLabel: '6 v' },
  { id: '128', label: '128', months: 84, cm: '128', weight: '24–27kg', ageLabel: '7 v' },
]

const CATEGORIES = [
  { id: 'bodysuit', label: 'Body', icon: '👶', essential: true },
  { id: 'onesie', label: 'Romppari/haalari', icon: '🐣', essential: true },
  { id: 'top', label: 'Paita/pusero', icon: '👕', essential: true },
  { id: 'pants', label: 'Housut', icon: '👖', essential: true },
  { id: 'outerwear', label: 'Takki/haalarit', icon: '🧥', essential: true },
  { id: 'sleepsuit', label: 'Unipuku', icon: '😴', essential: true },
  { id: 'socks', label: 'Sukat', icon: '🧦', essential: true },
  { id: 'shoes', label: 'Kengät', icon: '👟', essential: true },
  { id: 'hat', label: 'Pipo/hattu', icon: '🧢', essential: true },
  { id: 'mittens', label: 'Lapaset', icon: '🧤', essential: false },
  { id: 'dress', label: 'Mekko/hame', icon: '👗', essential: false },
  { id: 'swimwear', label: 'Uima-asu', icon: '🏊', essential: false },
]


function getCurrentStage(heightCm: number) {
  for (let i = SIZE_STAGES.length - 1; i >= 0; i--) {
    const num = parseInt(SIZE_STAGES[i].label)
    if (!isNaN(num) && heightCm >= num - 4) return SIZE_STAGES[i]
  }
  return SIZE_STAGES[0]
}

function getNextStages(currentId: string) {
  const idx = SIZE_STAGES.findIndex(s => s.id === currentId)
  return SIZE_STAGES.slice(idx + 1)
}

function predictSizeDate(
  measurements: Measurement[],
  targetCm: number,
  dateOfBirth: string | null
): string | null {
  if (measurements.length === 0) return null

  let cmPerMonth: number

  if (measurements.length >= 2) {
    const sorted = [...measurements].sort((a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
    )
    const latest = sorted[0]
    const previous = sorted[1]
    if (!latest.height_cm || !previous.height_cm) return null
    const daysDiff = (new Date(latest.measured_at).getTime() - new Date(previous.measured_at).getTime()) / (1000 * 60 * 60 * 24)
    const monthsDiff = daysDiff / 30.44
    if (monthsDiff <= 0) return null
    const growthRate = (latest.height_cm - previous.height_cm) / monthsDiff
    cmPerMonth = Math.min(Math.max(growthRate, 0.3), 4.0)
  } else {
    const m = measurements[0]
    if (!m.height_cm) return null
    const ageMonths = dateOfBirth
      ? Math.round((new Date(m.measured_at).getTime() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      : 6
    if (ageMonths < 3) cmPerMonth = 3.5
    else if (ageMonths < 6) cmPerMonth = 2.5
    else if (ageMonths < 12) cmPerMonth = 1.5
    else if (ageMonths < 24) cmPerMonth = 1.2
    else cmPerMonth = 0.6
  }

  const latest = [...measurements].sort((a, b) =>
    new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  )[0]
  if (!latest.height_cm) return null
  const cmNeeded = targetCm - latest.height_cm
  if (cmNeeded <= 0) return null
  const monthsNeeded = cmNeeded / cmPerMonth
  const targetDate = new Date(latest.measured_at)
  targetDate.setMonth(targetDate.getMonth() + Math.round(monthsNeeded))
  return targetDate.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })
}

type Measurement = {
  id: string
  measured_at: string
  height_cm: number | null
  weight_kg: number | null
  head_circ_cm: number | null
  foot_length_cm: number | null
}

type WardrobeItem = {
  id: string
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
  archived_at: string | null
}

type Child = {
  id: string
  name: string
  date_of_birth: string | null
  is_expected: boolean
}

export default function ChildDashboard({
    child,
    initialMeasurements,
    initialWardrobe,
    wardrobes,
    wardrobeIds,
  }: {
    child: Child
    initialMeasurements: Measurement[]
    initialWardrobe: WardrobeItem[]
    wardrobes: { id: string; name: string }[]
    wardrobeIds: string[]
  }) {
  const [tab, setTab] = useState<'timeline' | 'wardrobe' | 'measurements'>('timeline')
  const [measurements, setMeasurements] = useState(initialMeasurements)
  const [wardrobe, setWardrobe] = useState(initialWardrobe)
  const [addingMeasurement, setAddingMeasurement] = useState(false)
  const [addingItem, setAddingItem] = useState<{ sizeLabel: string; categoryId: string } | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [newM, setNewM] = useState({ height: '', weight: '', headCirc: '', footLength: '', date: new Date().toISOString().split('T')[0] })
  const [newItem, setNewItem] = useState({ name: '', brand: '', color: '', qty: '1', purchasePrice: '', sellingPrice: '' })
  const [loading, setLoading] = useState(false)
  const [openStages, setOpenStages] = useState<string[]>([])
  const [archivingItem, setArchivingItem] = useState<string | null>(null)
  const [archiveData, setArchiveData] = useState({ sellingPrice: '', soldAt: new Date().toISOString().split('T')[0] })
  const supabase = createClient()
  const router = useRouter()

  const latestM = measurements[0]
  const currentStage = latestM?.height_cm ? getCurrentStage(latestM.height_cm) : null

  const activeWardrobe = wardrobe.filter(w => w.status === 'active')
  const archivedWardrobe = wardrobe.filter(w => w.status === 'archived')

  const saveMeasurement = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('measurements').insert({
      child_id: child.id,
      measured_at: newM.date,
      height_cm: newM.height ? parseFloat(newM.height) : null,
      weight_kg: newM.weight ? parseFloat(newM.weight) : null,
      head_circ_cm: newM.headCirc ? parseFloat(newM.headCirc) : null,
      foot_length_cm: newM.footLength ? parseFloat(newM.footLength) : null,
    }).select().single()
    if (!error && data) {
      setMeasurements(prev => [data, ...prev])
      setAddingMeasurement(false)
      setNewM({ height: '', weight: '', headCirc: '', footLength: '', date: new Date().toISOString().split('T')[0] })
    }
    setLoading(false)
  }

  const saveWardrobeItem = async () => {
    if (!addingItem) return
    setLoading(true)
  
    // Käytetään ensimmäistä kaappia johon lapsi on linkitetty
    const targetWardrobeId = wardrobeIds[0] || null
  
    const { data, error } = await supabase.from('wardrobe_items').insert({
      wardrobe_id: targetWardrobeId,
      child_id: targetWardrobeId ? null : child.id, // legacy jos ei kaappia
      current_wearer_id: child.id,
      size_label: addingItem.sizeLabel,
      category_id: addingItem.categoryId,
      name: newItem.name || CATEGORIES.find(c => c.id === addingItem.categoryId)?.label,
      brand: newItem.brand || null,
      color: newItem.color || null,
      quantity: parseInt(newItem.qty) || 1,
      purchase_price: newItem.purchasePrice ? parseFloat(newItem.purchasePrice) : null,
      selling_price: newItem.sellingPrice ? parseFloat(newItem.sellingPrice) : null,
      status: 'active',
    }).select().single()
  
    if (!error && data) {
      setWardrobe(prev => [...prev, data])
      setAddingItem(null)
      setNewItem({ name: '', brand: '', color: '', qty: '1', purchasePrice: '', sellingPrice: '' })
    }
    setLoading(false)
  }

  const archiveItem = async (id: string) => {
    setLoading(true)
    const { data, error } = await supabase.from('wardrobe_items')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        selling_price: archiveData.sellingPrice ? parseFloat(archiveData.sellingPrice) : null,
        sold_at: archiveData.soldAt || null,
      })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setWardrobe(prev => prev.map(w => w.id === id ? data : w))
      setArchivingItem(null)
      setArchiveData({ sellingPrice: '', soldAt: new Date().toISOString().split('T')[0] })
    }
    setLoading(false)
  }

  const toggleStage = (id: string) => {
    setOpenStages(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const inputStyle = {
    padding: '10px 13px', borderRadius: 10, border: '1.5px solid #d0dece',
    fontSize: 14, background: '#fafffe', width: '100%',
    boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#1a2e18',
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#5a7a58', display: 'block', marginBottom: 3 } as const

  const TABS = [
    { id: 'timeline', label: 'Aikajana', icon: '📅' },
    { id: 'wardrobe', label: 'Kaappi', icon: '👗' },
    { id: 'measurements', label: 'Mitat', icon: '📏' },
    { id: 'shopping', label: 'Ostokset', icon: '🛍️' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f4faf3', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2e18 0%, #2d5a27 100%)', padding: '20px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard" style={{ color: 'white', fontSize: 22, textDecoration: 'none' }}>←</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>👶 {child.name}</div>
            <div style={{ fontSize: 12, color: '#a8d8a4' }}>
              {currentStage ? `Koko ${currentStage.label} · ${currentStage.ageLabel}` : 'Lisää mitat aloittaaksesi'}
            </div>
          </div>
          <a href={`/dashboard/${child.id}/shopping`} style={{
            background: '#ffffff20', borderRadius: 20, padding: '6px 14px',
            color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            🛍️ Ostokset
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 80px' }}>

        {/* ── TIMELINE ── */}
        {tab === 'timeline' && (
          <div>
            {!currentStage && (
              <div style={{ background: '#fff9f0', border: '1.5px solid #fde9c2', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📏</div>
                <div style={{ fontWeight: 700, color: '#7a4a0a', marginBottom: 4 }}>Lisää ensin mitat</div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>Mitat-välilehdeltä voit lisätä lapsen pituuden</div>
                <button onClick={() => setTab('measurements')} style={{ padding: '8px 20px', borderRadius: 20, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  Lisää mitat →
                </button>
              </div>
            )}

            {currentStage && (
              <div style={{ background: '#f0f9ee', border: '2px solid #2d5a27', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2d5a27', marginBottom: 4 }}>NYKYKOKO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1a2e18' }}>Koko {currentStage.label}</div>
                <div style={{ fontSize: 13, color: '#5a7a58' }}>{currentStage.cm} cm · {currentStage.weight} · {currentStage.ageLabel}</div>
                {latestM?.height_cm && <div style={{ fontSize: 12, color: '#7a9a78', marginTop: 4 }}>Pituus: {latestM.height_cm} cm{latestM.weight_kg ? ` · Paino: ${latestM.weight_kg} kg` : ''}</div>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(currentStage ? [currentStage, ...getNextStages(currentStage.id)] : SIZE_STAGES).map(stage => {
                const owned = activeWardrobe.filter(w =>
                  w.size_label === stage.label &&
                  (w.current_wearer_id === child.id || w.current_wearer_id === null)
                )
                const ownedCatIds = owned.map(w => w.category_id)
                const missing = CATEGORIES.filter(c => c.essential && !ownedCatIds.includes(c.id))
                const isOpen = openStages.includes(stage.id)
                const isCurrent = currentStage?.id === stage.id
                const targetCm = parseInt(stage.label)

                return (
                  <div key={stage.id} style={{
                    background: 'white', borderRadius: 14,
                    border: isCurrent ? '2px solid #2d5a27' : '1.5px solid #e8f0e7',
                    overflow: 'hidden',
                  }}>
                    <button onClick={() => toggleStage(stage.id)} style={{
                      width: '100%', padding: '13px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontFamily: 'inherit',
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          {isCurrent && <span style={{ fontSize: 9, background: '#2d5a27', color: 'white', padding: '2px 7px', borderRadius: 10, fontWeight: 800 }}>NYKYKOKO</span>}
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#1a2e18' }}>Koko {stage.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#7a9a78' }}>{stage.cm} cm · {stage.ageLabel}</div>
                        {!isCurrent && measurements.length > 0 && (() => {
                          const prediction = predictSizeDate(measurements, targetCm - 4, child.date_of_birth)
                          if (!prediction) return null
                          return <div style={{ fontSize: 11, color: '#7a9a78', fontWeight: 600, marginTop: 2 }}>📅 Ennuste: {prediction}</div>
                        })()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {missing.length > 0 && <span style={{ fontSize: 11, background: '#fde9c2', color: '#7a4a0a', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Puuttuu {missing.length}</span>}
                        {owned.length > 0 && <span style={{ fontSize: 11, background: '#d4e6d1', color: '#2d5a27', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{owned.length} kpl</span>}
                        <span style={{ color: '#aaa', fontSize: 18, transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        {missing.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#b85c00', marginBottom: 8 }}>⚠️ PUUTTUVAT</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {missing.map(cat => (
                                <button key={cat.id} onClick={() => { setAddingItem({ sizeLabel: stage.label, categoryId: cat.id }); setTab('wardrobe') }} style={{
                                  padding: '5px 10px', borderRadius: 20, border: '1.5px solid #fde9c2',
                                  background: '#fff9f0', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#7a4a0a',
                                }}>
                                  {cat.icon} {cat.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {owned.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2d5a27', marginBottom: 8 }}>✅ KAAPISSA</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {owned.map(item => {
  const cat = CATEGORIES.find(c => c.id === item.category_id)
  return (
    <button key={item.id} onClick={() => router.push(`/wardrobe-item/${item.id}?childId=${child.id}`)} style={{
      background: '#d4e6d1', color: '#1a2e18', padding: '4px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {cat?.icon} {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''} ›
    </button>
  )
})}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── WARDROBE ── */}
        {tab === 'wardrobe' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18', margin: 0 }}>👗 Vaatekaappi</h2>
              <button onClick={() => setAddingItem({ sizeLabel: currentStage?.label || '68', categoryId: 'bodysuit' })} style={{
                padding: '8px 14px', borderRadius: 20, background: '#2d5a27', color: 'white',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}>+ Lisää vaate</button>
            </div>

            {/* Lisää vaate -lomake */}
            {addingItem && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Lisää vaate kaappiin</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>KOKO</label>
                      <select style={inputStyle} value={addingItem.sizeLabel} onChange={e => setAddingItem(p => p ? { ...p, sizeLabel: e.target.value } : null)}>
                        {SIZE_STAGES.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>KATEGORIA</label>
                      <select style={inputStyle} value={addingItem.categoryId} onChange={e => setAddingItem(p => p ? { ...p, categoryId: e.target.value } : null)}>
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
                      <label style={labelStyle}>MYYNTIHINTA (€)</label>
                      <input type="number" step="0.01" style={inputStyle} value={newItem.sellingPrice} onChange={e => setNewItem(p => ({ ...p, sellingPrice: e.target.value }))} placeholder="15.00" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveWardrobeItem} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Tallennetaan...' : 'Tallenna'}
                    </button>
                    <button onClick={() => setAddingItem(null)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Arkistointilomake */}
            {archivingItem && (
              <div style={{ background: '#fff9f0', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #fde9c2' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#7a4a0a' }}>Arkistoi vaate</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>MYYNTIHINTA (€)</label>
                      <input type="number" step="0.01" style={inputStyle} value={archiveData.sellingPrice} onChange={e => setArchiveData(p => ({ ...p, sellingPrice: e.target.value }))} placeholder="15.00" />
                    </div>
                    <div>
                      <label style={labelStyle}>MYYNTIPÄIVÄ</label>
                      <input type="date" style={inputStyle} value={archiveData.soldAt} onChange={e => setArchiveData(p => ({ ...p, soldAt: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => archiveItem(archivingItem)} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#b85c00', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Arkistoidaan...' : 'Arkistoi'}
                    </button>
                    <button onClick={() => setArchivingItem(null)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aktiiviset vaatteet */}
            {activeWardrobe.length === 0 && !addingItem ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👚</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Kaappi on tyhjä</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeWardrobe.map(item => {
                  const cat = CATEGORIES.find(c => c.id === item.category_id)
                  return (
                    <div key={item.id} style={{ background: 'white', border: '1.5px solid #e8f0e7', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => router.push(`/wardrobe-item/${item.id}?childId=${child.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{cat?.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e18' }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#7a9a78' }}>
                              Koko {item.size_label}{item.brand ? ` · ${item.brand}` : ''}{item.color ? ` · ${item.color}` : ''}{item.quantity > 1 ? ` · ×${item.quantity}` : ''}
                            </div>
                            {(item.purchase_price || item.selling_price) && (
                              <div style={{ fontSize: 11, color: '#5a7a58', marginTop: 2 }}>
                                {item.purchase_price ? `Ostettu: ${item.purchase_price}€` : ''}
                                {item.purchase_price && item.selling_price ? ' · ' : ''}
                                {item.selling_price ? `Myyntihinta: ${item.selling_price}€` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => setArchivingItem(item.id)} style={{ background: 'none', border: 'none', color: '#e07070', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>
                          Arkistoi
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Arkistoitu vaatehistoria */}
            {archivedWardrobe.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowArchived(s => !s)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 6, color: '#7a9a78', fontWeight: 700, fontSize: 13, padding: 0,
                }}>
                  <span style={{ transform: showArchived ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>›</span>
                  Vaatehistoria ({archivedWardrobe.length} vaatetta)
                </button>

                {showArchived && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {archivedWardrobe.map(item => {
                      const cat = CATEGORIES.find(c => c.id === item.category_id)
                      const profit = item.purchase_price && item.selling_price
                        ? (item.selling_price - item.purchase_price).toFixed(2)
                        : null
                      return (
                        <div key={item.id} style={{ background: '#f8f8f8', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '12px 14px', opacity: 0.8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{cat?.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#555' }}>{item.name} · Koko {item.size_label}</div>
                              <div style={{ fontSize: 11, color: '#999' }}>
                                {item.purchase_price ? `Ostettu: ${item.purchase_price}€` : ''}
                                {item.selling_price ? ` · Myyty: ${item.selling_price}€` : ''}
                                {profit !== null && (
                                  <span style={{ color: parseFloat(profit) >= 0 ? '#2d5a27' : '#e07070', fontWeight: 700 }}>
                                    {' '}({parseFloat(profit) >= 0 ? '+' : ''}{profit}€)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Yhteenveto */}
                    {archivedWardrobe.some(w => w.purchase_price || w.selling_price) && (
                      <div style={{ background: '#f0f9ee', border: '1.5px solid #c8e6c4', borderRadius: 12, padding: '12px 16px', marginTop: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 6 }}>💰 Vaatebudjetti yhteensä</div>
                        <div style={{ fontSize: 12, color: '#5a7a58' }}>
                          Ostettu yhteensä: <strong>{archivedWardrobe.filter(w => w.purchase_price).reduce((s, w) => s + (w.purchase_price || 0), 0).toFixed(2)}€</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#5a7a58' }}>
                          Myyty yhteensä: <strong>{archivedWardrobe.filter(w => w.selling_price).reduce((s, w) => s + (w.selling_price || 0), 0).toFixed(2)}€</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MEASUREMENTS ── */}
        {tab === 'measurements' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18', margin: 0 }}>📏 Mitat</h2>
              <button onClick={() => setAddingMeasurement(true)} style={{ padding: '8px 14px', borderRadius: 20, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                + Lisää mittaus
              </button>
            </div>

            {addingMeasurement && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Uusi mittaus</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>PÄIVÄMÄÄRÄ</label>
                    <input type="date" style={inputStyle} value={newM.date} onChange={e => setNewM(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>PITUUS (cm)</label>
                      <input type="number" style={inputStyle} value={newM.height} onChange={e => setNewM(p => ({ ...p, height: e.target.value }))} placeholder="68" />
                    </div>
                    <div>
                      <label style={labelStyle}>PAINO (kg)</label>
                      <input type="number" step="0.1" style={inputStyle} value={newM.weight} onChange={e => setNewM(p => ({ ...p, weight: e.target.value }))} placeholder="7.5" />
                    </div>
                    <div>
                      <label style={labelStyle}>PÄÄNYMPÄRYS (cm)</label>
                      <input type="number" style={inputStyle} value={newM.headCirc} onChange={e => setNewM(p => ({ ...p, headCirc: e.target.value }))} placeholder="42" />
                    </div>
                    <div>
                      <label style={labelStyle}>JALAN PITUUS (cm)</label>
                      <input type="number" step="0.5" style={inputStyle} value={newM.footLength} onChange={e => setNewM(p => ({ ...p, footLength: e.target.value }))} placeholder="11.5" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveMeasurement} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Tallennetaan...' : 'Tallenna'}
                    </button>
                    <button onClick={() => setAddingMeasurement(false)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              </div>
            )}

            <GrowthChart measurements={measurements} dateOfBirth={child.date_of_birth} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {measurements.map((m, i) => (
                <div key={m.id} style={{ background: 'white', border: '1.5px solid #e8f0e7', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#1a2e18', fontSize: 14 }}>
                      {new Date(m.measured_at).toLocaleDateString('fi-FI')}
                    </div>
                    {i === 0 && <span style={{ fontSize: 10, background: '#d4e6d1', color: '#2d5a27', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>VIIMEISIN</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {m.height_cm && <span style={{ fontSize: 13, color: '#5a7a58' }}>📏 {m.height_cm} cm</span>}
                    {m.weight_kg && <span style={{ fontSize: 13, color: '#5a7a58' }}>⚖️ {m.weight_kg} kg</span>}
                    {m.head_circ_cm && <span style={{ fontSize: 13, color: '#5a7a58' }}>🧢 {m.head_circ_cm} cm</span>}
                    {m.foot_length_cm && <span style={{ fontSize: 13, color: '#5a7a58' }}>👟 {m.foot_length_cm} cm</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8f0e7', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 20px #0001' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 480 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
              flex: 1, padding: '12px 4px 10px', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              borderTop: tab === t.id ? '2.5px solid #2d5a27' : '2.5px solid transparent',
              fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? '#2d5a27' : '#9aaa98' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}