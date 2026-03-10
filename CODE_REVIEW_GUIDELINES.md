# Code Review Guidelines

## Overview

This document defines the code review process and guidelines for the Notion Task Manager CLI project. Effective code reviews are critical for maintaining code quality, security, and knowledge sharing within the team.

## Code Review Process

### 1. Pre-Review Checklist (Author)

Before requesting a review, ensure:

- [ ] Code follows the [Coding Standards](./CODING_STANDARDS.md)
- [ ] All automated checks pass (linting, formatting, tests)
- [ ] Self-review completed
- [ ] Code is properly documented
- [ ] No debug code, console.logs (except intentional logging), or commented-out code
- [ ] Security considerations addressed (API keys, sensitive data handling)
- [ ] Performance implications considered
- [ ] Breaking changes documented

### 2. Submitting a Pull Request

**PR Title Format:**

```
[TYPE] Brief description

Types: FEAT, FIX, REFACTOR, DOCS, TEST, CHORE
Example: [FEAT] Add task filtering by status
```

**PR Description Must Include:**

- **What:** Summary of changes
- **Why:** Rationale and context
- **How:** Implementation approach
- **Testing:** How changes were tested
- **Screenshots/Examples:** For CLI output or behavior changes
- **Related Issues:** Link to relevant tickets

### 3. Review Assignment

- **Required Reviewers:** Minimum 1 (Technical Lead for architecture changes)
- **Optional Reviewers:** Other Backend/CLI Developers
- **Response Time:** Reviews should be completed within 24 hours
- **Review Priority:**
  - P0 (Critical): Hotfixes, security issues
  - P1 (High): Feature work, blocking issues
  - P2 (Normal): Refactoring, improvements
  - P3 (Low): Documentation, minor cleanups

### 4. Review Focus Areas

#### Functionality

- Does the code do what it's supposed to do?
- Are edge cases handled?
- Is error handling comprehensive?
- Are there potential bugs?

#### Code Quality

- Is the code readable and maintainable?
- Is there unnecessary complexity?
- Are functions and variables well-named?
- Is the code DRY (Don't Repeat Yourself)?
- Are there opportunities for simplification?

#### Architecture & Design

- Does it fit the overall architecture?
- Are abstractions appropriate?
- Is the module structure logical?
- Are dependencies managed properly?

#### Security

- Are API keys and secrets properly handled?
- Is user input validated and sanitized?
- Are there potential security vulnerabilities?
- Is data exposure minimized?

#### Performance

- Are there performance bottlenecks?
- Is API usage optimized (batch operations, rate limits)?
- Are resources properly managed (memory, connections)?

#### Testing

- Is test coverage adequate?
- Are tests meaningful and maintainable?
- Do tests cover edge cases?

#### Documentation

- Is code self-documenting with clear naming?
- Are complex algorithms explained?
- Is API documentation complete?
- Are breaking changes documented?

### 5. Providing Feedback

#### Feedback Types

Use these prefixes to clarify feedback intent:

- **[BLOCKING]:** Must be addressed before merge
- **[SUGGESTION]:** Nice to have, not required
- **[QUESTION]:** Seeking clarification
- **[NITPICK]:** Minor style/preference issue
- **[PRAISE]:** Acknowledging good work

#### Feedback Guidelines

**DO:**

- Be specific and actionable
- Explain the "why" behind suggestions
- Suggest alternatives or solutions
- Acknowledge good practices
- Be respectful and constructive
- Focus on the code, not the person
- Ask questions to understand intent

**DON'T:**

- Make personal criticisms
- Use ambiguous language ("this is bad")
- Bikeshed minor stylistic preferences
- Block on subjective opinions
- Assume malice or incompetence

#### Example Good Feedback

```
[BLOCKING] Line 45: The API key is exposed in the error message.
This could leak sensitive information to logs.

Suggestion:
- Sanitize error messages to remove credentials
- Log error.code instead of error.body

Reference: OWASP Top 10 - Sensitive Data Exposure
```

```
[SUGGESTION] Lines 30-60: This function is doing multiple things.
Consider extracting the validation logic into a separate function
for better testability and reusability.
```

```
[QUESTION] Line 78: Why are we using setTimeout here?
Is this to handle a race condition? Could you add a comment
explaining the reasoning?
```

### 6. Responding to Feedback

#### As the Author

- Respond to all comments (even if just acknowledging)
- Don't take feedback personally
- Ask for clarification if needed
- Mark conversations as resolved after addressing
- Push new commits (don't force push during review)
- Notify reviewers when ready for re-review

#### As the Reviewer

- Mark approval once satisfied
- Re-review changes after substantial updates
- Be available for follow-up questions

### 7. Approval & Merge Criteria

**Merge Requirements:**

- ✅ Minimum 1 approval from Technical Lead or Senior Developer
- ✅ All blocking comments resolved
- ✅ All automated checks passing (CI/CD)
- ✅ No merge conflicts
- ✅ Branch is up to date with target branch

**Who Can Merge:**

- Technical Lead (all PRs)
- PR Author (after approval, non-architecture changes)

**Merge Strategy:**

- Use "Squash and Merge" for feature branches
- Use "Merge Commit" for release branches
- Delete branch after merge

### 8. Special Review Cases

#### Hotfixes

- Fast-tracked review process
- Technical Lead approval required
- Create follow-up ticket for proper solution if needed

#### Refactoring

- Ensure behavior is unchanged
- Validate with existing tests
- Consider impact on other features

#### Architecture Changes

- Design doc required for significant changes
- Technical Lead must review
- Consider scheduling a design review meeting

#### Documentation-Only Changes

- Simplified review process
- Check accuracy and clarity
- No need for extensive testing

## Quality Gates (Automated)

All PRs must pass automated quality checks before review:

1. **Linting:** ESLint with project configuration
2. **Formatting:** Prettier check
3. **Tests:** All tests pass (when implemented)
4. **Security:** No high/critical vulnerabilities in dependencies
5. **Build:** Code builds successfully

## Review Metrics

To ensure healthy review practices, we track:

- **Review Turnaround Time:** Target < 24 hours
- **Review Thoroughness:** Comments per PR (quality over quantity)
- **Approval Rate:** Should not be 100% (indicates rubber-stamping)
- **Revision Rounds:** Target 1-2 rounds average

## Tips for Effective Reviews

### For Authors

- Keep PRs small and focused (< 400 lines preferred)
- Provide context in description
- Respond to feedback promptly
- Be open to suggestions

### For Reviewers

- Review promptly (within 24 hours)
- Balance thoroughness with pragmatism
- Recognize good work
- Coach junior developers
- Don't perfectionism block progress

## Continuous Improvement

This process should evolve based on team feedback. Suggestions for improvement should be discussed in retrospectives or team meetings.

## Resources

- [Coding Standards](./CODING_STANDARDS.md)
- [Git Workflow](./docs/git-workflow.md) _(to be created)_
- [Architecture Decision Records](./docs/adr/) _(to be created)_

---

_Last Updated: March 10, 2026_
_Owner: Technical Lead_
