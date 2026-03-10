# Architecture Diagrams
## Notion Task Tracker CLI

Visual representations of system architecture, data flows, and component interactions.

---

## System Architecture Overview

```mermaid
graph TB
    User[User/Terminal] --> CLI[CLI Interface Layer]
    
    CLI --> CP[Command Parser]
    CLI --> IV[Input Validator]
    CLI --> OF[Output Formatter]
    
    CP --> BL[Business Logic Layer]
    IV --> BL
    
    BL --> TS[TaskService]
    BL --> CS[ConfigService]
    BL --> CAS[CacheService]
    BL --> VS[ValidationService]
    
    TS --> DAL[Data Access Layer]
    CS --> DAL
    CAS --> DAL
    
    DAL --> NR[NotionRepository]
    DAL --> CR[ConfigRepository]
    DAL --> CAR[CacheRepository]
    
    NR --> IL[Infrastructure Layer]
    CR --> IL
    CAR --> IL
    
    IL --> NC[Notion API Client]
    IL --> FS[File System]
    IL --> LOG[Logger]
    
    NC --> API[Notion API]
    
    style User fill:#e1f5ff
    style CLI fill:#fff3cd
    style BL fill:#d4edda
    style DAL fill:#cce5ff
    style IL fill:#f8d7da
    style API fill:#d1ecf1
```

---

## Component Interaction - Task Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as CLI Command
    participant TS as TaskService
    participant V as ValidationService
    participant DM as DataMapper
    participant NR as NotionRepository
    participant RL as RateLimiter
    participant API as Notion API
    participant Cache as CacheService

    U->>CLI: notion-task create "My Task"
    CLI->>V: validate(taskData)
    V-->>CLI: valid
    
    CLI->>TS: createTask(taskData)
    TS->>DM: toNotionProperties(taskData)
    DM-->>TS: notionProperties
    
    TS->>RL: acquire()
    RL-->>TS: token acquired
    
    TS->>NR: createPage(databaseId, properties)
    NR->>API: POST /v1/pages
    API-->>NR: page object
    
    NR-->>TS: page
    TS->>DM: fromNotionPage(page)
    DM-->>TS: task
    
    TS->>Cache: invalidate("task:list")
    Cache-->>TS: done
    
    TS-->>CLI: task
    CLI->>U: ✓ Task created successfully!
```

---

## Data Flow - Query with Caching

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as CLI
    participant TS as TaskService
    participant Cache as CacheService
    participant NR as NotionRepository
    participant API as Notion API

    U->>CLI: notion-task list --status=todo
    CLI->>TS: listTasks(filter)
    
    TS->>Cache: get(cacheKey)
    
    alt Cache Hit
        Cache-->>TS: cached tasks
        TS-->>CLI: tasks
        CLI->>U: Display tasks
    else Cache Miss
        Cache-->>TS: null
        TS->>NR: queryDatabase(filter)
        NR->>API: POST /v1/databases/query
        API-->>NR: results
        NR-->>TS: pages
        TS->>Cache: set(cacheKey, tasks, TTL)
        TS-->>CLI: tasks
        CLI->>U: Display tasks
    end
```

---

## Error Handling Flow

```mermaid
graph TB
    Start[API Call] --> Try{Try Operation}
    Try -->|Success| Success[Return Result]
    Try -->|Error| Classify[Error Handler]
    
    Classify --> Type{Error Type}
    
    Type -->|401/403| Auth[AuthenticationError]
    Type -->|404| NotFound[NotFoundError]
    Type -->|429| RateLimit[RateLimitError]
    Type -->|500/503| Server[ServerError]
    Type -->|Network| Network[NetworkError]
    Type -->|Unknown| Unknown[UnknownError]
    
    Auth --> Log[Log Error]
    NotFound --> Log
    RateLimit --> Retry{Retry?}
    Server --> Retry
    Network --> Retry
    Unknown --> Log
    
    Retry -->|Yes| Backoff[Exponential Backoff]
    Retry -->|No| Log
    
    Backoff --> Wait[Wait]
    Wait --> Try
    
    Log --> UserMsg[User-Friendly Message]
    UserMsg --> Exit[Exit with Error]
    
    style Success fill:#d4edda
    style Exit fill:#f8d7da
    style Retry fill:#fff3cd
```

---

## Rate Limiting - Token Bucket

```mermaid
graph LR
    subgraph Token Bucket
        Bucket[Bucket: 3 tokens]
        Refill[Refill: 3/sec]
        Queue[Request Queue]
    end
    
    Req1[Request 1] --> Check{Token Available?}
    Check -->|Yes| Take[Take Token]
    Check -->|No| Queue
    
    Take --> Execute[Execute Request]
    Execute --> Return[Return Response]
    
    Queue --> Wait[Wait in Queue]
    Wait --> Refill
    Refill --> Check
    
    style Execute fill:#d4edda
    style Queue fill:#fff3cd
    style Wait fill:#f8d7da
```

