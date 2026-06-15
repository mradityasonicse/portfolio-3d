FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Install sqlite for debugging/verification if needed
RUN apk add --no-cache sqlite

# Copy the project files
COPY . .

# Compile the Java application using the libs on the classpath
RUN javac -cp "lib/*" Server.java

# Expose the server port (dynamic port will be read from environment variable PORT)
EXPOSE 3000

# Run the server using colon (:) as classpath separator for Linux
CMD ["java", "-cp", ".:lib/*", "Server"]
