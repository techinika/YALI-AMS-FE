"use client";

import { X, ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type Option = {
  id: string;
  name: string;
};

type Props = {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
};

export const MultiSelectSearch: React.FC<Props> = React.memo(
  ({
    label,
    options,
    value,
    onChange,
    placeholder = "Search and select...",
    disabled,
    error,
  }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedOptions = options.filter((o) => value.includes(o.id));

    const filteredOptions = options
      ? options.filter(
          (o) =>
            o?.name.toLowerCase().includes(search.toLowerCase()) &&
            !value.includes(o.id)
        )
      : [];

    const addValue = (val: string) => {
      onChange([...value, val]);
      setSearch("");
    };

    const removeValue = (val: string) => {
      onChange(value.filter((v) => v !== val));
    };

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium mb-1">{label}</label>
        )}

        <div
          className={`relative border rounded-lg px-3 py-2 min-h-11 flex flex-wrap gap-2 items-center cursor-text
          ${error ? "border-red-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
        `}
          onClick={() => !disabled && setOpen(true)}
        >
          {/* Chips */}
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
            >
              {opt.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(opt.id);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 outline-none bg-transparent text-sm min-w-30"
          />

          <ChevronDown size={16} className="text-gray-400" />
        </div>

        {/* Dropdown */}
        {open && !disabled && filteredOptions.length > 0 && (
          <div className="mt-1 max-h-32 overflow-auto rounded-lg border bg-white shadow-sm z-20">
            {filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => addValue(opt.id)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              >
                {opt.name}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
