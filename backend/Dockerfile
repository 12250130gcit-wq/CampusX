FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /campusx-api .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /campusx-api /app/campusx-api
COPY schema.sql /app/schema.sql
EXPOSE 8080
CMD ["/app/campusx-api"]
