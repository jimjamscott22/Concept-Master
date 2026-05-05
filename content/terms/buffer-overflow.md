---
name: Buffer Overflow
categories:
- memory-management
tags:
- cybersecurity
- c
- low-level
code_lang: bash
---

A buffer overflow occurs when a program writes more data to a fixed-size buffer than it can hold, overwriting adjacent memory. It is one of the oldest and most exploited classes of vulnerability.

**Stack overflow (classic):** overwriting the saved return address on the call stack lets an attacker redirect execution to arbitrary shellcode.

**Heap overflow:** corrupting heap metadata or adjacent objects to manipulate program behaviour.

**Consequences:** arbitrary code execution, privilege escalation, denial of service.

**Why it happens:** unsafe C functions (`strcpy`, `gets`, `sprintf`) that don't check bounds.

**Mitigations:**
- **Language level:** use memory-safe languages (Rust, Python, Java).
- **Compiler:** stack canaries (`-fstack-protector`), address sanitiser (`-fsanitize=address`).
- **OS:** Address Space Layout Randomisation (ASLR), Non-Executable stack (NX/DEP).
- **Code:** use bounds-checked functions (`strncpy`, `snprintf`), validate all input lengths.

```bash
# Compile with address sanitiser to catch overflows during development
gcc -fsanitize=address -g -o demo demo.c

# Example of UNSAFE code (never do this):
# char buf[8];
# gets(buf);   <- no bounds check, classic vulnerability
#
# SAFE equivalent:
# fgets(buf, sizeof(buf), stdin);
```
