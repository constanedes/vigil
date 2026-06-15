# ─── Vigil Core (Go) ─────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o vigil-core .

# Runtime
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /build/vigil-core .

# Create data directories
RUN mkdir -p /app/data /app/logs /app/data/screenshots

EXPOSE 8080

ENTRYPOINT ["./vigil-core"]
