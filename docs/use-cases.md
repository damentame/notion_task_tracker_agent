# Use Cases & Examples

This document showcases practical use cases for the Notion Task Tracker CLI across different scenarios and workflows.

## Table of Contents

1. [DevOps & CI/CD](#devops--cicd)
2. [Git Workflows](#git-workflows)
3. [Automation Scripts](#automation-scripts)
4. [Project Management](#project-management)
5. [Development Workflows](#development-workflows)
6. [Team Collaboration](#team-collaboration)

---

## DevOps & CI/CD

### 1. Automated Incident Tracking from Monitoring

Track incidents automatically when monitoring alerts fire:

```bash
#!/bin/bash
# monitor-alert-handler.sh

ALERT_NAME=$1
SEVERITY=$2
ALERT_URL=$3

# Create incident task
notion-task create "🚨 $ALERT_NAME" \
  --status "To-do" \
  --notes "Severity: $SEVERITY\nAlert URL: $ALERT_URL\nTriggered: $(date)"

echo "Incident task created in Notion"
```

**Integration with Prometheus Alertmanager:**
```yaml
# alertmanager.yml
receivers:
  - name: 'notion-webhook'
    webhook_configs:
      - url: 'http://your-server/alert-handler'
        send_resolved: true
```

### 2. CI/CD Pipeline Task Creation

**GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Application
        id: deploy
        run: |
          # Your deployment commands
          echo "Deploying..."
      
      - name: Create Notion Task
        if: always()
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: |
          npm install -g notion-task-tracker-cli
          
          if [ "${{ steps.deploy.outcome }}" == "success" ]; then
            notion-task create "✅ Deploy succeeded: ${{ github.sha }}" \
              --status "Done" \
              --notes "Branch: ${{ github.ref }}\nCommit: ${{ github.sha }}\nActor: ${{ github.actor }}"
          else
            notion-task create "❌ Deploy failed: ${{ github.sha }}" \
              --status "To-do" \
              --notes "Branch: ${{ github.ref }}\nCommit: ${{ github.sha }}\nActor: ${{ github.actor }}\nLogs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          fi
```

**GitLab CI:**
```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    - ./deploy.sh
  after_script:
    - npm install -g notion-task-tracker-cli
    - |
      if [ $CI_JOB_STATUS == "success" ]; then
        notion-task create "✅ Deploy succeeded: $CI_COMMIT_SHORT_SHA" \
          --status "Done" \
          --notes "Pipeline: $CI_PIPELINE_URL"
      else
        notion-task create "❌ Deploy failed: $CI_COMMIT_SHORT_SHA" \
          --status "To-do" \
          --notes "Pipeline: $CI_PIPELINE_URL\nRequires investigation"
      fi
```

### 3. Daily Infrastructure Reports

```bash
#!/bin/bash
# daily-infra-report.sh

# Run daily via cron: 0 9 * * * /path/to/daily-infra-report.sh

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt 80 ]; then
  notion-task create "⚠️ High disk usage: ${DISK_USAGE}%" \
    --status "To-do" \
    --notes "Server disk usage is at ${DISK_USAGE}%. Investigate and clean up."
fi

# Check service status
if ! systemctl is-active --quiet nginx; then
  notion-task create "🔴 Nginx service down" \
    --status "To-do" \
    --notes "Nginx service is not running. Immediate attention required."
fi

# Summary task
notion-task create "📊 Daily infra check: $(date +%Y-%m-%d)" \
  --status "Done" \
  --notes "Disk: ${DISK_USAGE}%\nAll critical services: OK"
```

---

## Git Workflows

### 4. Pre-commit Hook for Task Tracking

Automatically create tasks for commits:

```bash
#!/bin/bash
# .git/hooks/pre-commit

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_MSG=$(cat .git/COMMIT_EDITMSG 2>/dev/null || echo "Uncommitted changes")

# Only create tasks for feature branches
if [[ $BRANCH == feature/* ]]; then
  notion-task create "Work on: $BRANCH" \
    --notes "Latest commit: $COMMIT_MSG" \
    --status "In Progress"
fi
```

### 5. Post-merge Hook for Deployment Tracking

```bash
#!/bin/bash
# .git/hooks/post-merge

BRANCH=$(git rev-parse --abbrev-ref HEAD)
LAST_COMMIT=$(git log -1 --pretty=%B)

if [ "$BRANCH" == "main" ]; then
  notion-task create "🚀 Merged to main: Deploy needed" \
    --status "To-do" \
    --notes "Commit: $LAST_COMMIT\nVerify staging before deploying to production"
fi
```

### 6. PR Creation Notification

```bash
#!/bin/bash
# create-pr-task.sh

PR_NUMBER=$1
PR_TITLE=$2
PR_URL=$3
AUTHOR=$4

notion-task create "👀 Review PR #$PR_NUMBER: $PR_TITLE" \
  --status "To-do" \
  --notes "Author: $AUTHOR\nURL: $PR_URL\nPriority: Normal"
```

---

## Automation Scripts

### 7. Weekly Report Generation

```bash
#!/bin/bash
# weekly-report.sh
# Run via cron: 0 17 * * 5  # Every Friday at 5 PM

WEEK_NUMBER=$(date +%U)
DATE_RANGE="$(date -d 'last monday' +%Y-%m-%d) to $(date +%Y-%m-%d)"

notion-task create "📋 Weekly report - Week $WEEK_NUMBER" \
  --status "To-do" \
  --notes "Period: $DATE_RANGE\nTasks:\n- Review team progress\n- Update stakeholders\n- Plan next week"
```

### 8. Backup Verification

```bash
#!/bin/bash
# verify-backups.sh

BACKUP_DIR="/backups"
TODAY=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/backup-$TODAY.tar.gz"

if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  notion-task create "✅ Backup verified: $TODAY" \
    --status "Done" \
    --notes "Backup file: $BACKUP_FILE\nSize: $SIZE"
else
  notion-task create "❌ Backup missing: $TODAY" \
    --status "To-do" \
    --notes "Expected backup file not found: $BACKUP_FILE\nIMmediate investigation required"
fi
```

### 9. Dependency Update Checker

```bash
#!/bin/bash
# check-dependencies.sh

OUTDATED=$(npm outdated --json)
COUNT=$(echo $OUTDATED | jq 'length')

if [ $COUNT -gt 0 ]; then
  PACKAGES=$(echo $OUTDATED | jq -r 'keys[]' | head -5 | tr '\n' ', ')
  
  notion-task create "📦 $COUNT dependencies outdated" \
    --status "To-do" \
    --notes "Outdated packages: $PACKAGES\nRun: npm outdated for full list\nUpdate with: npm update"
fi
```

---

## Project Management

### 10. Sprint Task Template

```bash
#!/bin/bash
# create-sprint-tasks.sh

SPRINT_NUMBER=$1
START_DATE=$2
END_DATE=$3

# Sprint planning task
notion-task create "🎯 Sprint $SPRINT_NUMBER Planning" \
  --status "To-do" \
  --notes "Date: $START_DATE\nAgenda:\n- Review backlog\n- Estimate stories\n- Assign tasks"

# Sprint review task
notion-task create "📊 Sprint $SPRINT_NUMBER Review" \
  --status "To-do" \
  --notes "Date: $END_DATE\nAgenda:\n- Demo completed work\n- Gather feedback\n- Update metrics"

# Sprint retrospective task
notion-task create "🔄 Sprint $SPRINT_NUMBER Retrospective" \
  --status "To-do" \
  --notes "Date: $END_DATE\nAgenda:\n- What went well\n- What can improve\n- Action items"
```

### 11. Recurring Task Creation

```bash
#!/bin/bash
# create-recurring-tasks.sh

# Daily standup
notion-task create "🗣️ Daily Standup: $(date +%A, %B %d)" \
  --status "To-do" \
  --notes "Time: 9:30 AM\nDuration: 15 minutes\nTopics: Yesterday, Today, Blockers"

# Weekly sync
if [ $(date +%u) -eq 1 ]; then  # Monday
  notion-task create "📅 Weekly Team Sync" \
    --status "To-do" \
    --notes "Time: 2:00 PM\nDuration: 1 hour\nAgenda: Progress, Blockers, Planning"
fi

# Monthly review
if [ $(date +%d) -eq 01 ]; then  # First of month
  notion-task create "📈 Monthly Team Review" \
    --status "To-do" \
    --notes "Review:\n- KPIs and metrics\n- Team achievements\n- Next month goals"
fi
```

### 12. Project Initialization Template

```bash
#!/bin/bash
# init-project-tasks.sh

PROJECT_NAME=$1

tasks=(
  "📝 Create project documentation"
  "🏗️ Set up development environment"
  "🔧 Configure CI/CD pipeline"
  "🧪 Set up testing framework"
  "🚀 Initial deployment to staging"
  "👥 Onboard team members"
  "📊 Set up monitoring and logging"
)

for task in "${tasks[@]}"; do
  notion-task create "$PROJECT_NAME: $task" \
    --status "To-do"
  sleep 1  # Avoid rate limiting
done

echo "Created ${#tasks[@]} tasks for project: $PROJECT_NAME"
```

---

## Development Workflows

### 13. Code Review Reminders

```bash
#!/bin/bash
# check-pending-reviews.sh

# Get pending PRs (example using GitHub CLI)
PENDING_PRS=$(gh pr list --limit 10 --json number,title,author)
COUNT=$(echo $PENDING_PRS | jq 'length')

if [ $COUNT -gt 0 ]; then
  PR_LIST=$(echo $PENDING_PRS | jq -r '.[] | "#\(.number): \(.title) by \(.author.login)"' | head -3)
  
  notion-task create "👀 $COUNT PRs pending review" \
    --status "To-do" \
    --notes "Pending reviews:\n$PR_LIST"
fi
```

### 14. Test Failure Notifications

```bash
#!/bin/bash
# test-runner.sh

npm test > test-results.txt 2>&1

if [ $? -ne 0 ]; then
  FAILURES=$(grep -c "FAIL" test-results.txt || echo "0")
  FIRST_FAILURE=$(grep "FAIL" test-results.txt | head -1 || echo "See logs")
  
  notion-task create "❌ Tests failing: $FAILURES test(s)" \
    --status "To-do" \
    --notes "First failure: $FIRST_FAILURE\n\nRun 'npm test' for details"
else
  echo "✅ All tests passed"
fi
```

### 15. Release Preparation Checklist

```bash
#!/bin/bash
# prepare-release.sh

VERSION=$1

tasks=(
  "📝 Update CHANGELOG.md for v$VERSION"
  "🔍 Run full test suite"
  "📚 Update documentation"
  "🏷️ Create git tag v$VERSION"
  "📦 Build release artifacts"
  "🚀 Deploy to production"
  "📣 Announce release"
)

for task in "${tasks[@]}"; do
  notion-task create "Release v$VERSION: $task" \
    --status "To-do"
  sleep 1
done
```

---

## Team Collaboration

### 16. Onboarding Checklist

```bash
#!/bin/bash
# onboard-team-member.sh

NEW_MEMBER=$1
START_DATE=$2

tasks=(
  "👋 Welcome email sent"
  "💻 Hardware setup complete"
  "🔑 Access credentials provided"
  "📚 Documentation shared"
  "👥 Intro to team members"
  "🎯 First week goals set"
  "☕ 1:1 scheduled with manager"
)

for task in "${tasks[@]}"; do
  notion-task create "Onboarding $NEW_MEMBER: $task" \
    --status "To-do" \
    --notes "Start date: $START_DATE"
  sleep 1
done
```

### 17. Meeting Notes Automation

```bash
#!/bin/bash
# post-meeting-notes.sh

MEETING_TITLE=$1
ATTENDEES=$2
ACTION_ITEMS=$3

notion-task create "📝 Meeting notes: $MEETING_TITLE" \
  --status "Done" \
  --notes "Attendees: $ATTENDEES\n\nAction items:\n$ACTION_ITEMS\n\nDate: $(date)"
```

### 18. Knowledge Sharing

```bash
#!/bin/bash
# share-learning.sh

TOPIC=$1
RESOURCE_URL=$2
SHARED_BY=$3

notion-task create "📚 Learning resource: $TOPIC" \
  --status "To-do" \
  --notes "Resource: $RESOURCE_URL\nShared by: $SHARED_BY\n\nTake time to review and provide feedback"
```

---

## Advanced Examples

### 19. Integration with Slack

```bash
#!/bin/bash
# slack-to-notion.sh

# Triggered by Slack webhook
SLACK_MESSAGE=$1
SLACK_USER=$2
SLACK_CHANNEL=$3

notion-task create "💬 Action from Slack: $SLACK_CHANNEL" \
  --status "To-do" \
  --notes "Message: $SLACK_MESSAGE\nFrom: $SLACK_USER\nChannel: $SLACK_CHANNEL"
```

### 20. Multi-Environment Deployment Tracking

```bash
#!/bin/bash
# deploy-tracker.sh

ENVIRONMENT=$1  # dev, staging, production
VERSION=$2
DEPLOYED_BY=$3

# Set appropriate database based on environment
case $ENVIRONMENT in
  production)
    export NOTION_DATABASE_ID=$NOTION_DB_PROD
    STATUS="Done"
    ;;
  staging)
    export NOTION_DATABASE_ID=$NOTION_DB_STAGING
    STATUS="In Progress"
    ;;
  dev)
    export NOTION_DATABASE_ID=$NOTION_DB_DEV
    STATUS="Done"
    ;;
esac

notion-task create "🚀 Deployed v$VERSION to $ENVIRONMENT" \
  --status "$STATUS" \
  --notes "Version: $VERSION\nDeployed by: $DEPLOYED_BY\nTime: $(date)\nEnvironment: $ENVIRONMENT"
```

---

## Tips for Maximum Productivity

### Best Practices

1. **Use Descriptive Titles with Emojis**
   - Makes tasks easy to scan: 🐛 Bug, 🚀 Deploy, 📝 Docs, etc.

2. **Include Context in Notes**
   - Add links, commit SHAs, timestamps
   - Future you will thank you

3. **Standardize Your Workflows**
   - Create reusable scripts
   - Share with your team

4. **Set Up Proper Error Handling**
   ```bash
   if ! notion-task create "My task"; then
     echo "Failed to create task" >&2
     # Fallback action
   fi
   ```

5. **Use Functions for Reusability**
   ```bash
   create_deploy_task() {
     local env=$1
     local version=$2
     notion-task create "🚀 Deploy $version to $env" \
       --status "To-do" \
       --notes "Version: $version\nEnvironment: $env"
   }
   ```

### Common Patterns

```bash
# Conditional task creation
if [ "$BRANCH" == "main" ]; then
  notion-task create "Review merge"
fi

# Loop through items
for service in api frontend worker; do
  notion-task create "Deploy $service"
done

# Capture output
OUTPUT=$(npm test 2>&1)
notion-task create "Test results" --notes "$OUTPUT"

# With timestamps
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
notion-task create "Task at $TIMESTAMP"
```

---

## Troubleshooting Common Issues

### Rate Limiting

Notion API has rate limits. If creating many tasks:

```bash
# Add delays between requests
for task in "${tasks[@]}"; do
  notion-task create "$task"
  sleep 1  # Wait 1 second
done
```

### Error Handling

```bash
# Check if task creation succeeded
if notion-task create "My task"; then
  echo "Success"
else
  echo "Failed - check credentials and database ID"
  exit 1
fi
```

### Debugging

```bash
# Enable verbose output
DEBUG=1 notion-task create "Debug task"

# Check environment variables
echo $NOTION_API_KEY | head -c 10  # Show first 10 chars only
echo $NOTION_DATABASE_ID
```

---

## Contributing Your Use Cases

Have a creative use case? We'd love to hear about it!

1. Open a discussion on GitHub
2. Share your script or workflow
3. Help others learn from your experience

---

**Happy automating! 🚀**

For more examples and community contributions, visit our [GitHub Discussions](https://github.com/your-org/notion-task-tracker-cli/discussions).
