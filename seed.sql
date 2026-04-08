-- Interactive Glossary of Programming Concepts
-- Seed Data
-- Run after schema.sql to populate initial glossary

-- ============================================================
-- Categories
-- ============================================================

INSERT INTO categories (name, slug) VALUES
    ('Data Structures',     'data-structures'),
    ('Algorithms',          'algorithms'),
    ('Object-Oriented Programming', 'oop'),
    ('Web Development',     'web-development'),
    ('Databases',           'databases'),
    ('Language Concepts',   'language-concepts'),
    ('Design Patterns',     'design-patterns'),
    ('Networking',          'networking'),
    ('DevOps & Tooling',    'devops-tooling'),
    ('Computer Science Fundamentals', 'cs-fundamentals');

-- ============================================================
-- Tags
-- ============================================================

INSERT INTO tags (name) VALUES
    ('interview-prep'),
    ('exam-review'),
    ('java'),
    ('python'),
    ('javascript'),
    ('beginner'),
    ('advanced'),
    ('daily-reference');

-- ============================================================
-- Terms
-- ============================================================

-- 1. Array
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Array',
    'array',
    'A contiguous block of memory storing elements of the same type, accessed by index. Arrays offer **O(1)** random access but **O(n)** insertion/deletion in the middle.

Key characteristics:
- Fixed size (in most languages) or dynamically resizable (e.g., `ArrayList` in Java, `list` in Python)
- Zero-indexed in most languages
- Cache-friendly due to memory locality',
    'int[] nums = {10, 20, 30, 40, 50};
System.out.println(nums[2]); // 30
System.out.println(nums.length); // 5',
    'java'
);

-- 2. Linked List
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Linked List',
    'linked-list',
    'A linear data structure where each element (node) contains data and a reference (pointer) to the next node. Unlike arrays, linked lists do not store elements contiguously in memory.

**Singly Linked List:** Each node points to the next.
**Doubly Linked List:** Each node points to both next and previous.

Trade-offs vs. arrays:
- **O(1)** insertion/deletion at head (or at any node if you have a reference)
- **O(n)** access by index (no random access)
- Extra memory overhead per node for the pointer(s)',
    'class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

head = Node(10)
head.next = Node(20)
head.next.next = Node(30)',
    'python'
);

-- 3. Hash Map
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Hash Map',
    'hash-map',
    'A data structure that maps keys to values using a **hash function** to compute an index into an array of buckets. Provides average-case **O(1)** lookup, insertion, and deletion.

Also known as: hash table, dictionary (`dict` in Python), `HashMap` in Java, `Object`/`Map` in JavaScript.

**Collision handling strategies:**
- Chaining (linked list at each bucket)
- Open addressing (linear probing, quadratic probing, double hashing)',
    'import java.util.HashMap;

HashMap<String, Integer> ages = new HashMap<>();
ages.put("Alice", 25);
ages.put("Bob", 30);
System.out.println(ages.get("Alice")); // 25
System.out.println(ages.containsKey("Charlie")); // false',
    'java'
);

-- 4. Stack
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Stack',
    'stack',
    'A **LIFO** (Last In, First Out) data structure. Elements are added and removed from the same end, called the **top**.

Common operations:
- `push(item)` — add to top
- `pop()` — remove and return top
- `peek()` — view top without removing
- `isEmpty()` — check if empty

Used in: function call stacks, undo mechanisms, expression parsing, DFS.',
    'from collections import deque

stack = deque()
stack.append(1)   # push
stack.append(2)
stack.append(3)
print(stack.pop())  # 3 (LIFO)
print(stack[-1])    # 2 (peek)',
    'python'
);

-- 5. Queue
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Queue',
    'queue',
    'A **FIFO** (First In, First Out) data structure. Elements are added at the **rear** and removed from the **front**.

Variants:
- **Priority Queue:** Elements dequeued by priority, not insertion order
- **Deque (Double-ended Queue):** Insert/remove from both ends
- **Circular Queue:** Wraps around a fixed-size array

Used in: BFS, task scheduling, print queues, message buffers.',
    'import java.util.LinkedList;
import java.util.Queue;

Queue<String> q = new LinkedList<>();
q.offer("first");
q.offer("second");
q.offer("third");
System.out.println(q.poll());  // "first" (FIFO)
System.out.println(q.peek());  // "second"',
    'java'
);

