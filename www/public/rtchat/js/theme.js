const toggleThemeBtn = document.getElementById("toggle-theme");
const darkThemeIcon = document.getElementById("dark-theme-icon");
const lightThemeIcon = document.getElementById("light-theme-icon");

let currentTheme = localStorage.getItem("theme");
if (!currentTheme) {
  currentTheme = "light";
  localStorage.setItem("theme", currentTheme);
}
document.documentElement.setAttribute("data-bs-theme", currentTheme);

if (currentTheme === "dark") {
  lightThemeIcon.classList.remove("d-none");
} else {
  darkThemeIcon.classList.remove("d-none");
}

toggleThemeBtn.addEventListener("click", (e) => {
  // Update current to be opposite since we are toggling...
  const updated = localStorage.getItem("theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", updated);
  document.documentElement.setAttribute("data-bs-theme", updated);

  if (updated === "dark") {
    lightThemeIcon.classList.remove("d-none");
    darkThemeIcon.classList.add("d-none");
  } else {
    lightThemeIcon.classList.add("d-none");
    darkThemeIcon.classList.remove("d-none");
  }
});
