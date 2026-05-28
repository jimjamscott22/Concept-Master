---
name: Encapsulation
categories:
- object-oriented
tags:
- java
- python
related:
- enum
code_lang: python
---

The bundling of data (attributes) and methods that operate on that data within a single unit (class), restricting direct access to some components.

In Python, use `_protected` and `__private` naming conventions.

**Java example:**
```java
class BankAccount {
    private double balance;

    BankAccount(double balance) { this.balance = balance; }

    void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    double getBalance() { return balance; }
}
```

```python
class BankAccount:
    def __init__(self, balance):
        self.__balance = balance  # private

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount

    def get_balance(self):
        return self.__balance
```
