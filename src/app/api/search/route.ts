import { NextRequest, NextResponse } from 'next/server'

const CATEGORY_QUERIES: Record<string, string> = {
  'Body': 'vauvan body',
  'Romppari': 'lasten romppari haalari',
  'Paita': 'lasten paita pusero',
  'Housut': 'lasten housut',
  'Takki/haalarit': 'lasten talvihaalari takki',
  'Unipuku': 'vauvan unipussi unipuku',
  'Sukat': 'lasten sukat',
  'Kengät': 'lasten kengät',
  'Pipo/hattu': 'lasten pipo hattu',
  'Lapaset': 'lasten lapaset hanskat',
  'Mekko/hame': 'lasten mekko hame',
  'Uima-asu': 'lasten uimapuku',
}

export async function POST(request: NextRequest) {
  try {
    const { query, size, needed } = await request.json()

    // Käytetään parempaa hakusanaa jos löytyy
    const betterQuery = CATEGORY_QUERIES[query.replace(' lapsi', '')] || query

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Olet lastenvaatteiden asiantuntija. Etsi netistä parhaita tuotteita suomalaisista tai pohjoismaisista verkkokaupoista (Reima, Didriksons, Lindex, H&M, Zalando, CDON, Kidsbrandstore, Name It, Polarn O. Pyret, Kärkkäinen, Stockmann).
Palauta VAIN JSON-taulukko muodossa:
[{"name":"tuotteen nimi","brand":"merkki","price":"hinta €","store":"kauppa","url":"linkki","description":"lyhyt kuvaus max 10 sanaa"}]
Ei selityksiä, ei markdown, vain JSON-taulukko. Palauta 3-4 tuotetta.`,
        messages: [{ role: 'user', content: `Etsi: "${betterQuery}" koko ${size}. Tarvitaan ${needed} kpl. Etsi nimenomaan koko ${size} tuotteita.` }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', response.status, error)
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()

    let text = ''
    for (const block of data.content) {
      if (block.type === 'text') text += block.text
      if (block.type === 'tool_result') {
        for (const inner of (block.content || [])) {
          if (inner.type === 'text') text += inner.text
        }
      }
    }

    const clean = text.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    const results = match ? JSON.parse(match[0]) : []

    return NextResponse.json(results)

  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json([], { status: 200 })
  }
}