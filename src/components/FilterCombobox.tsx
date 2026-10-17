import { useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  useAdwaita,
} from "adwaita-gpuix";
import { ComboboxInput as ComboboxField } from "@gpuix/react/combobox";
import { useGpuix, useWindowSize, type PublicInstance } from "@gpuix/react";
import type { EventPayload } from "@gpuix/native";
import type { ProjectMeta } from "../repos";
import { keyHandler, keyOf } from "../keybus";
import { LanguagePill } from "./LanguagePill";

const SUGGESTION_LIMIT = 8;

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
  const { width: windowWidth } = useWindowSize();

  const suppressClearRef = useRef(false);

  const filterInputRef = useRef<PublicInstance | null>(null);
  const boxRef = useRef<PublicInstance | null>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);

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
  }, [renderer]);

  const handleLangChange = (value: string | string[] | null) => {
    suppressClearRef.current = true;
    const next = Array.isArray(value) ? value : value ? [value] : [];
    onLanguagesChange(next);
    onFilterChange("");
    onOpenChange?.(false);
  };

  const handleInputChange = (value: string) => {
    if (value === "" && suppressClearRef.current) {
      suppressClearRef.current = false;
      return;
    }
    suppressClearRef.current = false;
    onFilterChange(value);
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

  const effectiveOpen = (open ?? false) && filter.trim().length > 1;
  const dropdownVisible = effectiveOpen && suggestions.length > 0;

  useEffect(() => {
    onVisibleChange?.(dropdownVisible);
  }, [dropdownVisible, onVisibleChange]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const measure = () => {
      const bounds = renderer?.getElementBounds?.(el.id);
      if (bounds && bounds.width > 0) {
        setBoxWidth(bounds.width - 16);
        return;
      }
      if (++tries < 25) timer = setTimeout(measure, 100);
    };
    timer = setTimeout(measure, 0);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [renderer, windowWidth]);

  return (
    <div style={{ padding: 8, paddingBottom: 8 }} ref={boxRef}>
      <Combobox
        items={allLanguages}
        multiple
        value={languages}
        onValueChange={handleLangChange}
        inputValue={filter}
        onInputValueChange={handleInputChange}
        open={effectiveOpen}
        onOpenChange={onOpenChange}
        autoHighlight
        style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        {}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
            minHeight: 34,
            padding: 4,
            paddingLeft: 6,
            paddingRight: 8,
            width: "100%",
          }}
        >
          {languages.map((lang) => (
            <LanguagePill
              key={lang}
              name={lang}
              onRemove={() =>
                onLanguagesChange(languages.filter((l) => l !== lang))
              }
            />
          ))}
          <ComboboxField
            ref={filterInputRef}
            onKeyUp={handleInputKeyUp}
            placeholder="Filter projects…"
            theme={{ text: colors.fg, textMuted: colors.dim_fg }}
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
        </div>
        {}
        {suggestions.length > 0 ? (
          <ComboboxContent
            style={{
              width: boxWidth ?? undefined,
              maxHeight: 320,
            }}
          >
            <ComboboxList>
              {suggestions.map((l) => (
                <ComboboxItem key={l} value={l}>
                  {l}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        ) : null}
      </Combobox>
    </div>
  );
}
