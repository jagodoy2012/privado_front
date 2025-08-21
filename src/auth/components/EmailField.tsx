type Props = {
  value: string;
  onChange: (v: string) => void;
};
export default function EmailField({ value, onChange }: Props) {
  return (
    <div className="form-row">
      <label className="label" htmlFor="email">Correo</label>
      <input
        id="email"
        type="email"
        className="input"
        placeholder="nombre@correo.com"
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
