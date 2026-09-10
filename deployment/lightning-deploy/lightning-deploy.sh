#!/bin/bash
# ⚡ OPERATION LIGHTNING: 24-Hour SWARM Deployment Script
# Version: 2.0 — All bugs fixed, complete secret coverage
# Usage: chmod +x lightning-deploy.sh && ./lightning-deploy.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# ============================================================
# COLORS & UTILITIES
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

START_TIME=$(date +%s)

# Cross-platform date formatting (Linux + macOS + Windows/Git Bash)
format_epoch() {
  local ts=$1
  if date -d "@$ts" > /dev/null 2>&1; then
    date -d "@$ts" "+%Y-%m-%d %H:%M:%S"     # GNU/Linux
  elif date -r "$ts" > /dev/null 2>&1; then
    date -r "$ts" "+%Y-%m-%d %H:%M:%S"       # macOS/BSD
  else
    echo "(unix: $ts)"                         # Windows fallback
  fi
}

log_phase() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_err()  { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# ============================================================
# HEADER
# ============================================================
clear
echo -e "${BLUE}"
cat << 'BANNER'
  ███████╗██╗    ██╗ █████╗ ██████╗ ███╗   ███╗
  ██╔════╝██║    ██║██╔══██╗██╔══██╗████╗ ████║
  ███████╗██║ █╗ ██║███████║██████╔╝██╔████╔██║
  ╚════██║██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║
  ███████║╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║
  ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
  ⚡ OPERATION LIGHTNING — 24-Hour Deployment
BANNER
echo -e "${NC}"
echo "  Start Time : $(format_epoch $START_TIME)"
echo "  Mission    : Deploy complete SWARM platform in 24 hours"
echo "  Cost       : \$0 (100% free infrastructure)"
echo "  Streams    : 28 parallel GitHub Actions workflows"
echo ""

# ============================================================
# PREREQUISITE CHECK
# ============================================================
log_phase "PREREQUISITE CHECK"

MISSING=0
for cmd in gh npm curl git node; do
  if command -v $cmd &>/dev/null; then
    log_ok "$cmd found ($(${cmd} --version 2>/dev/null | head -1))"
  else
    log_err "$cmd NOT FOUND"
    MISSING=$((MISSING + 1))
  fi
done

NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [[ "${NODE_VER:-0}" -lt 20 ]]; then
  log_err "Node.js >= 20 required (found: $(node --version 2>/dev/null || echo 'none'))"
  MISSING=$((MISSING + 1))
fi

if gh auth status &>/dev/null; then
  log_ok "GitHub CLI authenticated"
else
  log_err "GitHub CLI not authenticated — run: gh auth login"
  MISSING=$((MISSING + 1))
fi

if [[ $MISSING -gt 0 ]]; then
  echo ""
  log_err "Fix $MISSING missing prerequisite(s) then re-run."
  exit 1
fi

# ============================================================
# CONFIGURATION
# ============================================================
log_phase "CONFIGURATION"

echo -e "${YELLOW}Required inputs — all values are stored as encrypted GitHub Secrets${NC}"
echo -e "${YELLOW}(NOT saved to disk in plaintext)${NC}"
echo ""

read -p "  GitHub repository [UniversalStandards/SWARM]: " REPO
REPO="${REPO:-UniversalStandards/SWARM}"

read -p "  Supabase project URL: " SUPABASE_URL
read -sp "  Supabase anon key: " SUPABASE_ANON_KEY; echo ""
read -sp "  Supabase service key: " SUPABASE_SERVICE_KEY; echo ""
read -p "  Supabase direct DATABASE_URL: " DATABASE_URL
read -p "  Upstash Redis URL: " UPSTASH_REDIS_URL
read -sp "  Upstash Redis token: " UPSTASH_REDIS_TOKEN; echo ""
read -sp "  Groq API key [gsk_...]: " GROQ_API_KEY; echo ""
read -sp "  Google AI API key (optional, press Enter to skip): " GOOGLE_AI_API_KEY; echo ""
read -sp "  Anthropic API key (optional, press Enter to skip): " ANTHROPIC_API_KEY; echo ""
read -sp "  Together.ai API key (optional, press Enter to skip): " TOGETHER_API_KEY; echo ""

echo ""
echo -e "${YELLOW}Confirm deployment to: ${CYAN}$REPO${NC}"
read -p "  Proceed? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

# ============================================================
# HOUR 0: INFRASTRUCTURE SETUP
# ============================================================
log_phase "HOUR 0-1: INFRASTRUCTURE SETUP"

HOUR_0_START=$(date +%s)

echo "🔐 Configuring GitHub Secrets..."
# Required secrets
gh secret set SUPABASE_URL          --body "$SUPABASE_URL"          --repo "$REPO"
gh secret set SUPABASE_ANON_KEY     --body "$SUPABASE_ANON_KEY"     --repo "$REPO"
gh secret set SUPABASE_SERVICE_KEY  --body "$SUPABASE_SERVICE_KEY"  --repo "$REPO"
gh secret set DATABASE_URL          --body "$DATABASE_URL"          --repo "$REPO"
gh secret set UPSTASH_REDIS_URL     --body "$UPSTASH_REDIS_URL"     --repo "$REPO"
gh secret set UPSTASH_REDIS_TOKEN   --body "$UPSTASH_REDIS_TOKEN"   --repo "$REPO"
gh secret set GROQ_API_KEY          --body "$GROQ_API_KEY"          --repo "$REPO"

# Optional secrets (skip if empty)
[[ -n "$GOOGLE_AI_API_KEY"  ]] && gh secret set GOOGLE_AI_API_KEY  --body "$GOOGLE_AI_API_KEY"  --repo "$REPO"
[[ -n "$ANTHROPIC_API_KEY"  ]] && gh secret set ANTHROPIC_API_KEY  --body "$ANTHROPIC_API_KEY"  --repo "$REPO"
[[ -n "$TOGETHER_API_KEY"   ]] && gh secret set TOGETHER_API_KEY   --body "$TOGETHER_API_KEY"   --repo "$REPO"

log_ok "All GitHub Secrets configured (encrypted, never stored locally)"

echo ""
echo "⚡ Checking Chief CLI..."
if ! command -v chief &>/dev/null; then
  echo "  Installing Chief CLI..."
  curl -fsSL https://raw.githubusercontent.com/MiniCodeMonkey/chief/main/install.sh | sh
  export PATH="$PATH:$HOME/.chief/bin"
  log_ok "Chief CLI installed"
else
  log_ok "Chief CLI already installed ($(chief --version 2>/dev/null || echo 'installed'))"
fi

echo ""
echo "📦 Installing vinext..."
npm install vinext --save-dev 2>/dev/null || log_warn "vinext install skipped (run manually: npm install vinext)"

echo ""
echo "🔒 Running security audit on vinext..."
npm audit --audit-level=high 2>/dev/null && log_ok "Security audit passed" || log_warn "Review npm audit output before proceeding to production"

HOUR_0_END=$(date +%s)
HOUR_0_MINS=$(( (HOUR_0_END - HOUR_0_START) / 60 ))
log_ok "Infrastructure setup complete in ${HOUR_0_MINS} minutes"

# Save config (NO SECRETS — timestamps and non-sensitive metadata only)
cat > .lightning-deploy-config << CONF
REPO=$REPO
DEPLOYMENT_START=$START_TIME
INFRA_COMPLETE=$HOUR_0_END
CONF

log_ok "Deployment config saved to .lightning-deploy-config (no secrets stored)"

# ============================================================
# HOUR 1-3: PHASE 1 FOUNDATION (6 streams)
# ============================================================
log_phase "HOUR 1-3: PHASE 1 FOUNDATION (6 parallel streams)"

read -p "  Launch Phase 1 workflows? (yes/no): " LAUNCH_PHASE1
PHASE1_START=$(date +%s)

if [[ "$LAUNCH_PHASE1" == "yes" ]]; then
  PHASE1_WORKFLOWS=(
    "phase1-database"
    "phase1-testing"
    "phase1-api"
    "phase1-security"
    "phase1-frontend"
    "phase1-devops"
  )

  echo ""
  echo "  Launching ${#PHASE1_WORKFLOWS[@]} Phase 1 workflows..."
  LAUNCHED=0
  for wf in "${PHASE1_WORKFLOWS[@]}"; do
    if gh workflow run "${wf}.yml" --repo "$REPO" 2>/dev/null; then
      log_ok "  $wf launched"
      LAUNCHED=$((LAUNCHED + 1))
    else
      log_warn "  $wf not found — workflow file may need to be pushed first"
    fi
    sleep 2
  done

  echo ""
  log_info "Launched $LAUNCHED / ${#PHASE1_WORKFLOWS[@]} Phase 1 workflows"
  echo ""
  echo "  Monitor: gh run list --repo $REPO --limit 10"
  echo "  Watch:   gh run watch \$(gh run list --repo $REPO --json databaseId -q '.[0].databaseId') --repo $REPO"
  echo ""

  read -p "  Wait for Phase 1 completion before Phase 2? (yes/no): " WAIT_P1
  if [[ "$WAIT_P1" == "yes" ]]; then
    echo "  Polling Phase 1 completion (checks every 60s)..."
    while true; do
      # Fixed: filter by specific workflow labels, not generic run list
      COMPLETED=$(gh run list --repo "$REPO" --limit 20 --json status,workflowName \
        --jq '[.[] | select(.workflowName | startswith("Lightning Phase 1")) | select(.status == "completed")] | length')
      IN_PROG=$(gh run list --repo "$REPO" --limit 20 --json status,workflowName \
        --jq '[.[] | select(.workflowName | startswith("Lightning Phase 1")) | select(.status != "completed")] | length')

      echo -e "    Status: ${GREEN}${COMPLETED} completed${NC} | ${YELLOW}${IN_PROG} in progress${NC}"

      if [[ "$COMPLETED" -ge "$LAUNCHED" ]] && [[ "$LAUNCHED" -gt 0 ]]; then
        log_ok "All Phase 1 workflows complete!"
        break
      fi
      sleep 60
    done
  fi
fi

PHASE1_END=$(date +%s)
echo "PHASE1_COMPLETE=$PHASE1_END" >> .lightning-deploy-config

# ============================================================
# HOUR 3-8: PHASE 2 ADVANCED FEATURES (13 streams)
# ============================================================
log_phase "HOUR 3-8: PHASE 2 ADVANCED FEATURES (13 parallel streams)"

read -p "  Launch Phase 2 workflows? (yes/no): " LAUNCH_PHASE2
if [[ "$LAUNCH_PHASE2" == "yes" ]]; then
  PHASE2_WORKFLOWS=(
    "phase2-redis"
    "phase2-parallel-execution"
    "phase2-hive-mind"
    "phase2-mcp"
    "phase2-a2a"
    "phase2-github-automation"
    "phase2-github-pr-review"
    "phase2-github-issues"
    "phase2-dragonfly"
    "phase2-nats"
    "phase2-drools"
    "phase2-secrets"
    "phase2-workflow-versioning"
  )
  for wf in "${PHASE2_WORKFLOWS[@]}"; do
    gh workflow run "${wf}.yml" --repo "$REPO" 2>/dev/null && log_ok "  $wf launched" || log_warn "  $wf not found"
    sleep 2
  done
  log_ok "Phase 2 workflows launched (${#PHASE2_WORKFLOWS[@]} streams)"
fi

PHASE2_END=$(date +%s)
echo "PHASE2_COMPLETE=$PHASE2_END" >> .lightning-deploy-config

# ============================================================
# HOUR 8-14: PHASE 3 SCALE & POLISH (9 streams)
# ============================================================
log_phase "HOUR 8-14: PHASE 3 SCALE & POLISH (9 parallel streams)"

read -p "  Launch Phase 3 workflows? (yes/no): " LAUNCH_PHASE3
if [[ "$LAUNCH_PHASE3" == "yes" ]]; then
  PHASE3_WORKFLOWS=(
    "phase3-multitenant"
    "phase3-rbac"
    "phase3-monitoring"
    "phase3-grafana"
    "phase3-prometheus"
    "phase3-plugins"
    "phase3-plugin-sdk"
    "phase3-examples"
    "phase3-notifications"
  )
  for wf in "${PHASE3_WORKFLOWS[@]}"; do
    gh workflow run "${wf}.yml" --repo "$REPO" 2>/dev/null && log_ok "  $wf launched" || log_warn "  $wf not found"
    sleep 2
  done
  log_ok "Phase 3 workflows launched (${#PHASE3_WORKFLOWS[@]} streams)"
fi

PHASE3_END=$(date +%s)
echo "PHASE3_COMPLETE=$PHASE3_END" >> .lightning-deploy-config

# ============================================================
# FINAL STATUS DASHBOARD
# ============================================================
log_phase "⚡ OPERATION LIGHTNING — STATUS DASHBOARD"

END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))
HOURS=$(( ELAPSED / 3600 ))
MINS=$(( (ELAPSED % 3600) / 60 ))

echo "  Repository  : $REPO"
echo "  Started     : $(format_epoch $START_TIME)"
echo "  Current     : $(format_epoch $END_TIME)"
echo "  Elapsed     : ${HOURS}h ${MINS}m"
echo ""
echo "  Phases Launched:"
echo "    ✅ Infrastructure Setup"
[[ "$LAUNCH_PHASE1" == "yes" ]] && echo "    ⚡ Phase 1: Foundation    (6 workflows)"
[[ "$LAUNCH_PHASE2" == "yes" ]] && echo "    ⚡ Phase 2: Advanced      (13 workflows)"
[[ "$LAUNCH_PHASE3" == "yes" ]] && echo "    ⚡ Phase 3: Scale & Polish (9 workflows)"
echo ""
echo "  Next Steps:"
echo "    1. Monitor:  gh run list --repo $REPO --limit 30"
echo "    2. PRs:      gh pr list --repo $REPO --label lightning-deploy"
echo "    3. Deploy:   vinext deploy (after all PRs merged)"
echo "    4. Verify:   curl https://swarm.workers.dev/api/health"
echo ""

log_ok "OPERATION LIGHTNING deployment script complete!"