-- 6. Binary Search Tree
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Binary Search Tree',
    'binary-search-tree',
    'A binary tree where for every node: all values in the **left subtree are less** than the node, and all values in the **right subtree are greater**.

**Average case:** O(log n) search, insert, delete.
**Worst case (degenerate/skewed):** O(n) — essentially a linked list.

Balanced variants (AVL, Red-Black) guarantee O(log n) worst case.',
    'class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// Insert into BST
TreeNode insert(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = insert(root.left, val);
    else if (val > root.val) root.right = insert(root.right, val);
    return root;
}',
    'java'
);

-- 7. Graph
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Graph',
    'graph',
    'A non-linear data structure consisting of **vertices (nodes)** connected by **edges**. Graphs model relationships and connections.

Types:
- **Directed vs. Undirected**
- **Weighted vs. Unweighted**
- **Cyclic vs. Acyclic** (DAG = Directed Acyclic Graph)

Representations:
- **Adjacency Matrix:** O(V²) space, O(1) edge lookup
- **Adjacency List:** O(V + E) space, efficient for sparse graphs',
    '# Adjacency list representation
graph = {
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C"]
}

# BFS traversal
from collections import deque
def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    while queue:
        node = queue.popleft()
        print(node, end=" ")
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)',
    'python'
);

-- 8. Recursion
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Recursion',
    'recursion',
    'A technique where a function **calls itself** to solve smaller instances of the same problem. Every recursive solution needs:

1. **Base case** — the condition that stops recursion
2. **Recursive case** — the function calling itself with a smaller/simpler input

**Tail recursion:** When the recursive call is the last operation in the function — some compilers/interpreters optimize this to avoid stack overflow.',
    'def factorial(n):
    if n <= 1:       # Base case
        return 1
    return n * factorial(n - 1)  # Recursive case

print(factorial(5))  # 120',
    'python'
);

-- 9. Big O Notation
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Big O Notation',
    'big-o-notation',
    'A mathematical notation describing the **upper bound** of an algorithm''s time or space complexity as input size grows.

Common complexities (best → worst):
- **O(1)** — Constant (hash lookup)
- **O(log n)** — Logarithmic (binary search)
- **O(n)** — Linear (single loop)
- **O(n log n)** — Linearithmic (merge sort)
- **O(n²)** — Quadratic (nested loops)
- **O(2ⁿ)** — Exponential (naive recursive Fibonacci)

Big O describes **worst-case** behavior. Related notations: Ω (best-case), Θ (tight bound).',
    '// O(n) — linear scan
for (int i = 0; i < n; i++) { ... }

// O(n^2) — nested loops
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) { ... }
}

// O(log n) — binary search
while (low <= high) {
    int mid = (low + high) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
}',
    'java'
);

-- 10. Sorting Algorithm
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Sorting Algorithm',
    'sorting-algorithm',
    'An algorithm that arranges elements of a list in a specific order (ascending, descending, custom comparator).

Common sorting algorithms:
| Algorithm      | Best    | Average | Worst   | Space  | Stable? |
|----------------|---------|---------|---------|--------|---------|
| Bubble Sort    | O(n)    | O(n²)   | O(n²)   | O(1)   | Yes     |
| Selection Sort | O(n²)   | O(n²)   | O(n²)   | O(1)   | No      |
| Insertion Sort | O(n)    | O(n²)   | O(n²)   | O(1)   | Yes     |
| Merge Sort     | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort     | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort      | O(n log n) | O(n log n) | O(n log n) | O(1) | No |',
    'import java.util.Arrays;

int[] arr = {5, 2, 8, 1, 9, 3};
Arrays.sort(arr);  // Dual-pivot Quicksort (primitives)
System.out.println(Arrays.toString(arr));
// [1, 2, 3, 5, 8, 9]',
    'java'
);

-- 11. Binary Search
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Binary Search',
    'binary-search',
    'A search algorithm that finds a target value within a **sorted** array by repeatedly dividing the search space in half.

**Time complexity:** O(log n)
**Space complexity:** O(1) iterative, O(log n) recursive

Requirements: The input **must be sorted**. If unsorted, sort first (O(n log n)) or use linear search.',
    'def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1  # Not found

print(binary_search([1, 3, 5, 7, 9, 11], 7))  # 3',
    'python'
);

