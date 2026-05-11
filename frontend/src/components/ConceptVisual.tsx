const conceptVisuals: Record<string, { src: string; alt: string; caption: string }> = {
  acid: {
    src: "/concepts/acid.svg",
    alt: "Diagram showing the four ACID properties — Atomicity, Consistency, Isolation, Durability — around a central transaction.",
    caption: "Visual: ACID guarantees make database transactions safe and predictable.",
  },
  array: {
    src: "/concepts/array.svg",
    alt: "Diagram showing indexed array slots and constant-time access by index.",
    caption: "Visual: contiguous indexed slots with direct O(1) lookup.",
  },
  authentication: {
    src: "/concepts/authentication.svg",
    alt: "Diagram showing a user proving identity before access is granted.",
    caption: "Visual: authentication verifies who a user or system is.",
  },
  authorization: {
    src: "/concepts/authorization.svg",
    alt: "Diagram showing a permission check deciding whether an authenticated user may act.",
    caption: "Visual: authorization decides what an authenticated identity can access or do.",
  },
  "big-o-notation": {
    src: "/concepts/big-o-notation.svg",
    alt: "Chart comparing common Big O growth curves.",
    caption: "Visual: how common complexity classes grow as input size increases.",
  },
  "binary-search": {
    src: "/concepts/binary-search.svg",
    alt: "Diagram showing binary search halving a sorted array around the midpoint.",
    caption: "Visual: inspect the midpoint, then discard half the search space.",
  },
  "binary-search-tree": {
    src: "/concepts/binary-search-tree.svg",
    alt: "Binary search tree diagram showing left values smaller and right values larger.",
    caption: "Visual: BST ordering rule for left and right subtrees.",
  },
  "breadth-first-search": {
    src: "/concepts/breadth-first-search.svg",
    alt: "Breadth-first search traversal diagram with level-order visits and a queue.",
    caption: "Visual: BFS explores one level at a time using a queue.",
  },
  closure: {
    src: "/concepts/closure.svg",
    alt: "Diagram showing an inner function retaining access to an outer variable.",
    caption: "Visual: returned inner functions can still use variables captured from outer scope.",
  },
  "condition-variable": {
    src: "/concepts/condition-variable.svg",
    alt: "Diagram showing a consumer waiting on a condition variable while a producer notifies after updating shared state under a mutex.",
    caption: "Visual: waiters sleep while holding no lock; a notifier wakes them after changing state.",
  },
  "cpu-scheduling": {
    src: "/concepts/cpu-scheduling.svg",
    alt: "Diagram showing a ready queue of processes, a scheduler choosing the next task for the CPU, and a timer interrupt returning control.",
    caption: "Visual: the scheduler picks who runs next; the timer interrupt brings control back.",
  },
  "cross-site-scripting-xss": {
    src: "/concepts/cross-site-scripting-xss.svg",
    alt: "Diagram contrasting unsafe HTML rendering with safe text rendering to prevent XSS.",
    caption: "Visual: untrusted input should be rendered as text, not executed as script.",
  },
  deadlock: {
    src: "/concepts/deadlock.svg",
    alt: "Diagram showing two threads stuck waiting on each other's locks.",
    caption: "Visual: circular waiting between threads and locks causes progress to stop.",
  },
  "depth-first-search": {
    src: "/concepts/depth-first-search.svg",
    alt: "Depth-first search diagram showing one branch explored deeply before backtracking.",
    caption: "Visual: DFS dives down a branch first, then backtracks to remaining paths.",
  },
  dns: {
    src: "/concepts/dns.svg",
    alt: "Diagram showing a DNS query resolving a domain name to an IP address.",
    caption: "Visual: DNS translates a human-readable domain into the server's IP address.",
  },
  "dynamic-programming": {
    src: "/concepts/dynamic-programming.svg",
    alt: "Diagram showing dynamic programming reusing cached subproblem results.",
    caption: "Visual: cache overlapping subproblems instead of recomputing them.",
  },
  encapsulation: {
    src: "/concepts/encapsulation.svg",
    alt: "Diagram showing object state protected behind methods in a class.",
    caption: "Visual: class internals stay protected behind a controlled public interface.",
  },
  encryption: {
    src: "/concepts/encryption.svg",
    alt: "Diagram showing plaintext transformed into ciphertext using a key.",
    caption: "Visual: readable data becomes protected ciphertext through encryption.",
  },
  "factory-pattern": {
    src: "/concepts/factory-pattern.svg",
    alt: "Diagram showing a factory receiving a type parameter and producing different concrete objects.",
    caption: "Visual: the client asks a factory to create objects without knowing the concrete class.",
  },
  "garbage-collection": {
    src: "/concepts/garbage-collection.svg",
    alt: "Diagram contrasting reachable objects with unreachable objects eligible for cleanup.",
    caption: "Visual: unreachable objects can be reclaimed automatically by the runtime.",
  },
  graph: {
    src: "/concepts/graph.svg",
    alt: "Graph diagram showing nodes connected by edges.",
    caption: "Visual: graphs model entities as vertices and relationships as edges.",
  },
  "hash-map": {
    src: "/concepts/hash-map.svg",
    alt: "Diagram showing keys hashed into buckets in a hash map.",
    caption: "Visual: a hash function routes keys into buckets for fast lookup.",
  },
  heap: {
    src: "/concepts/heap.svg",
    alt: "Min-heap tree diagram showing the smallest value at the root.",
    caption: "Visual: heap ordering keeps the highest-priority value near the top.",
  },
  "higher-order-function": {
    src: "/concepts/higher-order-function.svg",
    alt: "Diagram showing a function passed into another function to produce a result.",
    caption: "Visual: higher-order functions take functions as input or return them as output.",
  },
  http: {
    src: "/concepts/http.svg",
    alt: "Diagram of an HTTP request from client to server and a response back.",
    caption: "Visual: HTTP request-response flow between a client and server.",
  },
  "index-database": {
    src: "/concepts/index-database.svg",
    alt: "Diagram showing a database index pointing quickly to matching rows.",
    caption: "Visual: indexes help the database jump directly to matching rows.",
  },
  inheritance: {
    src: "/concepts/inheritance.svg",
    alt: "Diagram showing a parent class with child classes inheriting and overriding behavior.",
    caption: "Visual: subclasses reuse parent behavior and specialize it.",
  },
  interrupt: {
    src: "/concepts/interrupt.svg",
    alt: "Diagram showing the CPU pausing a running program to enter an interrupt service routine after a device IRQ, then resuming.",
    caption: "Visual: a device IRQ detours the CPU into an ISR, then execution resumes where it left off.",
  },
  "kernel-vs-user-mode": {
    src: "/concepts/kernel-vs-user-mode.svg",
    alt: "Diagram showing user-mode applications crossing into kernel mode via a syscall trap, with the kernel managing hardware and isolation.",
    caption: "Visual: user code must trap into the kernel to do anything privileged.",
  },
  "linked-list": {
    src: "/concepts/linked-list.svg",
    alt: "Linked list diagram showing nodes connected by next pointers.",
    caption: "Visual: each node stores data plus a pointer to the next node.",
  },
  "map-filter-reduce": {
    src: "/concepts/map-filter-reduce.svg",
    alt: "Diagram showing a pipeline: input list through map, filter, and reduce to a single result.",
    caption: "Visual: map transforms, filter selects, reduce combines — no explicit loops needed.",
  },
  "memory-leak": {
    src: "/concepts/memory-leak.svg",
    alt: "Diagram showing retained references causing memory usage to grow over time.",
    caption: "Visual: memory leaks happen when unneeded data stays referenced.",
  },
  "merge-sort": {
    src: "/concepts/merge-sort.svg",
    alt: "Diagram showing merge sort splitting an array and merging it back sorted.",
    caption: "Visual: divide into halves, sort recursively, then merge.",
  },
  normalization: {
    src: "/concepts/normalization.svg",
    alt: "Diagram showing an unnormalized table splitting into normalized related tables to eliminate redundancy.",
    caption: "Visual: normalization splits repeated data into related tables linked by foreign keys.",
  },
  object: {
    src: "/concepts/object.svg",
    alt: "Diagram showing a class blueprint and an instantiated object with state and behavior.",
    caption: "Visual: objects are runtime instances created from classes.",
  },
  "observer-pattern": {
    src: "/concepts/observer-pattern.svg",
    alt: "Diagram showing a subject notifying multiple observers after a state change.",
    caption: "Visual: one subject can broadcast updates to many subscribed observers.",
  },
  "page-fault": {
    src: "/concepts/page-fault.svg",
    alt: "Diagram showing a virtual page access trapping into the kernel page-fault handler, which routes to a minor fault, major fault, or SIGSEGV.",
    caption: "Visual: touching an absent page traps to the kernel, which fixes it up — or kills you.",
  },
  pointer: {
    src: "/concepts/pointer.svg",
    alt: "Diagram showing a pointer variable storing a memory address that points to another variable's location.",
    caption: "Visual: pointers store addresses, enabling indirection and dynamic memory access.",
  },
  polymorphism: {
    src: "/concepts/polymorphism.svg",
    alt: "Diagram showing one interface producing different behavior across object types.",
    caption: "Visual: the same method call can behave differently depending on the object.",
  },
  "producer-consumer": {
    src: "/concepts/producer-consumer.svg",
    alt: "Diagram showing multiple producer threads pushing items into a bounded buffer and consumer threads pulling them out.",
    caption: "Visual: a bounded buffer decouples producers from consumers, with waits on full/empty.",
  },
  "pure-function": {
    src: "/concepts/pure-function.svg",
    alt: "Diagram contrasting a pure function with deterministic output and no side effects versus an impure function that mutates external state.",
    caption: "Visual: pure functions always return the same result and never touch external state.",
  },
  queue: {
    src: "/concepts/queue.svg",
    alt: "Diagram showing a queue with front dequeue and back enqueue operations.",
    caption: "Visual: queues process items in first-in, first-out order.",
  },
  "quick-sort": {
    src: "/concepts/quick-sort.svg",
    alt: "Diagram showing quick sort partitioning values around a pivot.",
    caption: "Visual: quick sort partitions around a pivot, then sorts each side recursively.",
  },
  "race-condition": {
    src: "/concepts/race-condition.svg",
    alt: "Diagram showing two threads interfering while updating shared state.",
    caption: "Visual: concurrent timing issues can corrupt shared state without coordination.",
  },
  recursion: {
    src: "/concepts/recursion.svg",
    alt: "Diagram showing a function calling itself on smaller inputs until a base case is reached.",
    caption: "Visual: recursion solves a problem by reducing it until a base case stops the calls.",
  },
  rest: {
    src: "/concepts/rest.svg",
    alt: "Diagram showing REST resources, HTTP verbs, and stateless API requests.",
    caption: "Visual: REST combines resource URLs, HTTP verbs, and stateless requests.",
  },
  singleton: {
    src: "/concepts/singleton.svg",
    alt: "Diagram showing multiple callers receiving the same shared singleton instance.",
    caption: "Visual: a singleton pattern ensures one shared instance is reused.",
  },
  "sql-join": {
    src: "/concepts/sql-join.svg",
    alt: "Diagram showing two related tables combined through a join condition.",
    caption: "Visual: SQL joins connect related rows across multiple tables.",
  },
  stack: {
    src: "/concepts/stack.svg",
    alt: "Diagram showing a stack with push and pop operations at the top.",
    caption: "Visual: stacks process items in last-in, first-out order.",
  },
  "stack-vs-heap-memory": {
    src: "/concepts/stack-vs-heap-memory.svg",
    alt: "Diagram comparing stack memory with LIFO function frames and heap memory with scattered dynamic allocations.",
    caption: "Visual: stack is fast and automatic; heap is flexible but needs management.",
  },
  "strategy-pattern": {
    src: "/concepts/strategy-pattern.svg",
    alt: "Diagram showing a context object delegating to interchangeable strategy implementations.",
    caption: "Visual: the strategy pattern lets you swap algorithms at runtime without changing the context.",
  },
  tcp: {
    src: "/concepts/tcp.svg",
    alt: "Diagram showing a TCP handshake and reliable client-server communication.",
    caption: "Visual: TCP establishes a reliable, ordered connection before sending data.",
  },
  thread: {
    src: "/concepts/thread.svg",
    alt: "Diagram showing multiple threads sharing a process's memory while keeping separate stacks.",
    caption: "Visual: threads run concurrently while sharing process memory.",
  },
  "thread-pool": {
    src: "/concepts/thread-pool.svg",
    alt: "Diagram showing tasks queuing into a shared task queue while a fixed pool of worker threads pulls and executes them.",
    caption: "Visual: a fixed worker pool pulls from a shared queue — amortizes thread cost, caps concurrency.",
  },
  tls: {
    src: "/concepts/tls.svg",
    alt: "Diagram showing a TLS handshake, certificate verification, and encrypted session.",
    caption: "Visual: TLS secures traffic through identity checks and encryption.",
  },
  transaction: {
    src: "/concepts/transaction.svg",
    alt: "Diagram showing the transaction flow from BEGIN through operations to COMMIT or ROLLBACK.",
    caption: "Visual: a transaction groups operations into an all-or-nothing unit of work.",
  },
  udp: {
    src: "/concepts/udp.svg",
    alt: "Diagram showing UDP datagrams sent without delivery guarantees.",
    caption: "Visual: UDP favors speed by sending datagrams without built-in reliability.",
  },
  websocket: {
    src: "/concepts/websocket.svg",
    alt: "Diagram showing a persistent two-way WebSocket connection between client and server.",
    caption: "Visual: WebSockets enable long-lived bidirectional real-time communication.",
  },
}

interface ConceptVisualProps {
  slug: string
  name: string
}

export function ConceptVisual({ slug, name }: ConceptVisualProps) {
  const visual = conceptVisuals[slug]

  if (!visual) return null

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Visual Representation</p>
          <p className="text-sm text-text">{name} at a glance</p>
        </div>
      </div>
      <img
        src={visual.src}
        alt={visual.alt}
        className="w-full rounded-lg border border-border bg-bg object-cover"
        loading="lazy"
      />
      <p className="mt-3 text-xs text-muted">{visual.caption}</p>
    </section>
  )
}
