# Tarantec: nginx sem root servindo a pasta site/.
FROM nginxinc/nginx-unprivileged:1.31.7-alpine

LABEL org.opencontainers.image.title="tarantec" \
      org.opencontainers.image.description="Portfólio do Tarantec (site estático)" \
      org.opencontainers.image.source="https://github.com/Agelinena/tarantec" \
      org.opencontainers.image.licenses="AGPL-3.0-only"

USER root
# Correções do Alpine que saíram depois da imagem base (o Trivy barra o build
# sem elas). A execução semanal do CI reconstrói sem cache para pegar as novas.
RUN apk upgrade --no-cache

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=root:root --chmod=644 site/ /usr/share/nginx/html/
# Pastas precisam de x para o nginx entrar nelas.
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
 && rm -f /usr/share/nginx/html/50x.html
USER 101

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/saude || exit 1
