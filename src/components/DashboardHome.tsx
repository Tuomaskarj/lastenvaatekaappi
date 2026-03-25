'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Child = {
  id: string
  name: string
  date_of_birth: string | null
  is_expected: boolean
}

type Wardrobe = {
  id: string
  name: string
  description: string | null
  wardrobe_children: { child_id: string }[]
}

export default function DashboardHome({
  user,
  initialChildren,
  initialWardrobes,
}: {
  user: { id: string; email?: string }
  initialChildren: Child[]
  initialWardrobes: Wardrobe[]
}) {
  const [children, setChildren] = useState(initialChildren)
  const [wardrobes, setWardrobes] = useState(initialWardrobes)
  const [tab, setTab] = useState<'children' | 'wardrobes'>('children')
  const [addingChild, setAddingChild] = useState(false)
  const [addingWardrobe, setAddingWardrobe] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', dob: '', isExpected: false })
  const [newWardrobe, setNewWardrobe] = useState({ name: '', description: '', childIds: [] as string[] })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addChild = async () => {
    if (!newChild.name.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('children')
      .insert({
        name: newChild.name,
        date_of_birth: newChild.dob || null,
        is_expected: newChild.isExpected,
        user_id: user.id,
      })
      .select()
      .single()
    if (!error && data) {
      setChildren(prev => [...prev, data])
      setNewChild({ name: '', dob: '', isExpected: false })
      setAddingChild(false)
    }
    setLoading(false)
  }

  const addWardrobe = async () => {
    if (!newWardrobe.name.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('wardrobes')
      .insert({ name: newWardrobe.name, description: newWardrobe.description || null, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      // Linkitetään lapset
      if (newWardrobe.childIds.length > 0) {
        await supabase.from('wardrobe_children').insert(
          newWardrobe.childIds.map(childId => ({ wardrobe_id: data.id, child_id: childId }))
        )
      }
      setWardrobes(prev => [...prev, { ...data, wardrobe_children: newWardrobe.childIds.map(id => ({ child_id: id })) }])
      setNewWardrobe({ name: '', description: '', childIds: [] })
      setAddingWardrobe(false)
    }
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>🌱 Lastenvaatekaappi</div>
            <div style={{ fontSize: 12, color: '#a8d8a4' }}>{user.email}</div>
          </div>
          <button onClick={signOut} style={{
            background: '#ffffff20', border: 'none', borderRadius: 20,
            padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          }}>
            Kirjaudu ulos
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 40px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'children', label: '👶 Lapset', count: children.length },
            { id: 'wardrobes', label: '👗 Kaapit', count: wardrobes.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
              flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid',
              borderColor: tab === t.id ? '#2d5a27' : '#e8f0e7',
              background: tab === t.id ? '#2d5a27' : 'white',
              color: tab === t.id ? 'white' : '#5a7a58',
              fontWeight: 800, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
            }}>
              {t.label} {t.count > 0 && <span style={{ opacity: 0.7, fontSize: 12 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* ── LAPSET ── */}
        {tab === 'children' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18', margin: 0 }}>Lapset</h2>
              <button onClick={() => setAddingChild(true)} style={{
                padding: '8px 16px', borderRadius: 20, background: '#2d5a27', color: 'white',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}>+ Lisää lapsi</button>
            </div>

            {addingChild && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Uusi lapsi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>NIMI</label>
                    <input style={inputStyle} value={newChild.name} onChange={e => setNewChild(p => ({ ...p, name: e.target.value }))} placeholder="esim. Aino" />
                  </div>
                  <div>
                    <label style={labelStyle}>SYNTYMÄPÄIVÄ / LASKETTU AIKA</label>
                    <input type="date" style={inputStyle} value={newChild.dob} onChange={e => setNewChild(p => ({ ...p, dob: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="expected" checked={newChild.isExpected} onChange={e => setNewChild(p => ({ ...p, isExpected: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2d5a27' }} />
                    <label htmlFor="expected" style={{ fontSize: 13, color: '#5a7a58', cursor: 'pointer' }}>Lapsi ei ole vielä syntynyt</label>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addChild} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Tallennetaan...' : 'Tallenna'}
                    </button>
                    <button onClick={() => setAddingChild(false)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {children.length === 0 && !addingChild && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Ei lapsia vielä</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {children.map(child => {
                const childWardrobes = wardrobes.filter(w => w.wardrobe_children.some(wc => wc.child_id === child.id))
                return (
                  <button key={child.id} onClick={() => router.push(`/dashboard/${child.id}`)} style={{
                    background: 'white', borderRadius: 16, padding: '16px 20px',
                    border: '1.5px solid #e8f0e7', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 1px 6px #0001', fontFamily: 'inherit',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>👶</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2e18' }}>{child.name}</div>
                        <div style={{ fontSize: 12, color: '#7a9a78' }}>
                          {child.is_expected ? '🤰 Odotetaan' : child.date_of_birth ? `Syntynyt ${new Date(child.date_of_birth).toLocaleDateString('fi-FI')}` : 'Ei syntymäpäivää'}
                        </div>
                        {childWardrobes.length > 0 && (
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                            {childWardrobes.map(w => w.name).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#aaa', fontSize: 20 }}>›</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── KAAPIT ── */}
        {tab === 'wardrobes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18', margin: 0 }}>Kaapit</h2>
              <button onClick={() => setAddingWardrobe(true)} style={{
                padding: '8px 16px', borderRadius: 20, background: '#2d5a27', color: 'white',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}>+ Lisää kaappi</button>
            </div>

            {addingWardrobe && (
              <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Uusi kaappi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>NIMI</label>
                    <input style={inputStyle} value={newWardrobe.name} onChange={e => setNewWardrobe(p => ({ ...p, name: e.target.value }))} placeholder="esim. Kotikaappi" />
                  </div>
                  <div>
                    <label style={labelStyle}>KUVAUS (vapaaehtoinen)</label>
                    <input style={inputStyle} value={newWardrobe.description} onChange={e => setNewWardrobe(p => ({ ...p, description: e.target.value }))} placeholder="esim. Arkivaatteet kotiin" />
                  </div>
                  {children.length > 0 && (
                    <div>
                      <label style={labelStyle}>LAPSET (valitse ketkä käyttävät tätä kaappia)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {children.map(child => (
                          <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              id={`child-${child.id}`}
                              checked={newWardrobe.childIds.includes(child.id)}
                              onChange={e => setNewWardrobe(p => ({
                                ...p,
                                childIds: e.target.checked
                                  ? [...p.childIds, child.id]
                                  : p.childIds.filter(id => id !== child.id)
                              }))}
                              style={{ width: 16, height: 16, accentColor: '#2d5a27' }}
                            />
                            <label htmlFor={`child-${child.id}`} style={{ fontSize: 14, color: '#1a2e18', cursor: 'pointer' }}>
                              👶 {child.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addWardrobe} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      {loading ? 'Tallennetaan...' : 'Tallenna'}
                    </button>
                    <button onClick={() => setAddingWardrobe(false)} style={{ padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888', border: '1.5px solid #ddd', cursor: 'pointer' }}>
                      Peruuta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wardrobes.length === 0 && !addingWardrobe && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>👗</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Ei kaappeja vielä</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Luo ensimmäinen kaappi yllä olevasta napista</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wardrobes.map(wardrobe => {
                const wardrobeChildren = children.filter(c => wardrobe.wardrobe_children.some(wc => wc.child_id === c.id))
                return (
                  <button key={wardrobe.id} onClick={() => router.push(`/wardrobe/${wardrobe.id}`)} style={{
                    background: 'white', borderRadius: 16, padding: '16px 20px',
                    border: '1.5px solid #e8f0e7', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 1px 6px #0001', fontFamily: 'inherit',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>👗</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2e18' }}>{wardrobe.name}</div>
                        {wardrobe.description && <div style={{ fontSize: 12, color: '#7a9a78' }}>{wardrobe.description}</div>}
                        {wardrobeChildren.length > 0 && (
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                            {wardrobeChildren.map(c => c.name).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#aaa', fontSize: 20 }}>›</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}