-- 12. API
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'API',
    'api',
    '**Application Programming Interface** — a contract defining how software components communicate. APIs abstract away implementation details, exposing only what consumers need.

Types:
- **REST API:** HTTP-based, resource-oriented, stateless
- **GraphQL:** Query language, client specifies exact data shape
- **WebSocket:** Persistent bidirectional connection
- **Library/SDK API:** Function signatures and classes exposed by a library',
    '// Fetch data from a REST API
const response = await fetch("https://api.example.com/users/1");
const user = await response.json();
console.log(user.name);',
    'javascript'
);

-- 13. REST
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'REST',
    'rest',
    '**Representational State Transfer** — an architectural style for designing networked APIs. RESTful services use HTTP methods to operate on resources identified by URLs.

Principles:
- **Stateless:** Each request contains all info needed to process it
- **Resource-based:** URLs identify resources (`/users/42`)
- **HTTP methods as verbs:** GET (read), POST (create), PUT (update), DELETE (remove)
- **Uniform interface:** Consistent, predictable URL patterns',
    '# FastAPI REST endpoint example
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "name": "Alice"}

@app.post("/api/users")
async def create_user(name: str):
    return {"id": 1, "name": name}',
    'python'
);

-- 14. HTTP
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'HTTP',
    'http',
    '**HyperText Transfer Protocol** — the foundation of data communication on the web. A request-response protocol between clients and servers.

Key concepts:
- **Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Status codes:** 2xx (success), 3xx (redirect), 4xx (client error), 5xx (server error)
- **Headers:** Metadata (Content-Type, Authorization, Cache-Control)
- **HTTPS:** HTTP over TLS encryption',
    'curl -X GET https://api.example.com/data \
     -H "Authorization: Bearer TOKEN" \
     -H "Accept: application/json"',
    'bash'
);

-- 15. SQL
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'SQL',
    'sql',
    '**Structured Query Language** — the standard language for managing and querying relational databases.

Core operations (**CRUD**):
- **CREATE** / INSERT — add data
- **READ** / SELECT — query data
- **UPDATE** — modify data
- **DELETE** — remove data

Key clauses: `WHERE`, `JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`',
    'SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1
GROUP BY u.id
HAVING order_count > 5
ORDER BY order_count DESC
LIMIT 10;',
    'sql'
);

-- 16. Git
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Git',
    'git',
    'A **distributed version control system** for tracking changes in source code. Every developer has a full copy of the repository history.

Core concepts:
- **Repository (repo):** Project folder tracked by Git
- **Commit:** A snapshot of changes with a message
- **Branch:** An independent line of development
- **Merge:** Combining branches
- **Remote:** A hosted copy of the repo (GitHub, GitLab, etc.)',
    'git init
git add .
git commit -m "Initial commit"
git branch feature/search
git checkout feature/search
# ... make changes ...
git add .
git commit -m "Add search functionality"
git checkout main
git merge feature/search',
    'bash'
);

-- 17. OOP (Object-Oriented Programming)
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Object-Oriented Programming',
    'object-oriented-programming',
    'A programming paradigm organized around **objects** — instances of classes that bundle data (fields/attributes) and behavior (methods).

**Four pillars:**
1. **Encapsulation** — Bundling data and methods; controlling access via visibility modifiers
2. **Abstraction** — Hiding implementation complexity behind simple interfaces
3. **Inheritance** — Creating new classes from existing ones (`extends`)
4. **Polymorphism** — One interface, multiple implementations (method overriding/overloading)',
    'public class Animal {
    private String name;

    public Animal(String name) {
        this.name = name;
    }

    public String speak() {
        return name + " makes a sound";
    }
}

public class Dog extends Animal {
    public Dog(String name) { super(name); }

    @Override
    public String speak() {
        return super.speak().replace("a sound", "Woof!");
    }
}',
    'java'
);

-- 18. Interface
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Interface',
    'interface',
    'A contract that specifies **what** a class must do without defining **how**. Classes that implement an interface must provide concrete implementations of all declared methods.

In Java:
- Declared with `interface` keyword
- All methods are implicitly `public abstract` (pre-Java 8)
- Java 8+ allows `default` and `static` methods
- A class can implement **multiple interfaces** (unlike single inheritance with classes)

In TypeScript: Interfaces define object shapes and are purely compile-time constructs.',
    'public interface Searchable {
    List<String> search(String query);
    default int resultCount(String query) {
        return search(query).size();
    }
}

