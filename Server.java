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

            // Map /api/settings handler (GET for public config, POST for changes)
            server.createContext("/api/settings", new SettingsHandler());

            // Map CRUD handlers for admin (POST/DELETE)
            server.createContext("/api/projects-crud", new ProjectsCrudHandler());
            server.createContext("/api/education-crud", new EducationCrudHandler());
            server.createContext("/api/experience-crud", new ExperienceCrudHandler());

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

                    // Create portfolio_settings table
                    String sqlSettings = "CREATE TABLE IF NOT EXISTS portfolio_settings (" +
                                         "id INTEGER PRIMARY KEY CHECK (id = 1), " +
                                         "theme_preset TEXT DEFAULT 'dark', " +
                                         "primary_color TEXT DEFAULT '#f43f5e', " +
                                         "secondary_color TEXT DEFAULT '#8b5cf6', " +
                                         "accent_color TEXT DEFAULT '#f59e0b', " +
                                         "background_color TEXT DEFAULT '#050811', " +
                                         "surface_color TEXT DEFAULT '#0c1122', " +
                                         "font_display TEXT DEFAULT 'Oswald', " +
                                         "font_body TEXT DEFAULT 'Inter', " +
                                         "animations_enabled INTEGER DEFAULT 1, " +
                                         "layout_sections_order TEXT DEFAULT 'about,education,skills,now,projects,contact', " +
                                         "seo_title TEXT DEFAULT 'Aditya Soni | Developer & Security Enthusiast', " +
                                         "seo_description TEXT DEFAULT 'B.Tech CSE Undergrad at Rungta Skill University. Full-stack developer & ethical hacker.', " +
                                         "analytics_id TEXT DEFAULT '', " +
                                         "hero_badge TEXT DEFAULT 'First-year CSE student · Bhilai, CG', " +
                                         "hero_title TEXT DEFAULT 'I BUILD WEB THINGS.\nTHEN I TRY TO\nBREAK THEM.', " +
                                         "hero_subtitle TEXT DEFAULT '— Aditya Soni', " +
                                         "hero_description TEXT DEFAULT 'I''m a CS undergrad at Rungta University, Bhilai who spends most of his time writing MERN stack apps and then poking holes in them on Kali Linux. I just finished 12th, so I''m early in this journey — but I''m all in.', " +
                                         "about_lead TEXT DEFAULT 'A first-year CS undergrad trying to bridge the gap between building things and breaking them.', " +
                                         "about_body TEXT DEFAULT 'I''m Aditya Soni, a Computer Science student currently in my first year at Rungta International Skill University, Bhilai. Unlike a lot of people who get into coding just for jobs, I got into it because I wanted to understand how things work under the hood.\nI started coding in high school, and since then I''ve been building full-stack web applications. But just building them felt incomplete — I wanted to know how to secure them, which led me into ethical hacking, networking, and vulnerability research. That means I write code on weekdays and run Kali Linux on weekends to audit my own creations.', " +
                                         "skills_web_dev TEXT DEFAULT 'MongoDB, Express.js, React.js, Node.js, REST APIs', " +
                                         "skills_security TEXT DEFAULT 'Kali Linux, Nmap, Wireshark, Metasploit, Pen Testing', " +
                                         "skills_languages TEXT DEFAULT 'C / C++, HTML5 / CSS3, JavaScript, Git & GitHub', " +
                                         "contact_title TEXT DEFAULT 'LET''S COLLABORATE ON THE FUTURE', " +
                                         "contact_subtitle TEXT DEFAULT 'Have a project in mind, need a security audit, or just want to chat about CS? Drop a message or book a time slot directly in my calendar.', " +
                                         "social_github TEXT DEFAULT 'https://github.com', " +
                                         "social_linkedin TEXT DEFAULT 'https://linkedin.com', " +
                                         "social_twitter TEXT DEFAULT 'https://twitter.com', " +
                                         "brand_name TEXT DEFAULT 'Aditya Soni', " +
                                         "logo_text TEXT DEFAULT 'ADITYA.DEV', " +
                                         "footer_text TEXT DEFAULT '© 2026 Aditya Soni. All Rights Reserved.', " +
                                         "goal_1_title TEXT DEFAULT 'Goal #1', " +
                                         "goal_1_desc TEXT DEFAULT '🛡️ Master Cybersecurity. I want to become a certified ethical hacker — learning penetration testing, network security, and digital forensics to protect systems and people from cyber threats.', " +
                                         "goal_1_status TEXT DEFAULT 'Priority', " +
                                         "goal_2_title TEXT DEFAULT 'Goal #2', " +
                                         "goal_2_desc TEXT DEFAULT '🌐 Become a MERN Developer. Build full-stack web applications that solve real problems — using MongoDB, Express, React, and Node.js to create fast, scalable, and meaningful digital products.', " +
                                         "goal_2_status TEXT DEFAULT 'In Progress', " +
                                         "goal_3_title TEXT DEFAULT 'Goal #3', " +
                                         "goal_3_desc TEXT DEFAULT '🇮🇳 Serve the Nation. Use my skills in cybersecurity and software development to contribute to India''s digital safety and infrastructure. Code is my weapon; protection is my purpose.', " +
                                         "goal_3_status TEXT DEFAULT 'The Why', " +
                                         "contact_email TEXT DEFAULT 'mradityasoni.cse@gmail.com', " +
                                         "contact_location TEXT DEFAULT 'Bhilai, Chhattisgarh 🇮🇳', " +
                                         "contact_status TEXT DEFAULT 'Open to Opportunities', " +
                                         "custom_css TEXT DEFAULT '', " +
                                         "custom_javascript TEXT DEFAULT '', " +
                                         "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                         ")";
                    stmt.execute(sqlSettings);
                    
                    // Run Alter table schema migrations for existing SQLite databases
                    String[] newColumns = {
                        "hero_badge TEXT DEFAULT 'First-year CSE student · Bhilai, CG'",
                        "hero_title TEXT DEFAULT 'I BUILD WEB THINGS.\nTHEN I TRY TO\nBREAK THEM.'",
                        "hero_subtitle TEXT DEFAULT '— Aditya Soni'",
                        "hero_description TEXT DEFAULT 'I''m a CS undergrad at Rungta University, Bhilai who spends most of his time writing MERN stack apps and then poking holes in them on Kali Linux. I just finished 12th, so I''m early in this journey — but I''m all in.'",
                        "about_lead TEXT DEFAULT 'A first-year CS undergrad trying to bridge the gap between building things and breaking them.'",
                        "about_body TEXT DEFAULT 'I''m Aditya Soni, a Computer Science student currently in my first year at Rungta International Skill University, Bhilai. Unlike a lot of people who get into coding just for jobs, I got into it because I wanted to understand how things work under the hood.\nI started coding in high school, and since then I''ve been building full-stack web applications. But just building them felt incomplete — I wanted to know how to secure them, which led me into ethical hacking, networking, and vulnerability research. That means I write code on weekdays and run Kali Linux on weekends to audit my own creations.'",
                        "skills_web_dev TEXT DEFAULT 'MongoDB, Express.js, React.js, Node.js, REST APIs'",
                        "skills_security TEXT DEFAULT 'Kali Linux, Nmap, Wireshark, Metasploit, Pen Testing'",
                        "skills_languages TEXT DEFAULT 'C / C++, HTML5 / CSS3, JavaScript, Git & GitHub'",
                        "contact_title TEXT DEFAULT 'LET''S COLLABORATE ON THE FUTURE'",
                        "contact_subtitle TEXT DEFAULT 'Have a project in mind, need a security audit, or just want to chat about CS? Drop a message or book a time slot directly in my calendar.'",
                        "social_github TEXT DEFAULT 'https://github.com'",
                        "social_linkedin TEXT DEFAULT 'https://linkedin.com'",
                        "social_twitter TEXT DEFAULT 'https://twitter.com'",
                        "brand_name TEXT DEFAULT 'Aditya Soni'",
                        "logo_text TEXT DEFAULT 'ADITYA.DEV'",
                        "footer_text TEXT DEFAULT '© 2026 Aditya Soni. All Rights Reserved.'",
                        "goal_1_title TEXT DEFAULT 'Goal #1'",
                        "goal_1_desc TEXT DEFAULT '🛡️ Master Cybersecurity. I want to become a certified ethical hacker — learning penetration testing, network security, and digital forensics to protect systems and people from cyber threats.'",
                        "goal_1_status TEXT DEFAULT 'Priority'",
                        "goal_2_title TEXT DEFAULT 'Goal #2'",
                        "goal_2_desc TEXT DEFAULT '🌐 Become a MERN Developer. Build full-stack web applications that solve real problems — using MongoDB, Express, React, and Node.js to create fast, scalable, and meaningful digital products.'",
                        "goal_2_status TEXT DEFAULT 'In Progress'",
                        "goal_3_title TEXT DEFAULT 'Goal #3'",
                        "goal_3_desc TEXT DEFAULT '🇮🇳 Serve the Nation. Use my skills in cybersecurity and software development to contribute to India''s digital safety and infrastructure. Code is my weapon; protection is my purpose.'",
                        "goal_3_status TEXT DEFAULT 'The Why'",
                        "contact_email TEXT DEFAULT 'mradityasoni.cse@gmail.com'",
                        "contact_location TEXT DEFAULT 'Bhilai, Chhattisgarh 🇮🇳'",
                        "contact_status TEXT DEFAULT 'Open to Opportunities'",
                        "custom_css TEXT DEFAULT ''",
                        "custom_javascript TEXT DEFAULT ''"
                    };
                    for (String col : newColumns) {
                        try {
                            stmt.execute("ALTER TABLE portfolio_settings ADD COLUMN " + col);
                            System.out.println("SQL Migration: Added column " + col.split(" ")[0] + " to portfolio_settings.");
                        } catch (SQLException e) {
                            // Column already exists, ignore
                        }
                    }
                    
                    // Seed defaults if empty
                    String countSettings = "SELECT COUNT(*) FROM portfolio_settings";
                    try (ResultSet rs = stmt.executeQuery(countSettings)) {
                        if (rs.next() && rs.getInt(1) == 0) {
                            String seedSettings = "INSERT INTO portfolio_settings (id) VALUES (1)";
                            stmt.execute(seedSettings);
                            System.out.println("SQL: Seeded table 'portfolio_settings' with default parameters.");
                        }
                    }


                    // Create projects table
                    String sqlProjects = "CREATE TABLE IF NOT EXISTS projects (" +
                                         "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                                         "title TEXT NOT NULL, " +
                                         "description TEXT NOT NULL, " +
                                         "image_url TEXT DEFAULT '', " +
                                         "github_link TEXT DEFAULT '', " +
                                         "live_link TEXT DEFAULT '', " +
                                         "tags TEXT DEFAULT '', " +
                                         "sort_order INTEGER DEFAULT 0, " +
                                         "is_visible INTEGER DEFAULT 1, " +
                                         "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                         ")";
                    stmt.execute(sqlProjects);

                    // Seed default project if empty
                    String countProjects = "SELECT COUNT(*) FROM projects";
                    try (ResultSet rs = stmt.executeQuery(countProjects)) {
                        if (rs.next() && rs.getInt(1) == 0) {
                            String seedProj = "INSERT INTO projects (title, description, tags, sort_order, is_visible) VALUES (" +
                                              "'This Portfolio', " +
                                              "'The site you''re looking at. Built with vanilla HTML/CSS/JS, GSAP animations, Tailwind, and a Java backend with SQLite for the contact form and booking system.', " +
                                              "'HTML/CSS/JS,GSAP,Java,SQLite', 0, 1)";
                            stmt.execute(seedProj);
                            System.out.println("SQL: Seeded table 'projects' with default item.");
                        }
                    }

                    // Create education table
                    String sqlEducation = "CREATE TABLE IF NOT EXISTS education (" +
                                          "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                                          "degree TEXT NOT NULL, " +
                                          "institution TEXT NOT NULL, " +
                                          "timeline TEXT NOT NULL, " +
                                          "description TEXT DEFAULT '', " +
                                          "sort_order INTEGER DEFAULT 0, " +
                                          "is_visible INTEGER DEFAULT 1, " +
                                          "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                          ")";
                    stmt.execute(sqlEducation);

                    // Seed default education if empty
                    String countEdu = "SELECT COUNT(*) FROM education";
                    try (ResultSet rs = stmt.executeQuery(countEdu)) {
                        if (rs.next() && rs.getInt(1) == 0) {
                            stmt.execute("INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'B.Tech - Computer Science Engineering', " +
                                         "'Rungta International Skill University, Bhilai', " +
                                         "'2026 - Present', " +
                                         "'Just started my first year. Learning data structures, algorithms, and computer networks in class — and teaching myself MERN stack and ethical hacking on the side.', " +
                                         "0, 1)");
                            stmt.execute("INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'Higher Secondary (Class XII)', " +
                                         "'Board Examinations • CBSE', " +
                                         "'2026 Batch', " +
                                         "'Completed Senior Secondary education with a focus on Mathematics, Physics, Chemistry, and Computer Science. Secured 80% marks.', " +
                                         "1, 1)");
                            stmt.execute("INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'Secondary School (Class X)', " +
                                         "'Board Examinations • CBSE', " +
                                         "'2024 Batch', " +
                                         "'Completed secondary education. Strengthened structural discipline and academic efficiency, achieving an exceptional score of 92% marks.', " +
                                         "2, 1)");
                            System.out.println("SQL: Seeded table 'education' with default items.");
                        }
                    }

                    // Create experience table
                    String sqlExperience = "CREATE TABLE IF NOT EXISTS experience (" +
                                           "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                                           "role TEXT NOT NULL, " +
                                           "company TEXT NOT NULL, " +
                                           "timeline TEXT NOT NULL, " +
                                           "description TEXT DEFAULT '', " +
                                           "sort_order INTEGER DEFAULT 0, " +
                                           "is_visible INTEGER DEFAULT 1, " +
                                           "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                           ")";
                    stmt.execute(sqlExperience);

                    // Seed default experience if empty
                    String countExp = "SELECT COUNT(*) FROM experience";
                    try (ResultSet rs = stmt.executeQuery(countExp)) {
                        if (rs.next() && rs.getInt(1) == 0) {
                            stmt.execute("INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'Learning MERN Stack', " +
                                         "'Self-study', " +
                                         "'Currently', " +
                                         "'Building full-stack apps with MongoDB, Express, React, and Node. Currently working through authentication flows and REST API design.', " +
                                         "0, 1)");
                            stmt.execute("INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'Exploring Ethical Hacking', " +
                                         "'Self-study', " +
                                         "'Currently', " +
                                         "'Setting up vulnerable VMs, running Nmap scans, learning Wireshark packet analysis. Working toward understanding how real attacks work so I can defend against them.', " +
                                         "1, 1)");
                            stmt.execute("INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (" +
                                         "'First Year of CSE', " +
                                         "'Rungta University', " +
                                         "'Currently', " +
                                         "'Taking my core CS courses — data structures, algorithms, computer networks. Trying to connect what I learn in class with what I build on weekends.', " +
                                         "2, 1)");
                            System.out.println("SQL: Seeded table 'experience' with default items.");
                        }
                    }
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
        // Matches "key" : "value" or "key" : value
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*(?:\"((?:[^\"\\\\]|\\\\.)*)\"|([^,\\}]+))");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            if (matcher.group(1) != null) {
                String val = matcher.group(1);
                // Replace basic escape characters
                return val.replace("\\\"", "\"")
                          .replace("\\\\", "\\")
                          .replace("\\n", "\n")
                          .replace("\\r", "\r")
                          .replace("\\t", "\t");
            } else if (matcher.group(2) != null) {
                return matcher.group(2).trim();
            }
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

    // Handles GET /api/settings and POST /api/settings/save
    static class SettingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String method = exchange.getRequestMethod();
            if ("GET".equalsIgnoreCase(method)) {
                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String settingsJson = "{}";
                    String projectsJson = "[]";
                    String educationJson = "[]";
                    String experienceJson = "[]";

                    // 1. Fetch settings
                    String sqlSettings = "SELECT * FROM portfolio_settings WHERE id = 1";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sqlSettings)) {
                        if (rs.next()) {
                            settingsJson = "{" +
                                "\"theme_preset\":\"" + escapeJson(rs.getString("theme_preset")) + "\"," +
                                "\"primary_color\":\"" + escapeJson(rs.getString("primary_color")) + "\"," +
                                "\"secondary_color\":\"" + escapeJson(rs.getString("secondary_color")) + "\"," +
                                "\"accent_color\":\"" + escapeJson(rs.getString("accent_color")) + "\"," +
                                "\"background_color\":\"" + escapeJson(rs.getString("background_color")) + "\"," +
                                "\"surface_color\":\"" + escapeJson(rs.getString("surface_color")) + "\"," +
                                "\"font_display\":\"" + escapeJson(rs.getString("font_display")) + "\"," +
                                "\"font_body\":\"" + escapeJson(rs.getString("font_body")) + "\"," +
                                "\"animations_enabled\":" + rs.getInt("animations_enabled") + "," +
                                "\"layout_sections_order\":\"" + escapeJson(rs.getString("layout_sections_order")) + "\"," +
                                "\"seo_title\":\"" + escapeJson(rs.getString("seo_title")) + "\"," +
                                "\"seo_description\":\"" + escapeJson(rs.getString("seo_description")) + "\"," +
                                "\"analytics_id\":\"" + escapeJson(rs.getString("analytics_id")) + "\"," +
                                "\"hero_badge\":\"" + escapeJson(rs.getString("hero_badge")) + "\"," +
                                "\"hero_title\":\"" + escapeJson(rs.getString("hero_title")) + "\"," +
                                "\"hero_subtitle\":\"" + escapeJson(rs.getString("hero_subtitle")) + "\"," +
                                "\"hero_description\":\"" + escapeJson(rs.getString("hero_description")) + "\"," +
                                "\"about_lead\":\"" + escapeJson(rs.getString("about_lead")) + "\"," +
                                "\"about_body\":\"" + escapeJson(rs.getString("about_body")) + "\"," +
                                "\"skills_web_dev\":\"" + escapeJson(rs.getString("skills_web_dev")) + "\"," +
                                "\"skills_security\":\"" + escapeJson(rs.getString("skills_security")) + "\"," +
                                "\"skills_languages\":\"" + escapeJson(rs.getString("skills_languages")) + "\"," +
                                "\"contact_title\":\"" + escapeJson(rs.getString("contact_title")) + "\"," +
                                "\"contact_subtitle\":\"" + escapeJson(rs.getString("contact_subtitle")) + "\"," +
                                "\"social_github\":\"" + escapeJson(rs.getString("social_github")) + "\"," +
                                "\"social_linkedin\":\"" + escapeJson(rs.getString("social_linkedin")) + "\"," +
                                "\"social_twitter\":\"" + escapeJson(rs.getString("social_twitter")) + "\"," +
                                "\"brand_name\":\"" + escapeJson(rs.getString("brand_name")) + "\"," +
                                "\"logo_text\":\"" + escapeJson(rs.getString("logo_text")) + "\"," +
                                "\"footer_text\":\"" + escapeJson(rs.getString("footer_text")) + "\"," +
                                "\"goal_1_title\":\"" + escapeJson(rs.getString("goal_1_title")) + "\"," +
                                "\"goal_1_desc\":\"" + escapeJson(rs.getString("goal_1_desc")) + "\"," +
                                "\"goal_1_status\":\"" + escapeJson(rs.getString("goal_1_status")) + "\"," +
                                "\"goal_2_title\":\"" + escapeJson(rs.getString("goal_2_title")) + "\"," +
                                "\"goal_2_desc\":\"" + escapeJson(rs.getString("goal_2_desc")) + "\"," +
                                "\"goal_2_status\":\"" + escapeJson(rs.getString("goal_2_status")) + "\"," +
                                "\"goal_3_title\":\"" + escapeJson(rs.getString("goal_3_title")) + "\"," +
                                "\"goal_3_desc\":\"" + escapeJson(rs.getString("goal_3_desc")) + "\"," +
                                "\"goal_3_status\":\"" + escapeJson(rs.getString("goal_3_status")) + "\"," +
                                "\"contact_email\":\"" + escapeJson(rs.getString("contact_email")) + "\"," +
                                "\"contact_location\":\"" + escapeJson(rs.getString("contact_location")) + "\"," +
                                "\"contact_status\":\"" + escapeJson(rs.getString("contact_status")) + "\"," +
                                "\"custom_css\":\"" + escapeJson(rs.getString("custom_css")) + "\"," +
                                "\"custom_javascript\":\"" + escapeJson(rs.getString("custom_javascript")) + "\"" +
                                "}";
                        }
                    }

                    // 2. Fetch projects
                    String sqlProj = "SELECT * FROM projects ORDER BY sort_order ASC";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sqlProj)) {
                        StringBuilder sb = new StringBuilder("[");
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) sb.append(",");
                            first = false;
                            sb.append("{")
                                .append("\"id\":").append(rs.getInt("id")).append(",")
                                .append("\"title\":\"").append(escapeJson(rs.getString("title"))).append("\",")
                                .append("\"description\":\"").append(escapeJson(rs.getString("description"))).append("\",")
                                .append("\"image_url\":\"").append(escapeJson(rs.getString("image_url"))).append("\",")
                                .append("\"github_link\":\"").append(escapeJson(rs.getString("github_link"))).append("\",")
                                .append("\"live_link\":\"").append(escapeJson(rs.getString("live_link"))).append("\",")
                                .append("\"tags\":\"").append(escapeJson(rs.getString("tags"))).append("\",")
                                .append("\"sort_order\":").append(rs.getInt("sort_order")).append(",")
                                .append("\"is_visible\":").append(rs.getInt("is_visible"))
                                .append("}");
                        }
                        sb.append("]");
                        projectsJson = sb.toString();
                    }

                    // 3. Fetch education
                    String sqlEdu = "SELECT * FROM education ORDER BY sort_order ASC";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sqlEdu)) {
                        StringBuilder sb = new StringBuilder("[");
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) sb.append(",");
                            first = false;
                            sb.append("{")
                                .append("\"id\":").append(rs.getInt("id")).append(",")
                                .append("\"degree\":\"").append(escapeJson(rs.getString("degree"))).append("\",")
                                .append("\"institution\":\"").append(escapeJson(rs.getString("institution"))).append("\",")
                                .append("\"timeline\":\"").append(escapeJson(rs.getString("timeline"))).append("\",")
                                .append("\"description\":\"").append(escapeJson(rs.getString("description"))).append("\",")
                                .append("\"sort_order\":").append(rs.getInt("sort_order")).append(",")
                                .append("\"is_visible\":").append(rs.getInt("is_visible"))
                                .append("}");
                        }
                        sb.append("]");
                        educationJson = sb.toString();
                    }

                    // 4. Fetch experience
                    String sqlExp = "SELECT * FROM experience ORDER BY sort_order ASC";
                    try (Statement stmt = conn.createStatement();
                         ResultSet rs = stmt.executeQuery(sqlExp)) {
                        StringBuilder sb = new StringBuilder("[");
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) sb.append(",");
                            first = false;
                            sb.append("{")
                                .append("\"id\":").append(rs.getInt("id")).append(",")
                                .append("\"role\":\"").append(escapeJson(rs.getString("role"))).append("\",")
                                .append("\"company\":\"").append(escapeJson(rs.getString("company"))).append("\",")
                                .append("\"timeline\":\"").append(escapeJson(rs.getString("timeline"))).append("\",")
                                .append("\"description\":\"").append(escapeJson(rs.getString("description"))).append("\",")
                                .append("\"sort_order\":").append(rs.getInt("sort_order")).append(",")
                                .append("\"is_visible\":").append(rs.getInt("is_visible"))
                                .append("}");
                        }
                        sb.append("]");
                        experienceJson = sb.toString();
                    }

                    String responseJson = "{" +
                        "\"settings\":" + settingsJson + "," +
                        "\"projects\":" + projectsJson + "," +
                        "\"education\":" + educationJson + "," +
                        "\"experience\":" + experienceJson +
                        "}";

                    sendResponse(exchange, 200, "application/json", responseJson);
                } catch (SQLException e) {
                    System.err.println("SQL Error in GET settings: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("POST".equalsIgnoreCase(method)) {
                if (!isAuthenticated(exchange)) {
                    sendResponse(exchange, 401, "application/json", "{\"status\":\"error\",\"message\":\"Unauthorized\"}");
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

                    String theme_preset = extractJsonValue(body, "theme_preset");
                    String primary_color = extractJsonValue(body, "primary_color");
                    String secondary_color = extractJsonValue(body, "secondary_color");
                    String accent_color = extractJsonValue(body, "accent_color");
                    String background_color = extractJsonValue(body, "background_color");
                    String surface_color = extractJsonValue(body, "surface_color");
                    String font_display = extractJsonValue(body, "font_display");
                    String font_body = extractJsonValue(body, "font_body");
                    String animEnabledStr = extractJsonValue(body, "animations_enabled");
                    String layout_sections_order = extractJsonValue(body, "layout_sections_order");
                    String seo_title = extractJsonValue(body, "seo_title");
                    String seo_description = extractJsonValue(body, "seo_description");
                    String analytics_id = extractJsonValue(body, "analytics_id");
                    
                    String hero_badge = extractJsonValue(body, "hero_badge");
                    String hero_title = extractJsonValue(body, "hero_title");
                    String hero_subtitle = extractJsonValue(body, "hero_subtitle");
                    String hero_description = extractJsonValue(body, "hero_description");
                    String about_lead = extractJsonValue(body, "about_lead");
                    String about_body = extractJsonValue(body, "about_body");
                    String skills_web_dev = extractJsonValue(body, "skills_web_dev");
                    String skills_security = extractJsonValue(body, "skills_security");
                    String skills_languages = extractJsonValue(body, "skills_languages");
                    String contact_title = extractJsonValue(body, "contact_title");
                    String contact_subtitle = extractJsonValue(body, "contact_subtitle");
                    String social_github = extractJsonValue(body, "social_github");
                    String social_linkedin = extractJsonValue(body, "social_linkedin");
                    String social_twitter = extractJsonValue(body, "social_twitter");
                    String brand_name = extractJsonValue(body, "brand_name");
                    String logo_text = extractJsonValue(body, "logo_text");
                    String footer_text = extractJsonValue(body, "footer_text");
                    String goal_1_title = extractJsonValue(body, "goal_1_title");
                    String goal_1_desc = extractJsonValue(body, "goal_1_desc");
                    String goal_1_status = extractJsonValue(body, "goal_1_status");
                    String goal_2_title = extractJsonValue(body, "goal_2_title");
                    String goal_2_desc = extractJsonValue(body, "goal_2_desc");
                    String goal_2_status = extractJsonValue(body, "goal_2_status");
                    String goal_3_title = extractJsonValue(body, "goal_3_title");
                    String goal_3_desc = extractJsonValue(body, "goal_3_desc");
                    String goal_3_status = extractJsonValue(body, "goal_3_status");
                    String contact_email = extractJsonValue(body, "contact_email");
                    String contact_location = extractJsonValue(body, "contact_location");
                    String contact_status = extractJsonValue(body, "contact_status");
                    String custom_css = extractJsonValue(body, "custom_css");
                    String custom_javascript = extractJsonValue(body, "custom_javascript");

                    try (Connection conn = DriverManager.getConnection(DB_URL)) {
                        String query = "UPDATE portfolio_settings SET " +
                                       "theme_preset = COALESCE(NULLIF(?, ''), theme_preset), " +
                                       "primary_color = COALESCE(NULLIF(?, ''), primary_color), " +
                                       "secondary_color = COALESCE(NULLIF(?, ''), secondary_color), " +
                                       "accent_color = COALESCE(NULLIF(?, ''), accent_color), " +
                                       "background_color = COALESCE(NULLIF(?, ''), background_color), " +
                                       "surface_color = COALESCE(NULLIF(?, ''), surface_color), " +
                                       "font_display = COALESCE(NULLIF(?, ''), font_display), " +
                                       "font_body = COALESCE(NULLIF(?, ''), font_body), " +
                                       "animations_enabled = COALESCE(?, animations_enabled), " +
                                       "layout_sections_order = COALESCE(NULLIF(?, ''), layout_sections_order), " +
                                       "seo_title = COALESCE(NULLIF(?, ''), seo_title), " +
                                       "seo_description = COALESCE(NULLIF(?, ''), seo_description), " +
                                       "analytics_id = COALESCE(?, analytics_id), " +
                                       "hero_badge = ?, " +
                                       "hero_title = ?, " +
                                       "hero_subtitle = ?, " +
                                       "hero_description = ?, " +
                                       "about_lead = ?, " +
                                       "about_body = ?, " +
                                       "skills_web_dev = ?, " +
                                       "skills_security = ?, " +
                                       "skills_languages = ?, " +
                                       "contact_title = ?, " +
                                       "contact_subtitle = ?, " +
                                       "social_github = ?, " +
                                       "social_linkedin = ?, " +
                                       "social_twitter = ?, " +
                                       "brand_name = ?, " +
                                       "logo_text = ?, " +
                                       "footer_text = ?, " +
                                       "goal_1_title = ?, " +
                                       "goal_1_desc = ?, " +
                                       "goal_1_status = ?, " +
                                       "goal_2_title = ?, " +
                                       "goal_2_desc = ?, " +
                                       "goal_2_status = ?, " +
                                       "goal_3_title = ?, " +
                                       "goal_3_desc = ?, " +
                                       "goal_3_status = ?, " +
                                       "contact_email = ?, " +
                                       "contact_location = ?, " +
                                       "contact_status = ?, " +
                                       "custom_css = ?, " +
                                       "custom_javascript = ?, " +
                                       "updated_at = CURRENT_TIMESTAMP " +
                                       "WHERE id = 1";

                        try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                            pstmt.setString(1, theme_preset);
                            pstmt.setString(2, primary_color);
                            pstmt.setString(3, secondary_color);
                            pstmt.setString(4, accent_color);
                            pstmt.setString(5, background_color);
                            pstmt.setString(6, surface_color);
                            pstmt.setString(7, font_display);
                            pstmt.setString(8, font_body);
                            
                            if (animEnabledStr != null && !animEnabledStr.isEmpty()) {
                                try {
                                    if ("true".equalsIgnoreCase(animEnabledStr)) {
                                        pstmt.setInt(9, 1);
                                    } else if ("false".equalsIgnoreCase(animEnabledStr)) {
                                        pstmt.setInt(9, 0);
                                    } else {
                                        pstmt.setInt(9, Integer.parseInt(animEnabledStr));
                                    }
                                } catch (Exception e) {
                                    pstmt.setNull(9, Types.INTEGER);
                                }
                            } else {
                                pstmt.setNull(9, Types.INTEGER);
                            }
                            
                            pstmt.setString(10, layout_sections_order);
                            pstmt.setString(11, seo_title);
                            pstmt.setString(12, seo_description);
                            pstmt.setString(13, analytics_id);
                            
                            pstmt.setString(14, hero_badge);
                            pstmt.setString(15, hero_title);
                            pstmt.setString(16, hero_subtitle);
                            pstmt.setString(17, hero_description);
                            pstmt.setString(18, about_lead);
                            pstmt.setString(19, about_body);
                            pstmt.setString(20, skills_web_dev);
                            pstmt.setString(21, skills_security);
                            pstmt.setString(22, skills_languages);
                            pstmt.setString(23, contact_title);
                            pstmt.setString(24, contact_subtitle);
                            pstmt.setString(25, social_github);
                            pstmt.setString(26, social_linkedin);
                            pstmt.setString(27, social_twitter);

                            pstmt.setString(28, brand_name);
                            pstmt.setString(29, logo_text);
                            pstmt.setString(30, footer_text);
                            pstmt.setString(31, goal_1_title);
                            pstmt.setString(32, goal_1_desc);
                            pstmt.setString(33, goal_1_status);
                            pstmt.setString(34, goal_2_title);
                            pstmt.setString(35, goal_2_desc);
                            pstmt.setString(36, goal_2_status);
                            pstmt.setString(37, goal_3_title);
                            pstmt.setString(38, goal_3_desc);
                            pstmt.setString(39, goal_3_status);
                            pstmt.setString(40, contact_email);
                            pstmt.setString(41, contact_location);
                            pstmt.setString(42, contact_status);
                            pstmt.setString(43, custom_css);
                            pstmt.setString(44, custom_javascript);

                            pstmt.executeUpdate();
                        }
                    }

                    sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Settings saved successfully.\"}");
                } catch (Exception e) {
                    System.err.println("Error saving settings: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }

    // Handles POST /api/projects-crud (Create/Update) and DELETE /api/projects-crud?id=123
    static class ProjectsCrudHandler implements HttpHandler {
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
            if ("POST".equalsIgnoreCase(method)) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        bos.write(buffer, 0, len);
                    }
                    String body = bos.toString(StandardCharsets.UTF_8);

                    String idStr = extractJsonValue(body, "id");
                    String title = extractJsonValue(body, "title").trim();
                    String description = extractJsonValue(body, "description").trim();
                    String imageUrl = extractJsonValue(body, "image_url").trim();
                    String githubLink = extractJsonValue(body, "github_link").trim();
                    String liveLink = extractJsonValue(body, "live_link").trim();
                    String tags = extractJsonValue(body, "tags").trim();
                    String sortOrderStr = extractJsonValue(body, "sort_order").trim();
                    String isVisibleStr = extractJsonValue(body, "is_visible").trim();

                    if (title.isEmpty()) {
                        sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Title is required.\"}");
                        return;
                    }

                    int sortOrder = 0;
                    if (!sortOrderStr.isEmpty()) {
                        try { sortOrder = Integer.parseInt(sortOrderStr); } catch (Exception e) {}
                    }
                    int isVisible = 1;
                    if (!isVisibleStr.isEmpty()) {
                        try {
                            if ("false".equalsIgnoreCase(isVisibleStr)) isVisible = 0;
                            else if ("true".equalsIgnoreCase(isVisibleStr)) isVisible = 1;
                            else isVisible = Integer.parseInt(isVisibleStr);
                        } catch (Exception e) {}
                    }

                    try (Connection conn = DriverManager.getConnection(DB_URL)) {
                        if (idStr == null || idStr.isEmpty()) {
                            String query = "INSERT INTO projects (title, description, image_url, github_link, live_link, tags, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, title);
                                pstmt.setString(2, description);
                                pstmt.setString(3, imageUrl);
                                pstmt.setString(4, githubLink);
                                pstmt.setString(5, liveLink);
                                pstmt.setString(6, tags);
                                pstmt.setInt(7, sortOrder);
                                pstmt.setInt(8, isVisible);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 201, "application/json", "{\"status\":\"success\",\"message\":\"✓ Project added successfully.\"}");
                        } else {
                            int id = Integer.parseInt(idStr);
                            String query = "UPDATE projects SET title=?, description=?, image_url=?, github_link=?, live_link=?, tags=?, sort_order=?, is_visible=? WHERE id=?";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, title);
                                pstmt.setString(2, description);
                                pstmt.setString(3, imageUrl);
                                pstmt.setString(4, githubLink);
                                pstmt.setString(5, liveLink);
                                pstmt.setString(6, tags);
                                pstmt.setInt(7, sortOrder);
                                pstmt.setInt(8, isVisible);
                                pstmt.setInt(9, id);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Project updated successfully.\"}");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error saving project: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("DELETE".equalsIgnoreCase(method)) {
                String queryParams = exchange.getRequestURI().getQuery();
                int id = -1;
                if (queryParams != null) {
                    String[] params = queryParams.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length > 1 && "id".equals(pair[0])) {
                            try { id = Integer.parseInt(pair[1]); } catch (Exception e) {}
                        }
                    }
                }

                if (id == -1) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing project 'id' parameter.\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "DELETE FROM projects WHERE id = ?";
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, id);
                        pstmt.executeUpdate();
                    }
                    sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Project removed successfully.\"}");
                } catch (SQLException e) {
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }

    // Handles POST /api/education-crud (Create/Update) and DELETE /api/education-crud?id=123
    static class EducationCrudHandler implements HttpHandler {
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
            if ("POST".equalsIgnoreCase(method)) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        bos.write(buffer, 0, len);
                    }
                    String body = bos.toString(StandardCharsets.UTF_8);

                    String idStr = extractJsonValue(body, "id");
                    String degree = extractJsonValue(body, "degree").trim();
                    String institution = extractJsonValue(body, "institution").trim();
                    String timeline = extractJsonValue(body, "timeline").trim();
                    String description = extractJsonValue(body, "description").trim();
                    String sortOrderStr = extractJsonValue(body, "sort_order").trim();
                    String isVisibleStr = extractJsonValue(body, "is_visible").trim();

                    if (degree.isEmpty() || institution.isEmpty()) {
                        sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Degree and Institution are required.\"}");
                        return;
                    }

                    int sortOrder = 0;
                    if (!sortOrderStr.isEmpty()) {
                        try { sortOrder = Integer.parseInt(sortOrderStr); } catch (Exception e) {}
                    }
                    int isVisible = 1;
                    if (!isVisibleStr.isEmpty()) {
                        try {
                            if ("false".equalsIgnoreCase(isVisibleStr)) isVisible = 0;
                            else if ("true".equalsIgnoreCase(isVisibleStr)) isVisible = 1;
                            else isVisible = Integer.parseInt(isVisibleStr);
                        } catch (Exception e) {}
                    }

                    try (Connection conn = DriverManager.getConnection(DB_URL)) {
                        if (idStr == null || idStr.isEmpty()) {
                            String query = "INSERT INTO education (degree, institution, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, degree);
                                pstmt.setString(2, institution);
                                pstmt.setString(3, timeline);
                                pstmt.setString(4, description);
                                pstmt.setInt(5, sortOrder);
                                pstmt.setInt(6, isVisible);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 201, "application/json", "{\"status\":\"success\",\"message\":\"✓ Education item added successfully.\"}");
                        } else {
                            int id = Integer.parseInt(idStr);
                            String query = "UPDATE education SET degree=?, institution=?, timeline=?, description=?, sort_order=?, is_visible=? WHERE id=?";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, degree);
                                pstmt.setString(2, institution);
                                pstmt.setString(3, timeline);
                                pstmt.setString(4, description);
                                pstmt.setInt(5, sortOrder);
                                pstmt.setInt(6, isVisible);
                                pstmt.setInt(7, id);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Education item updated successfully.\"}");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error saving education: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("DELETE".equalsIgnoreCase(method)) {
                String queryParams = exchange.getRequestURI().getQuery();
                int id = -1;
                if (queryParams != null) {
                    String[] params = queryParams.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length > 1 && "id".equals(pair[0])) {
                            try { id = Integer.parseInt(pair[1]); } catch (Exception e) {}
                        }
                    }
                }

                if (id == -1) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing education 'id' parameter.\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "DELETE FROM education WHERE id = ?";
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, id);
                        pstmt.executeUpdate();
                    }
                    sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Education item removed successfully.\"}");
                } catch (SQLException e) {
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }

    // Handles POST /api/experience-crud (Create/Update) and DELETE /api/experience-crud?id=123
    static class ExperienceCrudHandler implements HttpHandler {
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
            if ("POST".equalsIgnoreCase(method)) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        bos.write(buffer, 0, len);
                    }
                    String body = bos.toString(StandardCharsets.UTF_8);

                    String idStr = extractJsonValue(body, "id");
                    String role = extractJsonValue(body, "role").trim();
                    String company = extractJsonValue(body, "company").trim();
                    String timeline = extractJsonValue(body, "timeline").trim();
                    String description = extractJsonValue(body, "description").trim();
                    String sortOrderStr = extractJsonValue(body, "sort_order").trim();
                    String isVisibleStr = extractJsonValue(body, "is_visible").trim();

                    if (role.isEmpty() || company.isEmpty()) {
                        sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Role and Company are required.\"}");
                        return;
                    }

                    int sortOrder = 0;
                    if (!sortOrderStr.isEmpty()) {
                        try { sortOrder = Integer.parseInt(sortOrderStr); } catch (Exception e) {}
                    }
                    int isVisible = 1;
                    if (!isVisibleStr.isEmpty()) {
                        try {
                            if ("false".equalsIgnoreCase(isVisibleStr)) isVisible = 0;
                            else if ("true".equalsIgnoreCase(isVisibleStr)) isVisible = 1;
                            else isVisible = Integer.parseInt(isVisibleStr);
                        } catch (Exception e) {}
                    }

                    try (Connection conn = DriverManager.getConnection(DB_URL)) {
                        if (idStr == null || idStr.isEmpty()) {
                            String query = "INSERT INTO experience (role, company, timeline, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, role);
                                pstmt.setString(2, company);
                                pstmt.setString(3, timeline);
                                pstmt.setString(4, description);
                                pstmt.setInt(5, sortOrder);
                                pstmt.setInt(6, isVisible);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 201, "application/json", "{\"status\":\"success\",\"message\":\"✓ Focus item added successfully.\"}");
                        } else {
                            int id = Integer.parseInt(idStr);
                            String query = "UPDATE experience SET role=?, company=?, timeline=?, description=?, sort_order=?, is_visible=? WHERE id=?";
                            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                                pstmt.setString(1, role);
                                pstmt.setString(2, company);
                                pstmt.setString(3, timeline);
                                pstmt.setString(4, description);
                                pstmt.setInt(5, sortOrder);
                                pstmt.setInt(6, isVisible);
                                pstmt.setInt(7, id);
                                pstmt.executeUpdate();
                            }
                            sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Focus item updated successfully.\"}");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error saving experience: " + e.getMessage());
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else if ("DELETE".equalsIgnoreCase(method)) {
                String queryParams = exchange.getRequestURI().getQuery();
                int id = -1;
                if (queryParams != null) {
                    String[] params = queryParams.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length > 1 && "id".equals(pair[0])) {
                            try { id = Integer.parseInt(pair[1]); } catch (Exception e) {}
                        }
                    }
                }

                if (id == -1) {
                    sendResponse(exchange, 400, "application/json", "{\"status\":\"error\",\"message\":\"Missing focus 'id' parameter.\"}");
                    return;
                }

                try (Connection conn = DriverManager.getConnection(DB_URL)) {
                    String sql = "DELETE FROM experience WHERE id = ?";
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, id);
                        pstmt.executeUpdate();
                    }
                    sendResponse(exchange, 200, "application/json", "{\"status\":\"success\",\"message\":\"✓ Focus item removed successfully.\"}");
                } catch (SQLException e) {
                    sendResponse(exchange, 500, "application/json", "{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
            } else {
                sendResponse(exchange, 405, "application/json", "{\"status\":\"error\",\"message\":\"Method Not Allowed\"}");
            }
        }
    }
}
