# marketplaceIndexer/Dockerfile
# Uses the official rindexer image that includes the indexer + GraphQL query layer
FROM ghcr.io/joshstevens19/rindexer-bundled:latest

# Work in /app (arbitrary)
WORKDIR /app

# Copy your config + ABIs exactly where rindexer will read them
COPY rindexer.yaml /app/rindexer.yaml
COPY abis /app/abis

# Render/Railway inject PORT; your rindexer.yaml should use ${PORT}
# (Expose is just documentation and not strictly required)
EXPOSE 3001

# Start the indexer + query layer using your config file
# If your image defaults to ./rindexer.yaml you could omit the --config
CMD ["start", "all", "--config", "/app/rindexer.yaml"]