public class GlossaryService implements Searchable {
    @Override
    public List<String> search(String query) {
        // implementation here
        return List.of("result1", "result2");
    }
}',
    'java'
);

-- 19. Design Pattern
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Design Pattern',
    'design-pattern',
    'A reusable solution to a commonly occurring problem in software design. Not code you copy-paste, but a **template** for solving a category of problems.

**Three categories (Gang of Four):**
- **Creational:** How objects are created (Singleton, Factory, Builder)
- **Structural:** How objects are composed (Adapter, Decorator, Facade)
- **Behavioral:** How objects communicate (Observer, Strategy, Command)',
    '# Strategy Pattern example
class SortStrategy:
    def sort(self, data): ...

class QuickSort(SortStrategy):
    def sort(self, data):
        return sorted(data)  # simplified

class BubbleSort(SortStrategy):
    def sort(self, data):
        # bubble sort implementation
        return data

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy

    def sort(self, data):
        return self._strategy.sort(data)',
    'python'
);

-- 20. Dependency Injection
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Dependency Injection',
    'dependency-injection',
    'A design technique where an object **receives** its dependencies from the outside rather than creating them internally. This promotes loose coupling and testability.

Types:
- **Constructor injection** — dependencies passed via constructor (most common)
- **Setter injection** — dependencies set via methods
- **Interface injection** — dependency provides an injector method

Frameworks: Spring (Java), FastAPI `Depends()` (Python), Angular (TypeScript).',
    '// Constructor Injection in Java
public class TermService {
    private final TermRepository repo;

    // Dependency injected via constructor
    public TermService(TermRepository repo) {
        this.repo = repo;
    }

    public Term findBySlug(String slug) {
        return repo.findBySlug(slug);
    }
}',
    'java'
);

-- 21. JSON
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'JSON',
    'json',
    '**JavaScript Object Notation** — a lightweight, text-based data interchange format. Language-independent but uses conventions familiar to C-family languages.

Data types: string, number, boolean, null, object (key-value pairs), array (ordered list).

Used everywhere: REST API responses, config files (`package.json`, `tsconfig.json`), data storage, inter-service communication.',
    '{
  "name": "Binary Search Tree",
  "category": "Data Structures",
  "complexity": {
    "search": "O(log n)",
    "insert": "O(log n)"
  },
  "balanced_variants": ["AVL", "Red-Black"],
  "is_recursive": true
}',
    'json'
);

-- 22. Async/Await
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Async/Await',
    'async-await',
    'A syntactic pattern for writing **asynchronous** code that reads like synchronous code. `async` marks a function as asynchronous; `await` pauses execution until a Promise/Future resolves.

Supported in: JavaScript (ES2017), Python (3.5+), C#, Rust, and many others.

Key benefit: Avoids deeply nested callbacks ("callback hell") while maintaining non-blocking I/O.',
    'import aiohttp
import asyncio

async def fetch_term(slug: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"http://localhost:8000/api/terms/{slug}") as resp:
            return await resp.json()

# Run it
result = asyncio.run(fetch_term("binary-search-tree"))
print(result["name"])',
    'python'
);

-- 23. Type System
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Type System',
    'type-system',
    'The set of rules a language uses to assign and enforce **types** on values, variables, and expressions.

**Static vs. Dynamic:**
- **Static** (Java, TypeScript, Rust): Types checked at compile time
- **Dynamic** (Python, JavaScript, Ruby): Types checked at runtime

**Strong vs. Weak:**
- **Strong** (Python, Java): No implicit type coercion (`"5" + 1` → error in Python)
- **Weak** (JavaScript, C): Implicit coercion allowed (`"5" + 1` → `"51"` in JS)',
    '// TypeScript — static typing
interface Term {
    id: number;
    name: string;
    slug: string;
    definition: string;
    isFavorite: boolean;
}

function displayTerm(term: Term): string {
    return `${term.name}: ${term.definition}`;
}',
    'typescript'
);

-- 24. Version Control
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Version Control',
    'version-control',
    'A system that records changes to files over time so you can recall specific versions later. Essential for collaboration, history tracking, and safe experimentation.

Types:
- **Centralized** (SVN): Single server holds the canonical history
- **Distributed** (Git, Mercurial): Every clone is a full repository

Core benefits: branching/merging, blame/annotation, rollback, collaboration without conflicts.',
    'git log --oneline --graph --all
