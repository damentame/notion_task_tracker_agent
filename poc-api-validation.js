/**
 * Notion API Proof of Concept Validation Script
 * 
 * This script validates the key API capabilities documented in the integration plan:
 * - Authentication
 * - Pages API
 * - Databases/Data Sources API
 * - Blocks API
 * - Search API
 * - Users API
 * - Rate limiting behavior
 * - Error handling
 * 
 * Usage: node poc-api-validation.js
 * Requirements: NOTION_API_KEY environment variable set
 */

import { Client, APIErrorCode } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: "2026-03-11",
});

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logTest(name, status, details = "") {
  const symbol = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`${symbol} ${name}`);
  if (details) console.log(`   ${details}`);
}

function recordResult(name, status, details = "") {
  const result = { name, details, timestamp: new Date().toISOString() };
  if (status === "pass") {
    results.passed.push(result);
  } else if (status === "fail") {
    results.failed.push(result);
  } else {
    results.warnings.push(result);
  }
  logTest(name, status, details);
}

// Test 1: Authentication validation
async function testAuthentication() {
  console.log("\n🔐 Testing Authentication...");
  try {
    const response = await notion.users.me();
    recordResult(
      "Authentication",
      "pass",
      `Bot user: ${response.name || response.id}`
    );
    return true;
  } catch (error) {
    if (error.code === APIErrorCode.Unauthorized) {
      recordResult(
        "Authentication",
        "fail",
        "Invalid API token. Check NOTION_API_KEY environment variable."
      );
    } else {
      recordResult("Authentication", "fail", error.message);
    }
    return false;
  }
}

// Test 2: Search API
async function testSearch() {
  console.log("\n🔍 Testing Search API...");
  try {
    const response = await notion.search({
      page_size: 5,
    });

    recordResult(
      "Search API",
      "pass",
      `Found ${response.results.length} results (has_more: ${response.has_more})`
    );

    if (response.results.length === 0) {
      recordResult(
        "Search Results",
        "warn",
        "No pages/databases found. Integration may not have access to any content."
      );
    }

    return response.results;
  } catch (error) {
    recordResult("Search API", "fail", error.message);
    return [];
  }
}

