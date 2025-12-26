import React from "react";

export const TailwindSelect = React.memo(
  ({
    id,
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
    error,
    helperText,
    disabled = false,
  }: any) => (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full p-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white rounded-md focus:ring-primary focus:border-primary ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      >
        <option value="" disabled>
          {placeholder || `${label}`}
        </option>
        {options.map((option: any) => (
          <option
            key={option.id || option.name}
            value={option.id || option.name}
          >
            {option.name}
          </option>
        ))}
      </select>
      {helperText && (
        <p
          className={`text-xs mt-1 ${error ? "text-red-500" : "text-gray-500"}`}
        >
          {helperText}
        </p>
      )}
    </div>
  )
);
