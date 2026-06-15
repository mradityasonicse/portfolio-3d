import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.BasicAuthenticator;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Server {
    private static final int PORT = getPort();
    private static final String DB_URL = "jdbc:sqlite:portfolio.db";

    private static int getPort() {
        String portEnv = System.getenv("PORT");
        if (portEnv != null && !portEnv.trim().isEmpty()) {
            try {
                return Integer.parseInt(portEnv.trim());
            } catch (NumberFormatException e) {
                System.err.println("Invalid PORT env variable: " + portEnv + ", using 3000");
            }
        }
        return 3000;
    }

    public static void main(String[] args) {
        // Initialize SQLite Database
        initializeDatabase();

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

            // Map /api/contact handler
            server.createContext("/api/contact", new ContactHandler());
            
            // Map /api/booking-submit handler (public POST)
            server.createContext("/api/booking-submit", new BookingSubmitHandler());

            // Map /api/login handler (POST login credentials and set secure cookie)
            server.createContext("/api/login", new LoginHandler());
            
            // Map /api/messages handler (GET for list, DELETE for deletion) - PROTECTED
            server.createContext("/api/messages", new MessagesHandler());
            
            // Map /api/bookings handler (GET for list, DELETE for deletion) - PROTECTED
            server.createContext("/api/bookings", new BookingsHandler());

            // Map /admin and /admin.html context - PROTECTED
            server.createContext("/admin", new StaticFileHandler());
            server.createContext("/admin.html", new StaticFileHandler());
            
            // Map default context for static file serving
            server.createContext("/", new StaticFileHandler());
            
            server.setExecutor(null); // default executor
            System.out.println("====================================================");
            System.out.println(" Aditya's Premium Portfolio Backend Active ");
            System.out.println(" Web Server running at: http://localhost:" + PORT);
            System.out.println(" Database (SQL): SQLite [portfolio.db]");
            System.out.println(" Press Ctrl+C to stop the server.");
            System.out.println("====================================================");
            server.start();
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void initializeDatabase() {
        // Ensure JDBC driver class is loaded
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.err.println("SQLite JDBC Driver not found on classpath!");
            return;
        }

        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            if (conn != null) {
                System.out.println("Connected to SQL database successfully.");
                try (Statement stmt = conn.createStatement()) {
                    // Create contact table
                    String sql = "CREATE TABLE IF NOT EXISTS contacts (" +
                                 "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                                 "name TEXT NOT NULL, " +
                                 "email TEXT NOT NULL, " +
                                 "message TEXT NOT NULL, " +
                                 "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                 ")";
                    stmt.execute(sql);
                    System.out.println("SQL: Table 'contacts' verified/created.");

                    // Create bookings table
                    String sqlBookings = "CREATE TABLE IF NOT EXISTS bookings (" +
                                         "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                                         "name TEXT NOT NULL, " +
                                         "email TEXT NOT NULL, " +
                                         "booking_date TEXT NOT NULL, " +
                                         "booking_time TEXT NOT NULL, " +
                                         "topic TEXT NOT NULL, " +
                                         "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                         ")";
                    stmt.execute(sqlBookings);
                    System.out.println("SQL: Table 'bookings' verified/created.");
                }
            }
        } catch (SQLException e) {
            System.err.println("Database initialization error: " + e.getMessage());
        }
    }

    private static boolean isAuthenticated(HttpExchange exchange) {
        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null) {
            return false;
        }
        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String[] pair = cookie.trim().split("=", 2);
            if (pair.length == 2 && "session_id".equals(pair[0].trim())) {
                return "authorized_aditya_session".equals(pair[1].trim());
            }
        }
        return false;
    }

    // Handles POST /api/login and sets authentication cookie
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
                return;
            }

            try {
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buffer = new byte[1024];
                int len;
                while ((len = is.read(buffer)) != -1) {
                    bos.write(buffer, 0, len);
                }
                String body = bos.toString(StandardCharsets.UTF_8);
                String contentType = exchange.getRequestHeaders().getFirst("Content-Type");

                Map<String, String> data = parseBody(body, contentType);
                String username = data.getOrDefault("username", "").trim();
                String password = data.getOrDefault("password", "");

                if ("aditya".equals(username) && "soni123".equals(password)) {
                    exchange.getResponseHeaders().add("Set-Cookie", "session_id=authorized_aditya_session; Path=/; HttpOnly; SameSite=Lax");
                    sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"Access Granted\"}");
                } else {
                    sendResponse(exchange, 401, "application/json", "{\"status\":\"error\",\"message\":\"Invalid credentials. Access denied.\"}");
                }
            } catch (Exception e) {
                System.err.println("Login Error: " + e.getMessage());
                sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"Internal server error.\"}");
            }
        }
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendResponse(HttpExchange exchange, int status, String mime, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", mime + "; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static Map<String, String> parseBody(String body, String contentType) {
        Map<String, String> params = new HashMap<>();
        if (body == null || body.trim().isEmpty()) {
            return params;
        }

        if (contentType != null && contentType.contains("application/json")) {
            params.put("name", extractJsonValue(body, "name"));
            params.put("email", extractJsonValue(body, "email"));
            params.put("message", extractJsonValue(body, "message"));
            params.put("booking_date", extractJsonValue(body, "booking_date"));
            params.put("booking_time", extractJsonValue(body, "booking_time"));
            params.put("topic", extractJsonValue(body, "topic"));
            params.put("username", extractJsonValue(body, "username"));
            params.put("password", extractJsonValue(body, "password"));
        } else {
            // application/x-www-form-urlencoded parsing
            String[] pairs = body.split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                if (idx > 0) {
                    String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                    String value = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                    params.put(key, value);
                } else if (idx == 0 && pair.length() > 1) {
                    // key is empty
                } else {
                    String key = URLDecoder.decode(pair, StandardCharsets.UTF_8);
                    params.put(key, "");
                }
            }
        }
        return params;
    }

    private static String extractJsonValue(String json, String key) {
        // Matches "key" : "value"
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            String val = matcher.group(1);
            // Replace basic escape characters
            return val.replace("\\\"", "\"")
                      .replace("\\\\", "\\")
                      .replace("\\n", "\n")
                      .replace("\\r", "\r")
                      .replace("\\t", "\t");
        }
        return "";
    }

    private static String escapeJson(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < ' ') {
                        String hex = Integer.toHexString(ch);
                        sb.append("\\u").append("0".repeat(4 - hex.length())).append(hex);
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
    }

    // Handles POST /api/contact
    static class ContactHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
                return;
            }

            try {
                // Read request body
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buffer = new byte[1024];
                int len;
                while ((len = is.read(buffer)) != -1) {
                    bos.write(buffer, 0, len);
                }
                String body = bos.toString(StandardCharsets.UTF_8);
                String contentType = exchange.getRequestHeaders().getFirst("Content-Type");

                Map<String, String> data = parseBody(body, contentType);
                String name = data.getOrDefault("name", "").trim();
                String email = data.getOrDefault("email", "").trim();
                String message = data.getOrDefault("message", "").trim();

                if (name.isEmpty() || email.isEmpty() || message.isEmpty()) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing required fields (name, email, message)\"}");
                    return;
                }

                // Insert into SQLite
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String query = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";
                    try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                        pstmt.setString(1, name);
                        pstmt.setString(2, email);
                        pstmt.setString(3, message);
                        pstmt.executeUpdate();
                    }
                }

                System.out.println("SQL Insert: Message from " + name + " (" + email + ") saved to SQL database.");
                sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Message received and stored in SQL database.\"}");

            } catch (SQLException e) {
                System.err.println("SQL Error: " + e.getMessage());
                sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"Database error: " + escapeJson(e.getMessage()) + "\"}");
            } catch (Exception e) {
                System.err.println("Internal Error: " + e.getMessage());
                sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"Internal server error.\"}");
            }
        }
    }

    // Handles GET /api/messages & DELETE /api/messages?id=123
    static class MessagesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!isAuthenticated(exchange)) {
                sendResponse(exchange, 401, "application/json", "{\"status\":\"error\",\"message\":\"Unauthorized\"}");
                return;
            }

            String method = exchange.getRequestMethod();
            if ("GET".equalsIgnoreCase(method)) {
                // Return all messages from database as JSON
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "SELECT * FROM contacts ORDER BY created_at DESC";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sql)) {

                        StringBuilder json = new StringBuilder("[");
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) json.append(",");
                            first = false;
                            json.append("{")
                                .append("\"id\":").append(rs.getInt("id")).append(",")
                                .append("\"name\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                                .append("\"email\":\"").append(escapeJson(rs.getString("email"))).append("\",")
                                .append("\"message\":\"").append(escapeJson(rs.getString("message"))).append("\",")
                                .append("\"created_at\":\"").append(escapeJson(rs.getString("created_at"))).append("\"")
                                .append("}");
                        }
                        json.append("]");

                        sendResponse(exchange, 200, "application/json", json.toString());
                    }
                } catch (SQLException e) {
                    System.err.println("SQL Error: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("DELETE".equalsIgnoreCase(method)) {
                // Delete message by ID
                String query = exchange.getRequestURI().getQuery();
                int id = -1;
                if (query != null) {
                    String[] params = query.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length > 1 && "id".equals(pair[0])) {
                            try {
                                id = Integer.parseInt(pair[1]);
                            } catch (NumberFormatException e) {
                                // Ignore
                            }
                        }
                    }
                }

                if (id == -1) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing or invalid 'id' parameter.\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "DELETE FROM contacts WHERE id = ?";
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, id);
                        int rows = pstmt.executeUpdate();
                        if (rows > 0) {
                            System.out.println("SQL Delete: Deleted message ID: " + id);
                            sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"Message deleted.\"}");
                        } else {
                            sendResponse(exchange, 444, "application/json", "{\"status\":\"error\",\"message\":\"Message ID not found.\"}");
                        }
                    }
                } catch (SQLException e) {
                    System.err.println("SQL Error: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }

    // Handles GET /api/bookings, DELETE /api/bookings?id=123
    static class BookingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!isAuthenticated(exchange)) {
                sendResponse(exchange, 401, "application/json", "{\"status\":\"error\",\"message\":\"Unauthorized\"}");
                return;
            }

            String method = exchange.getRequestMethod();
            if ("GET".equalsIgnoreCase(method)) {
                // Return all bookings from SQLite
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "SELECT * FROM bookings ORDER BY booking_date ASC, booking_time ASC";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sql)) {

                        StringBuilder json = new StringBuilder("[");
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) json.append(",");
                            first = false;
                            json.append("{")
                                .append("\"id\":").append(rs.getInt("id")).append(",")
                                .append("\"name\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                                .append("\"email\":\"").append(escapeJson(rs.getString("email"))).append("\",")
                                .append("\"booking_date\":\"").append(escapeJson(rs.getString("booking_date"))).append("\",")
                                .append("\"booking_time\":\"").append(escapeJson(rs.getString("booking_time"))).append("\",")
                                .append("\"topic\":\"").append(escapeJson(rs.getString("topic"))).append("\",")
                                .append("\"created_at\":\"").append(escapeJson(rs.getString("created_at"))).append("\"")
                                .append("}");
                        }
                        json.append("]");

                        sendResponse(exchange, 200, "application/json", json.toString());
                    }
                } catch (SQLException e) {
                    System.err.println("SQL Error: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("DELETE".equalsIgnoreCase(method)) {
                // Delete booking by ID
                String query = exchange.getRequestURI().getQuery();
                int id = -1;
                if (query != null) {
                    String[] params = query.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length > 1 && "id".equals(pair[0])) {
                            try {
                                id = Integer.parseInt(pair[1]);
                            } catch (NumberFormatException e) {
                                // Ignore
                            }
                        }
                    }
                }

                if (id == -1) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing or invalid 'id' parameter.\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "DELETE FROM bookings WHERE id = ?";
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, id);
                        int rows = pstmt.executeUpdate();
                        if (rows > 0) {
                            System.out.println("SQL Delete: Deleted booking ID: " + id);
                            sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"Booking deleted.\"}");
                        } else {
                            sendResponse(exchange, 444, "application/json", "{\"status\":\"error\",\"message\":\"Booking ID not found.\"}");
                        }
                    }
                } catch (SQLException e) {
                    System.err.println("SQL Error: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }

    // Handles POST /api/booking-submit (Public)
    static class BookingSubmitHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
                return;
            }

            try {
                // Read request body
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buffer = new byte[1024];
                int len;
                while ((len = is.read(buffer)) != -1) {
                    bos.write(buffer, 0, len);
                }
                String body = bos.toString(StandardCharsets.UTF_8);
                String contentType = exchange.getRequestHeaders().getFirst("Content-Type");

                Map<String, String> data = parseBody(body, contentType);
                String name = data.getOrDefault("name", "").trim();
                String email = data.getOrDefault("email", "").trim();
                String date = data.getOrDefault("booking_date", "").trim();
                String time = data.getOrDefault("booking_time", "").trim();
                String topic = data.getOrDefault("topic", "").trim();

                if (name.isEmpty() || email.isEmpty() || date.isEmpty() || time.isEmpty() || topic.isEmpty()) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing required fields for booking.\"}");
                    return;
                }

                // Insert into SQLite
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String query = "INSERT INTO bookings (name, email, booking_date, booking_time, topic) VALUES (?, ?, ?, ?, ?)";
                    try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                        pstmt.setString(1, name);
                        pstmt.setString(2, email);
                        pstmt.setString(3, date);
                        pstmt.setString(4, time);
                        pstmt.setString(5, topic);
                        pstmt.executeUpdate();
                    }
                }

                System.out.println("SQL Insert: Call Booking for " + name + " (" + email + ") saved to SQL database.");
                sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Consultation session booked and stored in SQL database.\"}");

            } catch (SQLException e) {
                System.err.println("SQL Error: " + e.getMessage());
                sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"Database error: " + escapeJson(e.getMessage()) + "\"}");
            } catch (Exception e) {
                System.err.println("Internal Error: " + e.getMessage());
                sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"Internal server error.\"}");
            }
        }
    }

    // Serving Static Files
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String pathStr = exchange.getRequestURI().getPath();
            
            // Rewrite root to index.html
            if (pathStr.equals("/") || pathStr.isEmpty()) {
                pathStr = "/index.html";
            }
            
            // Rewrite /admin or /admin/ to admin.html
            if (pathStr.equals("/admin") || pathStr.equals("/admin/")) {
                pathStr = "/admin.html";
            }

            // Authentication verification for admin views
            if ("/admin.html".equals(pathStr)) {
                if (!isAuthenticated(exchange)) {
                    exchange.getResponseHeaders().set("Location", "/login.html");
                    exchange.sendResponseHeaders(302, -1);
                    return;
                }
            }

            // Remove leading slash to get relative file path
            String relativePath = pathStr.substring(1);

            // Check if clean URL (no extension) matches an HTML file
            if (!pathStr.contains(".") && !pathStr.endsWith("/")) {
                try {
                    File rootDir = new File(".").getCanonicalFile();
                    File htmlFile = new File(relativePath + ".html").getCanonicalFile();
                    if (htmlFile.getPath().toLowerCase().startsWith(rootDir.getPath().toLowerCase())) {
                        if (htmlFile.exists() && !htmlFile.isDirectory()) {
                            pathStr = pathStr + ".html";
                            relativePath = pathStr.substring(1);
                        }
                    }
                } catch (IOException e) {
                    // Ignore and let standard canonical check handle/fail it
                }
            }

            // Canonical check to prevent directory traversal
            File file = new File(relativePath).getCanonicalFile();
            File rootDir = new File(".").getCanonicalFile();

            String filePath = file.getPath().toLowerCase();
            String rootPath = rootDir.getPath().toLowerCase();

            if (!filePath.startsWith(rootPath)) {
                String response = "Forbidden";
                exchange.sendResponseHeaders(403, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }

            if (!file.exists() || file.isDirectory()) {
                // Fallback to index.html for Single Page Application router behavior if requested, 
                // but since it's a simple portfolio, just return 404
                String response = "404 Not Found";
                exchange.sendResponseHeaders(404, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }

            // Content-Type mapping
            String mime = getMimeType(file.getName());
            
            // Stream the file content
            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String getMimeType(String filename) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".html")) return "text/html; charset=utf-8";
            if (lower.endsWith(".css")) return "text/css; charset=utf-8";
            if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".gif")) return "image/gif";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".ico")) return "image/x-icon";
            return "application/octet-stream";
        }
    }
}
