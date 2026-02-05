#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                    🧟 ZombieCoder Zed Installer 🧟                       ║
# ║         গরিবদের জন্য ফ্রি AI - Installation Script                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║   ███████╗ ██████╗ ███╗   ███╗██████╗ ██╗███████╗               ║"
    echo "║   ╚══███╔╝██╔═══██╗████╗ ████║██╔══██╗██║██╔════╝               ║"
    echo "║     ███╔╝ ██║   ██║██╔████╔██║██████╔╝██║█████╗                 ║"
    echo "║    ███╔╝  ██║   ██║██║╚██╔╝██║██╔══██╗██║██╔══╝                 ║"
    echo "║   ███████╗╚██████╔╝██║ ╚═╝ ██║██████╔╝██║███████╗               ║"
    echo "║   ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝╚══════╝               ║"
    echo "║                                                                  ║"
    echo "║              🧟 ZombieCoder for Zed Editor 🧟                    ║"
    echo "║           গরিবদের জন্য ফ্রি AI - Free AI for All                   ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print colored message
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

# Print step
print_step() {
    echo -e "${CYAN}[*]${NC} $1"
}

# Print success
print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Print error
print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
        CYGWIN*|MINGW*|MSYS*) OS="windows";;
        *)          OS="unknown";;
    esac
    echo $OS
}

# Get Zed config directory
get_zed_config_dir() {
    local os=$(detect_os)
    case $os in
        linux)
            echo "$HOME/.config/zed"
            ;;
        macos)
            echo "$HOME/Library/Application Support/Zed"
            ;;
        windows)
            echo "$APPDATA/Zed"
            ;;
        *)
            echo "$HOME/.config/zed"
            ;;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    local missing=()

    # Check Node.js
    if ! command_exists node; then
        missing+=("node")
        print_warning "Node.js is not installed"
    else
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 16 ]; then
            print_warning "Node.js version should be 16 or higher (found: $(node -v))"
        else
            print_success "Node.js $(node -v) found"
        fi
    fi

    # Check npm
    if ! command_exists npm; then
        missing+=("npm")
        print_warning "npm is not installed"
    else
        print_success "npm $(npm -v) found"
    fi

    # Check if Zed is installed
    if command_exists zed; then
        print_success "Zed editor found"
    else
        print_warning "Zed editor not found in PATH (may still be installed)"
    fi

    # Check Ollama
    if command_exists ollama; then
        print_success "Ollama found"

        # Check if Ollama is running
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            print_success "Ollama server is running"
        else
            print_warning "Ollama is installed but not running. Start it with: ollama serve"
        fi
    else
        print_warning "Ollama is not installed (optional but recommended for AI features)"
        echo -e "         Install from: ${BLUE}https://ollama.ai/download${NC}"
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Please install the missing tools and try again."
        echo ""
        echo "Installation guides:"
        echo "  Node.js: https://nodejs.org/"
        echo "  Ollama:  https://ollama.ai/download"
        return 1
    fi

    return 0
}

# Install npm dependencies
install_dependencies() {
    print_step "Installing npm dependencies..."

    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "package.json not found. Are you in the correct directory?"
        return 1
    fi
}

# Build the extension
build_extension() {
    print_step "Building extension..."

    if [ -f "build.js" ]; then
        node build.js
        print_success "Extension built successfully"
    else
        print_error "build.js not found"
        return 1
    fi
}

# Install Zed configuration
install_zed_config() {
    local zed_config_dir=$(get_zed_config_dir)

    print_step "Installing Zed configuration to: $zed_config_dir"

    # Create config directory if it doesn't exist
    mkdir -p "$zed_config_dir"

    # Backup existing settings if they exist
    if [ -f "$zed_config_dir/settings.json" ]; then
        local backup_file="$zed_config_dir/settings.json.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$zed_config_dir/settings.json" "$backup_file"
        print_warning "Existing settings backed up to: $backup_file"
    fi

    if [ -f "$zed_config_dir/keymap.json" ]; then
        local backup_file="$zed_config_dir/keymap.json.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$zed_config_dir/keymap.json" "$backup_file"
        print_warning "Existing keymap backed up to: $backup_file"
    fi

    # Copy new configuration files
    if [ -f "config/zed_settings.json" ]; then
        cp "config/zed_settings.json" "$zed_config_dir/settings.json"
        print_success "Settings installed"
    else
        print_warning "zed_settings.json not found in config/"
    fi

    if [ -f "config/zed_keymap.json" ]; then
        cp "config/zed_keymap.json" "$zed_config_dir/keymap.json"
        print_success "Keymap installed"
    else
        print_warning "zed_keymap.json not found in config/"
    fi
}

