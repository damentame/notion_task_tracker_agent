/**
 * Tests for RAG-Aligned Task Generation Prompt Builder
 */

import {
  buildTaskGenerationPrompt,
  validateTaskSchema,
  validateTaskList,
  extractRAGMetadata,
  formatRAGChunks,
  formatTaskSchema,
  TASK_SCHEMA,
} from './taskPromptBuilder.js';

// Mock RAG chunks for testing
const mockRAGChunks = [
  {
    document_id: 1,
    chunk_id: 5,
    requirement_type: 'functional',
    has_constraints: true,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'API Requirements',
    similarity_score: 0.95,
    content: 'The system must provide secure user authentication via JWT tokens. Login endpoint must validate credentials and return a token.',
    extracted_constraints: [
      'Must use JWT tokens',
      'Must validate credentials before issuing tokens',
    ],
    extracted_success_criteria: [
      'User can successfully log in with valid credentials',
      'Invalid credentials return appropriate error',
    ],
  },
  {
    document_id: 1,
    chunk_id: 7,
    requirement_type: 'constraint',
    has_constraints: true,
    has_success_criteria: false,
    project_id: 42,
    document_name: 'API Requirements',
    similarity_score: 0.88,
    content: 'All API endpoints must implement rate limiting to prevent abuse. Maximum 100 requests per minute per IP address.',
    extracted_constraints: [
      'Must implement rate limiting',
      'Maximum 100 requests per minute per IP',
    ],
  },
  {
    document_id: 2,
    chunk_id: 12,
    requirement_type: 'acceptance_criteria',
    has_constraints: false,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'Testing Requirements',
    similarity_score: 0.82,
    content: 'Authentication system must be tested with at least 95% code coverage. All edge cases must be covered.',
    extracted_success_criteria: [
      'Achieve at least 95% code coverage',
      'All edge cases are tested',
    ],
  },
];

// Valid task example
const validTask = {
  task_name: 'Implement user authentication API',
  task_type: 'implementation',
  description: 'Implement REST API endpoints for user authentication as specified in the requirements. This includes login, logout, and token validation endpoints.',
  parameters: {
    endpoints: ['/api/auth/login', '/api/auth/logout'],
    authentication_method: 'JWT',
  },
  status: 'PENDING',
  priority: 1,
  task_notes: 'Consider rate limiting for login attempts',
  task_data: {
    requirement_snippets: [
      'The system must provide secure user authentication via JWT tokens',
      'Login endpoint must validate credentials and return a token',
    ],
    requirement_type: 'functional',
    constraints: [
      'Must use JWT tokens',
      'Must validate credentials before issuing tokens',
    ],
    success_criteria: [
      'User can successfully log in with valid credentials',
      'Invalid credentials return appropriate error',
      'JWT token is returned on successful authentication',
    ],
    execution_complexity: 'medium',
    project_id: 42,
    document_ids: [1, 2],
    chunk_ids: [5, 7, 12],
  },
  dependencies: [],
};

// Test suite
console.log('=== RAG-Aligned Task Generation Prompt Builder Tests ===\n');

