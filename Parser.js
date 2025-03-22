const { TokenType, Lexer } = require("./lexer");

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    let statements = [];
    while (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type !== TokenType.EOF
    ) {
      const stmnt = this.parseStatement();
      statements.push(stmnt);
    }
    return statements;
  }

  parseStatement() {
    let token = this.tokens[this.current];

    // Parse statement/ var declaration
    if (token.type === TokenType.IDENTIFIER) {
      this.current++;

      // Handle array element assignment: arr[index] = value
      if (this.tokens[this.current]?.type === TokenType.LBRACKET) {
        this.current--; // Go back to identifier
        return this.parseArrayElementAssignment();
      }

      // Handle array method call: arr.push(value)
      if (this.tokens[this.current]?.type === TokenType.DOT) {
        this.current--; // Go back to identifier
        return this.parseArrayMethodCall();
      }

      // Handle regular assignment: var = value
      if (this.tokens[this.current]?.type === TokenType.ASSIGN) {
        this.current++;
        let value = this.parseExpression();
        return { type: "Assignment", name: token.value, value: value };
      } else {
        // If not an assignment, it could be a variable in an expression
        this.current--;
        return {
          type: "ExpressionStatement",
          expression: this.parseExpression(),
        };
      }
    }

    // Parse print function
    if (token.type === TokenType.KEYWORD && token.value === "print") {
      this.current++;
      if (this.tokens[this.current]?.type !== TokenType.LPAREN)
        throw new Error("Expected '(' after 'print'");
      this.current++;
      let value = this.parseExpression();
      if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
        throw new Error("Expected ')' after printed value");
      }
      this.current++;
      return { type: "Print", value };
    }

    // Parse if statement
    if (token.type === TokenType.KEYWORD && token.value === "if") {
      return this.parseIfStatement();
    }

    // Parse while statement
    if (token.type === TokenType.KEYWORD && token.value === "while") {
      return this.parseWhileStatement();
    }

    // Parse general expression
    return { type: "ExpressionStatement", expression: this.parseExpression() };
  }

  parseArrayElementAssignment() {
    // Format: arr[index] = value
    const varName = this.tokens[this.current].value;
    this.current++; // Move past identifier

    if (this.tokens[this.current]?.type !== TokenType.LBRACKET) {
      throw new Error("Expected '[' in array element access");
    }
    this.current++; // Move past '['

    const index = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' after array index");
    }
    this.current++; // Move past ']'

    if (this.tokens[this.current]?.type !== TokenType.ASSIGN) {
      throw new Error("Expected '=' in array element assignment");
    }
    this.current++; // Move past '='

    const value = this.parseExpression();

    return {
      type: "ArrayElementAssignment",
      array: varName,
      index: index,
      value: value,
    };
  }

  parseArrayMethodCall() {
    // Format: arr.method(args)
    const array = this.tokens[this.current].value;
    this.current++; // Move past array identifier

    if (this.tokens[this.current]?.type !== TokenType.DOT) {
      throw new Error("Expected '.' in method call");
    }
    this.current++; // Move past '.'

    if (this.tokens[this.current]?.type !== TokenType.KEYWORD) {
      throw new Error("Expected method name after '.'");
    }

    const method = this.tokens[this.current].value;
    this.current++; // Move past method name

    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after method name");
    }
    this.current++; // Move past '('

    // Parse arguments
    const args = [];
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      // Parse additional arguments separated by commas
      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // Move past ','
        args.push(this.parseExpression());
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after method arguments");
    }
    this.current++; // Move past ')'

    return {
      type: "ArrayMethodCall",
      array: array,
      method: method,
      args: args,
    };
  }

  // parsing hierarchy
  // -> parseComparison -> parseAdditive (+ , -) -> parseMultiplicative (* , /) -> parseExponential (^) -> parsePrimary (())
  parseExpression() {
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAdditive();

    while (
      this.current < this.tokens.length &&
      (this.tokens[this.current]?.type === TokenType.EQUALS ||
        (this.tokens[this.current]?.type === TokenType.OPERATOR &&
          ["<", ">", "<=", ">="].includes(this.tokens[this.current].value)))
    ) {
      let operator = this.tokens[this.current].value;
      this.current++;
      let right = this.parseAdditive();
      left = {
        type: "ComparisonExpression",
        left,
        operator,
        right,
      };
    }

    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();

    while (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type === TokenType.OPERATOR &&
      (this.tokens[this.current].value === "+" ||
        this.tokens[this.current].value === "-")
    ) {
      let operator = this.tokens[this.current].value;
      this.current++;
      let right = this.parseMultiplicative();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right,
      };
    }

    return left;
  }

  parseMultiplicative() {
    let left = this.parseExponential();

    while (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type === TokenType.OPERATOR &&
      (this.tokens[this.current].value === "*" ||
        this.tokens[this.current].value === "/")
    ) {
      let operator = this.tokens[this.current].value;
      this.current++;
      let right = this.parseExponential();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right,
      };
    }

    return left;
  }

  parseExponential() {
    let left = this.parsePrimary();

    while (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type === TokenType.POWER
    ) {
      let operator = this.tokens[this.current].value;
      this.current++;
      let right = this.parsePrimary();
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right,
      };
    }

    return left;
  }

  parsePrimary() {
    let token = this.tokens[this.current];

    // Parse array literal [elem1, elem2, ...]
    if (token.type === TokenType.LBRACKET) {
      return this.parseArrayLiteral();
    }

    // Parse array element access arr[index]
    if (token.type === TokenType.IDENTIFIER) {
      const varName = token.value;
      this.current++;

      // Check if this is array element access
      if (
        this.current < this.tokens.length &&
        this.tokens[this.current]?.type === TokenType.LBRACKET
      ) {
        return this.parseArrayElementAccess(varName);
      }

      // Check if this is a method call
      if (
        this.current < this.tokens.length &&
        this.tokens[this.current]?.type === TokenType.DOT
      ) {
        return this.parseArrayMethodExpression(varName);
      }

      // Otherwise, it's a regular variable
      return { type: "Variable", name: varName };
    }

    // Parse parenthesized expression
    if (token.type === TokenType.LPAREN) {
      this.current++;
      let expr = this.parseExpression();
      if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
        throw new Error("Expected ')'");
      }
      this.current++;
      return expr;
    }

    // Parse number literal
    if (token.type === TokenType.NUMBER) {
      this.current++;
      return { type: "Number", value: token.value };
    }

    // Parse string literal
    if (token.type === TokenType.STRING) {
      this.current++;
      return { type: "String", value: token.value };
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  parseArrayLiteral() {
    this.current++; // Move past '['

    const elements = [];

    // Check for empty array
    if (this.tokens[this.current]?.type === TokenType.RBRACKET) {
      this.current++; // Move past ']'
      return { type: "ArrayLiteral", elements: elements };
    }

    // Parse first element
    elements.push(this.parseExpression());

    // Parse remaining elements
    while (this.tokens[this.current]?.type === TokenType.COMMA) {
      this.current++; // Move past ','
      elements.push(this.parseExpression());
    }

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' to close array literal");
    }
    this.current++; // Move past ']'

    return { type: "ArrayLiteral", elements: elements };
  }

  parseArrayElementAccess(arrayName) {
    // Format: arr[index]
    if (this.tokens[this.current]?.type !== TokenType.LBRACKET) {
      throw new Error("Expected '[' in array element access");
    }
    this.current++; // Move past '['

    const index = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' after array index");
    }
    this.current++; // Move past ']'

    return {
      type: "ArrayElementAccess",
      array: arrayName,
      index: index,
    };
  }

  parseArrayMethodExpression(arrayName) {
    // Format: arr.method() as an expression
    if (this.tokens[this.current]?.type !== TokenType.DOT) {
      throw new Error("Expected '.' in method call");
    }
    this.current++; // Move past '.'

    if (this.tokens[this.current]?.type !== TokenType.KEYWORD) {
      throw new Error("Expected method name after '.'");
    }

    const method = this.tokens[this.current].value;
    this.current++; // Move past method name

    // Special case for array.length property (not a method call)
    if (
      method === "length" &&
      this.tokens[this.current]?.type !== TokenType.LPAREN
    ) {
      return {
        type: "ArrayProperty",
        array: arrayName,
        property: "length",
      };
    }

    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after method name");
    }
    this.current++; // Move past '('

    // Parse arguments
    const args = [];
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      // Parse additional arguments separated by commas
      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // Move past ','
        args.push(this.parseExpression());
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after method arguments");
    }
    this.current++; // Move past ')'

    return {
      type: "ArrayMethodExpression",
      array: arrayName,
      method: method,
      args: args,
    };
  }

  parseIfStatement() {
    this.current++;
    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after 'if'");
    }
    this.current++;
    let condition = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after condition");
    }
    this.current++;

    let ifBlock = this.parseBlock(); // Parse statements inside `{}`

    let elseBlock = null;
    if (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type === TokenType.KEYWORD &&
      this.tokens[this.current].value === "else"
    ) {
      this.current++;
      elseBlock = this.parseBlock();
    }

    return {
      type: "IfStatement",
      condition,
      ifBlock,
      elseBlock,
    };
  }

  parseWhileStatement() {
    this.current++;
    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after 'while'");
    }
    this.current++;
    let condition = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after while condition");
    }
    this.current++;

    let body = this.parseBlock(); // Parse statements inside `{}`

    return {
      type: "WhileStatement",
      condition,
      body,
    };
  }

  parseBlock() {
    if (this.tokens[this.current]?.type !== TokenType.LPRACE) {
      throw new Error("Expected '{' to start a block");
    }
    this.current++;

    let statements = [];
    while (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type !== TokenType.RPRACE &&
      this.tokens[this.current]?.type !== TokenType.EOF
    ) {
      statements.push(this.parseStatement());
    }

    if (this.tokens[this.current]?.type !== TokenType.RPRACE) {
      throw new Error("Expected '}' to close block");
    }
    this.current++;

    return statements;
  }
}

const code = `x = 10
y = 10*(3^4)
print(x)
print(y)
if (y > x) {
  print("true")
}
while(x < 15){
  print("salam")
  x = x + 1
}
  arr = [12,13]
  arr.push(1)
  arr.pop(12)
  `;

// const lexer = new Lexer(code);
// const tokens = lexer.tokenize();
// const parser = new Parser(tokens);
// const AST = parser.parse();
// console.log(tokens);
// console.log(AST);

module.exports = { Parser };
