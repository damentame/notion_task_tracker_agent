import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * Create a task in Notion
 */
export async function createTask(title, assignedTo = "Agent", notes = "") {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Task: {
          title: [
            {
              text: { content: title },
            },
          ],
        },
        "Assigned To": {
          people: [],
        },
        Status: {
          status: { name: "To-do" },
        },
        Notes: {
          rich_text: [{ text: { content: notes } }],
        },
        ID: {
          number: null, // This will be auto-incremented by Notion
        },
      },
    });

    console.log("Task created:", response.id);
    return response.id;
  } catch (error) {
    console.error("Error creating task:", error.body || error);
  }
}

/**
 * Update a task's status
 */
export async function updateTask(pageId, status, notes = "") {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          status: { name: status },
        },
        Notes: {
          rich_text: [{ text: { content: notes } }],
        },
      },
    });

    console.log(`Task ${pageId} updated to ${status}`);
  } catch (error) {
    console.error("Error updating task:", error.body || error);
  }
}

/**
 * Example usage — Create and Update a test task
 */
async function main() {
  // Step 1: Create a test task
  const taskId = await createTask(
    "Test Task: Set up Notion integration",
    "Agent",
    "This is just a test task."
  );

  // Step 2: Simulate agent completing the task
  if (taskId) {
    setTimeout(async () => {
      await updateTask(taskId, "Done", "Agent completed this test task.");
    }, 5000);
  }
}

main();