# Install Ollama models
install_ollama_models() {
    print_step "Would you like to install recommended Ollama models?"
    echo ""
    echo "Available options:"
    echo "  1) Lightweight (3B) - Best for 4-8GB RAM"
    echo "  2) Balanced (7B)    - Best for 8-16GB RAM"
    echo "  3) Full (14B+)      - Best for 16GB+ RAM"
    echo "  4) Skip model installation"
    echo ""
    read -p "Enter your choice [1-4]: " model_choice

    case $model_choice in
        1)
            print_step "Installing lightweight models..."
            ollama pull qwen2.5-coder:3b && print_success "qwen2.5-coder:3b installed"
            ollama pull starcoder2:3b && print_success "starcoder2:3b installed"
            ;;
        2)
            print_step "Installing balanced models..."
            ollama pull qwen2.5-coder:7b && print_success "qwen2.5-coder:7b installed"
            ollama pull deepseek-coder-v2:lite && print_success "deepseek-coder-v2:lite installed"
            ollama pull codellama:7b && print_success "codellama:7b installed"
            ;;
        3)
            print_step "Installing full models..."
            ollama pull deepseek-coder-v2:16b && print_success "deepseek-coder-v2:16b installed"
            ollama pull qwen2.5-coder:14b && print_success "qwen2.5-coder:14b installed"
            ;;
        4)
            print_warning "Skipping model installation"
            echo "You can install models later with: ollama pull <model-name>"
            ;;
        *)
            print_warning "Invalid choice, skipping model installation"
            ;;
    esac
}

# Create helper scripts
create_helper_scripts() {
    print_step "Creating helper scripts..."

    # Create start script
    cat > start_zombiecoder.sh << 'STARTSCRIPT'
#!/bin/bash
# Start ZombieCoder services

echo "🧟 Starting ZombieCoder Services..."

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama server..."
    ollama serve &
    sleep 2
fi

# Check if services are running
echo ""
echo "Service Status:"
echo "==============="

# Check Ollama
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✓ Ollama:       Running (http://localhost:11434)"

    # List available models
    echo ""
    echo "Available Models:"
    ollama list 2>/dev/null || echo "  (none installed)"
else
    echo "✗ Ollama:       Not running"
fi

# Check ZombieCoder services (if running)
services=(
    "Main App:3000"
    "WebSocket:3003"
    "LSP:3004"
    "DAP:3005"
    "Proxy:5010"
    "Codebase Sync:5051"
)

echo ""
for service in "${services[@]}"; do
    name="${service%:*}"
    port="${service#*:}"
    if curl -s "http://localhost:$port" >/dev/null 2>&1; then
        echo "✓ $name:   Running (http://localhost:$port)"
    else
        echo "○ $name:   Not running (port $port)"
    fi
done

echo ""
echo "🧟 ZombieCoder is ready!"
echo "Open Zed and press Ctrl+Shift+Z to start using AI"
STARTSCRIPT

    chmod +x start_zombiecoder.sh
    print_success "Created start_zombiecoder.sh"

    # Create stop script
    cat > stop_zombiecoder.sh << 'STOPSCRIPT'
#!/bin/bash
# Stop ZombieCoder services

echo "🧟 Stopping ZombieCoder Services..."

# Stop Ollama
if pgrep -x "ollama" > /dev/null; then
    echo "Stopping Ollama..."
    pkill -x ollama
fi

echo "Services stopped."
STOPSCRIPT

    chmod +x stop_zombiecoder.sh
    print_success "Created stop_zombiecoder.sh"
}

# Print final instructions
print_final_instructions() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 Installation Complete! 🎉                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Quick Start:${NC}"
    echo "  1. Make sure Ollama is running:"
    echo -e "     ${YELLOW}ollama serve${NC}"
    echo ""
    echo "  2. If you haven't installed a model yet:"
    echo -e "     ${YELLOW}ollama pull qwen2.5-coder:7b${NC}  (recommended)"
    echo ""
    echo "  3. Open Zed editor and start coding!"
    echo ""
    echo -e "${CYAN}AI Assistant Shortcuts:${NC}"
    echo "  Ctrl+Shift+Z  → Open AI Assistant Panel"
    echo "  Ctrl+Shift+A  → Inline AI Assist"
    echo "  Ctrl+Enter    → Send message to AI"
    echo ""
    echo -e "${CYAN}Helper Scripts:${NC}"
    echo "  ./start_zombiecoder.sh  → Start all services"
    echo "  ./stop_zombiecoder.sh   → Stop all services"
    echo ""
    echo -e "${CYAN}Configuration Files:${NC}"
    echo "  Settings: $(get_zed_config_dir)/settings.json"
    echo "  Keymap:   $(get_zed_config_dir)/keymap.json"
    echo ""
    echo -e "${PURPLE}🧟 Happy Coding with ZombieCoder! 🧟${NC}"
    echo -e "${PURPLE}   গরিবদের জন্য ফ্রি AI - Free AI for Everyone!${NC}"
    echo ""
}

