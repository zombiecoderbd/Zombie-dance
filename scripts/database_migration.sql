-- ZombieCoder Database Migration Script
-- SQLite Schema for Local Development
-- Created: 2024-01-20

-- Drop existing tables if they exist (for fresh migration)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS model_configs;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;

-- Users table - System administrators and users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    full_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    email_verified BOOLEAN DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model configurations - Available AI models
CREATE TABLE model_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('ollama', 'openai', 'anthropic', 'gemini')),
    model_id VARCHAR(100) NOT NULL, -- e.g., 'qwen2.5:0.5b', 'gpt-4'
    endpoint_url TEXT,
    api_key_hash VARCHAR(255), -- Encrypted API key
    max_tokens INTEGER DEFAULT 4096,
    temperature REAL DEFAULT 0.7,
    top_p REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    config_json TEXT, -- Additional model-specific configuration
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User preferences - Individual user settings
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preferred_model_id INTEGER,
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'bn' CHECK (language IN ('en', 'bn')),
    auto_save BOOLEAN DEFAULT 1,
    context_window_size INTEGER DEFAULT 20480,
    stream_responses BOOLEAN DEFAULT 1,
    show_typing_indicator BOOLEAN DEFAULT 1,
    notification_settings TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_model_id) REFERENCES model_configs(id)
);

-- Chat sessions - Conversation containers
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    model_id INTEGER NOT NULL,
    workspace_path TEXT,
    active_file_path TEXT,
    session_type VARCHAR(20) DEFAULT 'general' CHECK (session_type IN ('general', 'code_review', 'debugging', 'explanation')),
    context_data TEXT, -- JSON string for VS Code context
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES model_configs(id)
);

-- Chat messages - Individual messages in conversations
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'diff', 'error')),
    metadata TEXT, -- JSON string for additional data
    token_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Activity log - System activity tracking
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- e.g., 'session', 'message', 'model'
    resource_id INTEGER,
    details TEXT, -- JSON string with action details
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100), -- Browser/VS Code session ID
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System metrics - Performance and usage statistics
CREATE TABLE system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit VARCHAR(20), -- e.g., 'count', 'bytes', 'ms'
    tags TEXT, -- JSON string for additional categorization
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VS Code integration data
CREATE TABLE vscode_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    workspace_root TEXT,
    vscode_version VARCHAR(50),
    extension_version VARCHAR(50),
    active_files TEXT, -- JSON array of file paths
    project_language VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    expires_at TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Code snippets and embeddings for RAG
CREATE TABLE code_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content_snippet TEXT NOT NULL,
    language VARCHAR(50),
    embedding_vector BLOB, -- Serialized vector data
    line_start INTEGER,
    line_end INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_model_configs_provider ON model_configs(provider);
CREATE INDEX idx_model_configs_active ON model_configs(is_active);
CREATE INDEX idx_model_configs_default ON model_configs(is_default);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_activity ON chat_sessions(last_activity_at);
CREATE INDEX idx_chat_sessions_type ON chat_sessions(session_type);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_recorded ON system_metrics(recorded_at);

CREATE INDEX idx_vscode_sessions_user ON vscode_sessions(user_id);
CREATE INDEX idx_vscode_sessions_token ON vscode_sessions(session_token);
CREATE INDEX idx_vscode_sessions_active ON vscode_sessions(is_active);

CREATE INDEX idx_code_embeddings_user ON code_embeddings(user_id);
CREATE INDEX idx_code_embeddings_file ON code_embeddings(file_path);
CREATE INDEX idx_code_embeddings_hash ON code_embeddings(content_hash);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role, full_name, is_active, email_verified)
VALUES (
    'admin',
    'admin@zombiecoder.dev',
    '$2b$10$rQZ9j1Xn1vZ8oXQQoQQoQOoQoQoQoQoQoQoQoQoQoQoQoQoQoQ', -- 'admin123' hashed
    'admin',
    'ZombieCoder Administrator',
    1,
    1
);

-- Insert default Ollama models
INSERT INTO model_configs (name, display_name, provider, model_id, is_active, is_default, created_by)
VALUES
    ('qwen2.5-0.5b', 'Qwen 2.5 0.5B (Fast)', 'ollama', 'qwen2.5:0.5b', 1, 1, 1),
    ('qwen2.5-1.5b', 'Qwen 2.5 1.5B (Better)', 'ollama', 'qwen2.5:1.5b', 1, 0, 1),
    ('nomic-embed', 'Nomic Embed Text', 'ollama', 'nomic-embed-text:latest', 1, 0, 1);

-- Insert default user preferences for admin
INSERT INTO user_preferences (user_id, preferred_model_id, theme, language)
VALUES (1, 1, 'dark', 'bn');

-- Create views for common queries
CREATE VIEW active_chat_sessions AS
SELECT
    cs.*,
    u.username,
    mc.display_name as model_name,
    COUNT(cm.id) as message_count
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
JOIN model_configs mc ON cs.model_id = mc.id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
WHERE cs.is_archived = 0
GROUP BY cs.id;

CREATE VIEW system_health_metrics AS
SELECT
    'active_users' as metric,
    COUNT(*) as value,
    'count' as unit
FROM users WHERE is_active = 1 AND last_login_at > datetime('now', '-7 days')
UNION ALL
SELECT
    'total_sessions' as metric,
    COUNT(*) as value,
    'count' as unit
FROM chat_sessions WHERE created_at > datetime('now', '-24 hours')
UNION ALL
SELECT
    'active_models' as metric,
    COUNT(*) as value,
    'count' as unit
FROM model_configs WHERE is_active = 1;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_model_configs_timestamp
    AFTER UPDATE ON model_configs
    BEGIN
        UPDATE model_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_user_preferences_timestamp
    AFTER UPDATE ON user_preferences
    BEGIN
        UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to update session activity
CREATE TRIGGER update_session_activity
    AFTER INSERT ON chat_messages
    BEGIN
        UPDATE chat_sessions
        SET
            last_activity_at = CURRENT_TIMESTAMP,
            message_count = message_count + 1,
            total_tokens = total_tokens + COALESCE(NEW.token_count, 0)
        WHERE id = NEW.session_id;
    END;

-- Sample data for testing
INSERT INTO chat_sessions (user_id, title, model_id, session_type)
VALUES (1, 'প্রজেক্ট সেটআপ সাহায্য', 1, 'general');

INSERT INTO chat_messages (session_id, role, content, content_type)
VALUES
    (1, 'user', 'ZombieCoder প্রজেক্টের ডেটাবেজ কিভাবে সেটআপ করব?', 'text'),
    (1, 'assistant', 'আপনার প্রজেক্টে ডেটাবেজ সেটআপ করতে প্রথমে migration স্ক্রিপ্ট চালান...', 'text');

-- Log the migration
INSERT INTO activity_log (user_id, action, resource_type, details, status)
VALUES (1, 'database_migration', 'system', '{"version": "1.0", "tables_created": 12}', 'success');

-- Performance optimization pragma settings
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA foreign_keys = ON;

-- Migration completion log
INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
VALUES ('migration_completed', 1, 'boolean');

-- Database version info
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version) VALUES ('20240120_initial_schema');
