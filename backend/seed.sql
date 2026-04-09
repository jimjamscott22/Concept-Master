-- Concept Master — Seed Data
-- 11 categories, 8 tags, 43 terms

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Data Structures',        'data-structures'),
  ('Algorithms',             'algorithms'),
  ('Object-Oriented',        'object-oriented'),
  ('Functional Programming', 'functional-programming'),
  ('Concurrency',            'concurrency'),
  ('Networking',             'networking'),
  ('Cybersecurity',          'cybersecurity'),
  ('Databases',              'databases'),
  ('Design Patterns',        'design-patterns'),
  ('Memory Management',      'memory-management'),
  ('Web',                    'web');

INSERT IGNORE INTO tags (name) VALUES
  ('exam-review'),
  ('interview-prep'),
  ('fundamentals'),
  ('advanced'),
  ('python'),
  ('java'),
  ('javascript'),
  ('systems');

INSERT IGNORE INTO terms (name, slug, definition, example_code, code_lang) VALUES
('Array',
 'array',
 'A contiguous block of memory storing elements of the same type, accessed by index in O(1) time. Arrays have fixed size in most languages.\n\n**Time complexity:**\n- Access: O(1)\n- Search: O(n)\n- Insert/Delete: O(n)',
 'nums = [1, 2, 3, 4, 5]\nprint(nums[2])  # O(1) access => 3\nnums.append(6)  # O(1) amortized',
 'python'),

('Linked List',
 'linked-list',
 'A linear data structure where each element (node) stores a value and a pointer to the next node. Unlike arrays, nodes are not contiguous in memory.\n\n**Time complexity:**\n- Access: O(n)\n- Search: O(n)\n- Insert/Delete at head: O(1)',
 'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nhead = Node(1)\nhead.next = Node(2)',
 'python'),

('Stack',
 'stack',
 'A LIFO (Last In, First Out) data structure. Elements are pushed onto the top and popped from the top.\n\n**Use cases:** function call stack, undo/redo, expression evaluation.',
 'stack = []\nstack.append(1)  # push\nstack.append(2)\ntop = stack.pop()  # => 2',
 'python'),

('Queue',
 'queue',
 'A FIFO (First In, First Out) data structure. Elements are enqueued at the back and dequeued from the front.\n\n**Use cases:** BFS, task scheduling, print queues.',
 'from collections import deque\nq = deque()\nq.append(1)   # enqueue\nq.append(2)\nfront = q.popleft()  # => 1',
 'python'),

('Binary Search Tree',
 'binary-search-tree',
 'A binary tree where for each node, all values in the left subtree are smaller and all values in the right subtree are larger.\n\n**Time complexity (balanced):**\n- Search/Insert/Delete: O(log n)',
 'class BST:\n    def insert(self, root, val):\n        if not root:\n            return Node(val)\n        if val < root.val:\n            root.left = self.insert(root.left, val)\n        else:\n            root.right = self.insert(root.right, val)\n        return root',
 'python'),

('Hash Map',
 'hash-map',
 'A data structure mapping keys to values using a hash function. Provides O(1) average-case lookup, insert, and delete.\n\n**Collision resolution:** chaining or open addressing.',
 'freq = {}\nfor word in words:\n    freq[word] = freq.get(word, 0) + 1',
 'python'),

('Heap',
 'heap',
 'A complete binary tree satisfying the heap property. In a **min-heap**, each parent is ≤ its children; in a **max-heap**, each parent is ≥ its children.\n\nUsed to implement priority queues.',
 'import heapq\npq = []\nheapq.heappush(pq, 3)\nheapq.heappush(pq, 1)\nprint(heapq.heappop(pq))  # => 1',
 'python'),

('Graph',
 'graph',
 'A collection of nodes (vertices) connected by edges. Can be directed or undirected, weighted or unweighted.\n\n**Representations:** adjacency list (space-efficient) or adjacency matrix (fast edge lookup).',
 'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A"],\n    "D": ["B"],\n}',
 'python'),

