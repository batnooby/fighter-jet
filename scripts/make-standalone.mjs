import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const source = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const jsFile = source.match(/src="\.\/assets\/([^"]+\.js)"/)?.[1]
const cssFile = source.match(/href="\.\/assets\/([^"]+\.css)"/)?.[1]
if (!jsFile || !cssFile) throw new Error('Could not locate built JS/CSS assets')

const js = fs.readFileSync(path.join(dist, 'assets', jsFile), 'utf8')
const css = fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8')

const favicon = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23050b14'/%3E%3Cpath d='M32 7 L38 24 L56 40 L52 46 L34 38 L34 51 L30 51 L30 38 L12 46 L8 40 L26 24 Z' fill='%235ed6c7'/%3E%3C/svg%3E" />`

let html = source
  .replace(/<script type="module"[^>]*src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/, `<script type="module">\n${js}\n</script>`)
  .replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]+\.css"[^>]*>/, `<style>\n${css}\n</style>`)
  .replace(/<link rel="icon"[^>]*>/, favicon)

for (const target of [path.join(dist, 'skyfall-standalone.html'), path.join(root, 'skyfall-standalone.html')]) {
  fs.writeFileSync(target, html, 'utf8')
  console.log(`Created ${path.relative(root, target)}`)
}
