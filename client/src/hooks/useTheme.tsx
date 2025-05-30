import { useContext } from "react";
import ThemeContext from "../theme/ThemeContext";
import { ThemeContextValue } from "@client/types";

export default function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
