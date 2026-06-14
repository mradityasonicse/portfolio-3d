@echo off
title Aditya Soni - Portfolio Backend Server Launcher
echo ====================================================================
echo             Aditya Soni - Portfolio Backend Launcher
echo ====================================================================
echo.

:: Ensure lib directory exists
if not exist lib (
    echo Creating lib folder for dependencies...
    mkdir lib
)

:: Download SQLite JDBC driver jar
if not exist lib\sqlite-jdbc-3.45.1.0.jar (
    echo SQLite JDBC Driver not found in lib/
    echo Downloading SQLite JDBC Driver v3.45.1.0...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/3.45.1.0/sqlite-jdbc-3.45.1.0.jar' -OutFile 'lib\sqlite-jdbc-3.45.1.0.jar'"
)

:: Download SLF4J API jar
if not exist lib\slf4j-api-1.7.36.jar (
    echo SLF4J API jar not found in lib/
    echo Downloading SLF4J API v1.7.36...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/slf4j/slf4j-api/1.7.36/slf4j-api-1.7.36.jar' -OutFile 'lib\slf4j-api-1.7.36.jar'"
)

:: Download SLF4J Simple logger jar
if not exist lib\slf4j-simple-1.7.36.jar (
    echo SLF4J Simple jar not found in lib/
    echo Downloading SLF4J Simple v1.7.36...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/slf4j/slf4j-simple/1.7.36/slf4j-simple-1.7.36.jar' -OutFile 'lib\slf4j-simple-1.7.36.jar'"
)

if not exist lib\sqlite-jdbc-3.45.1.0.jar (
    echo [Error] Failed to verify SQLite JDBC driver.
    pause
    exit /b 1
)

echo Dependencies verified in lib/
echo.
echo Compiling Server.java...
javac -cp "lib\*" Server.java
if %ERRORLEVEL% neq 0 (
    echo [Error] Java compilation failed! Please verify JDK is installed properly and in your PATH.
    pause
    exit /b %ERRORLEVEL%
)
echo Compilation successful!

echo.
echo Starting Java HttpServer on http://localhost:3000...
echo Press Ctrl+C in this terminal window to shut down the server.
echo.
java -cp ".;lib\*" Server

if %ERRORLEVEL% neq 0 (
    echo [Error] Server stopped with error code %ERRORLEVEL%
    pause
)