('Big O Notation',
 'big-o-notation',
 'A mathematical notation describing the upper bound of an algorithm''s time or space complexity as input size n grows.\n\n**Common complexities:**\n- O(1) constant\n- O(log n) logarithmic\n- O(n) linear\n- O(n log n) linearithmic\n- O(n²) quadratic\n- O(2ⁿ) exponential',
 '# O(n²) example\nfor i in range(n):\n    for j in range(n):\n        print(i, j)',
 'python'),

('Binary Search',
 'binary-search',
 'A divide-and-conquer search algorithm that repeatedly halves the search space. Requires the array to be **sorted**.\n\n**Time complexity:** O(log n)',
 'def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1',
 'python'),

('Merge Sort',
 'merge-sort',
 'A stable divide-and-conquer sorting algorithm. Recursively splits the array in half, sorts each half, then merges.\n\n**Time complexity:** O(n log n) — all cases\n**Space:** O(n)',
 'def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left  = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)',
 'python'),

('Quick Sort',
 'quick-sort',
 'A divide-and-conquer sorting algorithm that selects a pivot and partitions elements around it.\n\n**Time complexity:**\n- Average: O(n log n)\n- Worst (bad pivot): O(n²)\n\nIn-place; poor cache performance for linked lists.',
 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left  = [x for x in arr if x < pivot]\n    mid   = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)',
 'python'),

('Depth-First Search',
 'depth-first-search',
 'A graph traversal algorithm that explores as far as possible along each branch before backtracking. Uses a stack (implicit via recursion or explicit).\n\n**Use cases:** topological sort, cycle detection, maze solving.',
 'def dfs(graph, node, visited=None):\n    if visited is None:\n        visited = set()\n    visited.add(node)\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            dfs(graph, neighbor, visited)\n    return visited',
 'python'),

('Breadth-First Search',
 'breadth-first-search',
 'A graph traversal algorithm that explores all neighbors at the current depth before moving deeper. Uses a queue.\n\n**Use cases:** shortest path in unweighted graphs, level-order traversal.',
 'from collections import deque\n\ndef bfs(graph, start):\n    visited = {start}\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return visited',
 'python'),

('Dynamic Programming',
 'dynamic-programming',
 'An optimization technique that solves complex problems by breaking them into overlapping subproblems and caching results (memoization or tabulation).\n\n**Key insight:** optimal substructure + overlapping subproblems.',
 '# Fibonacci with memoization\nfrom functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)',
 'python'),

('Recursion',
 'recursion',
 'A technique where a function calls itself with a smaller input until reaching a base case. Every recursive solution can be converted to an iterative one.\n\n**Watch out for:** stack overflow with deep recursion; Python default limit is 1000.',
 'def factorial(n):\n    if n == 0:        # base case\n        return 1\n    return n * factorial(n - 1)',
 'python'),

('Object',
 'object',
 'An instance of a class, encapsulating state (attributes) and behavior (methods). Objects are the core building blocks of object-oriented programming.',
 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        return f"{self.name} says woof!"\n\nfido = Dog("Fido")\nprint(fido.bark())',
 'python'),

('Inheritance',
 'inheritance',
 'A mechanism allowing a class (subclass) to inherit attributes and methods from another class (superclass). Supports code reuse and the **is-a** relationship.',
 'class Animal:\n    def speak(self): return "..."\n\nclass Cat(Animal):\n    def speak(self): return "Meow"\n\nclass Dog(Animal):\n    def speak(self): return "Woof"\n\nanimals = [Cat(), Dog()]\nfor a in animals:\n    print(a.speak())',
 'python'),

('Polymorphism',
 'polymorphism',
 'The ability of different objects to respond to the same interface. Enables writing code that works with objects of multiple types.\n\n**Types:** compile-time (overloading) and runtime (overriding).',
 '# Duck typing in Python\ndef make_it_speak(animal):\n    print(animal.speak())\n\nmake_it_speak(Dog())\nmake_it_speak(Cat())',
 'python'),

('Encapsulation',
 'encapsulation',
 'The bundling of data (attributes) and methods that operate on that data within a single unit (class), restricting direct access to some components.\n\nIn Python, use `_protected` and `__private` naming conventions.',
 'class BankAccount:\n    def __init__(self, balance):\n        self.__balance = balance  # private\n\n    def deposit(self, amount):\n        if amount > 0:\n            self.__balance += amount\n\n    def get_balance(self):\n        return self.__balance',
 'python'),

