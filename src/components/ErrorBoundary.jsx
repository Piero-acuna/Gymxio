import { Component } from 'react'

/** Evita la pantalla en blanco si algo falla al dibujar la app. */
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error(error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-md p-7 text-center">
          <h1 className="mb-2 text-xl font-bold">Algo salió mal</h1>
          <p className="text-gx-mut">Recarga la página. Si el problema continúa, escríbenos desde Panel &gt; Soporte.</p>
          <button className="btn btn-p mt-5" onClick={() => window.location.reload()}>Recargar</button>
        </div>
      </div>
    )
  }
}
