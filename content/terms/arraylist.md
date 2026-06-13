---
name: ArrayList
categories:
- data-structures
tags:
- exam-review
- fundamentals
- java
related:
- abstract-class
- abstract-data-type
code_lang: java
---

In Java, ArrayList is a class within the Java Collections Framework (java.util). Java is statically typed, so you must define the type of objects the ArrayList will hold using Generics (e.g., <String>). It can only hold objects, not primitives (though Java handles this via autoboxing, converting int to Integer).

```java
import java.util.ArrayList;
import java.util.List;

public class DynamicArrayExample {
    public static void main(String[] args) {
        // 1. Initialization: Creating an ArrayList of Strings
        List<String> servers = new ArrayList<>();

        // 2. Appending elements (Amortized O(1))
        servers.add("Database Server");
        servers.add("Web Server");
        servers.add("Cache Server");

        // 3. Inserting at a specific index (O(n) because elements must shift)
        servers.add(1, "Load Balancer");

        // 4. Accessing elements by index (O(1))
        System.out.println("Server at index 0: " + servers.get(0));

        // 5. Removing an element (O(n))
        servers.remove("Web Server");

        // 6. Iterating through the ArrayList
        System.out.println("\nActive Servers:");
        for (String server : servers) {
            System.out.println("- " + server);
        }
    }
}
```
