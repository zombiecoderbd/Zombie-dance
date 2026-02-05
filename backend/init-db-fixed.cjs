const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'zombi.db');
console.log('🗄️  Database path:', dbPath);

// Create/open database
const db = new Database(dbPath);

console.log('🚀 Starting database initialization...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables in correct order (respecting foreign key dependencies)
const createTablesSQL = `
-- Users table (no dependencies)
CREATE TABLE IF NOT EXISTS users (
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

-- Model configurations (depends on users)
CREATE TABLE IF NOT EXISTS model_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('ollama', 'openai', 'anthropic', 'gemini')),
    model_id VARCHAR(100) NOT NULL,
    endpoint_url TEXT,
    api_key_hash VARCHAR(255),
    max_tokens INTEGER DEFAULT 4096,
    temperature REAL DEFAULT 0.7,
    top_p REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    config_json TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User preferences (depends on users and model_configs)
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preferred_model_id INTEGER,
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'bn' CHECK (language IN ('en', 'bn')),
    auto_save BOOLEAN DEFAULT 1,
    context_window_size INTEGER DEFAULT 20480,
    stream_responses BOOLEAN DEFAULT 1,
    show_typing_indicator BOOLEAN DEFAULT 1,
    notification_settings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_model_id) REFERENCES model_configs(id)
);

-- Chat sessions (depends on users and model_configs)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    model_id INTEGER NOT NULL,
    workspace_path TEXT,
    active_file_path TEXT,
    session_type VARCHAR(20) DEFAULT 'general' CHECK (session_type IN ('general', 'code_review', 'debugging', 'explanation')),
    context_data TEXT,
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES model_configs(id)
);

-- Chat messages (depends on chat_sessions)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'code', 'diff', 'error')),
    metadata TEXT,
    token_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Activity log (depends on users)
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System metrics (no dependencies)
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit VARCHAR(20),
    tags TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VS Code sessions (depends on users)
CREATE TABLE IF NOT EXISTS vscode_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    workspace_root TEXT,
    vscode_version VARCHAR(50),
    extension_version VARCHAR(50),
    active_files TEXT,
    project_language VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    expires_at TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Code embeddings (depends on users)
CREATE TABLE IF NOT EXISTS code_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content_snippet TEXT NOT NULL,
    language VARCHAR(50),
    embedding_vector BLOB,
    line_start INTEGER,
    line_end INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Schema migrations tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

console.log('📋 Creating tables...');
try {
    db.exec(createTablesSQL);
    console.log('✅ Tables created successfully\n');
} catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
}

// Create indexes
console.log('🔍 Creating indexes...');
const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_model_configs_provider ON model_configs(provider)',
    'CREATE INDEX IF NOT EXISTS idx_model_configs_active ON model_configs(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_activity ON chat_sessions(last_activity_at)',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role)',
    'CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action)',
    'CREATE INDEX IF NOT EXISTS idx_vscode_sessions_user ON vscode_sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_vscode_sessions_token ON vscode_sessions(session_token)',
    'CREATE INDEX IF NOT EXISTS idx_code_embeddings_user ON code_embeddings(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_code_embeddings_file ON code_embeddings(file_path)'
];

indexes.forEach(idx => {
    try {
        db.exec(idx);
    } catch (error) {
        console.warn('⚠️  Index warning:', error.message.substring(0, 80));
    }
});
console.log('✅ Indexes created\n');

// Insert default data
console.log('📝 Inserting default data...');

// Check if admin user exists
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

if (!adminExists) {
    db.prepare(`
        INSERT INTO users (username, email, password_hash, role, full_name, is_active, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        'admin',
        'admin@zombiecoder.dev',
        '$2b$10$rQZ9j1Xn1vZ8oXQQoQQoQOoQoQoQoQoQoQoQoQoQoQoQoQoQoQ',
        'admin',
        'ZombieCoder Administrator',
        1,
        1
    );
    console.log('   ✅ Created admin user');
} else {
    console.log('   ℹ️  Admin user already exists');
}

// Check if default models exist
const modelCount = db.prepare('SELECT COUNT(*) as count FROM model_configs').get().count;

