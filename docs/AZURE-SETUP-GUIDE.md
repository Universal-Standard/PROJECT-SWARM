# Azure Setup Guide for PROJECT-SWARM

**GitHub-Centric Architecture with Azure Backend**
**Date:** 2025-12-30

---

## Prerequisites

- **Azure Account**: Free tier available at https://azure.microsoft.com/free
- **Azure CLI**: Install from https://aka.ms/InstallAzureCLIDeb
- **GitHub Account**: For GitHub App creation
- **Domain Name** (optional): For custom URLs

---

## Quick Start (5 Minutes)

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login to Azure
az login

# 3. Run automated setup script
npm run setup:azure

# 4. Configure GitHub App
npm run setup:github-app

# Done! Your infrastructure is ready.
```

---

## Detailed Setup Instructions

### Step 1: Azure Resource Group

```bash
# Set variables
RESOURCE_GROUP="project-swarm-rg"
LOCATION="eastus"  # or your preferred region

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags "project=PROJECT-SWARM" "environment=production"
```

**Cost:** Free (Resource groups have no cost)

---

### Step 2: Azure Database for PostgreSQL

```bash
# Set database variables
DB_SERVER_NAME="project-swarm-db-$(date +%s)"  # Unique name
DB_ADMIN_USER="swarmadmin"
DB_ADMIN_PASSWORD="$(openssl rand -base64 32)"  # Secure random password

# Save password securely
echo "Database Password: $DB_ADMIN_PASSWORD" >> ~/.azure-credentials
chmod 600 ~/.azure-credentials

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --version 16 \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --public-access 0.0.0.0 \
  --tags "component=database"

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name project_swarm

# Get connection string
DB_CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER_NAME \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --database-name project_swarm \
  --query connectionStrings.psql \
  --output tsv)

echo "Connection String: $DB_CONNECTION_STRING" >> ~/.azure-credentials
```

**Cost:** ~$12/month (Burstable B2s with 32GB storage)

**Upgrade to Production:**

```bash
# For production workloads, upgrade to General Purpose
az postgres flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128

# Cost: ~$140/month (General Purpose D2s_v3 with 128GB)
```

---

### Step 3: Azure Key Vault

```bash
# Create Key Vault
KEYVAULT_NAME="project-swarm-kv-$(date +%s)"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku standard \
  --tags "component=secrets"

# Store database credentials
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "database-connection-string" \
  --value "$DB_CONNECTION_STRING"

# Store AI API keys (you'll need to add your actual keys)
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "anthropic-api-key" \
  --value "YOUR_ANTHROPIC_KEY_HERE"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "openai-api-key" \
  --value "YOUR_OPENAI_KEY_HERE"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "gemini-api-key" \
  --value "YOUR_GEMINI_KEY_HERE"
```

**Cost:** ~$0.03/month per secret (very cheap)

---

### Step 4: Azure Blob Storage (Optional)

**Use Case:** Store large workflow artifacts, execution logs archive

```bash
# Create storage account
STORAGE_ACCOUNT_NAME="projectswarmsa$(date +%s | tail -c 10)"

az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --tags "component=storage"

# Create containers
az storage container create \
  --name "workflow-artifacts" \
  --account-name $STORAGE_ACCOUNT_NAME \
  --public-access off

az storage container create \
  --name "execution-logs" \
  --account-name $STORAGE_ACCOUNT_NAME \
  --public-access off

# Get connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "storage-connection-string" \
  --value "$STORAGE_CONNECTION_STRING"
```

**Cost:** ~$0.02/GB/month (Hot tier) + minimal transaction costs

---

### Step 5: Azure Container Registry (Optional)

**Use Case:** Private Docker images (alternative to GitHub Container Registry)

```bash
# Create container registry
ACR_NAME="projectswarmacr$(date +%s | tail -c 10)"

az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --admin-enabled true \
  --tags "component=registry"

# Get credentials
ACR_USERNAME=$(az acr credential show \
  --name $ACR_NAME \
  --query username \
  --output tsv)

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME \
  --query "passwords[0].value" \
  --output tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "acr-username" \
  --value "$ACR_USERNAME"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "acr-password" \
  --value "$ACR_PASSWORD"
```

**Cost:** ~$5/month (Basic tier)

**Note:** Consider using GitHub Container Registry (ghcr.io) instead - it's free for public repos.

---

### Step 6: Azure App Service (API Hosting)

```bash
# Create App Service Plan
APP_SERVICE_PLAN_NAME="project-swarm-plan"

