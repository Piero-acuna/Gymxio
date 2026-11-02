import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ToastProvider } from '../src/context/ToastContext'
import { AuthProvider } from '../src/context/AuthContext'
import AuthPage from '../src/pages/AuthPage'
import App from '../src/App'

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
})
