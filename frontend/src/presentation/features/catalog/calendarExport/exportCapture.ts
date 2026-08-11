import type { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { toJpeg, toPng } from 'html-to-image'

/**
 * Alto maximo defensivo por pagina capturada. Si algun layout se rompe y
 * termina midiendo miles de px de mas, esto evita generar un archivo de
 * cientos de MB en silencio — se recorta y se avisa por consola.
 */
const MAX_CAPTURE_HEIGHT_PX = 12000

interface CapturedPage {
  dataUrl: string
  width: number
  height: number
}

/**
 * Monta `node` fuera de pantalla y lo rasteriza con html-to-image, luego
 * desmonta. Ancho fijo, alto segun el contenido — cada pagina termina con
 * las proporciones que le pida su contenido real en vez de recortar o dejar
 * espacio en blanco forzando un tamaño de pagina fijo.
 *
 * Dos elementos, no uno: `wrapper` (fixed, fuera del viewport) es lo que
 * oculta esto del usuario, e `inner` (montado dentro, sin posicionamiento
 * propio) es lo unico que se le pasa a toPng/toJpeg. html-to-image clona el
 * nodo que se le pasa copiando tambien su PROPIO `getComputedStyle().cssText`
 * (no solo el de sus hijos — ver clone-node.js `cloneCSSStyle`), asi que si
 * se captura directamente el nodo con `position:fixed; left:-10000px` (o
 * antes, `opacity:0`), esa regla viaja intacta al clon rasterizado: o bien
 * el contenido sale invisible (opacity) o se posiciona fuera del lienzo que
 * se esta capturando (left negativo) — en ambos casos el resultado sale en
 * blanco, que es exactamente el bug que reporto el usuario. Ocultar en el
 * ancestro y capturar el descendiente evita que esa fuga de estilos
 * contamine el clon.
 */
async function captureElement(
  node: ReactElement,
  widthPx: number,
  format: 'png' | 'jpeg' = 'png',
): Promise<CapturedPage> {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.top = '0'
  wrapper.style.left = '-10000px'
  wrapper.style.pointerEvents = 'none'
  document.body.appendChild(wrapper)

  const inner = document.createElement('div')
  inner.style.width = `${widthPx}px`
  wrapper.appendChild(inner)

  const root = createRoot(inner)
  root.render(node)
  // Deja que React monte, las imagenes arranquen la carga y el navegador pinte.
  await new Promise((resolve) => setTimeout(resolve, 80))

  try {
    const measuredHeight = Math.ceil(inner.getBoundingClientRect().height)
    if (measuredHeight > MAX_CAPTURE_HEIGHT_PX) {
      console.warn(`[calendarExport] pagina de ${measuredHeight}px recortada a ${MAX_CAPTURE_HEIGHT_PX}px`)
    }
    const height = Math.max(1, Math.min(measuredHeight, MAX_CAPTURE_HEIGHT_PX))
    const capture = format === 'jpeg' ? toJpeg : toPng
    const dataUrl = await capture(inner, {
      pixelRatio: 1.5,
      backgroundColor: '#0b0f14',
      width: widthPx,
      height,
      quality: 0.92,
    })
    return { dataUrl, width: widthPx, height }
  } finally {
    root.unmount()
    wrapper.remove()
  }
}

export async function downloadElementAsPng(node: ReactElement, widthPx: number, fileName: string): Promise<void> {
  const { dataUrl } = await captureElement(node, widthPx, 'png')
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

export interface PdfPageSpec {
  node: ReactElement
  widthPx: number
}

/**
 * Una imagen capturada por pagina, agregada a un PDF con el tamaño de
 * pagina ajustado a esa imagen (ver captureElement). JPEG en vez de PNG:
 * con ~20 paginas el peso total del PDF importa mas que la perdida minima
 * de calidad en un fondo con gradiente + texto/logos.
 *
 * `orientation` se pasa explicito en cada pagina (constructor y addPage):
 * jsPDF asume "portrait" por default y, si no se le dice lo contrario,
 * intercambia width/height de `format` cada vez que width > height (ver
 * jspdf.js `_addPage`, case 'p': `if (width > height) format = [height,
 * width]`). Sin esto, una pagina mas ancha que alta (ej. Hall of Fame, un
 * solo partido) terminaba en una hoja angosta y muy alta con la imagen
 * recortada por la mitad y un espacio en blanco enorme abajo.
 */
export async function downloadPagesAsPdf(pages: PdfPageSpec[], fileName: string): Promise<void> {
  if (pages.length === 0) return
  const { jsPDF } = await import('jspdf')
  let doc: InstanceType<typeof jsPDF> | null = null

  for (const page of pages) {
    const { dataUrl, width, height } = await captureElement(page.node, page.widthPx, 'jpeg')
    const orientation = width > height ? 'l' : 'p'
    if (!doc) {
      doc = new jsPDF({ unit: 'px', hotfixes: ['px_scaling'], format: [width, height], orientation })
    } else {
      doc.addPage([width, height], orientation)
    }
    doc.addImage(dataUrl, 'JPEG', 0, 0, width, height)
  }

  doc!.save(fileName)
}