az appservice plan create \
  --name $APP_SERVICE_PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux \
  --tags "component=hosting"

# Create Web App
WEB_APP_NAME="project-swarm-api-$(date +%s)"

az webapp create \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN_NAME \
  --runtime "NODE:20-lts" \
  --tags "component=api"

# Configure environment variables
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "NODE_ENV=production" \
    "AZURE_KEY_VAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/"

# Enable system-assigned managed identity
az webapp identity assign \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Grant Key Vault access to Web App
WEBAPP_IDENTITY=$(az webapp identity show \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $WEBAPP_IDENTITY \
  --secret-permissions get list
```

**Cost:** ~$13/month (B1 Basic tier)

**Upgrade to Production:**

```bash
# Standard tier with auto-scaling
az appservice plan update \
  --name $APP_SERVICE_PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku S1

# Cost: ~$70/month (S1 Standard tier)
```

---

### Step 7: Azure Monitor & Application Insights

```bash
# Create Application Insights
APP_INSIGHTS_NAME="project-swarm-insights"

az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type Node.JS \
  --kind web \
  --tags "component=monitoring"

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Configure Web App to use Application Insights
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=$INSTRUMENTATION_KEY"

# Enable detailed logging
az webapp log config \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem
```

**Cost:** ~$2.88/GB ingested (first 5GB/month free)

---

### Step 8: Azure Functions (Alternative to App Service)

**Use Case:** Serverless API, better for low-traffic or event-driven workloads

```bash
# Create Storage Account for Functions
FUNCTIONS_STORAGE="swarmfuncsa$(date +%s | tail -c 10)"

az storage account create \
  --name $FUNCTIONS_STORAGE \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create Function App
FUNCTION_APP_NAME="project-swarm-func"

az functionapp create \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --storage-account $FUNCTIONS_STORAGE \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --os-type Linux \
  --tags "component=serverless"

# Configure environment
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "AZURE_KEY_VAULT_URL=https://$KEYVAULT_NAME.vault.azure.net/" \
    "NODE_ENV=production"

# Enable managed identity
az functionapp identity assign \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Grant Key Vault access
FUNCTION_IDENTITY=$(az functionapp identity show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $FUNCTION_IDENTITY \
  --secret-permissions get list
```

**Cost:** Consumption plan is $0.20/million executions + $0.000016/GB-s
(Very cheap for low traffic - likely < $5/month)

---

## Infrastructure as Code (Bicep)

**Automate everything above with a single command:**

### infrastructure/azure/main.bicep

```bicep
param location string = resourceGroup().location
param projectName string = 'project-swarm'

// PostgreSQL
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${projectName}-db-${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_B2s'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'swarmadmin'
    administratorLoginPassword: newGuid()
    storage: {
      storageSizeGB: 32
    }
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: '${projectName}-kv-${uniqueString(resourceGroup().id)}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
  }
}

// App Service
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${projectName}-plan'
  location: location
  kind: 'linux'
  properties: {
    reserved: true
  }
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${projectName}-api-${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        {
          name: 'AZURE_KEY_VAULT_URL'
          value: keyVault.properties.vaultUri
        }
      ]
    }
  }
}

// Grant Web App access to Key Vault
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Outputs
output databaseHost string = postgresServer.properties.fullyQualifiedDomainName
output keyVaultUrl string = keyVault.properties.vaultUri
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
```

**Deploy:**

```bash
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file infrastructure/azure/main.bicep \
  --parameters projectName=project-swarm
```

---

## Connecting to Azure from GitHub Actions

### GitHub Secrets Setup

```bash
# Create service principal for GitHub Actions
SP_JSON=$(az ad sp create-for-rbac \
  --name "github-actions-project-swarm" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth)

echo "Add this to GitHub Secrets as AZURE_CREDENTIALS:"
echo $SP_JSON
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and Deploy
        uses: azure/webapps-deploy@v2
        with:
          app-name: project-swarm-api
          package: .
