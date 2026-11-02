# ---------------------------------------------------------------------------
# CareerCraft backend - production image (used by Render / Railway)
#
#   docker build -t careercraft-backend .
#   docker run -p 8080:8080 --env-file .env careercraft-backend
#
# Stage 1 builds the jar with Maven; stage 2 runs it on a small JRE image as a
# non-root user. No secrets are baked in: everything comes from environment
# variables at runtime.
# ---------------------------------------------------------------------------

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Download dependencies first (cached unless pom.xml changes)
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests run in CI (GitHub Actions); skip them here to keep deploys fast
RUN mvn -B -q package -DskipTests && cp target/careercraft-backend-*.jar app.jar

# ---------- Stage 2: run ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Run as an unprivileged user
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build /app/app.jar app.jar
USER app

# Render/Railway pass the port in $PORT (application.yml reads it; 8080 locally)
EXPOSE 8080

# Use up to 75% of the container's memory for the heap
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
