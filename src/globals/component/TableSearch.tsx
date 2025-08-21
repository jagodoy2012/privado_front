type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};
export default function TableSearch({ value, onChange, placeholder }: Props) {
  return (
    <input
      className="input search"
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Buscar...'}
    />
  );
}
