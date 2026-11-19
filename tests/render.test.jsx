import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ToastProvider } from '../src/context/ToastContext'
import { AuthProvider } from '../src/context/AuthContext'
import AuthPage from '../src/pages/AuthPage'
import App from '../src/App'
import Legal from '../src/pages/public/Legal'
import Reclamos from '../src/pages/public/Reclamos'
import { DOCS } from '../src/legal/content'

const wrap = (el) => renderToString(<ToastProvider><AuthProvider>{el}</AuthProvider></ToastProvider>)

describe('render', () => {
  it('la pantalla de acceso muestra login y enlaces legales', () => {
    const html = wrap(<AuthPage />)
    expect(html).toContain('Iniciar Sesión')
    expect(html).toContain('Libro de Reclamaciones')
  })
  it('sin variables de entorno avisa que falta configurar', () => {
    expect(wrap(<App />)).toContain('Falta configurar')
  })
  it('los textos legales muestran los tres documentos', () => {
    const html = renderToString(<Legal />)
    for (const d of DOCS) expect(html).toContain(d.title)
    expect(html).toContain('Libro de Reclamaciones')
  })
  it('los textos legales no quedan con variables sin reemplazar', () => {
    expect(renderToString(<Legal />)).not.toContain('{{')
  })
  it('la página del libro de reclamaciones muestra el aviso', () => {
    globalThis.window = { location: { search: '' } } // el componente lee la URL; en el servidor de pruebas no hay navegador
    try { expect(renderToString(<Reclamos />)).toContain('LIBRO DE RECLAMACIONES') } finally { delete globalThis.window }
  })
})
