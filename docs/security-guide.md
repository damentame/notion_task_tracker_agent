# Security Best Practices Guide

This guide covers security best practices for using the Notion Task Tracker CLI safely and securely.

## 🔐 API Key Management

### ✅ DO

**Use Environment Variables**
```bash
# Store in shell configuration file
export NOTION_API_KEY="secret_xxxxxxxxxxxxx"
export NOTION_DATABASE_ID="xxxxxxxxxxxxx"
```

**Use .env Files (with .gitignore)**
```bash
# Create .env file
echo "NOTION_API_KEY=secret_xxx" > .env
echo "NOTION_DATABASE_ID=xxx" >> .env

# Add to .gitignore
echo ".env" >> .gitignore
```

**Use Secret Management Tools**
- AWS Secrets Manager
- HashiCorp Vault
- 1Password CLI
- Pass (password store)

**Restrict Integration Permissions**
- Only grant necessary permissions in Notion
- Limit to specific databases
- Review integration access regularly

### ❌ DON'T

**Never Hardcode API Keys**
```javascript
// BAD - Never do this!
const apiKey = "secret_abc123xyz";
```

**Never Commit Keys to Git**
```bash
# BAD - This exposes your key
git add .env
git commit -m "Add config"
```

**Never Share Keys in Public**
- Don't post in GitHub issues
- Don't share in Slack/Discord
- Don't include in screenshots
- Don't paste in documentation

**Never Use Production Keys for Testing**
- Create separate integrations for development
- Use test databases
- Limit test integration permissions

## 🔒 Environment Security

### Secure Storage Locations

**Recommended:**
```bash
# Shell config files (secure by default)
~/.bashrc
~/.zshrc
~/.profile

# Secret management
~/.secrets/notion-cli
```

**Not Recommended:**
```bash
# Project directories (may be committed)
./config.js
./secrets.txt

# Shared locations
/tmp/keys.txt
```

### File Permissions

Ensure your secret files have restricted permissions:

```bash
# Make secrets readable only by you
chmod 600 ~/.secrets/notion-cli

# Verify permissions
ls -la ~/.secrets/notion-cli
# Should show: -rw------- (600)
```

## 🛡️ CI/CD Security

### GitHub Actions

**Use Encrypted Secrets**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Create task
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: |
          npm install -g notion-task-tracker-cli
          notion-task create "Deployed ${{ github.sha }}"
```

**Setting Secrets in GitHub:**
1. Go to repository Settings
2. Select Secrets and Variables → Actions
3. Click "New repository secret"
4. Add NOTION_API_KEY and NOTION_DATABASE_ID

### GitLab CI

**Use Protected Variables**
```yaml
# .gitlab-ci.yml
deploy:
  script:
    - npm install -g notion-task-tracker-cli
    - notion-task create "Deployed $CI_COMMIT_SHA"
  variables:
    NOTION_API_KEY: $NOTION_API_KEY
    NOTION_DATABASE_ID: $NOTION_DATABASE_ID
```

**Setting Variables in GitLab:**
1. Go to Settings → CI/CD
2. Expand Variables section
3. Add variables and mark as "Protected" and "Masked"

### Jenkins

**Use Credentials Plugin**
```groovy
// Jenkinsfile
pipeline {
  agent any
  environment {
    NOTION_API_KEY = credentials('notion-api-key')
    NOTION_DATABASE_ID = credentials('notion-db-id')
  }
  stages {
    stage('Deploy') {
      steps {
        sh 'npm install -g notion-task-tracker-cli'
        sh 'notion-task create "Deployed ${BUILD_ID}"'
      }
    }
  }
}
```

## 🚨 Key Rotation

### When to Rotate Keys

- Every 90 days (recommended)
- When an employee leaves
- After a security incident
- If key may have been exposed
- Before major releases

### How to Rotate Keys

1. **Create New Integration**
   - Go to Notion integrations page
   - Create new integration
   - Copy new API key

2. **Update All Locations**
   - Environment variables
   - CI/CD secrets
   - Team member configurations
   - Documentation (if applicable)

3. **Test New Key**
   ```bash
   # Test with new key
   NOTION_API_KEY="new_secret_xxx" notion-task create "Test"
   ```

4. **Revoke Old Integration**
   - Go to Notion integrations page
   - Delete old integration
   - Verify old key no longer works

## 🔍 Detecting Exposed Keys

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets. If detected:

1. **Immediate Actions:**
   - Revoke the exposed key immediately
   - Create a new integration
   - Update all configurations
   - Review recent activity

2. **Investigation:**
   - Check commit history
   - Review who had access
   - Audit recent Notion activity
   - Look for suspicious changes

### Manual Checks

```bash
# Search your codebase for potential leaks
rg "secret_[a-zA-Z0-9]+" --type-not gitignore

