"""
Comprehensive test suite for TaskSchemaValidator

Tests cover:
- Required field validation
- Constraint extraction from marked chunks
- Success criteria extraction from marked chunks
- Pattern matching for acceptance language
- Edge cases and implied constraints/criteria
"""

import unittest
from task_schema_validator import (
    TaskSchemaValidator,
    RAGChunk,
    ValidationResult,
    create_validator
)


class TestTaskSchemaValidator(unittest.TestCase):
    """Test suite for TaskSchemaValidator"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.validator = create_validator()
    
    def test_valid_complete_task(self):
        """Test validation of a complete, valid task"""
        task = {
            'task_name': 'Implement user authentication',
            'task_type': 'implementation',
            'description': 'Add JWT-based authentication',
            'parameters': {'auth_type': 'JWT'},
            'status': 'PENDING',
            'priority': 1,
            'task_notes': 'High priority security feature',
            'task_data': {
                'requirement_snippets': ['User must authenticate with JWT'],
                'requirement_type': 'functional',
                'constraints': ['Must use JWT tokens', 'Session timeout 30 minutes'],
                'success_criteria': ['User can login successfully', 'Token expires after 30 min'],
                'execution_complexity': 'complex',
                'project_id': 1,
                'document_ids': [1, 2],
                'chunk_ids': [10, 11],
                'dependencies': []
            }
        }
        
        result = self.validator.validate_task(task)
        
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)
    
    def test_missing_required_fields(self):
        """Test that missing required fields are detected"""
        task = {
            'task_name': 'Incomplete task',
            'description': 'Missing several fields'
        }
        
        result = self.validator.validate_task(task)
        
        self.assertFalse(result.is_valid)
        self.assertGreater(len(result.errors), 0)
        
        # Check for specific missing fields
        error_text = ' '.join(result.errors)
        self.assertIn('task_type', error_text)
        self.assertIn('parameters', error_text)
        self.assertIn('status', error_text)
        self.assertIn('priority', error_text)
        self.assertIn('task_notes', error_text)
        self.assertIn('task_data', error_text)
    
    def test_missing_task_data_fields(self):
        """Test that missing task_data fields are detected"""
        task = {
            'task_name': 'Test task',
            'task_type': 'test',
            'description': 'Test description',
            'parameters': {},
            'status': 'PENDING',
            'priority': 2,
            'task_notes': 'Notes',
            'task_data': {
                'requirement_snippets': ['snippet'],
                'requirement_type': 'functional'
            }
        }
        
        result = self.validator.validate_task(task)
        
        self.assertFalse(result.is_valid)
        
        # Check for missing task_data fields
        error_text = ' '.join(result.errors)
        self.assertIn('constraints', error_text)
        self.assertIn('success_criteria', error_text)
        self.assertIn('execution_complexity', error_text)
        self.assertIn('project_id', error_text)
        self.assertIn('document_ids', error_text)
        self.assertIn('chunk_ids', error_text)
        self.assertIn('dependencies', error_text)
    
    def test_invalid_execution_complexity(self):
        """Test that invalid execution_complexity values are rejected"""
        task = {
            'task_name': 'Test task',
            'task_type': 'test',
            'description': 'Test description',
            'parameters': {},
            'status': 'PENDING',
            'priority': 2,
            'task_notes': 'Notes',
            'task_data': {
                'requirement_snippets': [],
                'requirement_type': 'functional',
                'constraints': [],
                'success_criteria': [],
                'execution_complexity': 'medium',  # Invalid value
                'project_id': 1,
                'document_ids': [],
                'chunk_ids': [],
                'dependencies': []
            }
        }
        
        result = self.validator.validate_task(task)
        
        self.assertFalse(result.is_valid)
        self.assertTrue(any('execution_complexity' in error for error in result.errors))
    
    def test_constraint_extraction_from_marked_chunk(self):
        """Test extraction of constraints from chunks marked has_constraints=true"""
        chunk = RAGChunk(
            chunk_id=1,
            chunk_text="""
            The system must support at least 1000 concurrent users.
            Response time must not exceed 200ms.
            The API shall use HTTPS only.
            Database queries are limited to 5 seconds maximum.
            """,
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=False
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        self.assertGreater(len(result.extracted_constraints), 0)
        
        # Check that specific constraints were found
        constraints_text = ' '.join(result.extracted_constraints)
        self.assertIn('1000 concurrent users', constraints_text)
        self.assertIn('200ms', constraints_text)
        self.assertIn('HTTPS', constraints_text)
    
    def test_success_criteria_extraction_from_marked_chunk(self):
        """Test extraction of success criteria from chunks marked has_success_criteria=true"""
        chunk = RAGChunk(
            chunk_id=2,
            chunk_text="""
            Acceptance criteria:
            - User must be able to login successfully
            - System should validate credentials
            - Invalid login must return error message
            - Session should expire after timeout
            The test must pass all security checks.
            """,
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        self.assertGreater(len(result.extracted_success_criteria), 0)
        
        # Check that specific criteria were found
        criteria_text = ' '.join(result.extracted_success_criteria)
        self.assertIn('login', criteria_text.lower())
        self.assertIn('pass', criteria_text.lower())
    
    def test_acceptance_language_detection(self):
        """Test detection of acceptance/validation language patterns"""
        chunk = RAGChunk(
            chunk_id=3,
            chunk_text="""
            The feature should return a 200 status code on success.
            When user submits form, then system must validate all fields.
            Expected to generate a confirmation email.
            Verify that the data is persisted correctly.
            Given a valid user, when they login, then they should see dashboard.
            """,
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        self.assertGreater(len(result.extracted_success_criteria), 0)
        
        criteria_text = ' '.join(result.extracted_success_criteria)
        # Check for various acceptance patterns
        self.assertTrue(
            any(keyword in criteria_text.lower() 
                for keyword in ['return', 'validate', 'verify', 'expected', 'should'])
        )
    
    def test_constraint_extraction_required_when_marked(self):
        """Test that validation fails if constraints not extracted when has_constraints=true"""
        chunk = RAGChunk(
            chunk_id=4,
            chunk_text="Some generic text without clear constraints.",
            document_id=1,
            project_id=1,
            has_constraints=True,  # Marked but no constraints in text
            has_success_criteria=False
        )
        
        task = self._create_minimal_valid_task()
        task['task_data']['constraints'] = []  # Empty constraints
        
        result = self.validator.validate_task(task, [chunk])
        
        # Should have error about missing constraints
        self.assertFalse(result.is_valid)
        self.assertTrue(
            any('constraint' in error.lower() for error in result.errors)
        )
    
    def test_success_criteria_extraction_required_when_marked(self):
        """Test that validation fails if success criteria not extracted when has_success_criteria=true"""
        chunk = RAGChunk(
            chunk_id=5,
            chunk_text="Some generic text without clear success criteria.",
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True  # Marked but no criteria in text
        )
        
        task = self._create_minimal_valid_task()
        task['task_data']['success_criteria'] = []  # Empty criteria
        
        result = self.validator.validate_task(task, [chunk])
        
        # Should have error about missing success criteria
        self.assertFalse(result.is_valid)
        self.assertTrue(
            any('success criteria' in error.lower() for error in result.errors)
        )
    
    def test_implied_constraints_detection(self):
        """Test detection of implied constraints in unmarked chunks"""
        chunk = RAGChunk(
            chunk_id=6,
            chunk_text="""
            The API must not allow unauthorized access.
            Maximum file size is 10MB.
            System shall comply with GDPR regulations.
            """,
            document_id=1,
            project_id=1,
            has_constraints=False,  # Not marked but contains constraints
            has_success_criteria=False
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        # Should extract constraints and generate warning
        self.assertGreater(len(result.extracted_constraints), 0)
        self.assertGreater(len(result.warnings), 0)
        
        warning_text = ' '.join(result.warnings)
        self.assertIn('constraint', warning_text.lower())
    
    def test_implied_success_criteria_detection(self):
        """Test detection of implied success criteria in unmarked chunks"""
        chunk = RAGChunk(
            chunk_id=7,
            chunk_text="""
            The system should validate all input fields.
            Expected to return JSON response.
            Must pass integration tests.
            """,
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=False  # Not marked but contains criteria
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        # Should extract criteria and generate warning
        self.assertGreater(len(result.extracted_success_criteria), 0)
        self.assertGreater(len(result.warnings), 0)
        
        warning_text = ' '.join(result.warnings)
        self.assertIn('acceptance', warning_text.lower())
    
    def test_validate_and_enrich_task(self):
        """Test automatic enrichment of task with extracted data"""
        chunk = RAGChunk(
            chunk_id=8,
            chunk_text="""
            The system must support HTTPS connections only.
            Response time shall not exceed 500ms.
            Success criteria: User must be able to complete checkout.
            The payment must be validated before processing.
            """,
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        task['task_data']['constraints'] = []
        task['task_data']['success_criteria'] = []
        
        enriched_task, result = self.validator.validate_and_enrich_task(task, [chunk])
        
        # Task should be enriched with extracted data
        self.assertGreater(len(enriched_task['task_data']['constraints']), 0)
        self.assertGreater(len(enriched_task['task_data']['success_criteria']), 0)
        
        constraints_text = ' '.join(enriched_task['task_data']['constraints'])
        self.assertIn('HTTPS', constraints_text)
        
        criteria_text = ' '.join(enriched_task['task_data']['success_criteria'])
        self.assertIn('checkout', criteria_text.lower())
    
    def test_preserve_original_wording(self):
        """Test that original wording of constraints and criteria is preserved"""
        original_constraint = "The system must support at least 1000 concurrent users with sub-200ms latency."
        original_criterion = "User must be able to login successfully and see their personalized dashboard."
        
        chunk = RAGChunk(
            chunk_id=9,
            chunk_text=f"{original_constraint}\n{original_criterion}",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        # Check that original wording is preserved
        self.assertTrue(
            any(original_constraint in constraint 
                for constraint in result.extracted_constraints)
        )
        self.assertTrue(
            any(original_criterion in criterion 
                for criterion in result.extracted_success_criteria)
        )
    
    def test_multiple_chunks_aggregation(self):
        """Test that constraints and criteria from multiple chunks are aggregated"""
        chunk1 = RAGChunk(
            chunk_id=10,
            chunk_text="System must use TLS 1.3 encryption.",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=False
        )
        
        chunk2 = RAGChunk(
            chunk_id=11,
            chunk_text="Database connections must be pooled with max 100 connections.",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=False
        )
        
        chunk3 = RAGChunk(
            chunk_id=12,
            chunk_text="User should be able to reset password. System must send confirmation email.",
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk1, chunk2, chunk3])
        
        # Should have constraints from both chunk1 and chunk2
        self.assertGreaterEqual(len(result.extracted_constraints), 2)
        
        # Should have criteria from chunk3
        self.assertGreater(len(result.extracted_success_criteria), 0)
        
        constraints_text = ' '.join(result.extracted_constraints)
        self.assertIn('TLS', constraints_text)
        self.assertIn('pooled', constraints_text)
        
        criteria_text = ' '.join(result.extracted_success_criteria)
        self.assertIn('password', criteria_text.lower())
    
    def test_invalid_field_types(self):
        """Test that invalid field types are detected"""
        task = {
            'task_name': 123,  # Should be string
            'task_type': 'test',
            'description': ['not', 'a', 'string'],  # Should be string
            'parameters': {},
            'status': True,  # Should be string
            'priority': 'high',  # Should be integer
            'task_notes': 'Notes',
            'task_data': {
                'requirement_snippets': 'not an array',  # Should be array
                'requirement_type': 123,  # Should be string
                'constraints': 'not an array',  # Should be array
                'success_criteria': {},  # Should be array
                'execution_complexity': 'fast',
                'project_id': 'one',  # Should be integer
                'document_ids': 'not an array',  # Should be array
                'chunk_ids': {},  # Should be array
                'dependencies': 'none'  # Should be array
            }
        }
        
        result = self.validator.validate_task(task)
        
        self.assertFalse(result.is_valid)
        self.assertGreater(len(result.errors), 5)  # Multiple type errors
    
    def test_priority_validation(self):
        """Test that priority must be >= 1"""
        task = self._create_minimal_valid_task()
        task['priority'] = 0  # Invalid
        
        result = self.validator.validate_task(task)
        
        self.assertFalse(result.is_valid)
        self.assertTrue(any('priority' in error.lower() for error in result.errors))
    
    def test_edge_case_empty_chunks(self):
        """Test handling of empty chunk list"""
        task = self._create_minimal_valid_task()
        
        result = self.validator.validate_task(task, [])
        
        # Should still validate task structure
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.extracted_constraints), 0)
        self.assertEqual(len(result.extracted_success_criteria), 0)
    
    def test_edge_case_none_chunks(self):
        """Test handling of None chunk list"""
        task = self._create_minimal_valid_task()
        
        result = self.validator.validate_task(task, None)
        
        # Should still validate task structure
        self.assertTrue(result.is_valid)
    
    def test_bdd_style_criteria(self):
        """Test extraction of BDD-style (Given/When/Then) success criteria"""
        chunk = RAGChunk(
            chunk_id=13,
            chunk_text="""
            Given a registered user
            When they enter valid credentials
            Then they should be logged in successfully
            And they should see their dashboard
            """,
            document_id=1,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True
        )
        
        task = self._create_minimal_valid_task()
        result = self.validator.validate_task(task, [chunk])
        
        self.assertGreater(len(result.extracted_success_criteria), 0)
        
        criteria_text = ' '.join(result.extracted_success_criteria).lower()
        self.assertTrue(
            any(keyword in criteria_text for keyword in ['given', 'when', 'then'])
        )
    
    def _create_minimal_valid_task(self) -> dict:
        """Helper to create a minimal valid task for testing"""
        return {
            'task_name': 'Test task',
            'task_type': 'test',
            'description': 'Test description',
            'parameters': {},
            'status': 'PENDING',
            'priority': 2,
            'task_notes': 'Test notes',
            'task_data': {
                'requirement_snippets': ['Test requirement'],
                'requirement_type': 'functional',
                'constraints': [],
                'success_criteria': [],
                'execution_complexity': 'fast',
                'project_id': 1,
                'document_ids': [1],
                'chunk_ids': [1],
                'dependencies': []
            }
        }


class TestRAGChunk(unittest.TestCase):
    """Test RAGChunk dataclass"""
    
    def test_rag_chunk_creation(self):
        """Test creating RAGChunk with all fields"""
        chunk = RAGChunk(
            chunk_id=1,
            chunk_text="Test text",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=True,
            requirement_type="functional",
            priority_indicators="high"
        )
        
        self.assertEqual(chunk.chunk_id, 1)
        self.assertEqual(chunk.chunk_text, "Test text")
        self.assertTrue(chunk.has_constraints)
        self.assertTrue(chunk.has_success_criteria)
    
    def test_rag_chunk_defaults(self):
        """Test RAGChunk default values"""
        chunk = RAGChunk(
            chunk_id=1,
            chunk_text="Test",
            document_id=1,
            project_id=1
        )
        
        self.assertFalse(chunk.has_constraints)
        self.assertFalse(chunk.has_success_criteria)
        self.assertIsNone(chunk.requirement_type)
        self.assertIsNone(chunk.priority_indicators)


class TestValidationResult(unittest.TestCase):
    """Test ValidationResult dataclass"""
    
    def test_validation_result_creation(self):
        """Test creating ValidationResult"""
        result = ValidationResult(
            is_valid=True,
            errors=[],
            warnings=['Warning 1'],
            extracted_constraints=['Constraint 1'],
            extracted_success_criteria=['Criterion 1']
        )
        
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.warnings), 1)
        self.assertEqual(len(result.extracted_constraints), 1)
        self.assertEqual(len(result.extracted_success_criteria), 1)


if __name__ == '__main__':
    unittest.main()
