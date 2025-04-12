# --- Build Stage ---
    FROM golang:1.21-alpine AS builder

    WORKDIR /app
    
    ENV GO111MODULE=on
    
    COPY go.mod go.sum ./
    RUN go mod download
    
    COPY . .
    
    RUN go build -o app .
    
    # --- Run Stage ---
    FROM alpine:latest
    
    RUN apk --no-cache add ca-certificates
    
    WORKDIR /root/
    
    COPY --from=builder /app/app .
    
    CMD ["./app"]
    