// Test 3: Pagination
async function testPagination() {
  console.log("\n📄 Testing Pagination...");
  try {
    let allResults = [];
    let hasMore = true;
    let cursor = undefined;
    let pageCount = 0;

    while (hasMore && pageCount < 3) {
      const response = await notion.search({
        start_cursor: cursor,
        page_size: 5,
      });

      allResults = allResults.concat(response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor;
      pageCount++;
    }

    recordResult(
      "Pagination",
      "pass",
      `Retrieved ${allResults.length} items across ${pageCount} pages`
    );
  } catch (error) {
    recordResult("Pagination", "fail", error.message);
  }
}

// Test 4: Pages API (if we have access to a page)
async function testPagesAPI(searchResults) {
  console.log("\n📝 Testing Pages API...");

  const page = searchResults.find((r) => r.object === "page");

  if (!page) {
    recordResult(
      "Pages API",
      "warn",
      "No accessible pages found. Cannot test page retrieval."
    );
    return;
  }

  try {
    const retrievedPage = await notion.pages.retrieve({ page_id: page.id });
    recordResult(
      "Page Retrieval",
      "pass",
      `Retrieved page: ${retrievedPage.id}`
    );

    // Test blocks API
    const blocks = await notion.blocks.children.list({
      block_id: page.id,
      page_size: 10,
    });
    recordResult(
      "Blocks API",
      "pass",
      `Retrieved ${blocks.results.length} blocks`
    );

    return page;
  } catch (error) {
    recordResult("Pages API", "fail", error.message);
  }
}

// Test 5: Database/Data Source API
async function testDatabaseAPI(searchResults) {
  console.log("\n🗄️  Testing Database/Data Source API...");

  const database = searchResults.find((r) => r.object === "data_source");

  if (!database) {
    recordResult(
      "Database API",
      "warn",
      "No accessible databases found. Cannot test database queries."
    );
    return;
  }

  try {
    // Retrieve database metadata
    const dbMetadata = await notion.dataSources.retrieve({
      data_source_id: database.id,
    });
    recordResult(
      "Database Retrieval",
      "pass",
      `Retrieved database: ${dbMetadata.id}`
    );

    // Query database
    const queryResult = await notion.dataSources.query({
      data_source_id: database.id,
      page_size: 5,
    });
    recordResult(
      "Database Query",
      "pass",
      `Queried ${queryResult.results.length} items`
    );
  } catch (error) {
    if (error.code === APIErrorCode.ObjectNotFound) {
      recordResult(
        "Database API",
        "warn",
        "Database found in search but not accessible. May need sharing permissions."
      );
    } else {
      recordResult("Database API", "fail", error.message);
    }
  }
}

// Test 6: Users API
async function testUsersAPI() {
  console.log("\n👥 Testing Users API...");
  try {
    const users = await notion.users.list({});
    recordResult("Users API", "pass", `Found ${users.results.length} users`);
  } catch (error) {
    recordResult("Users API", "fail", error.message);
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  console.log("\n⚠️  Testing Error Handling...");

  // Test invalid page ID
  try {
    await notion.pages.retrieve({ page_id: "invalid-id-12345" });
    recordResult(
      "Error Handling (Invalid ID)",
      "fail",
      "Expected validation error but succeeded"
    );
  } catch (error) {
    if (error.code === APIErrorCode.ValidationError) {
      recordResult(
        "Error Handling (Invalid ID)",
        "pass",
        "Correctly caught validation error"
      );
    } else if (error.code === APIErrorCode.ObjectNotFound) {
      recordResult(
        "Error Handling (Invalid ID)",
        "pass",
        "Correctly caught not found error"
      );
    } else {
      recordResult(
        "Error Handling (Invalid ID)",
        "fail",
        `Unexpected error: ${error.code}`
      );
    }
  }

  // Test non-existent page with valid UUID format
  try {
    await notion.pages.retrieve({
      page_id: "12345678-1234-1234-1234-123456789012",
    });
    recordResult(
      "Error Handling (Not Found)",
      "fail",
      "Expected not found error but succeeded"
    );
  } catch (error) {
    if (error.code === APIErrorCode.ObjectNotFound) {
      recordResult(
        "Error Handling (Not Found)",
        "pass",
        "Correctly caught not found error"
      );
    } else {
      recordResult(
        "Error Handling (Not Found)",
        "warn",
        `Got ${error.code} instead of object_not_found`
      );
    }
  }
}

// Test 8: Rate Limiting Awareness (measure request timing)
async function testRateLimitingAwareness() {
  console.log("\n⏱️  Testing Rate Limiting Awareness...");

  const startTime = Date.now();
  const requestTimes = [];

  try {
    // Make 10 sequential requests
    for (let i = 0; i < 10; i++) {
      const reqStart = Date.now();
      await notion.users.me();
      const reqEnd = Date.now();
      requestTimes.push(reqEnd - reqStart);
    }

    const totalTime = Date.now() - startTime;
    const avgTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;

    recordResult(
      "Rate Limiting Awareness",
      "pass",
      `10 requests completed in ${totalTime}ms (avg: ${avgTime.toFixed(0)}ms per request)`
    );

    // Warn if we're making requests too fast
    const requestsPerSecond = (10 / totalTime) * 1000;
    if (requestsPerSecond > 3) {
      recordResult(
        "Rate Limit Warning",
        "warn",
        `Making ${requestsPerSecond.toFixed(1)} req/s. Notion limit is 3 req/s average.`
      );
    }
  } catch (error) {
    if (error.code === APIErrorCode.RateLimited) {
      recordResult(
        "Rate Limiting Awareness",
        "pass",
        "Rate limit triggered as expected. Implement queueing strategy."
      );
    } else {
      recordResult("Rate Limiting Awareness", "fail", error.message);
    }
  }
}

// Test 9: Property Types (if we have a page)
async function testPropertyTypes(searchResults) {
  console.log("\n🏷️  Testing Property Types...");

  const page = searchResults.find((r) => r.object === "page");

  if (!page) {
    recordResult(
      "Property Types",
      "warn",
      "No pages available to test property types"
    );
    return;
  }

  try {
    const retrievedPage = await notion.pages.retrieve({ page_id: page.id });
    const properties = retrievedPage.properties;
    const propertyTypes = Object.entries(properties).map(
      ([name, prop]) => `${name}: ${prop.type}`
    );

    recordResult(
      "Property Types",
      "pass",
      `Found ${propertyTypes.length} properties: ${propertyTypes.slice(0, 3).join(", ")}${
        propertyTypes.length > 3 ? "..." : ""
      }`
    );
  } catch (error) {
    recordResult("Property Types", "fail", error.message);
  }
}

// Test 10: API Version Check
async function testAPIVersion() {
  console.log("\n📋 Testing API Version...");
  try {
    // The SDK should automatically send the correct version header
    const response = await notion.users.me();

    recordResult(
      "API Version",
      "pass",
      "SDK configured with API version 2026-03-11"
    );
  } catch (error) {
    recordResult("API Version", "fail", error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  NOTION API PROOF OF CONCEPT VALIDATION");
  console.log("  Integration Plan Validation Script");
  console.log("═══════════════════════════════════════════════════════");

  // Check if API key is set
  if (!process.env.NOTION_API_KEY) {
    console.error("\n❌ NOTION_API_KEY environment variable is not set!");
    console.error("   Set it with: export NOTION_API_KEY=your_token");
    console.error("   Get your token at: https://www.notion.so/my-integrations");
    process.exit(1);
  }

  const startTime = Date.now();

  // Run tests
  const isAuthenticated = await testAuthentication();

  if (!isAuthenticated) {
    console.error("\n❌ Authentication failed. Cannot proceed with other tests.");
    printSummary(startTime);
    process.exit(1);
  }

  await testAPIVersion();

  const searchResults = await testSearch();
  await testPagination();
  await testPagesAPI(searchResults);
  await testDatabaseAPI(searchResults);
  await testUsersAPI();
  await testPropertyTypes(searchResults);
  await testErrorHandling();
  await testRateLimitingAwareness();

  printSummary(startTime);
}

// Print final summary
function printSummary(startTime) {
  const totalTime = Date.now() - startTime;

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log("═══════════════════════════════════════════════════════");

  if (results.failed.length > 0) {
    console.log("\n❌ Failed Tests:");
    results.failed.forEach((r) => {
      console.log(`   - ${r.name}: ${r.details}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    results.warnings.forEach((r) => {
      console.log(`   - ${r.name}: ${r.details}`);
    });
  }

  console.log("\n💡 Next Steps:");
  if (results.warnings.some((w) => w.name.includes("No accessible"))) {
    console.log(
      "   1. Share pages/databases with your integration in Notion"
    );
    console.log('      (Click "..." on any page → "Connect to" → Select your integration)');
  }
  console.log("   2. Review the integration plan: docs/notion-api-integration-plan.md");
  console.log("   3. Begin implementation following the roadmap");
  console.log("   4. Implement rate limiting queue as documented");
  console.log("   5. Add comprehensive error handling");

  console.log("\n✨ POC validation complete!\n");

  // Exit with error code if tests failed
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch((error) => {
  console.error("\n💥 Unexpected error during POC validation:");
  console.error(error);
  process.exit(1);
});
