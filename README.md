# YALI AMS FRONTEND

Made by Ubunnifu Labs-Techinika Limited for YALI Rwanda Chapter.

## Performance Optimizations

### Organizations Page (/organizations)
- Replaced redundant `useState` + `useEffect` chains with direct `useMemo` for derived data (sectors, states, districts, countries, workingSectors, organizations)
- Removed unnecessary loading state in onClick handler
- Optimized data flow from RTK Query hooks to reduce re-render cycles

### MultiSelectSearch Component
- Memoized `selectedOptions` and `filteredOptions` with `useMemo` to prevent recalculation on every render
- Wrapped event handlers (`addValue`, `removeValue`, `handleInputChange`, `handleContainerClick`, `handleClickOutside`) with `useCallback` to maintain referential equality
- Optimized mousedown event handler cleanup with stable callback reference
