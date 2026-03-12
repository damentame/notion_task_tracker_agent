/**
 * RAG-Enhanced Task Generation Demo
 * Demonstrates the complete RAG system in action
 */

import { NotionRAGIntegration, ExampleDocument } from '../integration/notion_rag_integration.js';
import { validateRAGContext } from '../validation/rag_validation.js';

/**
 * Run comprehensive demo
 */
async function runDemo() {
  console.log('\n=== RAG-Enhanced Task Generation System Demo ===\n');

  // Initialize integration
  const integration = new NotionRAGIntegration({
    validateBeforeCreation: true,
    createNotionTasks: false, // Set to true to actually create in Notion
    includeMetadataInNotes: true
  });

  // Example project document
  const document = {
    id: 1,
    name: "API Development Requirements",
    type: "requirement",
    project_id: 100,
    content: `
      REST API Development Requirements
      
      The system must implement a RESTful API with the following specifications:
      
      CORE REQUIREMENTS:
      1. Implement CRUD operations for user management
      2. Create authentication middleware
      3. Build rate limiting system
      4. Add request logging and monitoring
      5. Implement error handling and validation
      
      CONSTRAINTS:
      - API must follow REST principles strictly
      - All endpoints must require authentication except /health
      - Must not exceed 100 requests per minute per user
      - Must use JSON for all request/response bodies
      - Must implement versioning (v1 prefix)
      - Response time must be under 200ms for 95th percentile
      - Must support pagination for list endpoints (max 100 items per page)
      
      SUCCESS CRITERIA:
      - All CRUD operations return appropriate HTTP status codes
      - Authentication middleware blocks unauthorized requests
      - Rate limiting triggers after 100 requests in 1 minute
      - Error responses include detailed error messages and codes
      - API documentation is generated automatically from code
      - All endpoints pass security audit
      - Load tests show < 200ms response time at 95th percentile
      
      TECHNICAL SPECIFICATIONS:
      - Use Express.js framework
      - PostgreSQL database with connection pooling
      - JWT tokens for authentication (24-hour expiration)
      - Redis for rate limiting and caching
      - Winston for logging
      - Joi for input validation
      - Swagger/OpenAPI for documentation
      
      DEPENDENCIES:
      - Database schema must be created first
      - Authentication service must be ready before protected endpoints
      - Rate limiting service must be configured before API deployment
      
      SECURITY REQUIREMENTS:
      - Must sanitize all user inputs to prevent SQL injection
      - Must implement CORS with strict origin checking
      - Must use HTTPS in production
      - Must hash sensitive data before storage
      - Must implement request signing for sensitive operations
    `,
    taskQuery: "Generate detailed implementation tasks for REST API development"
  };

  console.log('Step 1: Processing project document...');
  console.log(`Document: ${document.name}`);
  console.log(`Content length: ${document.content.length} characters\n`);

  // Process the document
  const result = await integration.processDocument(document, document.project_id);

  console.log('\nStep 2: Document chunking results');
  console.log(`Chunks created: ${result.chunks.length}`);
  console.log(`Documents referenced: ${result.summary.chunks_created}`);

  // Show chunk classification
  const constraintChunks = result.chunks.filter(c => c.metadata?.has_constraints);
  const successChunks = result.chunks.filter(c => c.metadata?.has_success_criteria);
  
  console.log(`Chunks with constraints: ${constraintChunks.length}`);
  console.log(`Chunks with success criteria: ${successChunks.length}`);

  console.log('\nStep 3: Task generation results');
  console.log(`Tasks generated: ${result.generatedTasks.length}`);
  console.log(`Tasks with constraints: ${result.generatedTasks.filter(t => t.has_constraints).length}`);
  console.log(`Tasks with success criteria: ${result.generatedTasks.filter(t => t.has_success_criteria).length}`);

  console.log('\nStep 4: Validation results');
  if (result.validationReport) {
    const summary = result.validationReport.getSummary();
    console.log(`Validation pass rate: ${summary.pass_rate}%`);
    console.log(`Valid tasks: ${summary.passed}/${summary.total_tasks}`);
    console.log(`Total errors: ${summary.total_errors}`);
    console.log(`Total warnings: ${summary.total_warnings}`);
  }

  console.log('\n=== Generated Tasks ===\n');
  
  result.generatedTasks.forEach((task, idx) => {
    console.log(`\nTask ${idx + 1}: ${task.task_name}`);
    console.log(`Description: ${task.description.substring(0, 100)}...`);
    console.log(`Has constraints: ${task.has_constraints} (${task.constraints?.length || 0} items)`);
    console.log(`Has success criteria: ${task.has_success_criteria} (${task.success_criteria?.length || 0} items)`);
    console.log(`Chunks referenced: ${task.chunk_ids.length}`);
    console.log(`Requirement snippets: ${task.requirement_snippets?.length || 0}`);
    console.log(`Priority: ${task.priority || 'N/A'}`);
    console.log(`Complexity: ${task.estimated_complexity || 'N/A'}`);
    
    if (task.constraints && task.constraints.length > 0) {
      console.log(`\nConstraints:`);
      task.constraints.slice(0, 2).forEach(c => console.log(`  • ${c}`));
      if (task.constraints.length > 2) {
        console.log(`  ... and ${task.constraints.length - 2} more`);
      }
    }
    
    if (task.success_criteria && task.success_criteria.length > 0) {
      console.log(`\nSuccess Criteria:`);
      task.success_criteria.slice(0, 2).forEach(sc => console.log(`  • ${sc}`));
      if (task.success_criteria.length > 2) {
        console.log(`  ... and ${task.success_criteria.length - 2} more`);
      }
    }
  });

  console.log('\n\n=== Validation Details ===\n');
  if (result.validationReport) {
    console.log(result.validationReport.toString());
  }

  console.log('\n=== Summary ===\n');
  console.log(JSON.stringify(result.summary, null, 2));

  console.log('\n=== Demo Complete ===\n');

  return result;
}

/**
 * Run minimal demo
 */
async function runMinimalDemo() {
  console.log('\n=== Minimal RAG Demo ===\n');

  const integration = new NotionRAGIntegration({
    validateBeforeCreation: true,
    createNotionTasks: false
  });

  const simpleDoc = {
    id: 1,
    name: "Simple Requirements",
    type: "requirement",
    project_id: 1,
    content: `
      Build a user dashboard with the following features:
      
      MUST HAVE:
      - User profile display
      - Activity feed
      - Settings panel
      
      CONSTRAINTS:
      - Must load in under 2 seconds
      - Must be mobile responsive
      
      SUCCESS CRITERIA:
      - Dashboard loads successfully
      - All components render correctly
      - Performance metrics meet requirements
    `
  };

  const result = await integration.processDocument(simpleDoc, simpleDoc.project_id);
  
  console.log(`Generated ${result.generatedTasks.length} tasks`);
  console.log(`Validation passed: ${result.validationReport?.getSummary().passed || 0}`);
  
  return result;
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo()
    .then(() => console.log('Demo completed successfully'))
    .catch(error => console.error('Demo failed:', error));
}

export { runDemo, runMinimalDemo };
