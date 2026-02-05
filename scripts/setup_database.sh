#!/bin/bash

# ZombieCoder Simple Database Setup Script
# Uses sqlite3 CLI to set up the database
# Usage: ./setup_db_simple.sh [--reset] [--mysql]

echo "🧟‍♂️ ZombieCoder ডেটাবেজ সেটআপ শুরু হচ্ছে..."

# Configuration
DB_PATH="$(dirname "$0")/../zombi.db"
BACKUP_PATH="$(dirname "$0")/../zombi_backup.db"
MIGRATION_PATH="$(dirname "$0")/database_migration.sql"

# Parse command line arguments
RESET_MODE=false
USE_MYSQL=false

for arg in "$@"; do
    case $arg in
        --reset)
            RESET_MODE=true
            shift
            ;;
        --mysql)
            USE_MYSQL=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

echo "⚙️  কনফিগারেশন:"
echo "   - ডেটাবেজ টাইপ: $([ "$USE_MYSQL" = true ] && echo "MySQL" || echo "SQLite")"
echo "   - রিসেট মোড: $([ "$RESET_MODE" = true ] && echo "হ্যাঁ" || echo "না")"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_PATH" ]; then
    echo "❌ Migration ফাইল পাওয়া যায়নি: $MIGRATION_PATH"
    exit 1
fi

setup_sqlite() {
    echo "📁 SQLite ডেটাবেজ সেটআপ করা হচ্ছে..."

    # Check if sqlite3 is installed
    if ! command -v sqlite3 &> /dev/null; then
        echo "❌ sqlite3 CLI পাওয়া যায়নি। ইনস্টল করুন: sudo apt install sqlite3"
        exit 1
    fi

    # Create backup if database exists and reset is requested
    if [ "$RESET_MODE" = true ] && [ -f "$DB_PATH" ]; then
        echo "🔄 পুরাতন ডেটাবেজের ব্যাকআপ তৈরি করা হচ্ছে..."
        cp "$DB_PATH" "$BACKUP_PATH"
        rm "$DB_PATH"
        echo "✅ ব্যাকআপ সম্পূর্ণ: $BACKUP_PATH"
    fi

    # Execute migration
    echo "📋 SQL migration চালানো হচ্ছে..."
    if sqlite3 "$DB_PATH" < "$MIGRATION_PATH"; then
        echo "✅ SQLite ডেটাবেজ সেটআপ সম্পূর্ণ"
    else
        echo "❌ SQLite সেটআপ ব্যর্থ"
        exit 1
    fi

    # Update admin password
    echo "🔐 অ্যাডমিন পাসওয়ার্ড আপডেট করা হচ্ছে..."

    # Generate password hash (simple SHA256 for demo)
    ADMIN_HASH=$(echo -n "admin123" | sha256sum | cut -d' ' -f1)

    sqlite3 "$DB_PATH" "UPDATE users SET password_hash = '$ADMIN_HASH' WHERE username = 'admin';"

    if [ $? -eq 0 ]; then
        echo "✅ অ্যাডমিন পাসওয়ার্ড আপডেট সম্পূর্ণ"
    else
        echo "⚠️ অ্যাডমিন পাসওয়ার্ড আপডেট ব্যর্থ"
    fi
}

