# Regras para conversas neste repositório

Fale sempre em português.

## Antes

- `git pull`. Se houver mudança local que não é sua, pare e pergunte.
- Este repositório é **público**: nada de domínio, IP ou segredo reais em código, docs ou exemplos (use `example.com`). O e-mail e o LinkedIn de contato no site são públicos de propósito.
- O que é do servidor (rota do proxy, redes externas, atualização automática) fica no repositório do servidor, num arquivo de ajuste por cima do `docker-compose.yml`.

## O site

- HTML, CSS e JS puros, sem framework e sem build. Só o que está em `site/` vai para a imagem.
- **Nada inline** (`<script>` sem `src`, `<style>`, `style=`, `onclick=`): a CSP do nginx bloqueia e o CI recusa. Estilo em `css/style.css`, comportamento em `js/main.js`.
- **Nada de terceiros** (CDN, Google Fonts, analytics): a CSP só permite `'self'`.
- Tema escuro é o padrão; toda cor nova vira variável no `:root` e no `:root[data-theme="light"]`.
- Toda animação nova respeita `prefers-reduced-motion`.
- Os textos falam do homelab de hoje: confira no repositório do servidor antes de afirmar uma ferramenta (o Wazuh, por exemplo, já saiu; o monitoramento é Grafana, Prometheus e Loki).

## Testes

- **Sem Docker:** `cd site && python -m http.server 8000` e abrir no navegador, nos dois temas e numa tela estreita.
- **Com Docker** (nunca num servidor de produção, o `container_name` seria o mesmo):
  ```bash
  docker build -t teste-tarantec .
  docker run --rm -d --name teste-tarantec --read-only --tmpfs /tmp --cap-drop ALL -p 18080:8080 teste-tarantec
  # http://localhost:18080 ; depois:
  docker rm -f teste-tarantec && docker rmi teste-tarantec
  ```
  Confira com `docker ps -a` que não sobrou nada `teste-*`.
- O CI repete tudo isso e mais (HTML válido, links, Trivy). Diga o que foi e o que não foi testado.

## Commits

- Só com autorização de quem pediu a mudança.
- E-mail pessoal, nunca o do trabalho: confira `git config user.email` contra `git log -3 --format=%ae`.
- Nunca `.env` nem chaves.
- Atualize o README no mesmo commit quando a mudança o deixar errado.
