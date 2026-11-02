export default function Field({ label, ...props }) {
  return (
    <>
      <label className="lbl">{label}</label>
      <input className="inp" {...props} />
    </>
  )
}
