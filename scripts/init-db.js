#!/usr/bin/env node

/**
 * ZombieCoder Database Initialization Script
 * Initializes database schema and imports Ollama models
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DB_PATH = path.join(__dirname, '../zombi.db');
const MIGRATION_PATH = path.join(__dirname, 'database_migration.sql');

console.log('🧟 ZombieCoder Database Initialization\n');

/**
 * Initialize database schema
 */
function initializeSchema() {
    console.log('📦 Initializing database schema...');

    try {
        const db = new Database(DB_PATH);

        // Configure SQLite
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('foreign_keys = ON');

        if (!fs.existsSync(MIGRATION_PATH)) {
            console.error(`❌ Migration file not found: ${MIGRATION_PATH}`);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');

        // Execute migration
        db.exec(migrationSQL);

        console.log('✅ Database schema initialized successfully');

        return db;
    } catch (error) {
        console.error('❌ Failed to initialize schema:', error.message);
        throw error;
    }
}

/**
 * Fetch Ollama models
 */
async function fetchOllamaModels() {
    console.log(`\n🔍 Fetching Ollama models from ${OLLAMA_HOST}...`);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.models || [];

        console.log(`✅ Found ${models.length} Ollama models`);

        return models;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⚠️  Ollama connection timeout');
        } else {
            console.warn('⚠️  Failed to fetch Ollama models:', error.message);
        }
        console.warn('   Make sure Ollama is running: ollama serve');
        return [];
    }
}

/**
 * Format model name for display
 */
function formatDisplayName(modelName) {
    let name = modelName.replace(/[:\-_]/g, ' ');
    name = name.replace(/\b\w/g, char => char.toUpperCase());
    name = name.replace(/\s+/g, ' ').trim();
    name = name.replace(/(\d+\.?\d*)\s*b\b/gi, '$1B');
    return name;
}

/**
 * Import Ollama models to database
 */
async function importOllamaModels(db) {
    console.log('\n🤖 Importing Ollama models...');

    const models = await fetchOllamaModels();

    if (models.length === 0) {
        console.warn('⚠️  No models to import');
        return 0;
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const insertStmt = db.prepare(`
        INSERT INTO model_configs
        (name, display_name, provider, model_id, is_active, is_default, config_json, created_by)
        VALUES (?, ?, 'ollama', ?, 1, ?, ?, 1)
    `);

    const updateStmt = db.prepare(`
        UPDATE model_configs
        SET name = ?, display_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE model_id = ?
    `);

    const checkStmt = db.prepare(`
        SELECT id FROM model_configs WHERE model_id = ?
    `);

    for (const model of models) {
        try {
            const modelName = model.name;
            const modelId = model.model || model.name;
            const displayName = formatDisplayName(modelName);

            const existing = checkStmt.get(modelId);

            if (existing) {
                updateStmt.run(modelName, displayName, modelId);
                updated++;
                console.log(`   ↻ Updated: ${displayName}`);
            } else {
                const isDefault = imported === 0 ? 1 : 0;

                const config = JSON.stringify({
                    size: model.size,
                    family: model.details?.family,
                    format: model.details?.format,
                    parameter_size: model.details?.parameter_size
                });

                insertStmt.run(modelName, displayName, modelId, isDefault, config);
                imported++;
                console.log(`   ✓ Imported: ${displayName}${isDefault ? ' (default)' : ''}`);
            }
        } catch (error) {
            console.warn(`   ✗ Failed to import ${model.name}:`, error.message);
            skipped++;
        }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   • New models: ${imported}`);
    console.log(`   • Updated: ${updated}`);
    console.log(`   • Skipped: ${skipped}`);

    return imported + updated;
}

/**
 * Verify database tables
 */
function verifyDatabase(db) {
    console.log('\n🔍 Verifying database tables...');

    const tables = [
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

    const checkStmt = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name=?
    `);

    let allExists = true;

    for (const table of tables) {
        const exists = checkStmt.get(table);
        if (exists) {
            console.log(`   ✓ ${table}`);
        } else {
            console.log(`   ✗ ${table} (missing)`);
            allExists = false;
        }
    }

    return allExists;
}

/**
 * Get database statistics
 */
function getDatabaseStats(db) {
    console.log('\n📊 Database Statistics:');

    try {
        const stats = {
            users: db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0,
            models: db.prepare('SELECT COUNT(*) as count FROM model_configs').get()?.count || 0,
            sessions: db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get()?.count || 0,
            messages: db.prepare('SELECT COUNT(*) as count FROM chat_messages').get()?.count || 0,
            activeModels: db.prepare('SELECT COUNT(*) as count FROM model_configs WHERE is_active = 1').get()?.count || 0
        };

        console.log(`   • Users: ${stats.users}`);
        console.log(`   • Models: ${stats.models} (${stats.activeModels} active)`);
        console.log(`   • Sessions: ${stats.sessions}`);
        console.log(`   • Messages: ${stats.messages}`);

        return stats;
    } catch (error) {
        console.warn('⚠️  Could not fetch stats:', error.message);
        return null;
    }
}

/**
 * List available models
 */
function listModels(db) {
    console.log('\n🎯 Available Models:');

    try {
        const models = db.prepare(`
            SELECT display_name, provider, model_id, is_active, is_default
            FROM model_configs
            ORDER BY is_default DESC, display_name ASC
        `).all();

        if (models.length === 0) {
            console.log('   No models configured');
            return;
        }

        models.forEach(model => {
            const status = model.is_active ? '✓' : '✗';
            const defaultTag = model.is_default ? ' [DEFAULT]' : '';
            console.log(`   ${status} ${model.display_name}${defaultTag}`);
            console.log(`      Provider: ${model.provider}, Model ID: ${model.model_id}`);
        });
    } catch (error) {
        console.warn('⚠️  Could not list models:', error.message);
    }
}

/**
 * Main initialization
 */
async function main() {
    let db;

    try {
        // Initialize schema
        db = initializeSchema();

        // Verify tables
        if (!verifyDatabase(db)) {
            throw new Error('Database verification failed');
        }

        // Import Ollama models
        await importOllamaModels(db);

        // Show stats
        getDatabaseStats(db);

        // List models
        listModels(db);

        console.log('\n✅ Database initialization complete!');
        console.log(`📁 Database location: ${DB_PATH}\n`);

        db.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Initialization failed:', error.message);
        if (db) db.close();
        process.exit(1);
    }
}

// Run
main();
