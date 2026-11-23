// Roda no <head>, antes de pintar a página: aplica o tema salvo sem piscar.
// Escuro é o padrão; o claro só vale se a pessoa escolheu no botão.
(function () {
  try {
    if (localStorage.getItem("tema") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) { /* sem localStorage: fica o escuro */ }
})();
