import { useContext } from "react";
import ThemeContext from "../theme/ThemeContext";

export default function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
