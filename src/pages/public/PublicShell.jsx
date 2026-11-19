export default function PublicShell({ title, text, children }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-8" style={{ background: 'radial-gradient(ellipse at 50% 15%,#0b1426 0,#050914 70%)' }}>
      <div className="w-full max-w-sm text-center">
        <img src="/favicon.svg" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mb-1 mt-4 text-2xl font-bold">Gym<span className="text-amber-400">xio</span></h1>
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mb-5 mt-1 text-gx-mut">{text}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
