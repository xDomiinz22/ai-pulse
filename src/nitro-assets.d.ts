// Ambient types for Nitro's Vite asset-manifest virtual imports
// (`?assets=client` / `?assets=ssr`), used in src/entry-server.tsx to collect
// the built CSS/JS for each environment and inject them into the SSR HTML.
interface NitroAssetAttr {
  href: string
  [key: string]: string
}

interface NitroAssets {
  css: NitroAssetAttr[]
  js: NitroAssetAttr[]
  entry: string
  merge(other: NitroAssets): NitroAssets
}

declare module '*?assets=client' {
  const assets: NitroAssets
  export default assets
}

declare module '*?assets=ssr' {
  const assets: NitroAssets
  export default assets
}
