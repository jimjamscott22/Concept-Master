---
title: Database Normalization in Depth
subtitle: From update anomalies to BCNF — why we split tables and when to stop
is_published: true
categories: [databases]
tags: [exam-review, fundamentals, interview-prep]
related_terms: [normalization, primary-key, foreign-key, acid, sql-join, transaction]
related_articles: []
---

The **Normalization** term gives you the one-paragraph version: organize tables to
reduce redundancy and prevent anomalies. This article is the long form — *why* those
anomalies happen, how each normal form removes a specific class of them, and where
the practical stopping point is.

## The problem: a single fat table

Imagine tracking course enrollments in one table:

| student_id | student_name | course_id | course_title    | instructor   | instructor_email   |
| ---------- | ------------ | --------- | --------------- | ------------ | ------------------ |
| 1          | Alice        | CS101     | Intro to CS     | Dr. Turing   | turing@uni.edu     |
| 1          | Alice        | CS204     | Databases       | Dr. Codd     | codd@uni.edu       |
| 2          | Bob          | CS101     | Intro to CS     | Dr. Turing   | turing@uni.edu     |

This *works*, but it's a minefield. The redundancy creates three classic **anomalies**:

- **Update anomaly:** Dr. Turing changes email. You must find and update *every* CS101
  row. Miss one and the data silently contradicts itself.
- **Insertion anomaly:** You can't add a brand-new course with no students yet — there's
  no row to put it on without inventing a fake student.
- **Deletion anomaly:** Bob drops his only course. Delete that row and you also lose the
  fact that CS101 is taught by Dr. Turing.

Normalization is the disciplined fix: split the table so each fact lives in exactly one
place.

## Functional dependencies: the underlying machinery

Every normal form is really a statement about **functional dependencies (FDs)**. We write
`A → B` ("A determines B") when each value of `A` is tied to exactly one value of `B`.

In the table above:

- `student_id → student_name`
- `course_id → course_title, instructor`
- `instructor → instructor_email`

Normalization is the process of reshaping tables so that the only FDs left are ones where
the left-hand side is a **key**. Everything else gets factored into its own table.

## 1NF — atomic values, no repeating groups

A table is in **First Normal Form** when every cell holds a single, indivisible value and
there are no repeating groups (no `phone1, phone2, phone3` columns, no comma-packed lists).

```sql
-- Violates 1NF: a list crammed into one column
-- | student_id | courses          |
-- | 1          | 'CS101, CS204'   |

-- 1NF: one row per student/course fact
CREATE TABLE enrollments (
    student_id INTEGER NOT NULL,
    course_id  TEXT    NOT NULL,
    PRIMARY KEY (student_id, course_id)
);
```

1NF is mostly about *shape* — it makes the data queryable with plain SQL instead of string
parsing.

## 2NF — no partial dependencies on a composite key

A table is in **Second Normal Form** when it's in 1NF *and* every non-key column depends on
the **whole** primary key, not just part of it. This only bites when you have a **composite**
key.

In an `enrollments(student_id, course_id, student_name, course_title)` table, the key is
`(student_id, course_id)`. But:

- `student_name` depends on `student_id` alone — a **partial dependency**.
- `course_title` depends on `course_id` alone — another partial dependency.

The fix is to pull those out:

```sql
CREATE TABLE students (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE courses (
    id    TEXT PRIMARY KEY,
    title TEXT NOT NULL
);

-- The join table now holds *only* the relationship
CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id),
    course_id  TEXT    REFERENCES courses(id),
    PRIMARY KEY (student_id, course_id)
);
```

Notice this leans on **primary key** and **foreign key** constraints to keep the split
tables consistent.

## 3NF — no transitive dependencies

A table is in **Third Normal Form** when it's in 2NF *and* no non-key column depends on
another non-key column. That indirect chain is a **transitive dependency**.

Back to courses: `course_id → instructor → instructor_email`. Here `instructor_email`
depends on `instructor`, which is itself a non-key column. Even though the table has a
simple key, that transitive chain still causes update anomalies for instructor emails.

```sql
CREATE TABLE instructors (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT NOT NULL
);

CREATE TABLE courses (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    instructor_id INTEGER REFERENCES instructors(id)
);
```

Now each instructor's email lives in exactly one row. A rule of thumb that captures 2NF and
3NF together: *every non-key column must depend on **the key, the whole key, and nothing but
the key**.*

## BCNF — when 3NF isn't quite enough

**Boyce-Codd Normal Form** is a stricter 3NF: for *every* functional dependency `X → Y`, `X`
must be a **superkey**. The edge case 3NF allows but BCNF forbids involves overlapping
**candidate keys**.

Classic example: a table `(student, course, instructor)` where each course is taught by one
instructor, but a student-course pair also uniquely identifies the instructor.

- `instructor → course` (each instructor teaches one course)
- `(student, course) → instructor`

`(student, course)` is a candidate key, so the table is in 3NF. But `instructor → course`
has a non-superkey on the left, violating BCNF. Splitting `instructor → course` into its own
table resolves it. In practice BCNF rarely requires changes beyond 3NF, which is why most
teams treat 3NF as the target and only reach for BCNF when a specific anomaly surfaces.

## 4NF and 5NF — the far end

- **4NF** removes **multi-valued dependencies** — independent one-to-many facts crammed into
  one table (e.g. a person's *skills* and their *languages*, which have nothing to do with
  each other, producing a spurious cross-product of rows).
- **5NF** deals with **join dependencies**, where a table can be losslessly reconstructed only
  by joining three or more tables. You will almost never design for 5NF deliberately.

## Where to actually stop

3NF (occasionally BCNF) is the practical target for transactional systems. It keeps writes
clean and anomaly-free, and it pairs naturally with **SQL joins** to reassemble the picture
at read time. Each write touching one fact stays a single-row update, which also keeps your
**transaction** boundaries small and your **ACID** guarantees cheap to maintain.

### The deliberate exception: denormalization

Normalization optimizes for *write* integrity at the cost of *read* joins. Analytics and
reporting workloads often flip that priority — a star schema in a data warehouse is
intentionally denormalized so a dashboard query doesn't fan out across a dozen joins. The key
word is *intentional*: you normalize to 3NF first, understand the anomalies you're
re-introducing, then denormalize specific paths for measured performance wins — never as a
shortcut to skip the modeling.

## Summary

| Form | Removes                                   | Trigger                          |
| ---- | ----------------------------------------- | -------------------------------- |
| 1NF  | Non-atomic values, repeating groups       | Lists/arrays inside a column     |
| 2NF  | Partial dependencies on a composite key   | Non-key depends on part of key   |
| 3NF  | Transitive dependencies                   | Non-key depends on another non-key |
| BCNF | Dependencies where the left isn't a superkey | Overlapping candidate keys    |
| 4NF  | Multi-valued dependencies                 | Independent multi-valued facts   |
| 5NF  | Join dependencies                         | Lossless only via 3+ way join    |

Get to 3NF by default, reach for BCNF when an anomaly demands it, and denormalize only on
purpose with numbers to back it up.