setup_mysql() {
    echo "🐬 MySQL ডেটাবেজ সেটআপ করা হচ্ছে..."

    # Check if mysql is installed
    if ! command -v mysql &> /dev/null; then
        echo "❌ MySQL CLI পাওয়া যায়নি। ইনস্টল করুন: sudo apt install mysql-client"
        exit 1
    fi

    # MySQL connection details
    DB_HOST="localhost"
    DB_PORT="3306"
    DB_NAME="zombi"
    DB_USER="root"
    DB_PASS="105585"

    # Create database if not exists
    echo "📊 ডেটাবেজ তৈরি করা হচ্ছে..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

    if [ $? -eq 0 ]; then
        echo "✅ ডেটাবেজ '$DB_NAME' তৈরি/নিশ্চিত করা হয়েছে"
    else
        echo "❌ MySQL ডেটাবেজ তৈরি ব্যর্থ"
        exit 1
    fi

    # Convert SQLite migration to MySQL compatible
    echo "🔄 SQLite migration কে MySQL এর জন্য রূপান্তর করা হচ্ছে..."

    # Create temporary MySQL migration file
    MYSQL_MIGRATION="/tmp/mysql_migration.sql"

    # Convert SQLite syntax to MySQL
    sed 's/INTEGER PRIMARY KEY AUTOINCREMENT/INT AUTO_INCREMENT PRIMARY KEY/g;
         s/TEXT/TEXT/g;
         s/REAL/DECIMAL(10,4)/g;
         s/BOOLEAN/TINYINT(1)/g;
         s/BLOB/LONGBLOB/g;
         /^PRAGMA/d;
         /^CREATE TRIGGER/,/^END;/d' "$MIGRATION_PATH" > "$MYSQL_MIGRATION"

    # Execute MySQL migration
    echo "📋 MySQL migration চালানো হচ্ছে..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MYSQL_MIGRATION"

    if [ $? -eq 0 ]; then
        echo "✅ MySQL ডেটাবেজ সেটআপ সম্পূর্ণ"
    else
        echo "❌ MySQL migration ব্যর্থ"
        exit 1
    fi

    # Update admin password
    echo "🔐 অ্যাডমিন পাসওয়ার্ড আপডেট করা হচ্ছে..."
    ADMIN_HASH=$(echo -n "admin123" | sha256sum | cut -d' ' -f1)

    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "UPDATE users SET password_hash = '$ADMIN_HASH' WHERE username = 'admin';"

    if [ $? -eq 0 ]; then
        echo "✅ অ্যাডমিন পাসওয়ার্ড আপডেট সম্পূর্ণ"
    else
        echo "⚠️ অ্যাডমিন পাসওয়ার্ড আপডেট ব্যর্থ"
    fi

    # Clean up temporary file
    rm -f "$MYSQL_MIGRATION"
}

test_connection() {
    echo "🧪 ডেটাবেজ সংযোগ পরীক্ষা করা হচ্ছে..."

    if [ "$USE_MYSQL" = true ]; then
        # Test MySQL connection
        USER_COUNT=$(mysql -h localhost -P 3306 -u root -p105585 zombi -se "SELECT COUNT(*) FROM users;" 2>/dev/null)
        MODEL_COUNT=$(mysql -h localhost -P 3306 -u root -p105585 zombi -se "SELECT COUNT(*) FROM model_configs WHERE is_active = 1;" 2>/dev/null)

        if [ -n "$USER_COUNT" ]; then
            echo "✅ MySQL: ${USER_COUNT}টি ব্যবহারকারী পাওয়া গেছে"
            echo "✅ MySQL: ${MODEL_COUNT}টি সক্রিয় মডেল পাওয়া গেছে"
        else
            echo "❌ MySQL সংযোগ পরীক্ষা ব্যর্থ"
            exit 1
        fi
    else
        # Test SQLite connection
        if [ -f "$DB_PATH" ]; then
            USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null)
            MODEL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM model_configs WHERE is_active = 1;" 2>/dev/null)
            TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null)

            if [ -n "$USER_COUNT" ]; then
                echo "✅ SQLite: ${USER_COUNT}টি ব্যবহারকারী পাওয়া গেছে"
                echo "✅ SQLite: ${MODEL_COUNT}টি সক্রিয় মডেল পাওয়া গেছে"
                echo "✅ SQLite: ${TABLE_COUNT}টি টেবিল তৈরি হয়েছে"
            else
                echo "❌ SQLite সংযোগ পরীক্ষা ব্যর্থ"
                exit 1
            fi
        else
            echo "❌ ডেটাবেজ ফাইল পাওয়া যায়নি: $DB_PATH"
            exit 1
        fi
    fi
}

create_env_file() {
    echo "📝 .env ফাইল তৈরি করা হচ্ছে..."

    ENV_PATH="$(dirname "$0")/../.env"
    BACKEND_ENV_PATH="$(dirname "$0")/../backend/.env"

    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your_jwt_secret_here")
    SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your_session_secret_here")

    # Create .env content
    cat > "$ENV_PATH" << EOF
# ZombieCoder Environment Configuration
# Database Configuration
DB_TYPE=$([ "$USE_MYSQL" = true ] && echo "mysql" || echo "sqlite")
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zombi
DB_USER=root
DB_PASSWORD=105585
DATABASE_URL=$([ "$USE_MYSQL" = true ] && echo "mysql://root:105585@localhost:3306/zombi" || echo "sqlite:$DB_PATH")

# Server Configuration
PORT=8001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# API Keys (Fill these in manually)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_TIMEOUT=30000

# Features
ENABLE_WEBSOCKETS=true
ENABLE_STREAMING=true
ENABLE_RAG=true
ENABLE_TERMINAL_COMMANDS=false

# Logging
LOG_LEVEL=info
LOG_FILE=logs/zombiecoder.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# VS Code Integration
VSCODE_SESSION_TIMEOUT=3600000
VSCODE_MAX_CONTEXT_SIZE=20480

# Generated at: $(date -Iseconds)
EOF

    # Copy to backend directory if it exists
    if [ -d "$(dirname "$BACKEND_ENV_PATH")" ]; then
        cp "$ENV_PATH" "$BACKEND_ENV_PATH"
        echo "✅ ব্যাকএন্ড .env ফাইল: $BACKEND_ENV_PATH"
    fi

    echo "✅ .env ফাইল তৈরি সম্পূর্ণ: $ENV_PATH"
}

