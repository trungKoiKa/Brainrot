"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchNodes } from "@/lib/graph-search";
import type { GraphNode } from "@/lib/graph-types";

const KIND_LABEL: Record<GraphNode["kind"], string> = {
  note: "Trang",
  task: "Task",
  field: "Lĩnh vực",
  project: "Dự án",
};

/**
 * Ô "Tìm trang" trên graph (SPEC-v0.2 4.3): combobox, ↑↓ chọn, Enter bay tới, Esc bỏ chọn, phím / để focus.
 */
export function GraphSearch({
  nodes,
  colorOf,
  selected,
  onSelect,
  onClear,
}: {
  nodes: readonly GraphNode[];
  colorOf: (n: GraphNode) => string;
  selected: GraphNode | null;
  onSelect: (n: GraphNode) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = searchNodes(nodes, query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function choose(n: GraphNode) {
    setQuery(n.label);
    setOpen(false);
    onSelect(n);
  }

  function clear() {
    setQuery("");
    setOpen(false);
    onClear();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      clear();
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      choose(results[active]);
    }
  }

  const showList = open && query.trim() !== "";

  return (
    <div className="pointer-events-auto relative w-72 max-w-full">
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Tìm trang trên Brain"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        value={query}
        placeholder="Tìm trang…  (/)"
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-line bg-surface/90 py-1.5 pl-3 pr-8 text-sm text-foreground outline-none backdrop-blur placeholder:text-muted-foreground focus:border-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {(query || selected) && (
        <button
          type="button"
          onClick={clear}
          aria-label="Bỏ tìm kiếm"
          className="absolute right-1.5 top-1/2 size-6 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-line bg-surface py-1 text-sm shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">Không có trang nào khớp.</li>
          ) : (
            results.map((n, i) => (
              <li
                key={n.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown thay vì click: chạy trước blur của ô nhập
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(n);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 ${i === active ? "bg-accent-soft" : ""}`}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(n) }} />
                <span className="min-w-0 flex-1 truncate">{n.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{KIND_LABEL[n.kind]}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
