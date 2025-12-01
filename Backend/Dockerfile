# Build stage
FROM maven:3.9.5-eclipse-temurin-17 AS builder
 
WORKDIR /app
COPY . .
 
ENTRYPOINT ["mvn"]
CMD ["clean", "package", "-DskipTests"]
 
# Run stage
FROM eclipse-temurin:17-jdk
 
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
 
EXPOSE 8080
 
ENTRYPOINT ["java", "-jar", "app.jar"]
