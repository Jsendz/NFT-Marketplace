FROM ghcr.io/joshstevens19/rindexer-bundled

WORKDIR /app

# Copy your rindexer.yaml and ABI
COPY rindexer.yaml /app/rindexer.yaml
COPY abis /app/abis

EXPOSE 3001

CMD ["start", "all", "--config", "/app/rindexer.yaml"]
