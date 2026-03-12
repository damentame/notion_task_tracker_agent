/**
 * RAG Retrieval System
 * Retrieves relevant chunks for task generation
 */

import { enrichChunk, filterChunksByRelevance, groupChunksByDocument } from './chunk_structure.js';

/**
 * Mock embedding function (in production, use actual embedding API)
 * @param {string} text - Text to embed
 * @returns {Array} - Embedding vector
 */
function generateEmbedding(text) {
  // This is a placeholder. In production, use OpenAI, Cohere, or similar
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array(384).fill(0).map((_, i) => Math.sin(hash + i) / 10);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * RAG Retrieval Configuration
 */
export const RAGConfig = {
  defaultLimit: 10,
  defaultThreshold: 0.3,
  maxChunks: 50,
  prioritizeTypes: ['constraint', 'success_criteria', 'requirement']
};

/**
 * RAG Retrieval Result
 */
export class RAGResult {
  constructor(chunks, query, metadata = {}) {
    this.chunks = chunks;
    this.query = query;
    this.metadata = {
      total_chunks: chunks.length,
      documents_referenced: [...new Set(chunks.map(c => c.document_id))].length,
      has_constraints: chunks.some(c => c.metadata?.has_constraints),
      has_success_criteria: chunks.some(c => c.metadata?.has_success_criteria),
      ...metadata
    };
  }

  /**
   * Get chunks grouped by document
   */
  getChunksByDocument() {
    return groupChunksByDocument(this.chunks);
  }

  /**
   * Get all unique document IDs
   */
  getDocumentIds() {
    return [...new Set(this.chunks.map(c => c.document_id))];
  }

  /**
   * Get all unique chunk IDs
   */
  getChunkIds() {
    return this.chunks.map(c => c.chunk_id);
  }

  /**
   * Get chunks with constraints
   */
  getConstraintChunks() {
    return this.chunks.filter(c => c.metadata?.has_constraints);
  }

  /**
   * Get chunks with success criteria
   */
  getSuccessCriteriaChunks() {
    return this.chunks.filter(c => c.metadata?.has_success_criteria);
  }

  /**
   * Extract all requirement snippets
   */
  getRequirementSnippets() {
    return this.chunks.map(c => c.content);
  }
}

/**
 * In-memory chunk storage (for demo purposes)
 * In production, this would be a database with vector similarity search
 */
class ChunkStore {
  constructor() {
    this.chunks = [];
    this.documents = new Map();
  }

  /**
   * Add document and its chunks
   */
  addDocument(document, chunks) {
    this.documents.set(document.id, document);
    
    const enrichedChunks = chunks.map((chunk, idx) => 
      enrichChunk({
        ...chunk,
        chunk_id: this.chunks.length + idx,
        document_id: document.id,
        project_id: document.project_id
      }, document)
    );

    this.chunks.push(...enrichedChunks);
    return enrichedChunks;
  }

  /**
   * Search chunks by semantic similarity
   */
  searchSimilar(queryText, options = {}) {
    const {
      project_id = null,
      document_type = null,
      semantic_types = null,
      limit = RAGConfig.defaultLimit,
      threshold = RAGConfig.defaultThreshold
    } = options;

    const queryEmbedding = generateEmbedding(queryText);

    let results = this.chunks
      .filter(chunk => {
        if (project_id && chunk.project_id !== project_id) return false;
        if (document_type && chunk.metadata.document_type !== document_type) return false;
        if (semantic_types && !semantic_types.includes(chunk.metadata.semantic_type)) return false;
        return true;
      })
      .map(chunk => {
        const chunkEmbedding = chunk.embedding || generateEmbedding(chunk.content);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        return { ...chunk, similarity_score: similarity, embedding: chunkEmbedding };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score);

    results = filterChunksByRelevance(results, threshold);
    results = results.slice(0, Math.min(limit, RAGConfig.maxChunks));

    return new RAGResult(results, queryText, { 
      threshold, 
      limit,
      filters: { project_id, document_type, semantic_types }
    });
  }

  /**
   * Get chunks by project ID
   */
  getChunksByProject(project_id) {
    return this.chunks.filter(chunk => chunk.project_id === project_id);
  }

  /**
   * Get chunks by document ID
   */
  getChunksByDocument(document_id) {
    return this.chunks.filter(chunk => chunk.document_id === document_id);
  }

  /**
   * Get document by ID
   */
  getDocument(document_id) {
    return this.documents.get(document_id);
  }
}

// Singleton instance
export const chunkStore = new ChunkStore();

/**
 * Main RAG retrieval function
 * @param {string} queryText - Search query
 * @param {Object} options - Retrieval options
 * @returns {RAGResult} - Retrieval results
 */
export async function retrieveRAGContext(queryText, options = {}) {
  return chunkStore.searchSimilar(queryText, options);
}

/**
 * Retrieve RAG context for task generation
 * Specialized function that prioritizes constraint and success criteria chunks
 */
export async function retrieveTaskGenerationContext(projectId, taskQuery = null) {
  const query = taskQuery || "Project requirements and specifications for task generation and implementation";
  
  // First, get high-relevance chunks
  const primaryResults = await retrieveRAGContext(query, {
    project_id: projectId,
    limit: 20,
    threshold: 0.3
  });

  // Ensure we have constraint and success criteria chunks
  const constraintChunks = chunkStore.getChunksByProject(projectId)
    .filter(c => c.metadata?.has_constraints)
    .slice(0, 5);

  const successCriteriaChunks = chunkStore.getChunksByProject(projectId)
    .filter(c => c.metadata?.has_success_criteria)
    .slice(0, 5);

  // Combine all chunks, removing duplicates
  const allChunks = [
    ...primaryResults.chunks,
    ...constraintChunks,
    ...successCriteriaChunks
  ];

  const uniqueChunks = Array.from(
    new Map(allChunks.map(c => [c.chunk_id, c])).values()
  );

  return new RAGResult(uniqueChunks, query, {
    specialized_for_task_generation: true,
    includes_constraints: constraintChunks.length > 0,
    includes_success_criteria: successCriteriaChunks.length > 0
  });
}
