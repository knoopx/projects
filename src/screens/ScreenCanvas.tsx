import type { ReactNode } from "react";
import { adwaitaTheme } from "../theme";

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;

export function ScreenCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: adwaitaTheme.colors.window_bg,
      }}
    >
      {children}
    </div>
  );
}