if (modelCount === 0) {
    const defaultModels = [
        ['qwen2.5-0.5b', 'Qwen 2.5 0.5B (Fast)', 'ollama', 'qwen2.5:0.5b', 1, 1],
        ['qwen2.5-1.5b', 'Qwen 2.5 1.5B (Better)', 'ollama', 'qwen2.5:1.5b', 1, 0],
        ['nomic-embed', 'Nomic Embed Text', 'ollama', 'nomic-embed-text:latest', 1, 0]
    ];

    const insertModel = db.prepare(`
        INSERT INTO model_configs (name, display_name, provider, model_id, is_active, is_default, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    defaultModels.forEach(model => {
        insertModel.run(...model);
    });
    console.log('   ✅ Created default models');
} else {
    console.log('   ℹ️  Models already exist');
}

// Mark migration as complete
try {
    db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)').run('20240120_initial_schema');
} catch (error) {
    // Ignore if already exists
}

console.log('\n✅ Default data inserted\n');

// Verify all tables
const requiredTables = [
    'users',
    'model_configs',
    'user_preferences',
    'chat_sessions',
    'chat_messages',
    'activity_log',
    'system_metrics',
    'vscode_sessions',
    'code_embeddings'
];

console.log('🔍 Verifying tables...');
let allTablesExist = true;

for (const table of requiredTables) {
    const result = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(table);

    if (result) {
        console.log(`   ✅ ${table}`);
    } else {
        console.log(`   ❌ ${table} - MISSING!`);
        allTablesExist = false;
    }
}

if (!allTablesExist) {
    console.error('\n❌ Some required tables are missing!');
    db.close();
    process.exit(1);
}

// Get database statistics
console.log('\n📊 Database Statistics:');
const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    models: db.prepare('SELECT COUNT(*) as count FROM model_configs').get().count,
    sessions: db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get().count,
    messages: db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count,
    activeModels: db.prepare('SELECT COUNT(*) as count FROM model_configs WHERE is_active = 1').get().count
};

console.log(`   - Users: ${stats.users}`);
console.log(`   - Models: ${stats.models} (${stats.activeModels} active)`);
console.log(`   - Chat Sessions: ${stats.sessions}`);
console.log(`   - Chat Messages: ${stats.messages}`);

// Import Ollama models
console.log('\n🤖 Checking Ollama models...');

async function importOllamaModels() {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${ollamaHost}/api/tags`, {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        const models = data.models || [];

        console.log(`   Found ${models.length} Ollama models`);

        if (models.length === 0) {
            console.log('   ⚠️  No models found. Install models with: ollama pull qwen2.5:0.5b');
            return 0;
        }

        let importedCount = 0;
        let updatedCount = 0;

        for (const model of models) {
            const modelName = model.name;
            const modelId = model.model || model.name;
            const displayName = modelName
                .replace(/[:\-_]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
                .replace(/(\d+\.?\d*)\s*b\b/gi, '$1B');

            // Check if exists
            const existing = db.prepare('SELECT id FROM model_configs WHERE model_id = ?').get(modelId);

            if (existing) {
                db.prepare(`
                    UPDATE model_configs
                    SET name = ?, display_name = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE model_id = ?
                `).run(modelName, displayName, modelId);
                updatedCount++;
            } else {
                const isDefault = importedCount === 0 && stats.activeModels === 0;
                const config = JSON.stringify({
                    size: model.size,
                    family: model.details?.family,
                    format: model.details?.format,
                    parameter_size: model.details?.parameter_size
                });

                db.prepare(`
                    INSERT INTO model_configs
                    (name, display_name, provider, model_id, is_active, is_default, config_json, created_by)
                    VALUES (?, ?, 'ollama', ?, 1, ?, ?, 1)
                `).run(modelName, displayName, modelId, isDefault ? 1 : 0, config);

                importedCount++;
                console.log(`   ✅ Imported: ${modelName}`);
            }
        }

        if (updatedCount > 0) {
            console.log(`   📝 Updated ${updatedCount} existing models`);
        }

        return importedCount;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('   ⚠️  Ollama connection timeout. Is Ollama running?');
        } else {
            console.log(`   ⚠️  Could not connect to Ollama: ${error.message}`);
        }
        console.log('   ℹ️  You can import models later or use OpenAI API');
        return 0;
    }
}

importOllamaModels().then(count => {
    console.log(`\n✅ Database initialization complete!`);

    if (count > 0) {
        console.log(`🎉 Imported ${count} new Ollama models`);
    } else {
        console.log('\nℹ️  To use Ollama models:');
        console.log('   1. Install Ollama: https://ollama.ai');
        console.log('   2. Pull a model: ollama pull qwen2.5:0.5b');
        console.log('   3. Restart the backend server');
    }

    console.log('\n🚀 You can now start the backend server:');
    console.log('   cd backend && npm run dev\n');

    db.close();
    process.exit(0);
}).catch(error => {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
});