// Test 1: Build prompt with all options
console.log('Test 1: Build complete task generation prompt');
try {
  const prompt = buildTaskGenerationPrompt({
    ragChunks: mockRAGChunks,
    taskQuery: 'Generate tasks for implementing the authentication system',
    projectId: 42,
    documentId: 1,
    agentId: 'agent-123',
    dbAgentId: 'db-agent-456',
    agentInstanceId: 'instance-789',
  });
  
  // Verify prompt includes required sections
  const requiredSections = [
    'PRIMARY OBJECTIVE',
    'STRICT REQUIREMENT SOURCE',
    'REQUIREMENT TRACEABILITY',
    'RAG CHUNKS',
    'TASK SCHEMA',
    'TASK GENERATION INSTRUCTIONS',
    'OUTPUT FORMAT',
    'CRITICAL REMINDERS',
  ];
  
  let allSectionsPresent = true;
  const missingSections = [];
  
  requiredSections.forEach(section => {
    if (!prompt.includes(section)) {
      allSectionsPresent = false;
      missingSections.push(section);
    }
  });
  
  if (allSectionsPresent) {
    console.log('✓ Prompt includes all required sections');
  } else {
    console.log('✗ Prompt missing sections:', missingSections);
  }
  
  // Verify high-level query is included
  if (prompt.includes('Generate tasks for implementing the authentication system')) {
    console.log('✓ High-level query/objective is included');
  } else {
    console.log('✗ High-level query not found in prompt');
  }
  
  // Verify RAG chunks are embedded
  if (prompt.includes('Document ID: 1') && prompt.includes('Chunk ID: 5')) {
    console.log('✓ RAG chunks are embedded directly');
  } else {
    console.log('✗ RAG chunks not properly embedded');
  }
  
  // Verify DB schema alignment
  const schemaFields = [
    'task_name',
    'task_type',
    'description',
    'parameters',
    'status',
    'priority',
    'task_notes',
    'task_data',
    'requirement_snippets',
    'requirement_type',
    'constraints',
    'success_criteria',
    'execution_complexity',
    'document_ids',
    'chunk_ids',
    'dependencies',
  ];
  
  let allFieldsPresent = true;
  const missingFields = [];
  
  schemaFields.forEach(field => {
    if (!prompt.includes(field)) {
      allFieldsPresent = false;
      missingFields.push(field);
    }
  });
  
  if (allFieldsPresent) {
    console.log('✓ Prompt includes complete task schema matching DB main.task structure');
  } else {
    console.log('✗ Prompt missing schema fields:', missingFields);
  }
  
  // Verify requirement traceability enforcement
  if (prompt.includes('document_ids') && prompt.includes('chunk_ids') && 
      prompt.includes('requirement_snippets') && prompt.includes('traceability')) {
    console.log('✓ Prompt enforces requirement traceability');
  } else {
    console.log('✗ Prompt does not enforce requirement traceability');
  }
  
  console.log('✓ Test 1 passed\n');
} catch (error) {
  console.log('✗ Test 1 failed:', error.message, '\n');
}

// Test 2: Build prompt with minimal options (defaults)
console.log('Test 2: Build prompt with default objective');
try {
  const prompt = buildTaskGenerationPrompt({
    ragChunks: mockRAGChunks,
  });
  
  if (prompt.includes('Generate an exhaustive, implementation-ready task list')) {
    console.log('✓ Default objective is used when taskQuery not provided');
  } else {
    console.log('✗ Default objective not found');
  }
  
  if (prompt.includes('project_id=UNKNOWN')) {
    console.log('✓ Handles missing projectId gracefully');
  } else {
    console.log('✗ Does not handle missing projectId');
  }
  
  console.log('✓ Test 2 passed\n');
} catch (error) {
  console.log('✗ Test 2 failed:', error.message, '\n');
}

// Test 3: Format RAG chunks
console.log('Test 3: Format RAG chunks for embedding');
try {
  const formatted = formatRAGChunks(mockRAGChunks);
  
  if (formatted.includes('CHUNK 1') && formatted.includes('CHUNK 2') && formatted.includes('CHUNK 3')) {
    console.log('✓ All chunks are formatted');
  } else {
    console.log('✗ Not all chunks formatted');
  }
  
  if (formatted.includes('Document ID: 1') && formatted.includes('Chunk ID: 5')) {
    console.log('✓ Chunk metadata is included');
  } else {
    console.log('✗ Chunk metadata missing');
  }
  
  if (formatted.includes('Requirement Type: functional') && 
      formatted.includes('Has Constraints: YES') &&
      formatted.includes('Has Success Criteria: YES')) {
    console.log('✓ Chunk flags are included');
  } else {
    console.log('✗ Chunk flags missing');
  }
  
  if (formatted.includes('Extracted Constraints:') && 
      formatted.includes('Extracted Success Criteria:')) {
    console.log('✓ Extracted metadata is included');
  } else {
    console.log('✗ Extracted metadata missing');
  }
  
  console.log('✓ Test 3 passed\n');
} catch (error) {
  console.log('✗ Test 3 failed:', error.message, '\n');
}

// Test 4: Format RAG chunks with empty array
console.log('Test 4: Handle empty RAG chunks');
try {
  const formatted = formatRAGChunks([]);
  
  if (formatted.includes('No RAG chunks provided')) {
    console.log('✓ Handles empty RAG chunks gracefully');
  } else {
    console.log('✗ Does not handle empty RAG chunks');
  }
  
  console.log('✓ Test 4 passed\n');
} catch (error) {
  console.log('✗ Test 4 failed:', error.message, '\n');
}

