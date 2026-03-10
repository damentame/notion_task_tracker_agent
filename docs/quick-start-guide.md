# Quick Start Guide: Notion Task Tracker CLI

**Goal:** Create your first Notion task from the command line in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Notion account
- 5 minutes of your time

## Step 1: Install the CLI (1 minute)

Open your terminal and run:

```bash
npm install -g notion-task-tracker-cli
```

Verify installation:

```bash
notion-task --version
```

## Step 2: Set Up Notion Integration (2 minutes)

### 2.1 Create a Notion Integration

1. Visit [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name: "Task Tracker CLI"
4. Select your workspace
5. Click **"Submit"**
6. Copy your **Internal Integration Token** (starts with `secret_`)

### 2.2 Get Your Database ID

1. Open your Notion workspace in a browser
2. Create or navigate to a database you want to manage
3. Copy the database ID from the URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^^ (copy this part)
   ```

### 2.3 Share Database with Integration

1. Open your database in Notion
2. Click the **"..."** menu in the top-right
3. Select **"Add connections"**
4. Find and select your **"Task Tracker CLI"** integration
5. Click **"Confirm"**

## Step 3: Configure the CLI (1 minute)

Add your credentials to your environment:

### On macOS/Linux:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
echo 'export NOTION_API_KEY="secret_your_key_here"' >> ~/.bashrc
echo 'export NOTION_DATABASE_ID="your_database_id_here"' >> ~/.bashrc
source ~/.bashrc
```

### On Windows (PowerShell):

```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', 'secret_your_key_here', 'User')
[System.Environment]::SetEnvironmentVariable('NOTION_DATABASE_ID', 'your_database_id_here', 'User')
```

### Alternative: Use a .env file

Create a `.env` file in your project directory:

```env
NOTION_API_KEY=secret_your_key_here
NOTION_DATABASE_ID=your_database_id_here
```

## Step 4: Create Your First Task (30 seconds)

```bash
notion-task create "My First CLI Task" --status "To-do" --notes "Created from the terminal!"
```

You should see:
```
✅ Task created: [task-id]
```

Go check your Notion database - your task is there!

## Step 5: Update Your Task (30 seconds)

Mark your task as done:

```bash
notion-task update [task-id] --status "Done" --notes "Completed using the CLI!"
```

Refresh your Notion page - the task is now marked as done!

## 🎉 Congratulations!

You've successfully:
- ✅ Installed the Notion Task Tracker CLI
- ✅ Configured your Notion integration
- ✅ Created a task from the command line
- ✅ Updated a task's status

## Next Steps

### Explore More Features

```bash
# Create task with different status
notion-task create "Important meeting prep" --status "In Progress"

# Add detailed notes
notion-task create "Review PR #123" --notes "Check for security issues and code quality"

# Use in scripts
if [ $? -ne 0 ]; then
  notion-task create "Build failed" --notes "Check logs: $LOG_PATH"
fi
```

### Integrate with Your Workflow

1. **Git Hooks:** Automatically create tasks on push
2. **CI/CD Pipelines:** Log build failures and deployments
3. **Automation Scripts:** Manage recurring tasks
4. **Cron Jobs:** Schedule task creation

### Learn More

- [Full Documentation](../README.md)
- [Use Cases & Examples](./use-cases.md)
- [Security Best Practices](./security-guide.md)
- [Troubleshooting](./troubleshooting.md)

## Troubleshooting

### "API key not found"
Make sure you've set the `NOTION_API_KEY` environment variable and restarted your terminal.

### "Database not found"
1. Verify your `NOTION_DATABASE_ID` is correct
2. Ensure you've shared the database with your integration
3. Check that the integration has the right permissions

### "Permission denied"
Your integration needs access to the database. Go to your Notion database and add the integration via **"..." → "Add connections"**.

### Still stuck?
- Check the [Troubleshooting Guide](./troubleshooting.md)
- Open an issue on [GitHub](https://github.com/your-org/notion-task-tracker-cli/issues)
- Ask in [Discussions](https://github.com/your-org/notion-task-tracker-cli/discussions)

---

**Happy task tracking! 🚀**