---

## Configuration & Security

```mermaid
graph TB
    Init[notion-task init] --> Prompt[Interactive Prompts]
    
    Prompt --> Input1[API Key Input]
    Prompt --> Input2[Database ID Input]
    
    Input1 --> Validate[Validation Service]
    Input2 --> Validate
    
    Validate --> Test[Test API Connection]
    
    Test -->|Success| Encrypt[Encrypt API Key]
    Test -->|Failure| Error[Show Error]
    
    Encrypt --> Derive[Derive Encryption Key]
    Derive --> AES[AES-256-GCM Encryption]
    
    AES --> Store[Store Config]
    Store --> File[~/.notion-task-cli/config.json]
    
    File --> Perm[Set Permissions 0600]
    Perm --> Complete[Configuration Complete]
    
    Error --> Retry{Retry?}
    Retry -->|Yes| Prompt
    Retry -->|No| Exit[Exit]
    
    style Complete fill:#d4edda
    style Error fill:#f8d7da
    style Encrypt fill:#cce5ff
```

---

## Deployment Architecture

```mermaid
graph TB
    Dev[Developer Machine] --> Git[Git Repository]
    
    Git --> CI[CI/CD Pipeline]
    
    CI --> Lint[Lint & Format]
    CI --> Test[Run Tests]
    CI --> Security[Security Audit]
    
    Lint --> Build{All Pass?}
    Test --> Build
    Security --> Build
    
    Build -->|Yes| Package[npm Package]
    Build -->|No| Fail[Build Failed]
    
    Package --> Registry[npm Registry]
    
    Registry --> Install1[User Installation]
    Registry --> Install2[CI/CD Installation]
    
    Install1 --> Global[npm install -g]
    Install2 --> Local[npm install]
    
    Global --> CLI1[CLI Available]
    Local --> CLI2[CLI in Scripts]
    
    style Build fill:#fff3cd
    style Package fill:#d4edda
    style Fail fill:#f8d7da
```

---

## Class Diagram - Core Components

```mermaid
classDiagram
    class TaskService {
        -notionRepository
        -cacheService
        -dataMapper
        +createTask(databaseId, taskData)
        +updateTask(taskId, updates)
        +listTasks(databaseId, filter)
        +getTask(taskId)
        +deleteTask(taskId)
    }
    
    class NotionRepository {
        -client
        +createPage(databaseId, properties)
        +updatePage(pageId, properties)
        +queryDatabase(databaseId, filter)
        +getPage(pageId)
    }
    
    class CacheService {
        -memoryCache
        -fileCache
        +get(key)
        +set(key, value, ttl)
        +invalidate(pattern)
        +clear()
    }
    
    class DataMapper {
        +toNotionProperties(task)
        +fromNotionPage(page)
        +toNotionFilter(filter)
        +extractTitle(property)
        +extractStatus(property)
    }
    
    class RateLimiter {
        -capacity
        -tokens
        -queue
        +acquire()
        +refill()
        +processQueue()
    }
    
    class ConfigService {
        -configRepository
        +load()
        +save(config)
        +validate()
        +getApiKey()
        +getDatabaseId()
    }
    
    TaskService --> NotionRepository
    TaskService --> CacheService
    TaskService --> DataMapper
    NotionRepository --> RateLimiter
    TaskService --> ConfigService
```

---

## State Machine - Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Todo: Create Task
    
    Todo --> InProgress: Start Work
    Todo --> Blocked: Encounter Issue
    
    InProgress --> Todo: Pause Work
    InProgress --> Done: Complete Task
    InProgress --> Blocked: Encounter Issue
    
    Blocked --> Todo: Issue Resolved
    Blocked --> InProgress: Resume Work
    
    Done --> InProgress: Reopen Task
    Done --> [*]: Archive
    
    note right of Todo
        Default state
        for new tasks
    end note
    
    note right of Done
        Terminal state
        (can be reopened)
    end note
```

---

## Caching Strategy

```mermaid
graph TB
    Request[API Request] --> Cache{Check Cache}
    
    Cache -->|Hit| Return1[Return Cached Data]
    Cache -->|Miss| Fetch[Fetch from Notion]
    
    Fetch --> API[Notion API Call]
    API --> Parse[Parse Response]
    Parse --> Store[Store in Cache]
    
    Store --> Memory[Memory Cache<br/>5 min TTL]
    Store --> File[File Cache<br/>1 hour TTL]
    
    Memory --> Return2[Return Fresh Data]
    File --> Return2
    
    Mutation[Create/Update/Delete] --> Invalidate[Invalidate Cache]
    Invalidate --> Pattern{Match Pattern}
    
    Pattern -->|task:ID| Specific[Invalidate Specific]
    Pattern -->|task:list| All[Invalidate All Lists]
    
    style Return1 fill:#d4edda
    style API fill:#fff3cd
    style Invalidate fill:#f8d7da
