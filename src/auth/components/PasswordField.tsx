type Props = {
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggleShow: () => void;
};
export default function PasswordField({ value, show, onChange, onToggleShow }: Props) {
  return (
    <div className="form-row">
      <label className="label" htmlFor="pwd">Contraseña</label>
      <div className="input-group">
        <input
          id="pwd"
          type={show ? 'text' : 'password'}
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={onToggleShow}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}
