"""
Task Schema Validator with Constraint and Success Criteria Extraction

This module provides validation logic that ensures every generated task strictly
adheres to the DB schema and extracts constraints/success criteria from RAG chunks.

Key Features:
- Validates all required task schema fields
- Extracts constraints from chunks marked has_constraints=true
- Extracts success criteria from chunks marked has_success_criteria=true
- Pattern matching for acceptance/validation language
- Preserves original wording of acceptance criteria
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class RAGChunk:
    """Represents a RAG chunk with metadata"""
    chunk_id: int
    chunk_text: str
    document_id: int
    project_id: int
    has_constraints: bool = False
    has_success_criteria: bool = False
    requirement_type: Optional[str] = None
    priority_indicators: Optional[str] = None


@dataclass
class ValidationResult:
    """Result of task validation"""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    extracted_constraints: List[str] = field(default_factory=list)
    extracted_success_criteria: List[str] = field(default_factory=list)


class TaskSchemaValidator:
    """
    Validates task objects against the DB schema and extracts constraints
    and success criteria from RAG chunks.
    """
    
    # Required top-level task fields
    REQUIRED_FIELDS = {
        'task_name', 'task_type', 'description', 'parameters',
        'status', 'priority', 'task_notes', 'task_data'
    }
    
    # Required task_data fields
    REQUIRED_TASK_DATA_FIELDS = {
        'requirement_snippets', 'requirement_type', 'constraints',
        'success_criteria', 'execution_complexity', 'project_id',
        'document_ids', 'chunk_ids', 'dependencies'
    }
    
    # Valid execution complexity values
    VALID_EXECUTION_COMPLEXITY = {'fast', 'complex'}
    
    # Patterns for identifying constraints in text
    CONSTRAINT_PATTERNS = [
        r'must\s+(?:not\s+)?(?:be|have|include|support|use|comply|adhere|follow)',
        r'shall\s+(?:not\s+)?(?:be|have|include|support|use|comply|adhere|follow)',
        r'required\s+to\s+(?:be|have|include|support|use)',
        r'(?:is|are)\s+required',
        r'(?:is|are)\s+mandatory',
        r'(?:cannot|must not|shall not|should not)\s+',
        r'(?:minimum|maximum|at least|at most|no more than|no less than)\s+',
        r'within\s+\d+\s+(?:seconds|minutes|hours|days|ms|milliseconds)',
        r'(?:limit|limitation|restriction|constraint)(?:s)?\s*:',
        r'(?:only|exclusively)\s+',
        r'(?:forbidden|prohibited|not allowed|disallowed)',
    ]
    
    # Patterns for identifying success criteria and acceptance language
    SUCCESS_CRITERIA_PATTERNS = [
        r'(?:must|shall|should)\s+(?:be\s+)?able\s+to\s+',  # User must be able to...
        r'(?:must|shall|should)\s+pass\s+',
        r'(?:must|shall|should)\s+validate\s+',
        r'(?:must|shall|should)\s+verify\s+',
        r'acceptance\s+criteria\s*:',
        r'success\s+criteria\s*:',
        r'validation\s+criteria\s*:',
        r'(?:when|if)\s+.*\s+(?:then|expect|should|must)',
        r'(?:given|when|then)\s+',  # BDD-style
        r'(?:expected|expects)\s+(?:to|that)',
        r'(?:ensure|ensures)\s+that',
        r'(?:verify|verifies)\s+that',
        r'(?:validate|validates)\s+that',
        r'(?:confirm|confirms)\s+that',
        r'(?:check|checks)\s+that',
        r'(?:test|tests)\s+that',
        r'(?:should|must|shall)\s+(?:return|produce|generate|create|result in|see)',
        r'(?:can|could)\s+(?:login|access|view|create|update|delete|submit)',
    ]
    
    def __init__(self):
        """Initialize the validator with compiled regex patterns"""
        self.constraint_regex = re.compile(
            '|'.join(self.CONSTRAINT_PATTERNS),
            re.IGNORECASE | re.MULTILINE
        )
        self.success_criteria_regex = re.compile(
            '|'.join(self.SUCCESS_CRITERIA_PATTERNS),
            re.IGNORECASE | re.MULTILINE
        )
    
    def validate_task(
        self,
        task: Dict[str, Any],
        rag_chunks: Optional[List[RAGChunk]] = None
    ) -> ValidationResult:
        """
        Validate a task object against the schema and extract constraints/success criteria.
        
        Args:
            task: The task object to validate
            rag_chunks: Optional list of RAG chunks that informed this task
            
        Returns:
            ValidationResult with validation status and extracted data
        """
        result = ValidationResult(is_valid=True)
        
        # Validate required top-level fields
        self._validate_required_fields(task, result)
        
        # Validate task_data if present
        if 'task_data' in task and isinstance(task['task_data'], dict):
            self._validate_task_data(task['task_data'], result)
        
        # Extract and validate constraints/success criteria from RAG chunks
        if rag_chunks:
            self._extract_from_rag_chunks(task, rag_chunks, result)
        
        # Validate that constraints were extracted if any chunk has has_constraints=true
        if rag_chunks:
            self._validate_constraint_extraction(task, rag_chunks, result)
            self._validate_success_criteria_extraction(task, rag_chunks, result)
        
        # Set overall validity
        result.is_valid = len(result.errors) == 0
        
        return result
    
    def _validate_required_fields(
        self,
        task: Dict[str, Any],
        result: ValidationResult
    ) -> None:
        """Validate that all required top-level fields are present"""
        missing_fields = self.REQUIRED_FIELDS - set(task.keys())
        
        for field in missing_fields:
            result.errors.append(f"Missing required field: {field}")
        
        # Validate field types and values
        if 'task_name' in task and not isinstance(task['task_name'], str):
            result.errors.append("task_name must be a string")
        
        if 'task_type' in task and not isinstance(task['task_type'], str):
            result.errors.append("task_type must be a string")
        
        if 'description' in task and not isinstance(task['description'], str):
            result.errors.append("description must be a string")
        
        if 'priority' in task:
            if not isinstance(task['priority'], int):
                result.errors.append("priority must be an integer")
            elif task['priority'] < 1:
                result.errors.append("priority must be >= 1")
        
        if 'status' in task and not isinstance(task['status'], str):
            result.errors.append("status must be a string")
    
    def _validate_task_data(
        self,
        task_data: Dict[str, Any],
        result: ValidationResult
    ) -> None:
        """Validate task_data structure and required fields"""
        missing_fields = self.REQUIRED_TASK_DATA_FIELDS - set(task_data.keys())
        
        for field in missing_fields:
            result.errors.append(f"Missing required task_data field: {field}")
        
        # Validate array fields
        array_fields = [
            'requirement_snippets', 'constraints', 'success_criteria',
            'document_ids', 'chunk_ids', 'dependencies'
        ]
        
        for field in array_fields:
            if field in task_data and not isinstance(task_data[field], list):
                result.errors.append(f"task_data.{field} must be an array")
        
        # Validate execution_complexity
        if 'execution_complexity' in task_data:
            complexity = task_data['execution_complexity']
            if complexity not in self.VALID_EXECUTION_COMPLEXITY:
                result.errors.append(
                    f"execution_complexity must be one of {self.VALID_EXECUTION_COMPLEXITY}, "
                    f"got: {complexity}"
                )
        
        # Validate project_id
        if 'project_id' in task_data:
            if not isinstance(task_data['project_id'], int):
                result.errors.append("task_data.project_id must be an integer")
        
        # Validate requirement_type
        if 'requirement_type' in task_data:
            if not isinstance(task_data['requirement_type'], str):
                result.errors.append("task_data.requirement_type must be a string")
    
    def _extract_from_rag_chunks(
        self,
        task: Dict[str, Any],
        rag_chunks: List[RAGChunk],
        result: ValidationResult
    ) -> None:
        """Extract constraints and success criteria from RAG chunks"""
        for chunk in rag_chunks:
            # Extract both constraints and success criteria if marked
            # Success criteria take precedence over constraints for overlapping patterns
            extracted_constraints = []
            extracted_criteria = []
            
            if chunk.has_constraints:
                extracted_constraints = self._extract_constraints(chunk.chunk_text)
            
            if chunk.has_success_criteria:
                extracted_criteria = self._extract_success_criteria(chunk.chunk_text)
            
            # If both are marked, remove items from constraints that are in criteria
            if chunk.has_constraints and chunk.has_success_criteria:
                # Success criteria take precedence
                extracted_constraints = [
                    c for c in extracted_constraints 
                    if c not in extracted_criteria
                ]
            
            result.extracted_constraints.extend(extracted_constraints)
            result.extracted_success_criteria.extend(extracted_criteria)
        
        # Also check for implied constraints and success criteria
        for chunk in rag_chunks:
            # Check for implied constraints even if not explicitly marked
            if not chunk.has_constraints:
                implied_constraints = self._extract_implied_constraints(chunk.chunk_text)
                if implied_constraints:
                    result.warnings.append(
                        f"Chunk {chunk.chunk_id} contains constraint language but "
                        f"has_constraints=false"
                    )
                    result.extracted_constraints.extend(implied_constraints)
            
            # Check for implied success criteria
            if not chunk.has_success_criteria:
                implied_criteria = self._extract_implied_success_criteria(chunk.chunk_text)
                if implied_criteria:
                    result.warnings.append(
                        f"Chunk {chunk.chunk_id} contains acceptance language but "
                        f"has_success_criteria=false"
                    )
                    result.extracted_success_criteria.extend(implied_criteria)
    
    def _extract_constraints(self, text: str) -> List[str]:
        """
        Extract explicit constraints from text.
        Preserves original wording.
        """
        constraints = []
        
        # Split text into sentences
        sentences = self._split_into_sentences(text)
        
        for sentence in sentences:
            # Check if sentence contains constraint patterns
            if self.constraint_regex.search(sentence):
                # Clean and preserve the constraint
                constraint = sentence.strip()
                # Remove leading bullets/dashes
                constraint = re.sub(r'^[-•*]\s*', '', constraint)
                if constraint and len(constraint) > 10:  # Avoid very short fragments
                    constraints.append(constraint)
        
        return constraints
    
    def _extract_success_criteria(self, text: str) -> List[str]:
        """
        Extract explicit success/acceptance criteria from text.
        Preserves original wording.
        """
        criteria = []
        
        # Split text into sentences
        sentences = self._split_into_sentences(text)
        
        for sentence in sentences:
            # Check if sentence contains success criteria patterns
            if self.success_criteria_regex.search(sentence):
                # Clean and preserve the criterion
                criterion = sentence.strip()
                # Remove leading bullets/dashes
                criterion = re.sub(r'^[-•*]\s*', '', criterion)
                if criterion and len(criterion) > 10:  # Avoid very short fragments
                    criteria.append(criterion)
        
        return criteria
    
    def _extract_implied_constraints(self, text: str) -> List[str]:
        """Extract constraints that may not be explicitly marked"""
        # Use same logic as explicit extraction but with lower confidence
        return self._extract_constraints(text)
    
    def _extract_implied_success_criteria(self, text: str) -> List[str]:
        """Extract success criteria that may not be explicitly marked"""
        # Use same logic as explicit extraction but with lower confidence
        return self._extract_success_criteria(text)
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences while preserving context.
        Handles common abbreviations and edge cases.
        """
        # Replace common abbreviations to avoid false splits
        text = re.sub(r'\be\.g\.', 'eg', text)
        text = re.sub(r'\bi\.e\.', 'ie', text)
        text = re.sub(r'\betc\.', 'etc', text)
        
        # Split on sentence boundaries, preserving the punctuation
        # Match sentence ending punctuation followed by whitespace or end of string
        sentences = []
        current = []
        
        # Split on periods, exclamation marks, question marks, or newlines
        parts = re.split(r'([.!?\n])', text)
        
        for i, part in enumerate(parts):
            if part in '.!?\n':
                if current:
                    sentence = ''.join(current) + (part if part != '\n' else '')
                    sentences.append(sentence.strip())
                    current = []
            else:
                current.append(part)
        
        # Add any remaining text
        if current:
            sentence = ''.join(current).strip()
            if sentence:
                sentences.append(sentence)
        
        # Restore abbreviations
        sentences = [
            s.replace('eg', 'e.g.').replace('ie', 'i.e.').replace('etc', 'etc.')
            for s in sentences
        ]
        
        # Filter out empty strings and very short fragments
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 5]
    
    def _validate_constraint_extraction(
        self,
        task: Dict[str, Any],
        rag_chunks: List[RAGChunk],
        result: ValidationResult
    ) -> None:
        """
        Validate that constraints were extracted when required.
        Enforces: If a chunk is marked has_constraints=true, constraints MUST be captured.
        """
        chunks_with_constraints = [c for c in rag_chunks if c.has_constraints]
        
        if not chunks_with_constraints:
            return
        
        # Check if task has constraints in task_data
        task_constraints = []
        if 'task_data' in task and isinstance(task['task_data'], dict):
            task_constraints = task['task_data'].get('constraints', [])
        
        if not task_constraints and not result.extracted_constraints:
            result.errors.append(
                f"Task must include constraints: {len(chunks_with_constraints)} chunk(s) "
                f"marked has_constraints=true but no constraints were extracted or present in task"
            )
        elif not task_constraints and result.extracted_constraints:
            result.warnings.append(
                f"Constraints extracted ({len(result.extracted_constraints)}) but not "
                f"present in task.task_data.constraints array"
            )
    
    def _validate_success_criteria_extraction(
        self,
        task: Dict[str, Any],
        rag_chunks: List[RAGChunk],
        result: ValidationResult
    ) -> None:
        """
        Validate that success criteria were extracted when required.
        Enforces: If a chunk is marked has_success_criteria=true, criteria MUST be captured.
        """
        chunks_with_criteria = [c for c in rag_chunks if c.has_success_criteria]
        
        if not chunks_with_criteria:
            return
        
        # Check if task has success_criteria in task_data
        task_criteria = []
        if 'task_data' in task and isinstance(task['task_data'], dict):
            task_criteria = task['task_data'].get('success_criteria', [])
        
        if not task_criteria and not result.extracted_success_criteria:
            result.errors.append(
                f"Task must include success criteria: {len(chunks_with_criteria)} chunk(s) "
                f"marked has_success_criteria=true but no criteria were extracted or present in task"
            )
        elif not task_criteria and result.extracted_success_criteria:
            result.warnings.append(
                f"Success criteria extracted ({len(result.extracted_success_criteria)}) but not "
                f"present in task.task_data.success_criteria array"
            )
    
    def validate_and_enrich_task(
        self,
        task: Dict[str, Any],
        rag_chunks: Optional[List[RAGChunk]] = None
    ) -> Tuple[Dict[str, Any], ValidationResult]:
        """
        Validate a task and automatically enrich it with extracted constraints
        and success criteria.
        
        Args:
            task: The task object to validate and enrich
            rag_chunks: Optional list of RAG chunks that informed this task
            
        Returns:
            Tuple of (enriched_task, validation_result)
        """
        result = self.validate_task(task, rag_chunks)
        
        # Enrich task with extracted data if validation passed or has warnings only
        if result.is_valid or (not result.errors and result.warnings):
            if 'task_data' not in task:
                task['task_data'] = {}
            
            # Add extracted constraints if not already present
            if result.extracted_constraints:
                existing_constraints = task['task_data'].get('constraints', [])
                # Merge without duplicates
                all_constraints = list(set(existing_constraints + result.extracted_constraints))
                task['task_data']['constraints'] = all_constraints
            
            # Add extracted success criteria if not already present
            if result.extracted_success_criteria:
                existing_criteria = task['task_data'].get('success_criteria', [])
                # Merge without duplicates
                all_criteria = list(set(existing_criteria + result.extracted_success_criteria))
                task['task_data']['success_criteria'] = all_criteria
        
        return task, result


def create_validator() -> TaskSchemaValidator:
    """Factory function to create a validator instance"""
    return TaskSchemaValidator()
