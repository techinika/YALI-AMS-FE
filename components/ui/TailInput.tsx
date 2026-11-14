import React from "react";

interface TailwindInputProps {
  id?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

export const TailwindInput = React.memo(
  ({
    id,
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    required = false,
    error,
    helperText,
    multiline = false,
    rows = 1,
    disabled = false,
  }: TailwindInputProps) => (
    <div className="flex flex-col w-full">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full p-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus:ring-primary focus:border-primary`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full p-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md focus:ring-primary focus:border-primary`}
        />
      )}
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

TailwindInput.displayName = "TailwindInput";
