---
name: Inode
categories:
- operating-systems
tags:
- fundamentals
- interview-prep
related:
- file-descriptor
- virtual-memory
code_lang: c
---

An inode is a filesystem data structure that stores metadata about a file, such as permissions, owner, size, timestamps, and pointers to disk blocks.

On Unix-like systems, filenames live in directories and point to inodes. This is why multiple hard links can refer to the same underlying file data.

**Key distinction:** a filename is a directory entry; an inode is the file's metadata and storage map.

```c
#include <sys/stat.h>
#include <stdio.h>

struct stat info;
stat("notes.txt", &info);
printf("inode: %lu\n", (unsigned long) info.st_ino);
```