('Closure',
 'closure',
 'A function that captures variables from its enclosing scope, even after the outer function has returned. Enables data hiding and partial application.',
 'def make_counter(start=0):\n    count = [start]  # mutable container\n    def increment():\n        count[0] += 1\n        return count[0]\n    return increment\n\ncounter = make_counter()\nprint(counter())  # 1\nprint(counter())  # 2',
 'python'),

('Higher-Order Function',
 'higher-order-function',
 'A function that takes one or more functions as arguments, or returns a function. Core to functional programming.\n\n**Examples:** map, filter, reduce, sorted with key.',
 'numbers = [1, -2, 3, -4, 5]\npositives = list(filter(lambda x: x > 0, numbers))\nsquared   = list(map(lambda x: x**2, numbers))\nsorted_abs = sorted(numbers, key=abs)',
 'python'),

('Thread',
 'thread',
 'The smallest unit of execution within a process. Multiple threads share the same memory space, enabling concurrency.\n\n**Python note:** the GIL limits true parallelism for CPU-bound tasks; use `multiprocessing` instead.',
 'import threading\n\ndef worker(name):\n    print(f"Thread {name} running")\n\nthreads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]\nfor t in threads:\n    t.start()\nfor t in threads:\n    t.join()',
 'python'),

('Deadlock',
 'deadlock',
 'A situation where two or more threads are blocked forever, each waiting for a resource held by another.\n\n**Conditions (Coffman):** mutual exclusion, hold and wait, no preemption, circular wait.',
 '# Classic deadlock: two threads, two locks\nimport threading\nlock_a = threading.Lock()\nlock_b = threading.Lock()\n\n# Thread 1: acquires lock_a, then lock_b\n# Thread 2: acquires lock_b, then lock_a\n# => potential deadlock',
 'python'),

('REST',
 'rest',
 'Representational State Transfer — an architectural style for distributed hypermedia systems. Key constraints: stateless, client-server, cacheable, uniform interface.\n\n**HTTP verbs:** GET (read), POST (create), PUT/PATCH (update), DELETE.',
 '# FastAPI REST endpoint example\n@app.get("/users/{user_id}")\nasync def get_user(user_id: int):\n    return {"id": user_id, "name": "Alice"}',
 'python'),

('SQL JOIN',
 'sql-join',
 'A SQL clause combining rows from two or more tables based on a related column.\n\n**Types:**\n- `INNER JOIN` — matching rows only\n- `LEFT JOIN` — all left rows + matching right\n- `RIGHT JOIN` — all right rows + matching left\n- `FULL OUTER JOIN` — all rows from both',
 'SELECT u.name, o.total\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.total > 100;',
 'sql'),

('Index (Database)',
 'index-database',
 'A data structure (usually a B-tree) that speeds up data retrieval at the cost of additional storage and slower writes.\n\n**Rule of thumb:** index columns used in WHERE, JOIN, and ORDER BY clauses.',
 'CREATE INDEX idx_users_email ON users(email);\n\n-- Now this is fast:\nSELECT * FROM users WHERE email = ''alice@example.com'';',
 'sql'),

('Singleton',
 'singleton',
 'A creational design pattern ensuring a class has only one instance with a global access point.\n\n**Use cases:** database connections, logging, configuration.',
 'class Singleton:\n    _instance = None\n\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance\n\na = Singleton()\nb = Singleton()\nprint(a is b)  # True',
 'python'),

('Observer Pattern',
 'observer-pattern',
 'A behavioral design pattern where an object (subject) maintains a list of dependents (observers) and notifies them of state changes.\n\n**Use cases:** event systems, MVC (Model notifies View).',
 'class EventEmitter:\n    def __init__(self):\n        self._listeners = {}\n\n    def on(self, event, fn):\n        self._listeners.setdefault(event, []).append(fn)\n\n    def emit(self, event, *args):\n        for fn in self._listeners.get(event, []):\n            fn(*args)',
 'python'),

