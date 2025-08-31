FROM ghcr.io/joshstevens19/rindexer:latest

USER root

# Install tools needed by rindexer's port-killer (works on Debian OR Alpine bases)
RUN (apt-get update && apt-get install -y --no-install-recommends lsof procps psmisc && rm -rf /var/lib/apt/lists/*) \
 || (apk update && apk add --no-cache lsof procps psmisc)

WORKDIR /app/project
COPY . .
ENV PROJECT_PATH=/app/project
# Render only needs an open port; setting PORT helps for clarity
ENV PORT=3001
EXPOSE 3001

CMD ["start", "all"]
