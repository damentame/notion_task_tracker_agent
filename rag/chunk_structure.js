/**
 * RAG Chunk Structure and Management
 * Defines the structure of RAG chunks used for task generation
 */

/**
 * RAG Chunk Schema
 * Represents a chunk of text from a project document with metadata
 */
export const ChunkSchema = {
  chunk_id: 'integer',           // Unique identifier
  document_id: 'integer',         // Source document ID
  project_id: 'integer',          // Project context
  content: 'string',              // Actual chunk text
  chunk_index: 'integer',         // Position in document
  start_pos: 'integer',           // Character start position
  end_pos: 'integer',             // Character end position
  token_count: 'integer',         // Number of tokens
  embedding: 'vector',            // Semantic embedding (optional)
  metadata: {
    document_name: 'string',      // Name of source document
    document_type: 'string',      // Type: requirement, spec, code, etc.
    semantic_type: 'string',      // Classified type: constraint, success_criteria, etc.
    has_constraints: 'boolean',   // Contains constraint information
    has_success_criteria: 'boolean' // Contains success criteria
  }
};

/**
 * Chunk classification for semantic filtering
 */
export const SemanticTypes = {
  CONSTRAINT: 'constraint',
  SUCCESS_CRITERIA: 'success_criteria',
  REQUIREMENT: 'requirement',
  SPECIFICATION: 'specification',
  IMPLEMENTATION_DETAIL: 'implementation_detail',
  CONTEXT: 'context',
  EXAMPLE: 'example'
};

/**
 * Extract constraints from chunk content
 * Looks for common constraint patterns
 */
export function extractConstraints(content) {
  const constraints = [];
  const patterns = [
    /must\s+(?:not\s+)?[\w\s]+/gi,
    /shall\s+(?:not\s+)?[\w\s]+/gi,
    /should\s+(?:not\s+)?[\w\s]+/gi,
    /required\s+to\s+[\w\s]+/gi,
    /cannot\s+[\w\s]+/gi,
    /do\s+not\s+[\w\s]+/gi,
    /ensure\s+that\s+[\w\s]+/gi,
    /constraint[:\s]+[^\.]+/gi
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      constraints.push(...matches.map(m => m.trim()));
    }
  });

  return [...new Set(constraints)]; // Remove duplicates
}

/**
 * Extract success criteria from chunk content
 * Looks for common success criteria patterns
 */
export function extractSuccessCriteria(content) {
  const criteria = [];
  const patterns = [
    /success\s+criteri[ao][:\s]+[^\.]+/gi,
    /acceptance\s+criteri[ao][:\s]+[^\.]+/gi,
    /should\s+be\s+able\s+to\s+[\w\s]+/gi,
    /will\s+(?:result\s+in|demonstrate|show|prove)[\w\s]+/gi,
    /expected\s+(?:outcome|result)[:\s]+[^\.]+/gi,
    /definition\s+of\s+done[:\s]+[^\.]+/gi
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      criteria.push(...matches.map(m => m.trim()));
    }
  });

  return [...new Set(criteria)]; // Remove duplicates
}

/**
 * Classify chunk semantic type based on content
 */
export function classifyChunk(content) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('constraint') || 
      lowerContent.includes('must not') || 
      lowerContent.includes('shall not') ||
      lowerContent.includes('cannot')) {
    return SemanticTypes.CONSTRAINT;
  }
  
  if (lowerContent.includes('success criteria') || 
      lowerContent.includes('acceptance criteria') ||
      lowerContent.includes('definition of done')) {
    return SemanticTypes.SUCCESS_CRITERIA;
  }
  
  if (lowerContent.includes('requirement') || 
      lowerContent.includes('must') || 
      lowerContent.includes('shall')) {
    return SemanticTypes.REQUIREMENT;
  }
  
  if (lowerContent.includes('specification') || 
      lowerContent.includes('spec')) {
    return SemanticTypes.SPECIFICATION;
  }
  
  if (lowerContent.includes('example') || 
      lowerContent.includes('for instance')) {
    return SemanticTypes.EXAMPLE;
  }
  
  return SemanticTypes.CONTEXT;
}

/**
 * Enrich chunk with metadata
 */
export function enrichChunk(chunk, document) {
  const constraints = extractConstraints(chunk.content);
  const successCriteria = extractSuccessCriteria(chunk.content);
  const semanticType = classifyChunk(chunk.content);
  
  return {
    ...chunk,
    metadata: {
      ...chunk.metadata,
      document_name: document.name,
      document_type: document.type,
      semantic_type: semanticType,
      has_constraints: constraints.length > 0,
      has_success_criteria: successCriteria.length > 0,
      extracted_constraints: constraints,
      extracted_success_criteria: successCriteria
    }
  };
}

/**
 * Chunk a document into smaller pieces
 * @param {string} content - Document content
 * @param {Object} options - Chunking options
 * @returns {Array} - Array of chunks
 */
export function chunkDocument(content, options = {}) {
  const {
    chunkSize = 1000,
    overlap = 200,
    document_id = null,
    project_id = null
  } = options;

  const chunks = [];
  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < content.length) {
    const endPos = Math.min(startPos + chunkSize, content.length);
    const chunkContent = content.substring(startPos, endPos);
    
    chunks.push({
      chunk_id: null, // Will be assigned by database
      document_id,
      project_id,
      content: chunkContent,
      chunk_index: chunkIndex,
      start_pos: startPos,
      end_pos: endPos,
      token_count: Math.ceil(chunkContent.length / 4), // Rough estimate
      metadata: {}
    });

    startPos += chunkSize - overlap;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Filter chunks by relevance score
 */
export function filterChunksByRelevance(chunks, threshold = 0.3) {
  return chunks.filter(chunk => 
    !chunk.similarity_score || chunk.similarity_score >= threshold
  );
}

/**
 * Group chunks by document
 */
export function groupChunksByDocument(chunks) {
  return chunks.reduce((acc, chunk) => {
    const docId = chunk.document_id;
    if (!acc[docId]) {
      acc[docId] = [];
    }
    acc[docId].push(chunk);
    return acc;
  }, {});
}
