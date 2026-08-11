import type { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { toPng } from 'html-to-image'

interface CapturedPage {
  dataUrl: string
  width: number
  height: number
}

/**
 * Monta `node` fuera de pantalla (position:fixed en 0,0 con opacity:0, no
 * display:none/visibility:hidden) para que las imagenes de los escudos
 * carguen normal y el layout tenga dimensiones reales, lo rasteriza con
 * html-to-image y desmonta. Ancho fijo, alto segun el contenido — cada
 * pagina termina con las proporciones que le pida su contenido real en vez
 * de recortar o dejar espacio en blanco forzando un tamaño de pagina fijo.
 */
async function captureElement(node: ReactElement, widthPx: number): Promise<CapturedPage> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = `${widthPx}px`
  container.style.opacity = '0'
  container.style.zIndex = '-1'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(node)
  // Deja que React monte, las imagenes arranquen la carga y el navegador pinte.
  await new Promise((resolve) => setTimeout(resolve, 80))

  try {
    const height = Math.ceil(container.getBoundingClientRect().height)
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      backgroundColor: '#0b0f14',
      width: widthPx,
      height,
    })
    return { dataUrl, width: widthPx, height }
  } finally {
    root.unmount()
    container.remove()
  }
}

export async function downloadElementAsPng(node: ReactElement, widthPx: number, fileName: string): Promise<void> {
  const { dataUrl } = await captureElement(node, widthPx)
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

export interface PdfPageSpec {
  node: ReactElement
  widthPx: number
}

/** Una imagen capturada por pagina, agregada a un PDF con el tamaño de pagina ajustado a esa imagen (ver captureElement). */
export async function downloadPagesAsPdf(pages: PdfPageSpec[], fileName: string): Promise<void> {
  if (pages.length === 0) return
  const { jsPDF } = await import('jspdf')
  let doc: InstanceType<typeof jsPDF> | null = null

  for (const page of pages) {
    const { dataUrl, width, height } = await captureElement(page.node, page.widthPx)
    if (!doc) {
      doc = new jsPDF({ unit: 'px', hotfixes: ['px_scaling'], format: [width, height] })
    } else {
      doc.addPage([width, height])
    }
    doc.addImage(dataUrl, 'PNG', 0, 0, width, height)
  }

  doc!.save(fileName)
}