# Shows visual commit history across all branches

git diff HEAD~3..HEAD
# Shows changes in last 3 commits

git stash
# Temporarily shelve uncommitted changes',
    'bash'
);

-- 25. Docker
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Docker',
    'docker',
    'A platform for building, shipping, and running applications in **containers** — lightweight, isolated environments that package an app with all its dependencies.

Key concepts:
- **Image:** A read-only template (like a class)
- **Container:** A running instance of an image (like an object)
- **Dockerfile:** Instructions to build an image
- **Docker Compose:** Define and run multi-container apps via `docker-compose.yml`',
    'FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]',
    'bash'
);

-- 26. Middleware
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Middleware',
    'middleware',
    'Software that sits **between** the request and the response in a web application pipeline. Each middleware can inspect, modify, or short-circuit requests/responses.

Common uses:
- Logging (request timing, access logs)
- Authentication / Authorization
- CORS handling
- Error handling
- Request parsing (JSON body, cookies)',
    'from fastapi import FastAPI, Request
import time

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    print(f"{request.method} {request.url.path} — {elapsed:.3f}s")
    return response',
    'python'
);

-- 27. Polymorphism
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Polymorphism',
    'polymorphism',
    'The ability of different types to be treated through a **uniform interface**. "Many forms" — the same method call produces different behavior depending on the object.

Two main types in Java:
- **Compile-time (static):** Method **overloading** — same method name, different parameter lists
- **Runtime (dynamic):** Method **overriding** — subclass provides its own implementation of a superclass method

Enables writing flexible, extensible code that works with abstractions rather than concrete types.',
    'public class Shape {
    public double area() { return 0; }
}

public class Circle extends Shape {
    private double radius;
    public Circle(double r) { this.radius = r; }

    @Override
    public double area() { return Math.PI * radius * radius; }
}

public class Rectangle extends Shape {
    private double w, h;
    public Rectangle(double w, double h) { this.w = w; this.h = h; }

    @Override
    public double area() { return w * h; }
}

// Polymorphic usage
Shape s = new Circle(5);
System.out.println(s.area()); // 78.54 — calls Circle.area()',
    'java'
);

-- 28. Lambda Expression
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Lambda Expression',
    'lambda-expression',
    'An **anonymous function** — a function defined without a name, often used as an argument to higher-order functions.

In Java (8+): `(parameters) -> expression` — implements a **functional interface** (an interface with exactly one abstract method).

In Python: `lambda params: expression` — limited to a single expression.

In JavaScript: `(params) => expression` — arrow functions.',
    '// Java — Lambda with Streams
List<String> terms = List.of("Stack", "Queue", "Array", "Graph");

List<String> sorted = terms.stream()
    .filter(t -> t.length() > 4)
    .sorted((a, b) -> a.compareToIgnoreCase(b))
    .collect(Collectors.toList());
// [Graph, Queue, Stack]',
    'java'
);

-- 29. Closure
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Closure',
    'closure',
    'A function that **captures** and remembers variables from its enclosing scope, even after that scope has finished executing.

Closures "close over" their environment. The captured variables remain accessible to the inner function as long as the closure exists.

Common uses: data privacy, factory functions, callbacks, event handlers, partial application.',
    'function createCounter() {
    let count = 0;  // Enclosed variable
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
// count is not accessible directly — only via the closure',
    'javascript'
);

-- 30. Database Index
INSERT INTO terms (name, slug, definition, example_code, code_lang) VALUES (
    'Database Index',
    'database-index',
    'A data structure (typically a **B-tree** or hash table) that speeds up data retrieval on a database table at the cost of additional storage and slower writes.

Without an index, the database performs a **full table scan** (O(n)). With a B-tree index, lookups are **O(log n)**.

Trade-offs:
- Faster reads, slower writes (index must be updated on INSERT/UPDATE/DELETE)
- Additional disk space
- Too many indexes can degrade write performance

Rule of thumb: index columns that appear frequently in `WHERE`, `JOIN`, and `ORDER BY` clauses.',
    'CREATE INDEX idx_terms_name ON terms(name);

-- Composite index for common query patterns
CREATE INDEX idx_term_cats ON term_categories(term_id, category_id);

-- Explain query to verify index usage
EXPLAIN QUERY PLAN
SELECT * FROM terms WHERE name LIKE ''binary%'';',
    'sql'
);