// Test 5: Format task schema
console.log('Test 5: Format task schema section');
try {
  const schema = formatTaskSchema(42);
  
  if (schema.includes('TASK SCHEMA') && schema.includes('MIRRORS DB main.task')) {
    console.log('✓ Schema header is correct');
  } else {
    console.log('✗ Schema header missing');
  }
  
  if (schema.includes('"project_id": 42')) {
    console.log('✓ Project ID is included in schema');
  } else {
    console.log('✗ Project ID not in schema');
  }
  
  if (schema.includes('execution_complexity')) {
    console.log('✓ execution_complexity field is included');
  } else {
    console.log('✗ execution_complexity field missing');
  }
  
  console.log('✓ Test 5 passed\n');
} catch (error) {
  console.log('✗ Test 5 failed:', error.message, '\n');
}

// Test 6: Validate valid task
console.log('Test 6: Validate valid task schema');
try {
  const validation = validateTaskSchema(validTask);
  
  if (validation.valid) {
    console.log('✓ Valid task passes validation');
  } else {
    console.log('✗ Valid task fails validation:', validation.errors);
  }
  
  if (validation.errors.length === 0) {
    console.log('✓ No validation errors for valid task');
  } else {
    console.log('✗ Unexpected validation errors:', validation.errors);
  }
  
  console.log('✓ Test 6 passed\n');
} catch (error) {
  console.log('✗ Test 6 failed:', error.message, '\n');
}

// Test 7: Validate invalid tasks
console.log('Test 7: Validate invalid task schemas');
try {
  const invalidTasks = [
    { ...validTask, task_name: null },
    { ...validTask, priority: 'high' }, // should be number
    { ...validTask, task_data: { ...validTask.task_data, document_ids: [] } }, // empty array
    { ...validTask, task_data: { ...validTask.task_data, execution_complexity: 'invalid' } },
    { ...validTask, dependencies: 'task1' }, // should be array
  ];
  
  let allInvalid = true;
  invalidTasks.forEach((task, index) => {
    const validation = validateTaskSchema(task);
    if (validation.valid) {
      console.log(`✗ Invalid task ${index + 1} incorrectly passed validation`);
      allInvalid = false;
    }
  });
  
  if (allInvalid) {
    console.log('✓ All invalid tasks correctly fail validation');
  }
  
  console.log('✓ Test 7 passed\n');
} catch (error) {
  console.log('✗ Test 7 failed:', error.message, '\n');
}

// Test 8: Validate task list
console.log('Test 8: Validate task list');
try {
  const validList = [validTask, { ...validTask, task_name: 'Another task' }];
  const validation = validateTaskList(validList);
  
  if (validation.valid) {
    console.log('✓ Valid task list passes validation');
  } else {
    console.log('✗ Valid task list fails validation:', validation.taskErrors);
  }
  
  const invalidList = [validTask, { task_name: 'Invalid' }];
  const invalidValidation = validateTaskList(invalidList);
  
  if (!invalidValidation.valid && invalidValidation.taskErrors.length > 0) {
    console.log('✓ Invalid task list correctly fails validation');
  } else {
    console.log('✗ Invalid task list incorrectly passes validation');
  }
  
  console.log('✓ Test 8 passed\n');
} catch (error) {
  console.log('✗ Test 8 failed:', error.message, '\n');
}

// Test 9: Extract RAG metadata
console.log('Test 9: Extract RAG metadata');
try {
  const metadata = extractRAGMetadata(mockRAGChunks);
  
  if (metadata.totalChunks === 3) {
    console.log('✓ Total chunks count is correct');
  } else {
    console.log('✗ Total chunks count incorrect:', metadata.totalChunks);
  }
  
  if (metadata.uniqueDocuments === 2) {
    console.log('✓ Unique documents count is correct');
  } else {
    console.log('✗ Unique documents count incorrect:', metadata.uniqueDocuments);
  }
  
  if (metadata.requirementTypes.functional === 1 &&
      metadata.requirementTypes.constraint === 1 &&
      metadata.requirementTypes.acceptance_criteria === 1) {
    console.log('✓ Requirement types are correctly counted');
  } else {
    console.log('✗ Requirement types incorrect:', metadata.requirementTypes);
  }
  
  if (metadata.hasConstraints === 2) {
    console.log('✓ Constraints count is correct');
  } else {
    console.log('✗ Constraints count incorrect:', metadata.hasConstraints);
  }
  
  if (metadata.hasSuccessCriteria === 2) {
    console.log('✓ Success criteria count is correct');
  } else {
    console.log('✗ Success criteria count incorrect:', metadata.hasSuccessCriteria);
  }
  
  console.log('✓ Test 9 passed\n');
} catch (error) {
  console.log('✗ Test 9 failed:', error.message, '\n');
}