('Garbage Collection',
 'garbage-collection',
 'Automatic memory management that reclaims memory occupied by objects no longer referenced. Python uses reference counting + a cyclic GC for circular references.\n\n**Trade-off:** convenience vs. occasional GC pauses.',
 'import gc\n\nclass Node:\n    def __init__(self): self.ref = None\n\na = Node()\nb = Node()\na.ref = b  # circular reference\nb.ref = a\ndel a, b\ngc.collect()  # reclaim the cycle',
 'python');

INSERT IGNORE INTO terms (name, slug, definition, example_code, code_lang) VALUES
('HTTP',
 'http',
 'Hypertext Transfer Protocol, the request-response protocol that powers most web communication. Clients send requests to servers using methods like `GET` and `POST`, and servers return status codes, headers, and a response body.\n\n**Common building blocks:**\n- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`\n- Status codes: `2xx`, `3xx`, `4xx`, `5xx`\n- Headers: `Content-Type`, `Authorization`, `Cache-Control`',
 'curl -i https://example.com/api/terms \\\n  -H "Accept: application/json"',
 'bash'),

('TCP',
 'tcp',
 'Transmission Control Protocol is a connection-oriented transport protocol that prioritizes reliable, ordered delivery of bytes between hosts.\n\n**TCP features:**\n- Three-way handshake before data transfer\n- Retransmission of lost packets\n- Flow control and congestion control\n- Commonly used by HTTP, HTTPS, SSH, and databases',
 'import socket\n\nwith socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:\n    sock.connect(("example.com", 80))\n    sock.sendall(b"GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n")\n    print(sock.recv(1024).decode())',
 'python'),

('UDP',
 'udp',
 'User Datagram Protocol is a connectionless transport protocol that sends independent datagrams without guaranteeing delivery, ordering, or duplicate protection.\n\n**Why use UDP?**\n- Lower latency than TCP\n- Minimal protocol overhead\n- Useful for DNS, VoIP, live video, and online games where speed matters more than perfect delivery',
 'import socket\n\nwith socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:\n    sock.sendto(b"ping", ("127.0.0.1", 9999))',
 'python'),

('DNS',
 'dns',
 'Domain Name System translates human-readable domain names into IP addresses so clients can locate servers on a network.\n\n**DNS records include:**\n- `A` / `AAAA` for IP addresses\n- `CNAME` for aliases\n- `MX` for mail routing\n- `TXT` for verification and policy metadata',
 'nslookup example.com',
 'bash'),

('TLS',
 'tls',
 'Transport Layer Security encrypts data in transit so clients and servers can communicate privately and verify each other''s identity.\n\n**TLS provides:**\n- Confidentiality through encryption\n- Integrity checks to detect tampering\n- Certificate-based authentication\n\nHTTPS is simply HTTP running over TLS.',
 'openssl s_client -connect example.com:443 -servername example.com',
 'bash'),

('WebSocket',
 'websocket',
 'WebSocket is a protocol for long-lived, bidirectional communication between a client and server over a single TCP connection.\n\nUnlike standard HTTP request-response traffic, either side can push messages at any time after the connection is established.',
 'const socket = new WebSocket("wss://example.com/ws");\nsocket.addEventListener("open", () => {\n  socket.send(JSON.stringify({ type: "ping" }));\n});\nsocket.addEventListener("message", (event) => {\n  console.log("received:", event.data);\n});',
 'javascript'),

('Authentication',
 'authentication',
 'Authentication is the process of verifying who a user or system is. It answers the question, "Are you really who you claim to be?"\n\n**Common authentication factors:**\n- Something you know: password or PIN\n- Something you have: token or phone\n- Something you are: fingerprint or face scan',
 'headers = {"Authorization": f"Bearer {token}"}\nresponse = requests.get("https://api.example.com/me", headers=headers)',
 'python'),

('Authorization',
 'authorization',
 'Authorization determines what an authenticated user is allowed to do. It answers the question, "Now that we know who you are, what can you access?"\n\nExamples include role-based access control, ownership checks, and permission scopes.',
 'def can_edit_term(user, term):\n    return user.is_admin or term.owner_id == user.id',
 'python'),