```

---

## Cost Summary

### Development Environment

| Service              | Tier                 | Monthly Cost                |
| -------------------- | -------------------- | --------------------------- |
| PostgreSQL           | Burstable B2s (32GB) | $12                         |
| Key Vault            | Standard             | $0.03/secret (~$0.25 total) |
| App Service          | B1 Basic             | $13                         |
| Application Insights | 5GB free tier        | $0                          |
| **Total**            |                      | **~$25/month**              |

### Production Environment

| Service              | Tier                           | Monthly Cost    |
| -------------------- | ------------------------------ | --------------- |
| PostgreSQL           | General Purpose D2s_v3 (128GB) | $140            |
| Key Vault            | Standard                       | $0.25           |
| App Service          | S1 Standard                    | $70             |
| Blob Storage         | Hot tier (100GB)               | $2              |
| Application Insights | ~10GB/month                    | $15             |
| **Total**            |                                | **~$227/month** |

**GitHub Services (Free):**

- GitHub Actions: 2000 minutes/month
- GitHub Container Registry: Free for public repos
- GitHub Packages: 500MB free
- GitHub Pages: Free for public repos

---

## Environment Variables

### Application Configuration

Create a `.env.production` file:

```bash
# Azure
AZURE_KEY_VAULT_URL=https://project-swarm-kv-xxxxx.vault.azure.net/
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# GitHub App
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY_PATH=/secrets/github-app-private-key.pem
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Database (loaded from Key Vault)
DATABASE_URL=postgresql://user:pass@host:5432/db

# AI Providers (loaded from Key Vault)
ANTHROPIC_API_KEY=from-keyvault
OPENAI_API_KEY=from-keyvault
GEMINI_API_KEY=from-keyvault

# Application
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
```

### Load Secrets from Key Vault

```typescript
// packages/github-app/src/config/azure-config.ts
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

export async function loadConfig() {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL!;
  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());

  const [databaseUrl, anthropicKey, openaiKey, geminiKey] = await Promise.all([
    client.getSecret("database-connection-string"),
    client.getSecret("anthropic-api-key"),
    client.getSecret("openai-api-key"),
    client.getSecret("gemini-api-key"),
  ]);

  return {
    database: {
      url: databaseUrl.value!,
    },
    ai: {
      anthropic: anthropicKey.value!,
      openai: openaiKey.value!,
      gemini: geminiKey.value!,
    },
  };
}
```

---

## Monitoring & Alerts

### Set up Azure Monitor Alerts

```bash
# Alert when database CPU > 80%
az monitor metrics alert create \
  --name "High Database CPU" \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az postgres flexible-server show \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --query id -o tsv) \
  --condition "avg cpu_percent > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email me@example.com

# Alert when API response time > 2s
az monitor metrics alert create \
  --name "Slow API Response" \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az webapp show \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query id -o tsv) \
  --condition "avg ResponseTime > 2000" \
  --window-size 5m \
  --action email me@example.com
```

---

## Backup & Disaster Recovery

### Database Backup

```bash
# Enable automated backups (7-35 days retention)
az postgres flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --backup-retention 7

# Manual backup
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --backup-name "manual-backup-$(date +%Y%m%d)"

# Restore from backup
az postgres flexible-server restore \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME-restored \
  --source-server $DB_SERVER_NAME \
  --restore-time "2025-12-30T00:00:00Z"
```

### Key Vault Backup

```bash
# Soft delete is enabled by default (90 days retention)
# Backup all secrets
az keyvault secret backup \
  --vault-name $KEYVAULT_NAME \
  --name "database-connection-string" \
  --file database-secret-backup.blob

# Restore secret
az keyvault secret restore \
  --vault-name $KEYVAULT_NAME \
  --file database-secret-backup.blob
```

---

## Next Steps

After Azure setup is complete:

1. **GitHub App Setup**: Run `npm run setup:github-app`
2. **Deploy Application**: `npm run deploy:azure`
3. **Run Migrations**: `npm run db:migrate`
4. **Verify Setup**: `npm run verify:azure`
5. **Monitor**: Check Azure Portal for metrics

---

## Troubleshooting

### Issue: Cannot connect to database

```bash
# Check if firewall allows your IP
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name "AllowMyIP" \
  --start-ip-address $(curl -s ifconfig.me) \
  --end-ip-address $(curl -s ifconfig.me)

# Test connection
psql "$DB_CONNECTION_STRING"
```

### Issue: Key Vault access denied

```bash
# Grant yourself access
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --upn "$(az account show --query user.name -o tsv)" \
  --secret-permissions get list set delete
```

### Issue: Web App not starting

```bash
# Check logs
az webapp log tail \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Check deployment status
az webapp deployment list-publishing-profiles \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## Cleanup (Delete Everything)

**Warning: This will delete all data!**

```bash
# Delete entire resource group
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

---

## Support

- **Azure Docs**: https://docs.microsoft.com/azure
- **Azure CLI Docs**: https://docs.microsoft.com/cli/azure
- **Pricing Calculator**: https://azure.microsoft.com/pricing/calculator

---

**You're all set! Your Azure infrastructure is ready for PROJECT-SWARM.**