-- ============================================================
-- Term ↔ Category Associations
-- ============================================================

INSERT INTO term_categories (term_id, category_id) VALUES
    -- Data Structures (1)
    (1, 1),   -- Array
    (2, 1),   -- Linked List
    (3, 1),   -- Hash Map
    (4, 1),   -- Stack
    (5, 1),   -- Queue
    (6, 1),   -- Binary Search Tree
    (7, 1),   -- Graph
    -- Algorithms (2)
    (8, 2),   -- Recursion
    (9, 2),   -- Big O Notation
    (10, 2),  -- Sorting Algorithm
    (11, 2),  -- Binary Search
    -- OOP (3)
    (17, 3),  -- OOP
    (18, 3),  -- Interface
    (27, 3),  -- Polymorphism
    (20, 3),  -- Dependency Injection
    (28, 3),  -- Lambda Expression
    -- Web Development (4)
    (12, 4),  -- API
    (13, 4),  -- REST
    (14, 4),  -- HTTP
    (26, 4),  -- Middleware
    -- Databases (5)
    (15, 5),  -- SQL
    (30, 5),  -- Database Index
    -- Language Concepts (6)
    (22, 6),  -- Async/Await
    (23, 6),  -- Type System
    (28, 6),  -- Lambda Expression
    (29, 6),  -- Closure
    -- Design Patterns (7)
    (19, 7),  -- Design Pattern
    (20, 7),  -- Dependency Injection
    -- Networking (8)
    (14, 8),  -- HTTP
    -- DevOps & Tooling (9)
    (16, 9),  -- Git
    (24, 9),  -- Version Control
    (25, 9),  -- Docker
    -- CS Fundamentals (10)
    (9, 10),  -- Big O Notation
    (8, 10),  -- Recursion
    (21, 10), -- JSON
    (23, 10); -- Type System

-- ============================================================
-- Term ↔ Tag Associations
-- ============================================================

INSERT INTO term_tags (term_id, tag_id) VALUES
    -- interview-prep (1)
    (1, 1), (2, 1), (3, 1), (6, 1), (7, 1), (9, 1), (10, 1), (11, 1), (27, 1),
    -- exam-review (2)
    (1, 2), (2, 2), (4, 2), (5, 2), (6, 2), (8, 2), (9, 2), (10, 2), (17, 2), (27, 2),
    -- java (3)
    (1, 3), (3, 3), (5, 3), (6, 3), (9, 3), (10, 3), (17, 3), (18, 3), (20, 3), (27, 3), (28, 3),
    -- python (4)
    (2, 4), (4, 4), (7, 4), (8, 4), (11, 4), (13, 4), (19, 4), (22, 4), (26, 4),
    -- javascript (5)
    (12, 5), (29, 5),
    -- beginner (6)
    (1, 6), (4, 6), (5, 6), (14, 6), (15, 6), (16, 6), (21, 6),
    -- advanced (7)
    (19, 7), (20, 7), (22, 7), (25, 7), (29, 7),
    -- daily-reference (8)
    (3, 8), (9, 8), (15, 8), (16, 8), (21, 8);

-- ============================================================
-- Related Terms
-- ============================================================

INSERT INTO related_terms (term_a, term_b) VALUES
    (1, 2),   -- Array ↔ Linked List
    (1, 3),   -- Array ↔ Hash Map
    (2, 4),   -- Linked List ↔ Stack
    (2, 5),   -- Linked List ↔ Queue
    (4, 5),   -- Stack ↔ Queue
    (6, 7),   -- BST ↔ Graph
    (8, 11),  -- Recursion ↔ Binary Search
    (9, 10),  -- Big O ↔ Sorting Algorithm
    (9, 11),  -- Big O ↔ Binary Search
    (10, 11), -- Sorting Algorithm ↔ Binary Search
    (12, 13), -- API ↔ REST
    (13, 14), -- REST ↔ HTTP
    (12, 14), -- API ↔ HTTP
    (15, 30), -- SQL ↔ Database Index
    (16, 24), -- Git ↔ Version Control
    (17, 18), -- OOP ↔ Interface
    (17, 27), -- OOP ↔ Polymorphism
    (18, 27), -- Interface ↔ Polymorphism
    (19, 20), -- Design Pattern ↔ DI
    (22, 29), -- Async/Await ↔ Closure
    (28, 29); -- Lambda ↔ Closure
