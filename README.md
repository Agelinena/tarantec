<div align="center">

<img src="site/img/favicon.svg" alt="Bitsy" width="88">

# Tarantec

**O meu portfólio: Blue Team, SOC e homelab.**
Um site estático, sem framework, publicado do meu próprio servidor por um pipeline de CI/CD.

[![Pipeline Tarantec](https://github.com/Agelinena/tarantec/actions/workflows/ci.yml/badge.svg)](https://github.com/Agelinena/tarantec/actions/workflows/ci.yml)

</div>

## O que tem aqui

```
site/                 o site (é só isto que vai para a imagem)
  index.html          a página
  404.html
  css/style.css       tema escuro (padrão) e claro, animações
  js/tema.js          aplica o tema salvo antes de pintar a página
  js/main.js          teia que vibra, SOC ao vivo, contadores, adesivos
  fonts/              Poppins e JetBrains Mono (OFL), servidas daqui
  img/                Bitsy e favicon
nginx/default.conf    nginx: só GET/HEAD, CSP e cabeçalhos de segurança
Dockerfile            nginx sem root + site/
docker-compose.yml    sobe a imagem pronta do GHCR
.github/workflows/    o pipeline
```

Nada de script, estilo ou fonte de terceiros: a CSP é `default-src 'none'` com `'self'` só onde precisa. O visitante não faz nenhum pedido para fora do site.

## Ver localmente

Sem Docker, qualquer servidor estático serve:

```bash
cd site && python -m http.server 8000
# http://localhost:8000
```

Com Docker, igual ao servidor (o compose usa a imagem do GHCR; para testar mudanças, construa com a mesma tag):

```bash
cp .env.example .env
docker build -t ghcr.io/agelinena/tarantec:latest .
docker compose up -d          # http://localhost:8080
```

## Pipeline

```
git push ─▶ GitHub Actions ─▶ GHCR ◀── servidor confere a cada 5 min ─▶ site no ar
```

| Job | O que faz |
|---|---|
| 🔧 **Setup** | Checkout e lista os arquivos do site |
| ✅ **Validação** | `index.html` existe; nada inline (a CSP bloquearia); HTML válido (`html-validate`); links e âncoras internos (`lychee`) |
| 🏗️ **Build** | Cria a imagem, sobe o container como no servidor (só leitura, sem capabilities) e testa: 200, 404, 405 no POST, CSP, `.env` escondido, sem root. Depois, Trivy (CRITICAL/HIGH). Na `main`, publica `latest` e `sha-<commit>` no GHCR |
| 🚀 **Deploy** | Registra no resumo da execução a imagem publicada |

Em pull request o pipeline vai até o Build, sem publicar. Toda segunda ele também roda sozinho e reconstrói a imagem sem cache: o `apk upgrade` do Dockerfile traz as correções do Alpine da semana, e o servidor puxa a imagem nova.

**Por que o servidor puxa, em vez de o GitHub empurrar:** para empurrar, o GitHub precisaria de uma chave e de um caminho até o servidor. Puxando, o servidor só faz uma saída para o GHCR, e um vazamento no GitHub não abre nada em casa. O pior que uma imagem ruim faz é trocar o site, num container só leitura, sem root e numa rede sem saída.

**Fixar uma versão:** `TARANTEC_TAG=sha-abc1234` no `.env` do servidor; volte para `latest` para seguir a `main`.

### Conceitos (lab de CI/CD)

| Conceito | Onde aparece |
|---|---|
| CI | GitHub Actions: validação, build e testes a cada push |
| CD | Imagem no GHCR e servidor que se atualiza sozinho |
| Pipeline | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| Stage | Os jobs `setup`, `validacao`, `build` e `deploy` |
| Dependência | `needs:` entre os jobs |
| Artefato | A imagem `ghcr.io/agelinena/tarantec` |

## Licença

O código (HTML, CSS, JS, configurações) é [AGPL-3.0](LICENSE). Os textos, o nome Tarantec e o Bitsy são meus: peça antes de reaproveitar. As fontes são OFL (licenças em `site/fonts/`).
