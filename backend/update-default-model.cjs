const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'zombi.db');
console.log('🗄️  Database path:', dbPath);

try {
    const db = new Database(dbPath);

    console.log('📊 Current default model:');
    const currentDefault = db.prepare('SELECT name, model_id, is_default FROM model_configs WHERE is_default = 1').get();
    console.log('   ', JSON.stringify(currentDefault, null, 2));

    // Check if the default model exists in Ollama
    const availableModel = 'qwen2.5-coder:0.5b';
    console.log('\n🔄 Updating default model to:', availableModel);

    // Remove default from all models
    db.prepare('UPDATE model_configs SET is_default = 0').run();

    // Set new default
    const result = db.prepare(`
        UPDATE model_configs
        SET is_default = 1
        WHERE model_id = ?
    `).run(availableModel);

    if (result.changes > 0) {
        console.log('✅ Default model updated successfully!');

        const newDefault = db.prepare('SELECT name, model_id, is_default FROM model_configs WHERE is_default = 1').get();
        console.log('\n📊 New default model:');
        console.log('   ', JSON.stringify(newDefault, null, 2));
    } else {
        console.log('❌ Failed to update default model. Model not found in database.');
    }

    db.close();
    console.log('\n✅ Done!');
    process.exit(0);

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
