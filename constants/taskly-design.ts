export const TasklyPalettes = {
  light: {
    ink: "#101215",
    graphite: "#252B31",
    slate: "#667085",
    muted: "#98A2B3",
    paper: "#F6F8F4",
    surface: "#FFFFFF",
    soft: "#EEF2EB",
    line: "#DDE5DA",
    blue: "#2F9BFF",
    blueDark: "#1167B8",
    mint: "#22C55E",
    mintSoft: "#DDFBEA",
    coral: "#F97316",
    coralSoft: "#FFE6D0",
    lilac: "#8B5CF6",
    danger: "#EF4444",
    navy: "#0D1821",
    inverseText: "#FFFFFF",
    input: "#EEF2EB",
    tabSurface: "#FFFFFF",
    tabActive: "#101215",
  },
  dark: {
    ink: "#F8FAFC",
    graphite: "#D9E2EC",
    slate: "#A8B3C2",
    muted: "#758195",
    paper: "#11151B",
    surface: "#1A2028",
    soft: "#242C35",
    line: "#33404D",
    blue: "#5CB6FF",
    blueDark: "#8DCEFF",
    mint: "#4ADE80",
    mintSoft: "#153527",
    coral: "#FB923C",
    coralSoft: "#3A2417",
    lilac: "#A78BFA",
    danger: "#F87171",
    navy: "#0B1017",
    inverseText: "#101215",
    input: "#222A33",
    tabSurface: "#1A2028",
    tabActive: "#F8FAFC",
  },
} as const;

export type TasklyThemeName = keyof typeof TasklyPalettes;
export type TasklyThemeColors = (typeof TasklyPalettes)[TasklyThemeName];

export const TasklyColors = TasklyPalettes.light;

export const TasklyShadows = {
  light: {
    card: "0 14px 32px rgba(16, 18, 21, 0.08)",
    elevated: "0 24px 60px rgba(16, 18, 21, 0.13)",
  },
  dark: {
    card: "0 14px 32px rgba(0, 0, 0, 0.28)",
    elevated: "0 24px 60px rgba(0, 0, 0, 0.38)",
  },
} as const;

export const TasklyShadow = TasklyShadows.light;

export const TasklyRadius = {
  sm: 10,
  md: 18,
  lg: 24,
  xl: 28,
  screen: 44,
};

const tabBarHeight = 74;
const tabBarBottomOffset = 24;
const floatingActionGap = 20;
const floatingActionSize = 72;
const floatingActionBottom = tabBarBottomOffset + tabBarHeight + floatingActionGap;
const bottomContentClearance = 220;

export const TasklyLayout = {
  tabBarHeight,
  tabBarBottomOffset,
  floatingActionGap,
  floatingActionSize,
  floatingActionBottom,
  tabBarClearance: bottomContentClearance,
  floatingActionClearance: bottomContentClearance,
  bottomContainerGap: 15,
};