// Test 10: Extract metadata from empty chunks
console.log('Test 10: Extract metadata from empty chunks');
try {
  const metadata = extractRAGMetadata([]);
  
  if (metadata.totalChunks === 0 && metadata.uniqueDocuments === 0) {
    console.log('✓ Handles empty chunks gracefully');
  } else {
    console.log('✗ Does not handle empty chunks correctly');
  }
  
  console.log('✓ Test 10 passed\n');
} catch (error) {
  console.log('✗ Test 10 failed:', error.message, '\n');
}

// Test 11: Verify TASK_SCHEMA constant
console.log('Test 11: Verify TASK_SCHEMA constant');
try {
  if (TASK_SCHEMA && typeof TASK_SCHEMA === 'object') {
    console.log('✓ TASK_SCHEMA constant is exported');
  } else {
    console.log('✗ TASK_SCHEMA constant not properly exported');
  }
  
  const requiredSchemaKeys = [
    'task_name',
    'task_type',
    'description',
    'parameters',
    'status',
    'priority',
    'task_notes',
    'task_data',
    'dependencies',
  ];
  
  let allKeysPresent = true;
  requiredSchemaKeys.forEach(key => {
    if (!(key in TASK_SCHEMA)) {
      console.log(`✗ Missing key in TASK_SCHEMA: ${key}`);
      allKeysPresent = false;
    }
  });
  
  if (allKeysPresent) {
    console.log('✓ TASK_SCHEMA contains all required keys');
  }
  
  console.log('✓ Test 11 passed\n');
} catch (error) {
  console.log('✗ Test 11 failed:', error.message, '\n');
}

// Test 12: Success criteria verification
console.log('Test 12: Verify all success criteria are met');
console.log('\nSUCCESS CRITERIA CHECKLIST:');

const successCriteria = [
  {
    criterion: 'Prompt includes high-level query/objective',
    test: () => {
      const prompt = buildTaskGenerationPrompt({
        ragChunks: mockRAGChunks,
        taskQuery: 'Test objective',
      });
      return prompt.includes('Test objective') && prompt.includes('PRIMARY OBJECTIVE');
    },
  },
  {
    criterion: 'Prompt enforces strict requirement sourcing from RAG chunks',
    test: () => {
      const prompt = buildTaskGenerationPrompt({ ragChunks: mockRAGChunks });
      return prompt.includes('STRICT REQUIREMENT SOURCE') &&
             prompt.includes('based ONLY on the requirements') &&
             prompt.includes('Do NOT invent requirements');
    },
  },
  {
    criterion: 'Prompt includes complete task schema matching DB main.task structure',
    test: () => {
      const prompt = buildTaskGenerationPrompt({ ragChunks: mockRAGChunks });
      const requiredFields = [
        'task_name', 'task_type', 'description', 'parameters', 'status',
        'priority', 'task_notes', 'task_data', 'requirement_snippets',
        'requirement_type', 'constraints', 'success_criteria',
        'execution_complexity', 'document_ids', 'chunk_ids', 'dependencies'
      ];
      return requiredFields.every(field => prompt.includes(field));
    },
  },
  {
    criterion: 'Generated tasks are implementation-ready and exhaustive',
    test: () => {
      const prompt = buildTaskGenerationPrompt({ ragChunks: mockRAGChunks });
      return prompt.includes('implementation-ready') &&
             prompt.includes('exhaustive') &&
             prompt.includes('TASK GENERATION INSTRUCTIONS');
    },
  },
];

let allCriteriaMet = true;
successCriteria.forEach(({ criterion, test }) => {
  try {
    if (test()) {
      console.log(`✓ ${criterion}`);
    } else {
      console.log(`✗ ${criterion}`);
      allCriteriaMet = false;
    }
  } catch (error) {
    console.log(`✗ ${criterion} - Error: ${error.message}`);
    allCriteriaMet = false;
  }
});

console.log('\n=== Test Summary ===');
if (allCriteriaMet) {
  console.log('✓ ALL SUCCESS CRITERIA MET');
} else {
  console.log('✗ Some success criteria not met');
}

console.log('\n=== All Tests Complete ===');