# Main installation function
main() {
    print_banner

    echo ""
    print_step "Starting ZombieCoder installation..."
    echo ""

    # Check prerequisites
    if ! check_prerequisites; then
        print_error "Prerequisites check failed"
        exit 1
    fi
    echo ""

    # Install dependencies
    if ! install_dependencies; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    echo ""

    # Build extension
    if ! build_extension; then
        print_error "Failed to build extension"
        exit 1
    fi
    echo ""

    # Install Zed configuration
    read -p "Install Zed configuration? (y/n) [y]: " install_config
    install_config=${install_config:-y}
    if [[ "$install_config" =~ ^[Yy]$ ]]; then
        install_zed_config
    else
        print_warning "Skipping Zed configuration installation"
        echo "You can manually copy config files from config/ directory"
    fi
    echo ""

    # Install Ollama models (if Ollama is available)
    if command_exists ollama; then
        install_ollama_models
    fi
    echo ""

    # Create helper scripts
    create_helper_scripts
    echo ""

    # Print final instructions
    print_final_instructions
}

# Run uninstall if --uninstall flag is passed
uninstall() {
    print_banner
    echo ""
    print_step "Uninstalling ZombieCoder..."

    local zed_config_dir=$(get_zed_config_dir)

    # Remove Zed config (restore backup if exists)
    if [ -f "$zed_config_dir/settings.json" ]; then
        # Find most recent backup
        local latest_backup=$(ls -t "$zed_config_dir"/settings.json.backup.* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            cp "$latest_backup" "$zed_config_dir/settings.json"
            print_success "Restored settings from backup"
        else
            rm "$zed_config_dir/settings.json"
            print_success "Removed settings.json"
        fi
    fi

    if [ -f "$zed_config_dir/keymap.json" ]; then
        local latest_backup=$(ls -t "$zed_config_dir"/keymap.json.backup.* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            cp "$latest_backup" "$zed_config_dir/keymap.json"
            print_success "Restored keymap from backup"
        else
            rm "$zed_config_dir/keymap.json"
            print_success "Removed keymap.json"
        fi
    fi

    # Remove helper scripts
    [ -f "start_zombiecoder.sh" ] && rm "start_zombiecoder.sh" && print_success "Removed start_zombiecoder.sh"
    [ -f "stop_zombiecoder.sh" ] && rm "stop_zombiecoder.sh" && print_success "Removed stop_zombiecoder.sh"

    # Remove dist directory
    [ -d "dist" ] && rm -rf "dist" && print_success "Removed dist directory"

    # Remove node_modules
    read -p "Remove node_modules? (y/n) [n]: " remove_modules
    if [[ "$remove_modules" =~ ^[Yy]$ ]]; then
        [ -d "node_modules" ] && rm -rf "node_modules" && print_success "Removed node_modules"
    fi

    echo ""
    print_success "ZombieCoder uninstalled successfully"
    echo ""
    echo "Note: Ollama and installed models were not removed."
    echo "To remove Ollama models: ollama rm <model-name>"
}

# Parse arguments
case "$1" in
    --uninstall|-u)
        uninstall
        ;;
    --help|-h)
        echo "ZombieCoder Zed Extension Installer"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h       Show this help message"
        echo "  --uninstall, -u  Uninstall ZombieCoder"
        echo ""
        echo "Without options, runs the installation."
        ;;
    *)
        main
        ;;
esac