# Check git history
git log -S "secret_" --all
```

## 🔐 Database Security

### Notion Database Permissions

**Best Practices:**
- Share database with integration only
- Don't make databases public
- Review sharing settings regularly
- Limit integration to specific properties

**Integration Capabilities:**
Configure minimum required permissions:
- Read content: Yes (if reading tasks)
- Update content: Yes (if updating tasks)
- Insert content: Yes (if creating tasks)
- Read comments: No (unless needed)
- Insert comments: No (unless needed)

### Multiple Environments

Use separate databases for different environments:

```bash
# Development
export NOTION_DATABASE_ID_DEV="dev_database_id"

# Staging
export NOTION_DATABASE_ID_STAGING="staging_database_id"

# Production
export NOTION_DATABASE_ID_PROD="prod_database_id"
```

## 🚦 Access Control

### Team Access

**For Teams:**
1. Create team-specific integration
2. Share only required databases
3. Document who has access
4. Regular access reviews

**Onboarding New Team Members:**
```bash
# Share setup guide
# Provide team integration key securely (1Password, etc.)
# Verify they can create test tasks
# Add to team documentation
```

**Offboarding:**
1. Remove from shared secret manager
2. Rotate keys if they had direct access
3. Review recent activity
4. Update documentation

## 📋 Security Checklist

### Initial Setup
- [ ] API key stored in environment variables
- [ ] .env file added to .gitignore
- [ ] File permissions set correctly (600)
- [ ] Test database used for development
- [ ] Integration has minimum required permissions

### Regular Maintenance
- [ ] Keys rotated every 90 days
- [ ] Access reviewed quarterly
- [ ] No keys in git history
- [ ] CI/CD secrets are encrypted
- [ ] Team members follow best practices

### Incident Response
- [ ] Process for handling exposed keys
- [ ] Contact list for security issues
- [ ] Audit log review procedure
- [ ] Communication plan

## 🆘 What to Do If Key Is Exposed

### Immediate Actions (Within 1 Hour)

1. **Revoke Exposed Key**
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Delete the compromised integration
   - Verify it stops working

2. **Create New Integration**
   - Create fresh integration
   - Update all configurations
   - Test new key works

3. **Assess Impact**
   - Review Notion database activity
   - Check for unauthorized changes
   - Identify what data was accessible

### Follow-Up Actions (Within 24 Hours)

4. **Update All Systems**
   - Local environments
   - CI/CD pipelines
   - Team member configs
   - Documentation

5. **Notify Stakeholders**
   - Inform team members
   - Report to security team (if applicable)
   - Document incident

6. **Post-Mortem**
   - How was key exposed?
   - What can prevent this?
   - Update procedures
   - Team training if needed

## 📞 Reporting Security Issues

If you discover a security vulnerability:

**DO:**
- Email security@yourdomain.com (private disclosure)
- Include detailed reproduction steps
- Wait for response before public disclosure

**DON'T:**
- Post in public GitHub issues
- Share on social media
- Disclose before fix is available

## 📚 Additional Resources

- [Notion API Security Best Practices](https://developers.notion.com/docs/authorization)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitLab Secret Detection](https://docs.gitlab.com/ee/user/application_security/secret_detection/)

---

**Stay secure! 🔒**

Remember: Security is everyone's responsibility. When in doubt, ask!
