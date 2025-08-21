type Props = {
  remember: boolean;
  onToggle: (v: boolean) => void;
  onForgot?: () => void;
};
export default function RememberForgot({ remember, onToggle, onForgot }: Props) {
  return (
    <div className="row-between" style={{ marginTop: 8 }}>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => onToggle(e.target.checked)}
        />
        Recordarme
      </label>

      <a className="link" href="#" onClick={(e) => { e.preventDefault(); onForgot?.(); }}>
        ¿Olvidaste tu contraseña?
      </a>
    </div>
  );
}
