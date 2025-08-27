// Alternância de Tema (Claro <-> Escuro)
document.getElementById("theme-toggle").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Aplicar Tema ao Carregar Página
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    // Se o tema foi salvo anteriormente
    document.body.classList.toggle("dark", savedTheme === "dark");
  } else {
    // Detectar preferência do sistema
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.body.classList.toggle("dark", prefersDark);
  }

  // Menu Responsivo (Mobile)
  const menuBtn = document.getElementById("menu-button");
  const menu = document.getElementById("menu");

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
});

// Validação do Formulário de Produtor
