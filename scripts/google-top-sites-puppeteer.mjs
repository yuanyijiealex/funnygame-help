import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  const query = process.env.GOOGLE_QUERY || 'online games'
  const maxSites = parseInt(process.env.GOOGLE_MAX || '100', 10)
  const root = path.resolve(__dirname, '..')
  const sourcesDir = path.join(root, 'sources')
  const rawDir = path.join(sourcesDir, 'raw')
  fs.mkdirSync(rawDir, { recursive: true })
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const outCsv = path.join(sourcesDir, `google-top-sites-${date}.csv`)

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/puppeteer')
  const q = encodeURIComponent(query)
  let start = 0
  const sites = new Map()
  while (sites.size < maxSites && start < 200) {
    const url = `https://www.google.com/search?q=${q}&hl=en&num=10&start=${start}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    const html = await page.content()
    fs.writeFileSync(path.join(rawDir, `google-${query.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-${start}.html`), html)
    const links = await page.$$eval('a', as => as.map(a => a.href).filter(Boolean))
    for (const l of links) {
      try {
        const u = new URL(l)
        if (u.hostname.endsWith('google.com')) continue
        const key = u.hostname.toLowerCase()
        if (!sites.has(key)) sites.set(key, `${u.protocol}//${u.host}`)
        if (sites.size >= maxSites) break
      } catch {}
    }
    start += 10
  }
  const rows = Array.from(sites.entries()).slice(0, maxSites).map(([, url], i) => ({ rank: i+1, domain: new URL(url).hostname, url, source: 'google', query }))
  const header = 'rank,domain,url,source,query\n'
  const body = rows.map(r => `${r.rank},${r.domain},${r.url},${r.source},${JSON.stringify(r.query).slice(1,-1)}`).join('\n')
  fs.writeFileSync(outCsv, header + body)
  await browser.close()
  console.log(`Saved: ${outCsv} (${rows.length} sites)`) 
}

run().catch(err => { console.error(err); process.exit(1) })

