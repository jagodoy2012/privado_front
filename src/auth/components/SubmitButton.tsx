type Props = { loading: boolean; };
export default function SubmitButton({ loading }: Props) {
  return (
    <button className="btn" type="submit" disabled={loading}>
      {loading ? 'Ingresando…' : 'Ingresar'}
    </button>
  );
}