add_test_data() {
    echo "📊 টেস্ট ডেটা যোগ করা হচ্ছে..."

    if [ "$USE_MYSQL" = true ]; then
        # MySQL test data
        mysql -h localhost -P 3306 -u root -p105585 zombi << EOF
INSERT IGNORE INTO chat_sessions (user_id, title, model_id, session_type)
VALUES (1, 'প্রাথমিক সেটআপ টেস্ট', 1, 'general');

SET @session_id = LAST_INSERT_ID();

INSERT INTO chat_messages (session_id, role, content, content_type, token_count) VALUES
(@session_id, 'user', 'হ্যালো ZombieCoder!', 'text', 10),
(@session_id, 'assistant', 'আসসালামু আলাইকুম! আমি ZombieCoder। আমি আপনাকে কোড লিখতে এবং সমস্যা সমাধানে সাহায্য করতে পারি। 🧟‍♂️', 'text', 25);

INSERT INTO activity_log (user_id, action, resource_type, details, status)
VALUES (1, 'database_setup', 'system', '{"version": "1.0.0", "method": "mysql-cli"}', 'success');
EOF
    else
        # SQLite test data
        sqlite3 "$DB_PATH" << EOF
INSERT OR IGNORE INTO chat_sessions (user_id, title, model_id, session_type)
VALUES (1, 'প্রাথমিক সেটআপ টেস্ট', 1, 'general');

INSERT INTO chat_messages (session_id, role, content, content_type, token_count) VALUES
(last_insert_rowid(), 'user', 'হ্যালো ZombieCoder!', 'text', 10),
(last_insert_rowid(), 'assistant', 'আসসালামু আলাইকুম! আমি ZombieCoder। আমি আপনাকে কোড লিখতে এবং সমস্যা সমাধানে সাহায্য করতে পারি। 🧟‍♂️', 'text', 25);

INSERT INTO activity_log (user_id, action, resource_type, details, status)
VALUES (1, 'database_setup', 'system', '{"version": "1.0.0", "method": "sqlite-cli"}', 'success');
EOF
    fi

    if [ $? -eq 0 ]; then
        echo "✅ টেস্ট ডেটা যোগ করা সম্পূর্ণ"
    else
        echo "⚠️ টেস্ট ডেটা যোগ করতে সমস্যা"
    fi
}

# Main execution
main() {
    # Setup database
    if [ "$USE_MYSQL" = true ]; then
        setup_mysql
    else
        setup_sqlite
    fi

    # Test connection
    test_connection

    # Add test data
    add_test_data

    # Create configuration files
    create_env_file

    echo ""
    echo "🎉 ডেটাবেজ সেটআপ সফলভাবে সম্পূর্ণ হয়েছে!"
    echo ""
    echo "📋 পরবর্তী পদক্ষেপ:"
    echo "1. ব্যাকএন্ড সার্ভার চালান: cd backend && npm run dev"
    echo "2. ফ্রন্টএন্ড চালান: npm run dev"
    echo "3. অ্যাডমিন প্যানেল দেখুন: http://localhost:3000/admin"
    echo "4. অ্যাডমিন লগইন: admin / admin123"
    echo ""
    echo "📊 ডেটাবেজ তথ্য:"
    if [ "$USE_MYSQL" = true ]; then
        echo "   - টাইপ: MySQL"
        echo "   - সার্ভার: localhost:3306"
        echo "   - ডেটাবেজ: zombi"
    else
        echo "   - টাইপ: SQLite"
        echo "   - ফাইল: $DB_PATH"
        if [ -f "$DB_PATH" ]; then
            echo "   - সাইজ: $(du -h "$DB_PATH" | cut -f1)"
        fi
    fi
    echo ""
    echo "🔧 কনফিগারেশন সমাপ্ত!"
}

# Error handling
set -e
trap 'echo "❌ স্ক্রিপ্ট ব্যর্থ হয়েছে লাইন $LINENO এ"; exit 1' ERR

# Run main function
main

echo "✅ সেটআপ সম্পূর্ণ!"
