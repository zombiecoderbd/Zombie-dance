# 🧟 ZombieCursor AI - Safety & Usage Agreement

**Version:** 1.0  
**Product:** ZombieCursor AI  
**Owner:** Sahon Srabon  
**Company:** Developer Zone  
**Website:** https://zombiecoder.my.id/

## 📌 Introduction & Purpose

ZombieCursor AI is a local-first, privacy-focused AI coding assistant for VS Code that provides intelligent code completion, refactoring, and analysis—completely offline on your machine.

**Key Facts:**
- ✓ Completely free (no subscription)
- ✓ Open source community initiative
- ✓ No user tracking or data collection
- ✓ No mandatory login
- ✓ Educational and developmental use

## 📌 Complete Local & Security Policy

ZombieCursor operates **exclusively on your computer**.

**Guaranteed Security:**
- ✔ No server communication (ZERO data transmission)
- ✔ No login required
- ✔ No online tracking
- ✔ Your code, files, history—all stored locally
- ✔ Developer Zone/team never receives your data
- ✔ All AI models run locally or via user-configured APIs

## 📌 Safety Compliance Screen

Upon first launch, ZombieCursor displays this agreement:

\`\`\`
🧟 Welcome to ZombieCursor AI

Am I Safe? YES ✓

This tool operates 100% locally on YOUR computer.

Key Guarantees:
✓ No data sent to servers
✓ No subscriptions or fees
✓ No tracking or telemetry
✓ Complete local privacy

[ I Agree & Continue ]  [ Decline ]
\`\`\`

**User must explicitly agree to proceed.**

## 📌 Mandatory Developer Guidelines

### 4.1 Data Transmission Absolutely Prohibited

**Forbidden:**
\`\`\`typescript
// NEVER do this:
fetch("https://external-server.com/data", {...})
axios.post("https://api.com/track", {...})
// Hidden analytics, telemetry, or tracking code
\`\`\`

**Only Allowed:**
\`\`\`typescript
// Local operations only:
fs.writeFileSync(localPath, data)
localStorage.setItem('key', value)
// Local SQLite/database operations
\`\`\`

### 4.2 Code Quality Requirements

- ❌ No incomplete/experimental code
- ❌ No untested AI-generated code
- ❌ No "we'll assume it works" logic
- ✔ All code must be human-verified before merge
- ✔ All features must be fully tested

### 4.3 Terminal Execution Requires Permission

**Mandatory Workflow:**

\`\`\`
AI suggests command
    ↓
Permission popup shown
    ↓
User allows/denies
    ↓
Command executes (or blocked)
\`\`\`

**Never** allow silent command execution.

### 4.4 No Commercialization

ZombieCursor cannot be:
- Sold or monetized
- Used for paid subscriptions
- Bundled with premium features
- Used for commercial service offerings

**Forbidden:**
\`\`\`
Paid tiers / Premium access / VIP modes
\`\`\`

### 4.5 Owner Protection

Developers must ensure:
- No code that could harm users
- No features that create liability for owner
- No risky changes without owner consultation
- Immediate rollback of breaking changes

## 📌 Non-Technical User Safety

ZombieCursor protects users by:
- Simple, clear instructions
- Warning messages for dangerous actions
- Data export/import controls
- Emergency shutdown options
- Avoiding complex commands by default

## 📌 Legal Disclaimer

ZombieCursor AI is provided **"as-is"** for free. Developer Zone and Sahon Srabon are NOT liable for:

- Hardware damage
- Data loss
- Code deletion
- System corruption
- Unintended terminal execution
- Third-party service disruptions

**User bears 100% responsibility** for system changes and outcomes.

## 📌 Consent Statement

By installing and running ZombieCursor, you agree to:

1. ✓ This is local-only software
2. ✓ No automatic data collection
3. ✓ You control all terminal execution
4. ✓ You understand disclaimers
5. ✓ Free service without warranties

**No consent = No installation**

---

**The Soul of ZombieCursor:**

> All for humans.  
> No harm to anyone.  
> No money from users.  
> Developers must follow rules.  
> If broken, fix immediately.  
> Privacy and safety first, always.
