/**
 * Task Generation Prompt Builder
 * Creates prompts that embed RAG chunks and enforce DB schema alignment
 */

import { TaskSchema } from '../schema/task_schema.js';

/**
 * Build comprehensive task generation instructions
 * Aligns with main.task database schema and embeds RAG context
 */
export function buildTaskGenerationPrompt(ragResult, options = {}) {
  const {
    project_id = null,
    high_level_query = "Generate an exhaustive, implementation-ready task list for this project based strictly on the provided project_document requirements and context.",
    additional_context = ""
  } = options;

  const chunks = ragResult.chunks;
  const documentIds = ragResult.getDocumentIds();
  const constraintChunks = ragResult.getConstraintChunks();
  const successCriteriaChunks = ragResult.getSuccessCriteriaChunks();

  // Build RAG chunks section
  const chunksSection = buildRAGChunksSection(chunks);
  
  // Build schema documentation
  const schemaSection = buildSchemaDocumentation();
  
  // Build validation requirements
  const validationSection = buildValidationRequirements();

  const prompt = `
# TASK GENERATION INSTRUCTIONS

You are generating a detailed task plan for project_id=${project_id || 'UNKNOWN'} based ONLY on the requirements and context provided in the RAG chunks below.

## PRIMARY OBJECTIVE

${high_level_query}

## STRICT REQUIREMENT SOURCE

**CRITICAL**: Every task MUST be directly justified by one or more requirement snippets taken from the project_document content represented in the RAG chunks below.

**DO NOT**:
- Invent requirements, constraints, or success criteria that are not explicitly present or clearly implied by the RAG chunk content
- Generate tasks without citing specific requirement snippets
- Add assumptions not supported by the provided context

**DO**:
- Quote exact text from RAG chunks as requirement_snippets for each task
- Extract constraints explicitly mentioned in the chunks
- Extract success criteria explicitly mentioned in the chunks
- Reference chunk_ids and document_ids for every task

${additional_context}

---

## RAG CHUNKS - YOUR ONLY SOURCE OF TRUTH

The following chunks are retrieved from the project documentation. Each task you generate MUST reference one or more of these chunks.

${chunksSection}

---

## DATABASE SCHEMA - TASK STRUCTURE

Each task you generate MUST conform to this exact schema:

${schemaSection}

---

## VALIDATION REQUIREMENTS

${validationSection}

---

## CONSTRAINTS AND SUCCESS CRITERIA EXTRACTION

**Constraints** (${constraintChunks.length} chunks with constraints available):
${constraintChunks.length > 0 ? 'Review chunks marked with [HAS_CONSTRAINTS] to extract explicit constraints.' : 'No explicit constraint chunks found. Extract constraints from requirement text where present.'}

**Success Criteria** (${successCriteriaChunks.length} chunks with success criteria available):
${successCriteriaChunks.length > 0 ? 'Review chunks marked with [HAS_SUCCESS_CRITERIA] to extract acceptance criteria.' : 'No explicit success criteria chunks found. Extract success criteria from requirement text where present.'}

---

## OUTPUT FORMAT

Generate tasks as a JSON array. Each task must be a valid JSON object matching the schema above.

Example:
\`\`\`json
[
  {
    "task_name": "Implement user authentication",
    "description": "Build authentication system with JWT tokens as specified in requirements",
    "constraints": [
      "Must use JWT tokens with 24-hour expiration",
      "Must not store passwords in plain text",
      "Must implement rate limiting (5 attempts per minute)"
    ],
    "success_criteria": [
      "Users can successfully log in with valid credentials",
      "Invalid login attempts are blocked after 5 tries",
      "JWT tokens expire after 24 hours"
    ],
    "has_constraints": true,
    "has_success_criteria": true,
    "project_id": ${project_id},
    "document_ids": [${documentIds.join(', ')}],
    "chunk_ids": [1, 2, 3],
    "dependencies": [],
    "requirement_snippets": [
      "The system must implement JWT-based authentication with 24-hour token expiration",
      "Password storage must use bcrypt hashing",
      "Rate limiting of 5 login attempts per minute is required"
    ],
    "priority": "high",
    "estimated_complexity": "moderate"
  }
]
\`\`\`

---

## TASK GENERATION CHECKLIST

For each task, ensure:
- [ ] task_name is clear and concise (< 200 characters)
- [ ] description provides implementation guidance
- [ ] At least one requirement_snippet is provided
- [ ] chunk_ids array references actual chunks used
- [ ] document_ids array includes all source documents
- [ ] constraints array includes all explicit constraints (if any)
- [ ] success_criteria array includes all acceptance criteria (if any)
- [ ] has_constraints flag matches constraints array presence
- [ ] has_success_criteria flag matches success_criteria array presence
- [ ] dependencies list other task_names (if any)
- [ ] No invented requirements - all content from RAG chunks

BEGIN TASK GENERATION NOW.
`;

  return prompt;
}

/**
 * Build the RAG chunks section of the prompt
 */
