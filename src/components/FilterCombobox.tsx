import { useEffect, useMemo, useRef, useState } from "react";
import { Frame, Icon, T, useAdwaita } from "adwaita-gpuix";
import { useGpuix, type PublicInstance } from "@gpuix/react";
import type { EventPayload } from "@gpuix/native";
import type { ProjectMeta } from "../repos";
import { keyHandler, keyOf } from "../keybus";
import { LanguagePill } from "./LanguagePill";

const SUGGESTION_LIMIT = 8;
const PANEL_MAX_HEIGHT = 320;

const NAV_KEYS = new Set(["pageup", "pagedown", "home", "end"]);

export function useLanguageSuggestions(
  repoMeta: Record<string, ProjectMeta>,
  filter: string,
  open: boolean | undefined,
) {
  const allLanguages = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(repoMeta)
            .map((m) => m.language)
            .filter((l): l is string => l !== null),
        ),
      ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    [repoMeta],
  );

  const query = filter.trim().toLowerCase();
  const suggestions = (
    query === ""
      ? allLanguages
      : allLanguages.filter((l) => l.toLowerCase().includes(query))
  ).slice(0, SUGGESTION_LIMIT);

  return { allLanguages, suggestions };
}

export function FilterCombobox({
  filter,
  languages,
  onFilterChange,
  onLanguagesChange,
  open,
  onOpenChange,
  onVisibleChange,
  allLanguages,
  suggestions,
}: {
  filter: string;
  languages: string[];
  onFilterChange: (value: string) => void;
  onLanguagesChange: (languages: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  allLanguages: string[];
  suggestions: string[];
}) {
  const { colors } = useAdwaita();
  const { renderer } = useGpuix();

  const filterInputRef = useRef<PublicInstance | null>(null);

  
  
  const [activeIndex, setActiveIndex] = useState(0);

  const focusTriedRef = useRef(false);
  useEffect(() => {
    if (focusTriedRef.current) return;
    const el = filterInputRef.current;

    if (!el || !renderer) return;

    if (typeof renderer.focusElement !== "function") {
      throw new Error(
        "GpuixRenderer.focusElement is missing; cannot autofocus the filter input",
      );
    }
    focusTriedRef.current = true;
    renderer.focusElement(el.id);
    
    
    
    onOpenChange?.(true);
  }, [renderer, onOpenChange]);

  const effectiveOpen = (open ?? false) && filter.trim().length > 0;
  const dropdownVisible = effectiveOpen && suggestions.length > 0;

  
  
  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);
  useEffect(() => {
    if (dropdownVisible) setActiveIndex(0);
  }, [dropdownVisible]);

  useEffect(() => {
    onVisibleChange?.(dropdownVisible);
  }, [dropdownVisible, onVisibleChange]);

  const suggestionCount = suggestions.length;
  const activeRow =
    suggestionCount === 0 ? 0 : Math.min(activeIndex, suggestionCount - 1);

  const selectSuggestion = (language: string) => {
    onLanguagesChange(
      languages.includes(language) ? languages : [...languages, language],
    );
    onFilterChange("");
    onOpenChange?.(false);
  };

  const handleInputChange = (event: EventPayload) => {
    const value = event.value ?? "";
    onFilterChange(value);
    
    
    if (value.trim().length > 0) onOpenChange?.(true);
  };

  const handleInputSubmit = () => {
    
    
    if (dropdownVisible && suggestionCount > 0) {
      selectSuggestion(suggestions[activeRow]);
    }
  };

  const handleInputFocus = () => {
    onOpenChange?.(true);
  };

  const handleInputKeyDown = (event: EventPayload) => {
    const key = keyOf({ key: event.key ?? "" });
    if (key === "escape") {
      onOpenChange?.(false);
      return;
    }
    if (!dropdownVisible || suggestionCount === 0) return;
    if (key === "down") {
      setActiveIndex((i) => (i + 1) % suggestionCount);
    } else if (key === "up") {
      setActiveIndex((i) => (i - 1 + suggestionCount) % suggestionCount);
    }
  };

  const handleInputKeyUp = (event: EventPayload) => {
    if (event.key === "backspace" && filter === "" && languages.length > 0) {
      onLanguagesChange(languages.slice(0, -1));
      return;
    }
    const key = keyOf({ key: event.key ?? "" });
    if (NAV_KEYS.has(key)) {
      keyHandler.current?.({
        key,
        keyChar: event.keyChar,
        isHeld: event.isHeld,
        modifiers: event.modifiers,
      });
    }
  };

  return (
    <div style={{ padding: 8, paddingBottom: 8 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          minWidth: 0,
          width: "100%",
          gap: 8,
        }}
      >
        <Frame
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            minHeight: 36,
            padding: 8,
            paddingLeft: 10,
            width: "100%",
          }}
        >
          <Icon name="search" size={14} color={colors.dim_fg} />
          {languages.map((lang) => (
            <LanguagePill
              key={lang}
              name={lang}
              onRemove={() =>
                onLanguagesChange(languages.filter((l) => l !== lang))
              }
            />
          ))}
          <input
            ref={filterInputRef}
            value={filter}
            placeholder="Filter projects…"
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyUp={handleInputKeyUp}
            onKeyDown={handleInputKeyDown}
            onSubmit={handleInputSubmit}
            theme={{
              text: colors.fg,
              textMuted: colors.dim_fg,
              caret: colors.accent,
            }}
            style={{
              display: "flex",
              flexGrow: 1,
              flexBasis: 0,
              minWidth: 0,
              borderWidth: 0,
              backgroundColor: "transparent",
              color: colors.fg,
            }}
          />
        </Frame>
        {dropdownVisible ? (
          <Frame
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: 4,
              maxHeight: PANEL_MAX_HEIGHT,
              width: "100%",
            }}
          >
            {suggestions.map((l, i) => {
              const active = i === activeRow;
              return (
                <div
                  key={l}
                  onClick={() => selectSuggestion(l)}
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    height: 30,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: active ? colors.accentTint : "transparent",
                    cursor: "pointer",
                    hover: { backgroundColor: colors.accentTint },
                  }}
                >
                  <Icon
                    name={active ? "check" : "search"}
                    size={12}
                    color={active ? colors.accent : colors.dim_fg}
                    style={{ pointerEvents: "none" }}
                  />
                  <T
                    size="body"
                    color={active ? colors.accent : colors.fg}
                    style={{ pointerEvents: "none" }}
                  >
                    {l}
                  </T>
                </div>
              );
            })}
          </Frame>
        ) : null}
      </div>
    </div>
  );
}
