export const FilterDropdown = ({
  title,
  options,
  onChange,
  value,
}: {
  title: string;
  options: any[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  value: string;
}) => (
  <div className="flex flex-col flex-1">
    <label className="text-sm font-medium text-gray-600 mb-1">{title}</label>
    <select
      className="p-2 px-5 border border-blue-300 rounded focus:ring-primary focus:border-primary bg-white shadow-md"
      onChange={onChange}
      value={value}
    >
      <option value="">All {title}</option>
      {options.map((option) => (
        <option key={option?.id ?? option} value={option?.name ?? option}>
          {option?.name ?? option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  </div>
);