function buildRAGChunksSection(chunks) {
  if (!chunks || chunks.length === 0) {
    return "**WARNING**: No RAG chunks provided. Cannot generate tasks without source requirements.";
  }

  let section = `Total chunks: ${chunks.length}\n\n`;

  chunks.forEach((chunk, index) => {
    const flags = [];
    if (chunk.metadata?.has_constraints) flags.push('HAS_CONSTRAINTS');
    if (chunk.metadata?.has_success_criteria) flags.push('HAS_SUCCESS_CRITERIA');
    const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';

    section += `### CHUNK #${chunk.chunk_id}${flagStr}
**Document ID**: ${chunk.document_id}
**Document**: ${chunk.metadata?.document_name || 'Unknown'}
**Type**: ${chunk.metadata?.document_type || 'Unknown'}
**Semantic Type**: ${chunk.metadata?.semantic_type || 'context'}
**Similarity Score**: ${chunk.similarity_score?.toFixed(3) || 'N/A'}

**Content**:
\`\`\`
${chunk.content}
\`\`\`

${chunk.metadata?.extracted_constraints?.length > 0 ? 
`**Extracted Constraints**:
${chunk.metadata.extracted_constraints.map(c => `- ${c}`).join('\n')}
` : ''}

${chunk.metadata?.extracted_success_criteria?.length > 0 ? 
`**Extracted Success Criteria**:
${chunk.metadata.extracted_success_criteria.map(c => `- ${c}`).join('\n')}
` : ''}

---

`;
  });

  return section;
}

/**
 * Build the schema documentation section
 */
function buildSchemaDocumentation() {
  let section = '```json\n{\n';
  
  for (const [fieldName, fieldSpec] of Object.entries(TaskSchema.fields)) {
    const required = fieldSpec.required ? 'REQUIRED' : 'OPTIONAL';
    const typeInfo = fieldSpec.type === 'array' ? `array<${fieldSpec.items}>` : fieldSpec.type;
    
    section += `  "${fieldName}": ${typeInfo}, // ${required} - ${fieldSpec.description}\n`;
  }
  
  section += '}\n```\n';
  
  return section;
}

/**
 * Build the validation requirements section
 */
function buildValidationRequirements() {
  return `
Every task MUST pass these validations:

1. **Justification Required**: 
   - requirement_snippets array must contain at least one direct quote from RAG chunks
   - Each snippet should be a verbatim or near-verbatim quote

2. **Chunk References Required**: 
   - chunk_ids array must contain at least one chunk ID
   - Only reference chunk IDs that actually exist in the RAG chunks provided

3. **Document References Required**: 
   - document_ids array must contain at least one document ID
   - Only reference document IDs present in the RAG chunks

4. **Constraints Flag Validation**: 
   - If constraints array has items, has_constraints MUST be true
   - If constraints array is empty, has_constraints MUST be false

5. **Success Criteria Flag Validation**: 
   - If success_criteria array has items, has_success_criteria MUST be true
   - If success_criteria array is empty, has_success_criteria MUST be false

6. **No Invented Content**: 
   - Every constraint must be traceable to RAG chunk content
   - Every success criterion must be traceable to RAG chunk content
   - Every requirement must be directly from or clearly implied by RAG chunks
`;
}

/**
 * Build a simplified prompt for quick task generation
 */
export function buildSimpleTaskPrompt(ragResult, taskObjective) {
  const chunks = ragResult.chunks;
  const chunkSummary = chunks.map((c, i) => 
    `Chunk ${c.chunk_id}: ${c.content.substring(0, 200)}...`
  ).join('\n\n');

  return `
Generate implementation tasks for: ${taskObjective}

Based on these requirements:

${chunkSummary}

Each task must include:
- task_name
- description
- requirement_snippets (quotes from chunks above)
- chunk_ids (which chunks justify this task)
- constraints (if any)
- success_criteria (if any)

Output as JSON array of task objects.
`;
}

/**
 * Build example tasks section to guide the agent
 */
export function buildExamplesSection() {
  return `
## EXAMPLE TASK (for reference only)

\`\`\`json
{
  "task_name": "Set up PostgreSQL database with connection pooling",
  "description": "Configure PostgreSQL database instance with connection pooling as specified in the architecture requirements. Implement pg-pool with max 20 connections.",
  "constraints": [
    "Must use PostgreSQL version 14 or higher",
    "Maximum 20 concurrent connections",
    "Connection timeout must be 30 seconds",
    "Must enable SSL connections"
  ],
  "success_criteria": [
    "Database accepts connections via connection pool",
    "Pool maintains maximum 20 connections",
    "SSL certificate validation works",
    "Connection timeout enforced at 30 seconds"
  ],
  "has_constraints": true,
  "has_success_criteria": true,
  "project_id": 1,
  "document_ids": [5, 6],
  "chunk_ids": [23, 24, 25],
  "dependencies": [],
  "requirement_snippets": [
    "The system shall use PostgreSQL 14+ as the primary database",
    "Connection pooling must be implemented with a maximum of 20 concurrent connections",
    "All database connections must use SSL with certificate validation",
    "Connection timeouts should be set to 30 seconds"
  ],
  "priority": "high",
  "estimated_complexity": "moderate"
}
\`\`\`
`;
}

/**
 * Validate that a prompt has been properly constructed
 */
export function validatePrompt(prompt) {
  const requiredSections = [
    'PRIMARY OBJECTIVE',
    'STRICT REQUIREMENT SOURCE',
    'RAG CHUNKS',
    'DATABASE SCHEMA',
    'VALIDATION REQUIREMENTS',
    'OUTPUT FORMAT'
  ];

  const missingSection = requiredSections.find(section => !prompt.includes(section));
  
  if (missingSection) {
    return {
      valid: false,
      error: `Missing required section: ${missingSection}`
    };
  }

  if (!prompt.includes('chunk_id') || !prompt.includes('document_id')) {
    return {
      valid: false,
      error: 'Prompt must include RAG chunk information'
    };
  }

  return { valid: true };
}
