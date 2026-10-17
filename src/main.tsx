import { render } from "@gpuix/react";
import { AdwaitaContext } from "adwaita-gpuix";
import { keyHandler } from "./keybus";
import { App } from "./app";
import { loadConfig } from "./config";
import { adwaitaTheme } from "./theme";

const config = loadConfig();

render(
  <AdwaitaContext.Provider value={adwaitaTheme}>
    <App config={config} />
  </AdwaitaContext.Provider>,
  {
    title: "Projects",
    width: 1280,
    height: 800,
    focus: process.env.GPUIX_BACKGROUND !== "1",
    onKeyDown: (e) => {
      const ev = {
        key: e.key ?? "",
        keyChar: e.keyChar,
        isHeld: e.isHeld,
        modifiers: e.modifiers,
      };
      keyHandler.current?.(ev);
    },
  },
);
