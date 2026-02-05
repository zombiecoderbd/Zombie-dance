const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'zombi.db');
console.log('Database path:', dbPath);

// Create/open database
const db = new Database(dbPath);

console.log('🚀 Starting database initialization...\n');

// Read migration SQL
const migrationPath = path.join(__dirname, '..', 'scripts', 'database_migration.sql');

if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split and execute SQL statements
const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const statement of statements) {
    if (statement.startsWith('--') || statement.length === 0) {
        continue;
    }

    try {
        db.prepare(statement + ';').run();
        successCount++;
    } catch (error) {
        if (error.message.includes('already exists')) {
            skipCount++;
        } else {
            console.warn('⚠️ SQL warning:', error.message.substring(0, 100));
            errorCount++;
        }
    }
}

console.log(`✅ Database schema initialized:`);
console.log(`   - ${successCount} statements executed`);
console.log(`   - ${skipCount} already exists (skipped)`);
console.log(`   - ${errorCount} warnings\n`);

// Verify tables
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
            console.log('   ⚠️ No models found. Install models with: ollama pull qwen2.5:0.5b');
            return 0;
        }

        let importedCount = 0;
        let updatedCount = 0;

        for (const model of models) {
            const modelName = model.name;
            const modelId = model.model || model.name;
            const displayName = modelName.replace(/[:\-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
                const isDefault = importedCount === 0;
                const config = JSON.stringify({
                    size: model.size,
                    family: model.details?.family,
                    format: model.details?.format
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
            console.log('   ⚠️ Ollama connection timeout. Is Ollama running?');
        } else {
            console.log(`   ⚠️ Could not connect to Ollama: ${error.message}`);
        }
        console.log('   ℹ️  You can import models later or use OpenAI API');
        return 0;
    }
}

importOllamaModels().then(count => {
    console.log(`\n✅ Database initialization complete!`);

    if (count > 0) {
        console.log(`🎉 Imported ${count} new Ollama models\n`);
    } else {
        console.log('ℹ️  To use Ollama models:');
        console.log('   1. Install Ollama: https://ollama.ai');
        console.log('   2. Pull a model: ollama pull qwen2.5:0.5b');
        console.log('   3. Run this script again\n');
    }

    db.close();
    process.exit(0);
}).catch(error => {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
});
