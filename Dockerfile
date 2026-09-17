FROM node:22-slim AS runtime
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3000
WORKDIR /app
COPY --chown=node:node .output/ .output/
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
