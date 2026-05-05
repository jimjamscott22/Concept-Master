---
name: Command Pattern
categories:
- design-patterns
tags:
- behavioral
- interview-prep
code_lang: python
---

The Command pattern encapsulates a request as an object, allowing you to parameterise clients with different requests, queue or log requests, and support undoable operations.

**Participants:**
- **Command:** interface with `execute()` (and optionally `undo()`).
- **ConcreteCommand:** binds a receiver action to the command.
- **Invoker:** holds and fires commands (e.g., a button, menu, scheduler).
- **Receiver:** the object that does the actual work.

**Use cases:** undo/redo stacks, macro recording, task queues, transactional systems.

```python
from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...
    def undo(self) -> None: ...

class TextEditor:
    def __init__(self): self.text = ""
    def write(self, s: str): self.text += s
    def delete(self, n: int): self.text = self.text[:-n]

class WriteCommand(Command):
    def __init__(self, editor: TextEditor, text: str):
        self._editor, self._text = editor, text
    def execute(self): self._editor.write(self._text)
    def undo(self): self._editor.delete(len(self._text))

editor = TextEditor()
history: list[Command] = []

cmd = WriteCommand(editor, "Hello")
cmd.execute(); history.append(cmd)       # text = "Hello"
cmd2 = WriteCommand(editor, ", world")
cmd2.execute(); history.append(cmd2)     # text = "Hello, world"

history.pop().undo()                     # text = "Hello"
```
