# Syntactic Programming Language

## Introduction

Syntactic is a simple programming language designed for educational purposes. This README explains how the compiler works and provides an overview of the language syntax.

## Compilation Process

When writing code, the text goes through several stages before becoming executable machine code. The image below illustrates the transformation from source code to executable code:

![Compilation Process Overview](https://examradar.com/wp-content/uploads/2016/10/EXECUTION-OF-A-C-PROGRAM.png.webp)

This project focuses specifically on the compilation phase, which itself consists of several stages.

## Compiler Phases

![Compiler Phases](https://cdn1.byjus.com/wp-content/uploads/2022/03/phase-of-compiler.png)

### 1. Lexical Analysis (Lexer)

The lexer converts source code into tokens. It scans the input text and produces a sequence of tokens that represent the syntactic elements of the program.

**Example:**

Input (source code):

```
x = 10
```

Output (array of tokens):

```json
[
  { "type": "IDENTIFIER", "value": "x" },
  { "type": "ASSIGN", "value": "=" },
  { "type": "NUMBER", "value": 10 },
  { "type": "EOF" }
]
```

### 2. Syntax Analysis (Parser)

The parser takes the tokens as input and verifies that they conform to the language's grammar rules. It then generates an Abstract Syntax Tree (AST) that represents the syntactic structure of the program.

**Example:**

Input (tokens):

```json
[
  { "type": "IDENTIFIER", "value": "x" },
  { "type": "ASSIGN", "value": "=" },
  { "type": "NUMBER", "value": 10 },
  { "type": "EOF" }
]
```

Output (AST):

```json
{
  "type": "Assignment",
  "name": "x",
  "value": { "type": "Number", "value": 10 }
}
```

Visual representation of the AST:

```
    =
   / \
  x  10
```

### 3. Semantic Analysis

The semantic analyzer checks that the code follows logical rules beyond syntax. It ensures that operations make sense semantically, such as verifying that variables are used within their scope and that function calls match their declarations.

**Example:**

```
a = 10 + "h"
```

This code has valid syntax and would pass the parser, but the semantic analyzer would flag it as invalid because adding a number to a string is not semantically valid in our language.

### 4. Intermediate Code Generation (IR)

At this stage, the AST is converted into an intermediate representation that is closer to machine code. This helps facilitate code optimization and the generation of the final machine code. A common technique is Three-Address Code (TAC), where each instruction contains at most three operands.

**Example:**

Source code:

```
a = b + c * d;
```

TAC:

```
T1 = c * d
T2 = b + T1
a = T2
```

### 5. Code Optimization

The optimization phase improves the intermediate code to make the final machine code more efficient. Optimizations can be categorized as:

#### High-Level Optimizations

Applied to the IR, such as loop optimizations and constant folding.

#### Low-Level Optimizations

Hardware-related optimizations, such as register allocation and instruction scheduling.

**Optimization Goals:**

- Reduce execution time
- Reduce memory usage
- Improve CPU efficiency

**Examples of Optimizations:**

1. **Bitwise Operations Instead of Multiplication:**

   ```
   a = x * 2    converted to    a = x << 1
   ```

   (Bitwise operations are faster than multiplication)

2. **Constant Folding:**

   ```
   x = 2 * 5;    converted to    x = 10;
   ```

   (The compiler calculates constant expressions at compile time)

3. **Common Subexpression Elimination:**

   ```
   y = (a * b) + c;
   z = (a * b) - d;
   ```

   Converted to:

   ```
   temp = a * b;
   y = temp + c;
   z = temp - d;
   ```

   (Reduces multiplication operations from 2 to 1)

4. **Dead Code Elimination:**

   ```
   int x = 10;
   int y = x * 2;
   return 5;
   ```

   Converted to:

   ```
   return 5;
   ```

   (Since x and y are never used, they are eliminated)

## Syntactic Language Syntax

### Variable Declaration & Initialization

```
name;                  // Declaration
name = "Muhammad";     // Assignment
```

### Print Statement

```
print("Hello, World!");
print(name);
```

### If Statement

```
if (condition) {
    // code block
}

if (condition) {
    // code block
} else {
    // code block
}
```

### While Loop

```
while (condition) {
    // code block
}
```

### Functions

Functions can be declared with or without the `function` keyword:

```
function add(x, y) {
    return x + y;
}

// Alternative syntax
add(x, y) {
    return x + y;
}
```

### Arrays

```
arr = [1, 2, 3, 4];
arr.pop();       // Remove the last element
arr.push(77);    // Add an element to the end
length = arr.length;  // Get array length
```

### Arithmetic Operations and Precedence

Operations are performed in the following order of precedence (highest to lowest):

1. Parentheses `()`
2. Exponentiation `^`
3. Multiplication, Division `*`, `/`
4. Addition, Subtraction `+`, `-`
5. Comparison operators

**Examples:**

```
x = 10;
y = 10 + 9;
z = 29 / 90;
exp = 10 * (123 / 5) + 13 - (56 / 7);
```
