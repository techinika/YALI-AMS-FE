"use client";

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Check, ChevronDown, X } from "lucide-react";

type Option = { id: string; name: string };

type ComboboxProps = {
  label: string;
  id?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
};

export const Combobox = React.memo(
  ({
    label,
    options,
    value,
    onChange,
    placeholder,
    required = false,
    error,
    helperText,
    disabled = false,
    searchable = true,
    clearable = true,
  }: ComboboxProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [highlightIdx, setHighlightIdx] = useState(-1);

    const selected = useMemo(
      () => options.find((o) => o.id === value),
      [options, value],
    );

    const filtered = useMemo(() => {
      if (!search || !searchable) return options;
      const q = search.toLowerCase();
      return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, search, searchable]);

    useEffect(() => {
      if (open) setHighlightIdx(-1);
    }, [open]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectOption = useCallback(
      (opt: Option) => {
        onChange(opt.id);
        setOpen(false);
        setSearch("");
        inputRef.current?.blur();
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!open) {
          if (e.key === "ArrowDown" || e.key === "Enter") {
            setOpen(true);
            e.preventDefault();
          }
          return;
        }
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
            break;
          case "ArrowUp":
            e.preventDefault();
            setHighlightIdx((i) => Math.max(i - 1, 0));
            break;
          case "Enter":
            e.preventDefault();
            if (highlightIdx >= 0 && filtered[highlightIdx]) {
              selectOption(filtered[highlightIdx]);
            }
            break;
          case "Escape":
            setOpen(false);
            setSearch("");
            break;
        }
      },
      [open, filtered, highlightIdx, selectOption],
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearch("");
        inputRef.current?.focus();
      },
      [onChange],
    );

    const handleContainerClick = useCallback(() => {
      if (!disabled) {
        setOpen((prev) => !prev);
        if (!open) inputRef.current?.focus();
      }
    }, [disabled, open]);

    return (
      <div className="flex flex-col w-full" ref={containerRef}>
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div
            className={`flex items-center border rounded-md px-3 py-2 cursor-pointer min-h-[42px] transition-colors
              ${error ? "border-red-500" : "border-gray-300"}
              ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-gray-400"}
            `}
            onClick={handleContainerClick}
          >
            {searchable && open ? (
              <input
                ref={inputRef}
                type="text"
                className="flex-1 outline-none bg-transparent text-sm min-w-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                autoFocus
              />
            ) : (
              <span
                className={`flex-1 text-sm truncate ${
                  selected ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {selected ? selected.name : placeholder || `Select ${label}`}
              </span>
            )}

            <div className="flex items-center gap-1 ml-1 shrink-0">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 rounded hover:bg-gray-200"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {open && !disabled && (
            <div
              ref={listRef}
              className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border bg-white shadow-lg"
              onKeyDown={handleKeyDown}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-sm text-gray-400 text-center">
                  No results found
                </div>
              ) : (
                filtered.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors
                      ${
                        idx === highlightIdx
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-100"
                      }
                      ${value === opt.id ? "font-medium" : ""}
                    `}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    <span className="flex-1 truncate">{opt.name}</span>
                    {value === opt.id && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={`text-xs mt-1 ${
              error ? "text-red-500" : "text-gray-500"
            }`}
          >
            {helperText}
          </p>
        )}
        {error && (
          <p className="text-xs mt-1 text-red-500">{error}</p>
        )}
      </div>
    );
  },
);