```

---

## Security Layers

```mermaid
graph TB
    User[User Input] --> Layer1[Input Validation Layer]
    Layer1 --> Layer2[Business Logic Layer]
    Layer2 --> Layer3[Data Access Layer]
    Layer3 --> Layer4[Infrastructure Layer]
    
    Layer1 --> V1[Sanitize Input]
    Layer1 --> V2[Validate Schema]
    Layer1 --> V3[Type Checking]
    
    Layer2 --> S1[Authorization]
    Layer2 --> S2[Business Rules]
    
    Layer3 --> D1[Query Validation]
    Layer3 --> D2[SQL Injection Prevention]
    
    Layer4 --> I1[Encrypted Storage]
    Layer4 --> I2[Secure Transport HTTPS]
    Layer4 --> I3[Credential Management]
    
    style Layer1 fill:#fff3cd
    style Layer2 fill:#d4edda
    style Layer3 fill:#cce5ff
    style Layer4 fill:#f8d7da
```

---

## Performance Optimization Points

```mermaid
graph LR
    subgraph Client Side
        A1[Input Validation] --> A2[Request Batching]
        A2 --> A3[Local Caching]
    end
    
    subgraph Network Layer
        B1[Rate Limiting] --> B2[Connection Pooling]
        B2 --> B3[Request Compression]
    end
    
    subgraph Data Processing
        C1[Lazy Loading] --> C2[Pagination]
        C2 --> C3[Streaming]
    end
    
    A3 --> B1
    B3 --> C1
    
    style A3 fill:#d4edda
    style B2 fill:#cce5ff
    style C2 fill:#fff3cd
```

---

## Testing Pyramid

```mermaid
graph TB
    subgraph Test Layers
        E2E[End-to-End Tests<br/>10%<br/>Full user scenarios]
        INT[Integration Tests<br/>30%<br/>Component interaction]
        UNIT[Unit Tests<br/>60%<br/>Individual functions]
    end
    
    E2E --> INT
    INT --> UNIT
    
    UNIT --> Examples1[TaskService tests<br/>Mocked dependencies<br/>Fast execution]
    
    INT --> Examples2[Notion API tests<br/>Real API calls<br/>Test database]
    
    E2E --> Examples3[Complete CLI flows<br/>Real scenarios<br/>Acceptance criteria]
    
    style UNIT fill:#d4edda
    style INT fill:#fff3cd
    style E2E fill:#cce5ff
```

---

## Retry Strategy Flow

```mermaid
graph TB
    Start[API Request] --> Execute[Execute]
    Execute --> Result{Success?}
    
    Result -->|Yes| Success[Return Result]
    Result -->|No| Check{Retryable?}
    
    Check -->|No| Fail[Throw Error]
    Check -->|Yes| Count{Retry Count}
    
    Count -->|< 3| Calc[Calculate Backoff]
    Count -->|>= 3| Fail
    
    Calc --> Wait[Wait 2^n seconds]
    Wait --> Execute
    
    style Success fill:#d4edda
    style Fail fill:#f8d7da
    style Wait fill:#fff3cd
```

---

## Offline Support Architecture

```mermaid
graph TB
    Request[User Request] --> Online{Online?}
    
    Online -->|Yes| Direct[Direct API Call]
    Online -->|No| Queue[Add to Queue]
    
    Direct --> Success[Return Result]
    
    Queue --> Store[Persist Queue]
    Store --> Notify[Notify User]
    
    Notify --> Monitor[Monitor Connection]
    Monitor --> Check{Connected?}
    
    Check -->|Yes| Process[Process Queue]
    Check -->|No| Monitor
    
    Process --> Retry[Retry Operations]
    Retry --> Result{Success?}
    
    Result -->|Yes| Remove[Remove from Queue]
    Result -->|No| Increment[Increment Retry Count]
    
    Increment --> Limit{Max Retries?}
    Limit -->|Yes| Fail[Mark as Failed]
    Limit -->|No| Store
    
    Remove --> Next{More in Queue?}
    Next -->|Yes| Process
    Next -->|No| Complete[Queue Empty]
    
    style Success fill:#d4edda
    style Fail fill:#f8d7da
    style Queue fill:#fff3cd
```

---

## Legend

### Colors
- 🟢 Green: Success states, completed operations
- 🟡 Yellow: Waiting states, in-progress operations
- 🔵 Blue: Information, data storage
- 🔴 Red: Error states, security layers

### Shapes
- Rectangle: Process/Action
- Diamond: Decision point
- Rounded Rectangle: Start/End state
- Cylinder: Data storage

---

*These diagrams are maintained alongside the architecture documentation and should be updated when system changes occur.*

*Last Updated: March 10, 2026*
