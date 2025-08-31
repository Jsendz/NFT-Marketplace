FROM ghcr.io/joshstevens19/rindexer:latest
WORKDIR /app/project
COPY . .
# rindexer uses DATABASE_URL and PROJECT_PATH
ENV PROJECT_PATH=/app/project
EXPOSE 3001
CMD ["start", "all"]