('Encryption',
 'encryption',
 'Encryption transforms readable plaintext into unreadable ciphertext using an algorithm and a key so only authorized parties can recover the original data.\n\n**At-rest vs. in-transit:**\n- Disk/database encryption protects stored data\n- TLS protects data moving across the network',
 'echo "top-secret" | openssl enc -aes-256-cbc -pbkdf2 -salt -out secret.enc',
 'bash'),

('SQL Injection',
 'sql-injection',
 'SQL injection is a vulnerability where untrusted input is interpreted as part of a SQL query, allowing attackers to bypass checks or read and modify data.\n\n**Primary defense:** always use parameterized queries instead of building SQL with string concatenation.',
 'cursor.execute(\n    "SELECT * FROM users WHERE email = %s AND password_hash = %s",\n    (email, password_hash),\n)',
 'python'),

('Cross-Site Scripting (XSS)',
 'cross-site-scripting-xss',
 'Cross-site scripting is a vulnerability where attacker-controlled content is rendered as executable script in another user''s browser.\n\n**Common types:**\n- Stored XSS\n- Reflected XSS\n- DOM-based XSS\n\nMitigations include output escaping, content security policy, and avoiding unsafe HTML injection.',
 'const message = userSuppliedText;\nelement.textContent = message; // safe: treats input as text, not HTML',
 'javascript'),

('Memory Leak',
 'memory-leak',
 'A memory leak happens when a program keeps references to memory it no longer needs, preventing that memory from being reclaimed.\n\nLeaks often come from long-lived caches, event listeners that are never removed, or accidental retention of large objects.',
 'cache = []\n\ndef handle_request(payload):\n    cache.append(payload)  # grows forever if never cleared',
 'python'),

('Race Condition',
 'race-condition',
 'A race condition occurs when the result of a program depends on the timing or ordering of concurrent operations accessing shared state.\n\nThese bugs can be intermittent and hard to reproduce because small scheduling changes can alter the outcome.',
 'import threading\n\ncounter = 0\nlock = threading.Lock()\n\ndef increment():\n    global counter\n    with lock:\n        counter += 1',
 'python');

