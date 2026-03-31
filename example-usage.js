/**
 * Example Usage: RAG-Aligned Task Generation Prompt Builder
 * 
 * This file demonstrates practical usage of the task prompt builder
 * in a real-world scenario.
 */

import {
  buildTaskGenerationPrompt,
  validateTaskList,
  extractRAGMetadata,
} from './taskPromptBuilder.js';

// ============================================================================
// Example 1: Basic Task Generation with Mock RAG Chunks
// ============================================================================

console.log('=== Example 1: Basic Task Generation ===\n');

const mockRAGChunks = [
  {
    document_id: 1,
    chunk_id: 5,
    requirement_type: 'functional',
    has_constraints: true,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'API Requirements Document',
    similarity_score: 0.95,
    content: `The system must provide secure user authentication via JWT tokens. 
    The login endpoint must validate user credentials against the database and return 
    a signed JWT token upon successful authentication. The token must expire after 24 hours.`,
    extracted_constraints: [
      'Must use JWT tokens for authentication',
      'Must validate credentials against database',
      'Token must expire after 24 hours',
    ],
    extracted_success_criteria: [
      'User can successfully log in with valid credentials',
      'Invalid credentials return 401 error',
      'JWT token is returned on successful authentication',
      'Token expires after 24 hours',
    ],
  },
  {
    document_id: 1,
    chunk_id: 7,
    requirement_type: 'constraint',
    has_constraints: true,
    has_success_criteria: false,
    project_id: 42,
    document_name: 'API Requirements Document',
    similarity_score: 0.88,
    content: `All API endpoints must implement rate limiting to prevent abuse. 
    The system must enforce a maximum of 100 requests per minute per IP address. 
    Requests exceeding this limit must return a 429 Too Many Requests status code.`,
    extracted_constraints: [
      'Must implement rate limiting on all endpoints',
      'Maximum 100 requests per minute per IP address',
      'Must return 429 status code when limit exceeded',
    ],
  },
  {
    document_id: 1,
    chunk_id: 12,
    requirement_type: 'functional',
    has_constraints: false,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'API Requirements Document',
    similarity_score: 0.85,
    content: `The system must provide a logout endpoint that invalidates the user's JWT token. 
    The endpoint must accept the token in the Authorization header and add it to a blacklist.`,
    extracted_success_criteria: [
      'User can successfully log out',
      'Token is invalidated after logout',
      'Invalidated token cannot be used for subsequent requests',
    ],
  },
  {
    document_id: 2,
    chunk_id: 3,
    requirement_type: 'acceptance_criteria',
    has_constraints: false,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'Testing Requirements',
    similarity_score: 0.82,
    content: `The authentication system must be tested with at least 95% code coverage. 
    All edge cases must be covered including expired tokens, invalid tokens, and 
    concurrent login attempts. Load testing must verify the system can handle 
    1000 concurrent users.`,
    extracted_success_criteria: [
      'Achieve at least 95% code coverage for authentication module',
      'All edge cases are tested (expired, invalid, concurrent)',
      'System handles 1000 concurrent users in load tests',
    ],
  },
  {
    document_id: 3,
    chunk_id: 8,
    requirement_type: 'functional',
    has_constraints: true,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'Database Schema',
    similarity_score: 0.79,
    content: `The user table must store hashed passwords using bcrypt with a cost factor of 12. 
    The table must include fields for email (unique), password_hash, created_at, and last_login. 
    Email addresses must be validated and stored in lowercase.`,
    extracted_constraints: [
      'Must use bcrypt with cost factor 12 for password hashing',
      'Email must be unique',
      'Email must be stored in lowercase',
    ],
    extracted_success_criteria: [
      'Passwords are securely hashed with bcrypt',
      'Email uniqueness is enforced at database level',
      'Email validation prevents invalid addresses',
    ],
  },
];

