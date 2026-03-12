/**
 * RAG System Test Suite
 * Tests all components of the RAG-enhanced task generation system
 */

import { TaskSchema, validateTask, computeTaskFields } from '../schema/task_schema.js';
import { 
  chunkDocument, 
  extractConstraints, 
  extractSuccessCriteria,
  classifyChunk 
} from '../rag/chunk_structure.js';
import { chunkStore, retrieveTaskGenerationContext } from '../rag/rag_retrieval.js';
import { buildTaskGenerationPrompt, validatePrompt } from '../rag/task_generation_prompt.js';
import { generateTasks } from '../rag/task_generator.js';
import { validateGeneratedTasks, validateRAGContext } from '../validation/rag_validation.js';

/**
 * Test result tracker
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n=== Running RAG System Tests ===\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.tests.length}`);
    console.log(`Pass rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);

    return this.failed === 0;
  }
}

const runner = new TestRunner();

// ==================== Schema Tests ====================

runner.test('TaskSchema validates required fields', () => {
  const task = {
    task_name: 'Test task',
    description: 'Test description',
    constraints: ['Must test'],
    success_criteria: ['Test passes'],
    has_constraints: true,
    has_success_criteria: true,
    project_id: 1,
    document_ids: [1],
    chunk_ids: [1],
    requirement_snippets: ['Test requirement']
  };

  const result = validateTask(task);
  if (!result.valid) {
    throw new Error(`Task validation failed: ${result.errors.join(', ')}`);
  }
});

runner.test('TaskSchema rejects missing required fields', () => {
  const task = {
    task_name: 'Test task'
    // Missing required fields
  };

  const result = validateTask(task);
  if (result.valid) {
    throw new Error('Should have rejected task with missing fields');
  }
});

runner.test('TaskSchema computes has_constraints flag correctly', () => {
  const task = {
    task_name: 'Test',
    constraints: ['Must test'],
    success_criteria: []
  };

  const computed = computeTaskFields(task);
  if (!computed.has_constraints) {
    throw new Error('has_constraints should be true');
  }
  if (computed.has_success_criteria) {
    throw new Error('has_success_criteria should be false');
  }
});

// ==================== Chunking Tests ====================

runner.test('Document chunking creates proper chunks', () => {
  const content = 'A'.repeat(3000);
  const chunks = chunkDocument(content, {
    chunkSize: 1000,
    overlap: 200,
    document_id: 1,
    project_id: 1
  });

  if (chunks.length < 2) {
    throw new Error('Should have created multiple chunks');
  }

  if (chunks[0].chunk_index !== 0) {
    throw new Error('First chunk should have index 0');
  }

  if (!chunks[0].content) {
    throw new Error('Chunk should have content');
  }
});

runner.test('Constraint extraction finds constraints', () => {
  const content = `
    The system must authenticate users.
    It shall not store passwords in plain text.
    Required to implement rate limiting.
  `;

  const constraints = extractConstraints(content);
  if (constraints.length === 0) {
    throw new Error('Should have found constraints');
  }

  if (!constraints.some(c => c.toLowerCase().includes('must'))) {
    throw new Error('Should have found "must" constraint');
  }
});

runner.test('Success criteria extraction finds criteria', () => {
  const content = `
    Success criteria:
    - Users can log in successfully
    - System should be able to handle 1000 concurrent users
    Expected outcome: Zero downtime during deployment
  `;

  const criteria = extractSuccessCriteria(content);
  if (criteria.length === 0) {
    throw new Error('Should have found success criteria');
  }
});

runner.test('Chunk classification identifies semantic types', () => {
  const constraintText = 'The system must not allow unauthenticated access';
  const requirementText = 'The system must implement user authentication';
  const successText = 'Success criteria: users can log in successfully';

  const type1 = classifyChunk(constraintText);
  const type2 = classifyChunk(requirementText);
  const type3 = classifyChunk(successText);

  if (type1 !== 'constraint') {
    throw new Error(`Expected constraint, got ${type1}`);
  }
  if (type2 !== 'requirement') {
    throw new Error(`Expected requirement, got ${type2}`);
  }
  if (type3 !== 'success_criteria') {
    throw new Error(`Expected success_criteria, got ${type3}`);
  }
});

// ==================== RAG Retrieval Tests ====================

runner.test('Chunk store adds and retrieves documents', () => {
  // Clear store for test
  chunkStore.chunks = [];
  chunkStore.documents.clear();

  const document = {
    id: 999,
    name: 'Test Doc',
    type: 'requirement',
    project_id: 999
  };

  const chunks = [
    { content: 'Test content 1', chunk_index: 0, start_pos: 0, end_pos: 100 },
    { content: 'Test content 2', chunk_index: 1, start_pos: 100, end_pos: 200 }
  ];

  const enriched = chunkStore.addDocument(document, chunks);
  
  if (enriched.length !== 2) {
    throw new Error('Should have added 2 chunks');
  }

  const retrieved = chunkStore.getChunksByProject(999);
  if (retrieved.length !== 2) {
    throw new Error('Should retrieve 2 chunks for project 999');
  }
});

runner.test('RAG retrieval filters by project', async () => {
  // Add test chunks for different projects
  chunkStore.chunks = [];
  
  chunkStore.addDocument(
    { id: 1, name: 'Doc1', type: 'requirement', project_id: 1 },
    [{ content: 'Project 1 requirement', chunk_index: 0, start_pos: 0, end_pos: 100 }]
  );
  
  chunkStore.addDocument(
    { id: 2, name: 'Doc2', type: 'requirement', project_id: 2 },
    [{ content: 'Project 2 requirement', chunk_index: 0, start_pos: 0, end_pos: 100 }]
  );

  const result = await retrieveTaskGenerationContext(1);
  
  const project1Chunks = result.chunks.filter(c => c.project_id === 1);
  const project2Chunks = result.chunks.filter(c => c.project_id === 2);
  
  if (project1Chunks.length === 0) {
    throw new Error('Should have found chunks for project 1');
  }
  if (project2Chunks.length > 0) {
    throw new Error('Should not have found chunks for project 2');
  }
});

// ==================== Prompt Building Tests ====================

runner.test('Prompt builder creates valid prompt', async () => {
  // Setup test data
  chunkStore.chunks = [];
  const document = {
    id: 1,
    name: 'Test Requirements',
    type: 'requirement',
    project_id: 1
  };

  const chunks = [
    { content: 'Must implement authentication', chunk_index: 0, start_pos: 0, end_pos: 100 }
  ];

  chunkStore.addDocument(document, chunks);

  const ragContext = await retrieveTaskGenerationContext(1);
  const prompt = buildTaskGenerationPrompt(ragContext, {
    project_id: 1,
    high_level_query: 'Generate tasks'
  });

  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    throw new Error(`Invalid prompt: ${validation.error}`);
  }

  if (!prompt.includes('RAG CHUNKS')) {
    throw new Error('Prompt should include RAG chunks section');
  }

  if (!prompt.includes('DATABASE SCHEMA')) {
    throw new Error('Prompt should include schema section');
  }
});

// ==================== Task Generation Tests ====================

runner.test('Task generator creates valid tasks', async () => {
  // Setup test data
  chunkStore.chunks = [];
  const document = {
    id: 1,
    name: 'Auth Requirements',
    type: 'requirement',
    project_id: 1
  };

  const chunks = chunkDocument(`
    Authentication Requirements:
    
    Must implement JWT-based authentication.
    Must hash passwords with bcrypt.
    Must implement rate limiting.
    
    Success criteria:
    - Users can log in successfully
    - Tokens expire after 24 hours
  `, {
    document_id: 1,
    project_id: 1
  });

  chunkStore.addDocument(document, chunks);

  const result = await generateTasks(1, 'Generate auth tasks', {
    validateBeforeReturn: false,
    strictMode: false
  });

  if (result.tasks.length === 0) {
    throw new Error('Should have generated tasks');
  }

  const task = result.tasks[0];
  if (!task.task_name) {
    throw new Error('Task should have name');
  }
  if (!task.project_id) {
    throw new Error('Task should have project_id');
  }
});

// ==================== Validation Tests ====================

runner.test('Validator detects missing requirement snippets', () => {
  const task = {
    task_name: 'Test task',
    description: 'Test',
    constraints: [],
    success_criteria: [],
    has_constraints: false,
    has_success_criteria: false,
    project_id: 1,
    document_ids: [1],
    chunk_ids: [1],
    requirement_snippets: [] // EMPTY - should fail
  };

  const validation = validateTask(task);
  if (validation.valid) {
    throw new Error('Should have failed validation due to missing requirement snippets');
  }
});

runner.test('Validator detects mismatched constraint flags', () => {
  const task = {
    task_name: 'Test task',
    description: 'Test',
    constraints: ['Must test'],
    success_criteria: [],
    has_constraints: false, // WRONG - should be true
    has_success_criteria: false,
    project_id: 1,
    document_ids: [1],
    chunk_ids: [1],
    requirement_snippets: ['Test requirement']
  };

  const validation = validateTask(task);
  if (validation.valid) {
    throw new Error('Should have failed validation due to mismatched constraint flag');
  }
});

runner.test('RAG context validation detects empty chunks', () => {
  const emptyContext = {
    chunks: [],
    query: 'test',
    metadata: {}
  };

  const validation = validateRAGContext(emptyContext);
  if (validation.valid) {
    throw new Error('Should have rejected empty RAG context');
  }
});

// ==================== Integration Tests ====================

runner.test('End-to-end: Document to validated tasks', async () => {
  // Clear store
  chunkStore.chunks = [];
  chunkStore.documents.clear();

  const document = {
    id: 1,
    name: 'E2E Test Doc',
    type: 'requirement',
    project_id: 1,
    content: `
      Build a user dashboard.
      
      CONSTRAINTS:
      - Must load in under 2 seconds
      - Must be mobile responsive
      
      SUCCESS CRITERIA:
      - Dashboard displays user profile
      - All metrics load correctly
      - Responsive design works on mobile
    `
  };

  // Chunk document
  const chunks = chunkDocument(document.content, {
    document_id: document.id,
    project_id: document.project_id
  });

  // Add to store
  chunkStore.addDocument(document, chunks);

  // Generate tasks
  const result = await generateTasks(document.project_id, 'Generate dashboard tasks', {
    validateBeforeReturn: false,
    strictMode: false
  });

  if (result.tasks.length === 0) {
    throw new Error('Should have generated tasks');
  }

  // Validate
  const report = validateGeneratedTasks(result.tasks, result.ragContext);
  const summary = report.getSummary();

  if (summary.total_tasks === 0) {
    throw new Error('Should have validated tasks');
  }

  console.log(`  E2E test generated ${summary.total_tasks} tasks with ${summary.passed} valid`);
});

// ==================== Run Tests ====================

runner.run()
  .then(success => {
    if (success) {
      console.log('All tests passed!');
      process.exit(0);
    } else {
      console.log('Some tests failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
