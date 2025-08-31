FROM ghcr.io/joshstevens19/rindexer:latest

USER root
# If this fails (alpine base), replace with:  RUN apk add --no-cache lsof
RUN apt-get update && apt-get install -y --no-install-recommends lsof && rm -rf /var/lib/apt/lists/*

WORKDIR /app/project
COPY . .
ENV PROJECT_PATH=/app/project
ENV PORT=3001
EXPOSE 3001

# Runs both the indexer and GraphQL server
CMD ["start", "all"]
