type Props = {
  error?: string | null;
  ok?: string | null;
};
export default function Messages({ error, ok }: Props) {
  return (
    <>
      {error ? <div role="alert" className="error">{error}</div> : null}
      {ok ? <div role="status" className="success">{ok}</div> : null}
    </>
  );
}
