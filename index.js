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
 * RAG-Enhanced Task Generation
 * Import and use the RAG system
 */
import { quickStart, printSystemInfo } from './rag_system.js';

/**
 * Example usage — Create and Update a test task
 */
async function main() {
  // Print RAG system information
  printSystemInfo();

  // Step 1: Create a test task (traditional method)
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

  // Step 3: RAG-Enhanced Task Generation Example
  // Uncomment to run RAG system
  /*
  const ragResult = await quickStart(`
    Build a user authentication system with the following requirements:
    
    CONSTRAINTS:
    - Must use JWT tokens
    - Must implement rate limiting
    - Must hash passwords with bcrypt
    
    SUCCESS CRITERIA:
    - Users can log in successfully
    - Invalid attempts are blocked
    - Tokens expire after 24 hours
  `, 1, {
    documentName: 'Auth Requirements',
    createNotionTasks: true
  });
  
  console.log(`Generated ${ragResult.generatedTasks.length} tasks`);
  */
}

main();