// Extract metadata for analysis
const metadata = extractRAGMetadata(mockRAGChunks);
console.log('RAG Context Analysis:');
console.log(`- Total chunks: ${metadata.totalChunks}`);
console.log(`- Source documents: ${metadata.uniqueDocuments}`);
console.log(`- Chunks with constraints: ${metadata.hasConstraints}`);
console.log(`- Chunks with success criteria: ${metadata.hasSuccessCriteria}`);
console.log('- Requirement types:');
Object.entries(metadata.requirementTypes).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}`);
});
console.log();

// Build the task generation prompt
const prompt = buildTaskGenerationPrompt({
  ragChunks: mockRAGChunks,
  taskQuery: `Generate a comprehensive, implementation-ready task list for building 
  the user authentication system. Include all necessary implementation tasks, 
  database setup, testing, and security considerations. Prioritize security-critical 
  tasks and ensure all constraints from the requirements are captured.`,
  projectId: 42,
  documentId: 1,
  agentId: 'cursor-agent-123',
  dbAgentId: 'db-agent-456',
  agentInstanceId: 'instance-789',
});

console.log('Generated Prompt Preview (first 1000 characters):');
console.log(prompt.substring(0, 1000));
console.log('...\n');
console.log(`Full prompt length: ${prompt.length} characters\n`);

// ============================================================================
// Example 2: Mock Task Generation and Validation
// ============================================================================

console.log('=== Example 2: Task Validation ===\n');

// Simulate tasks that might be generated by an LLM
const mockGeneratedTasks = [
  {
    task_name: 'Design and implement user authentication database schema',
    task_type: 'implementation',
    description: `Create the database schema for user authentication as specified in the requirements. 
    This includes creating a users table with fields for email (unique), password_hash, created_at, 
    and last_login. The schema must enforce email uniqueness at the database level and support 
    bcrypt password hashing with cost factor 12. Email addresses must be validated and stored in lowercase.`,
    parameters: {
      database: 'postgresql',
      table_name: 'users',
      fields: [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL' },
        { name: 'password_hash', type: 'VARCHAR(255) NOT NULL' },
        { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'last_login', type: 'TIMESTAMP' },
      ],
      indexes: ['email'],
    },
    status: 'PENDING',
    priority: 1,
    task_notes: 'Consider adding indexes for performance. Ensure migration is reversible.',
    task_data: {
      requirement_snippets: [
        'The user table must store hashed passwords using bcrypt with a cost factor of 12.',
        'The table must include fields for email (unique), password_hash, created_at, and last_login.',
        'Email addresses must be validated and stored in lowercase.',
      ],
      requirement_type: 'functional',
      constraints: [
        'Must use bcrypt with cost factor 12 for password hashing',
        'Email must be unique',
        'Email must be stored in lowercase',
      ],
      success_criteria: [
        'Passwords are securely hashed with bcrypt',
        'Email uniqueness is enforced at database level',
        'Email validation prevents invalid addresses',
      ],
      execution_complexity: 'medium',
      project_id: 42,
      document_ids: [3],
      chunk_ids: [8],
    },
    dependencies: [],
  },
  {
    task_name: 'Implement JWT-based login endpoint',
    task_type: 'implementation',
    description: `Implement the POST /api/auth/login endpoint that validates user credentials 
    and returns a signed JWT token. The endpoint must validate the email and password against 
    the database, hash the provided password using bcrypt, and compare it with the stored hash. 
    Upon successful authentication, generate a JWT token with 24-hour expiration and return it 
    to the client. Failed authentication attempts must return a 401 Unauthorized status.`,
    parameters: {
      endpoint: '/api/auth/login',
      method: 'POST',
      request_body: {
        email: 'string',
        password: 'string',
      },
      response: {
        success: { token: 'string', expires_at: 'timestamp' },
        error: { message: 'string', status: 401 },
      },
      token_expiration: '24h',
    },
    status: 'PENDING',
    priority: 1,
    task_notes: 'Implement rate limiting to prevent brute force attacks. Log failed attempts.',
    task_data: {
      requirement_snippets: [
        'The system must provide secure user authentication via JWT tokens.',
        'The login endpoint must validate user credentials against the database and return a signed JWT token upon successful authentication.',
        'The token must expire after 24 hours.',
      ],
      requirement_type: 'functional',
      constraints: [
        'Must use JWT tokens for authentication',
        'Must validate credentials against database',
        'Token must expire after 24 hours',
      ],
      success_criteria: [
        'User can successfully log in with valid credentials',
        'Invalid credentials return 401 error',
        'JWT token is returned on successful authentication',
        'Token expires after 24 hours',
      ],
      execution_complexity: 'high',
      project_id: 42,
      document_ids: [1],
      chunk_ids: [5],
    },
    dependencies: ['Design and implement user authentication database schema'],
  },
  {
    task_name: 'Implement rate limiting middleware',
    task_type: 'implementation',
    description: `Implement rate limiting middleware that enforces a maximum of 100 requests 
    per minute per IP address across all API endpoints. The middleware must track request counts 
    per IP address and return a 429 Too Many Requests status code when the limit is exceeded. 
    Include appropriate headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) 
    in responses to inform clients of their rate limit status.`,
    parameters: {
      max_requests: 100,
      time_window: '1 minute',
      tracking_key: 'ip_address',
      response_status: 429,
      headers: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
    },
    status: 'PENDING',
    priority: 2,
    task_notes: 'Consider using Redis for distributed rate limiting in production.',
    task_data: {
      requirement_snippets: [
        'All API endpoints must implement rate limiting to prevent abuse.',
        'The system must enforce a maximum of 100 requests per minute per IP address.',
        'Requests exceeding this limit must return a 429 Too Many Requests status code.',
      ],
      requirement_type: 'constraint',
      constraints: [
        'Must implement rate limiting on all endpoints',
        'Maximum 100 requests per minute per IP address',
        'Must return 429 status code when limit exceeded',
      ],
      success_criteria: [],
      execution_complexity: 'medium',
      project_id: 42,
      document_ids: [1],
      chunk_ids: [7],
    },
    dependencies: [],
  },
  {
    task_name: 'Implement logout endpoint with token blacklisting',
    task_type: 'implementation',
    description: `Implement the POST /api/auth/logout endpoint that invalidates the user's JWT token. 
    The endpoint must accept the token in the Authorization header, validate it, and add it to a 
    blacklist to prevent further use. The blacklist should be stored in a fast-access data store 
    (e.g., Redis) with automatic expiration matching the token's original expiration time.`,
    parameters: {
      endpoint: '/api/auth/logout',
      method: 'POST',
      headers: {
        Authorization: 'Bearer <token>',
      },
      blacklist_storage: 'redis',
      blacklist_ttl: 'token_expiration',
    },
    status: 'PENDING',
    priority: 2,
    task_notes: 'Ensure blacklist is checked on every authenticated request.',
    task_data: {
      requirement_snippets: [
        'The system must provide a logout endpoint that invalidates the user\'s JWT token.',
        'The endpoint must accept the token in the Authorization header and add it to a blacklist.',
      ],
      requirement_type: 'functional',
      constraints: [],
      success_criteria: [
        'User can successfully log out',
        'Token is invalidated after logout',
        'Invalidated token cannot be used for subsequent requests',
      ],
      execution_complexity: 'medium',
      project_id: 42,
      document_ids: [1],
      chunk_ids: [12],
    },
    dependencies: ['Implement JWT-based login endpoint'],
  },
  {
    task_name: 'Implement comprehensive authentication test suite',
    task_type: 'testing',
    description: `Create a comprehensive test suite for the authentication system that achieves 
    at least 95% code coverage. Tests must cover all edge cases including expired tokens, invalid 
    tokens, concurrent login attempts, rate limiting, and token blacklisting. Include unit tests 
    for individual components and integration tests for complete authentication flows. Implement 
    load tests to verify the system can handle 1000 concurrent users.`,
    parameters: {
      test_framework: 'jest',
      coverage_target: 95,
      test_types: ['unit', 'integration', 'load'],
      load_test_users: 1000,
      edge_cases: [
        'expired_tokens',
        'invalid_tokens',
        'concurrent_logins',
        'rate_limiting',
        'token_blacklisting',
      ],
    },
    status: 'PENDING',
    priority: 3,
    task_notes: 'Run load tests in staging environment before production deployment.',
    task_data: {
      requirement_snippets: [
        'The authentication system must be tested with at least 95% code coverage.',
        'All edge cases must be covered including expired tokens, invalid tokens, and concurrent login attempts.',
        'Load testing must verify the system can handle 1000 concurrent users.',
      ],
      requirement_type: 'acceptance_criteria',
      constraints: [],
      success_criteria: [
        'Achieve at least 95% code coverage for authentication module',
        'All edge cases are tested (expired, invalid, concurrent)',
        'System handles 1000 concurrent users in load tests',
      ],
      execution_complexity: 'high',
      project_id: 42,
      document_ids: [2],
      chunk_ids: [3],
    },
    dependencies: [
      'Implement JWT-based login endpoint',
      'Implement logout endpoint with token blacklisting',
      'Implement rate limiting middleware',
    ],
  },
];

