# marketplaceIndexer/Dockerfile
FROM ghcr.io/joshstevens19/rindexer-bundled:latest

WORKDIR /app

# Put your config & ABIs where rindexer will look
COPY rindexer.yaml /app/rindexer.yaml
COPY abis /app/abis

# Render injects PORT; your YAML uses ${PORT}
EXPOSE 3001

# IMPORTANT: bundled image auto-reads ./rindexer.yaml — no --config flag
CMD ["start", "all"]