-- Term-category associations
INSERT IGNORE INTO term_categories (term_id, category_id)
SELECT t.id, c.id FROM terms t, categories c WHERE
  (t.slug = 'array'               AND c.slug = 'data-structures') OR
  (t.slug = 'linked-list'         AND c.slug = 'data-structures') OR
  (t.slug = 'stack'               AND c.slug = 'data-structures') OR
  (t.slug = 'queue'               AND c.slug = 'data-structures') OR
  (t.slug = 'binary-search-tree'  AND c.slug = 'data-structures') OR
  (t.slug = 'hash-map'            AND c.slug = 'data-structures') OR
  (t.slug = 'heap'                AND c.slug = 'data-structures') OR
  (t.slug = 'graph'               AND c.slug = 'data-structures') OR
  (t.slug = 'big-o-notation'      AND c.slug = 'algorithms') OR
  (t.slug = 'binary-search'       AND c.slug = 'algorithms') OR
  (t.slug = 'merge-sort'          AND c.slug = 'algorithms') OR
  (t.slug = 'quick-sort'          AND c.slug = 'algorithms') OR
  (t.slug = 'depth-first-search'  AND c.slug = 'algorithms') OR
  (t.slug = 'breadth-first-search' AND c.slug = 'algorithms') OR
  (t.slug = 'dynamic-programming' AND c.slug = 'algorithms') OR
  (t.slug = 'recursion'           AND c.slug = 'algorithms') OR
  (t.slug = 'object'              AND c.slug = 'object-oriented') OR
  (t.slug = 'inheritance'         AND c.slug = 'object-oriented') OR
  (t.slug = 'polymorphism'        AND c.slug = 'object-oriented') OR
  (t.slug = 'encapsulation'       AND c.slug = 'object-oriented') OR
  (t.slug = 'closure'             AND c.slug = 'functional-programming') OR
  (t.slug = 'higher-order-function' AND c.slug = 'functional-programming') OR
  (t.slug = 'thread'              AND c.slug = 'concurrency') OR
  (t.slug = 'deadlock'            AND c.slug = 'concurrency') OR
  (t.slug = 'race-condition'      AND c.slug = 'concurrency') OR
  (t.slug = 'rest'                AND c.slug = 'networking') OR
  (t.slug = 'http'                AND c.slug = 'networking') OR
  (t.slug = 'tcp'                 AND c.slug = 'networking') OR
  (t.slug = 'udp'                 AND c.slug = 'networking') OR
  (t.slug = 'dns'                 AND c.slug = 'networking') OR
  (t.slug = 'tls'                 AND c.slug = 'networking') OR
  (t.slug = 'websocket'           AND c.slug = 'networking') OR
  (t.slug = 'authentication'      AND c.slug = 'cybersecurity') OR
  (t.slug = 'authorization'       AND c.slug = 'cybersecurity') OR
  (t.slug = 'encryption'          AND c.slug = 'cybersecurity') OR
  (t.slug = 'tls'                 AND c.slug = 'cybersecurity') OR
  (t.slug = 'sql-injection'       AND c.slug = 'cybersecurity') OR
  (t.slug = 'cross-site-scripting-xss' AND c.slug = 'cybersecurity') OR
  (t.slug = 'sql-join'            AND c.slug = 'databases') OR
  (t.slug = 'index-database'      AND c.slug = 'databases') OR
  (t.slug = 'sql-injection'       AND c.slug = 'databases') OR
  (t.slug = 'singleton'           AND c.slug = 'design-patterns') OR
  (t.slug = 'observer-pattern'    AND c.slug = 'design-patterns') OR
  (t.slug = 'garbage-collection'  AND c.slug = 'memory-management') OR
  (t.slug = 'memory-leak'         AND c.slug = 'memory-management') OR
  (t.slug = 'http'                AND c.slug = 'web') OR
  (t.slug = 'websocket'           AND c.slug = 'web') OR
  (t.slug = 'authentication'      AND c.slug = 'web') OR
  (t.slug = 'authorization'       AND c.slug = 'web') OR
  (t.slug = 'sql-injection'       AND c.slug = 'web') OR
  (t.slug = 'cross-site-scripting-xss' AND c.slug = 'web');

-- Tag associations
INSERT IGNORE INTO term_tags (term_id, tag_id)
SELECT t.id, tg.id FROM terms t, tags tg WHERE
  (t.slug IN ('array','linked-list','stack','queue','binary-search-tree','hash-map','heap','graph') AND tg.name = 'fundamentals') OR
  (t.slug IN ('big-o-notation','binary-search','merge-sort','quick-sort','depth-first-search','breadth-first-search','dynamic-programming') AND tg.name = 'interview-prep') OR
  (t.slug IN ('binary-search','merge-sort','quick-sort','depth-first-search','breadth-first-search') AND tg.name = 'exam-review') OR
  (t.slug IN ('dynamic-programming','recursion','closure','higher-order-function') AND tg.name = 'advanced') OR
  (t.slug IN ('object','inheritance','polymorphism','encapsulation','closure','higher-order-function','garbage-collection','tcp','udp','authentication','authorization','sql-injection','memory-leak','race-condition') AND tg.name = 'python') OR
  (t.slug IN ('thread','deadlock','tcp','udp','dns','tls','encryption','memory-leak','race-condition') AND tg.name = 'systems') OR
  (t.slug IN ('rest','http','websocket','authentication','authorization','sql-join','index-database','encryption') AND tg.name = 'fundamentals') OR
  (t.slug IN ('tcp','udp','dns','tls','sql-injection','cross-site-scripting-xss','race-condition') AND tg.name = 'interview-prep') OR
  (t.slug IN ('http','tcp','udp','dns','sql-injection','cross-site-scripting-xss') AND tg.name = 'exam-review') OR
  (t.slug IN ('tls','websocket','encryption','sql-injection','cross-site-scripting-xss','memory-leak','race-condition') AND tg.name = 'advanced') OR
  (t.slug IN ('websocket','cross-site-scripting-xss') AND tg.name = 'javascript');