// Validate the generated tasks
console.log('Validating generated tasks...\n');
const validation = validateTaskList(mockGeneratedTasks);

if (validation.valid) {
  console.log('✓ All tasks passed validation!\n');
  console.log(`Generated ${mockGeneratedTasks.length} valid tasks:\n`);
  mockGeneratedTasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.task_name}`);
    console.log(`   Type: ${task.task_type}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Complexity: ${task.task_data.execution_complexity}`);
    console.log(`   Source: ${task.task_data.document_ids.length} document(s), ${task.task_data.chunk_ids.length} chunk(s)`);
    console.log(`   Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`);
    console.log();
  });
} else {
  console.log('✗ Validation failed!\n');
  validation.taskErrors.forEach(error => {
    console.log(`Task: ${error.task_name}`);
    console.log(`Errors:`);
    error.errors.forEach(err => console.log(`  - ${err}`));
    console.log();
  });
}

// ============================================================================
// Example 3: Traceability Analysis
// ============================================================================

console.log('=== Example 3: Requirement Traceability Analysis ===\n');

// Analyze traceability of generated tasks
console.log('Traceability Matrix:\n');

const documentCoverage = new Map();
const chunkCoverage = new Map();

mockGeneratedTasks.forEach(task => {
  task.task_data.document_ids.forEach(docId => {
    if (!documentCoverage.has(docId)) {
      documentCoverage.set(docId, []);
    }
    documentCoverage.get(docId).push(task.task_name);
  });

  task.task_data.chunk_ids.forEach(chunkId => {
    if (!chunkCoverage.has(chunkId)) {
      chunkCoverage.set(chunkId, []);
    }
    chunkCoverage.get(chunkId).push(task.task_name);
  });
});

console.log('Document Coverage:');
documentCoverage.forEach((tasks, docId) => {
  const doc = mockRAGChunks.find(c => c.document_id === docId);
  console.log(`\nDocument ${docId}: ${doc?.document_name || 'Unknown'}`);
  console.log(`Tasks implementing requirements from this document:`);
  tasks.forEach(taskName => console.log(`  - ${taskName}`));
});

console.log('\n\nChunk Coverage:');
chunkCoverage.forEach((tasks, chunkId) => {
  const chunk = mockRAGChunks.find(c => c.chunk_id === chunkId);
  console.log(`\nChunk ${chunkId} (${chunk?.requirement_type || 'unknown'}):`);
  console.log(`Content preview: ${chunk?.content.substring(0, 80)}...`);
  console.log(`Tasks implementing this requirement:`);
  tasks.forEach(taskName => console.log(`  - ${taskName}`));
});

console.log('\n\n=== Examples Complete ===');
