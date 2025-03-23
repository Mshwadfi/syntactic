const { TokenType, Lexer } = require("./lexer");

// here we will take tokens as input and provide the AST
// tokens(input):
// [
//   { type: 'IDENTIFIER', value: 'x' },
//   { type: 'ASSIGN', value: '=' },
//   { type: 'NUMBER', value: 10 },
//   { type: 'KEYWORD', value: 'if' },
//   { type: 'LPAREN', value: '(' },
//   { type: 'IDENTIFIER', value: 'x' },
//   { type: 'OPERATOR', value: '>' },
//   { type: 'NUMBER', value: 0 },
//   { type: 'RPAREN', value: ')' },
//   { type: 'LPRACE', value: '{' },
//   { type: 'KEYWORD', value: 'print' },
//   { type: 'LPAREN', value: '(' },
//   { type: 'STRING', value: 'true' },
//   { type: 'RPAREN', value: ')' },
//   { type: 'RPRACE', value: '}' },
//   { type: 'EOF' }
// ]

// ---------------------------------------------------
// AST (output):
// [
//   {
//     type: 'Assignment',
//     name: 'x',
//     value: { type: 'Number', value: 10 }
//   },
//   {
//     type: 'IfStatement',
//     condition: {
//       type: 'ComparisonExpression',
//       left: [Object],
//       operator: '>',
//       right: [Object]
//     },
//     ifBlock: [ [Object] ],
//     elseBlock: null
//   }
// ]

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

    // Parse return statement
    if (token.type === TokenType.RETURN) {
      return this.parseReturnStatement();
    }

    // Parse function declaration for syntax function add (x,y){...}
    if (token.type === TokenType.KEYWORD && token.value === "function") {
      return this.parseFunctionDeclaration();
    }

    // Parse statement/ var declaration
    if (token.type === TokenType.IDENTIFIER) {
      this.current++;

      // Check for function declaration: add(x,y){...} syntax without function keyword
      if (this.tokens[this.current]?.type === TokenType.LPAREN) {
        this.current--;
        return this.parseFunctionDeclaration();
      }

      // Handle array element assignment: arr[index] = value
      if (this.tokens[this.current]?.type === TokenType.LBRACKET) {
        this.current--;
        return this.parseArrayElementAssignment();
      }

      // Handle array method call: arr.push(value)
      if (this.tokens[this.current]?.type === TokenType.DOT) {
        this.current--;
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

  parseReturnStatement() {
    this.current++; // skip'return'

    // Check if there's an expression after 'return'
    let value = null;
    if (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type !== TokenType.RPRACE &&
      this.tokens[this.current]?.type !== TokenType.SEMICOLON
    ) {
      value = this.parseExpression();
    }

    // Skip semicolon
    if (
      this.current < this.tokens.length &&
      this.tokens[this.current]?.type === TokenType.SEMICOLON
    ) {
      this.current++;
    }

    return { type: "ReturnStatement", value };
  }

  parseFunctionDeclaration() {
    // syntax: add(x,y){...} or function add(x,y){...}

    // Handle optional 'function' keyword
    if (
      this.tokens[this.current]?.type === TokenType.KEYWORD &&
      this.tokens[this.current].value === "function"
    ) {
      this.current++; // Skip 'function' keyword
    }

    // Get function name
    if (this.tokens[this.current]?.type !== TokenType.IDENTIFIER) {
      throw new Error("Expected function name");
    }

    const name = this.tokens[this.current].value;
    this.current++; // skip function name

    // Parse parameters
    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after function name");
    }
    this.current++; // skip '('

    const params = [];

    // Check for parameters
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      // Parse first parameter without leading comma ","
      if (this.tokens[this.current]?.type !== TokenType.IDENTIFIER) {
        throw new Error("Expected parameter name");
      }

      params.push(this.tokens[this.current].value);
      this.current++; // skip parameter name

      // Parse additional parameters
      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // skip ','

        if (this.tokens[this.current]?.type !== TokenType.IDENTIFIER) {
          throw new Error("Expected parameter name after ','");
        }

        params.push(this.tokens[this.current].value);
        this.current++; // skip parameter name
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after parameters");
    }
    this.current++; // skip ')'

    // Parse function body
    if (this.tokens[this.current]?.type !== TokenType.LPRACE) {
      throw new Error("Expected '{' to start function body");
    }

    const body = this.parseBlock();

    return {
      type: "FunctionDeclaration",
      name: name,
      params: params,
      body: body,
    };
  }

  parseArrayElementAssignment() {
    // syntax: arr[index] = value
    const varName = this.tokens[this.current].value;
    this.current++; // skip identifier

    if (this.tokens[this.current]?.type !== TokenType.LBRACKET) {
      throw new Error("Expected '[' in array element access");
    }
    this.current++; // skip '['

    const index = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' after array index");
    }
    this.current++; // skip ']'

    if (this.tokens[this.current]?.type !== TokenType.ASSIGN) {
      throw new Error("Expected '=' in array element assignment");
    }
    this.current++; // skip '='

    const value = this.parseExpression();

    return {
      type: "ArrayElementAssignment",
      array: varName,
      index: index,
      value: value,
    };
  }

  parseArrayMethodCall() {
    // syntax: arr.method(args)
    const array = this.tokens[this.current].value;
    this.current++; // skip array identifier

    if (this.tokens[this.current]?.type !== TokenType.DOT) {
      throw new Error("Expected '.' in method call");
    }
    this.current++; // skip '.'

    if (this.tokens[this.current]?.type !== TokenType.KEYWORD) {
      throw new Error("Expected method name after '.'");
    }

    const method = this.tokens[this.current].value;
    this.current++; // skip method name

    if (this.tokens[this.current]?.type !== TokenType.LPAREN) {
      throw new Error("Expected '(' after method name");
    }
    this.current++; // skip '('

    // Parse arguments
    const args = [];
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      // Parse additional arguments separated by commas
      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // skip ','
        args.push(this.parseExpression());
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after method arguments");
    }
    this.current++; // skip ')'

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

      // Check if this is a function call
      if (
        this.current < this.tokens.length &&
        this.tokens[this.current]?.type === TokenType.LPAREN
      ) {
        return this.parseFunctionCall(varName);
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

  parseFunctionCall(functionName) {
    this.current++; // skip '('

    const args = [];
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // skip ','
        args.push(this.parseExpression());
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after function arguments");
    }
    this.current++; // skip ')'

    return {
      type: "FunctionCall",
      name: functionName,
      args: args,
    };
  }

  parseArrayLiteral() {
    this.current++; // skip '['

    const elements = [];

    // Check for empty array
    if (this.tokens[this.current]?.type === TokenType.RBRACKET) {
      this.current++; // skip ']'
      return { type: "ArrayLiteral", elements: elements };
    }

    // Parse first element
    elements.push(this.parseExpression());

    // Parse remaining elements
    while (this.tokens[this.current]?.type === TokenType.COMMA) {
      this.current++; // skip ','
      elements.push(this.parseExpression());
    }

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' to close array literal");
    }
    this.current++; // skip ']'

    return { type: "ArrayLiteral", elements: elements };
  }

  parseArrayElementAccess(arrayName) {
    // syntax: arr[index]
    if (this.tokens[this.current]?.type !== TokenType.LBRACKET) {
      throw new Error("Expected '[' in array element access");
    }
    this.current++; // skip '['

    const index = this.parseExpression();

    if (this.tokens[this.current]?.type !== TokenType.RBRACKET) {
      throw new Error("Expected ']' after array index");
    }
    this.current++; // skip ']'

    return {
      type: "ArrayElementAccess",
      array: arrayName,
      index: index,
    };
  }

  parseArrayMethodExpression(arrayName) {
    // syntax: arr.method() as an expression
    if (this.tokens[this.current]?.type !== TokenType.DOT) {
      throw new Error("Expected '.' in method call");
    }
    this.current++; // skip '.'

    if (this.tokens[this.current]?.type !== TokenType.KEYWORD) {
      throw new Error("Expected method name after '.'");
    }

    const method = this.tokens[this.current].value;
    this.current++; // skip method name

    // Special case for array.length property (not a method call) , like js syntax
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
    this.current++; // skip '('

    // Parse arguments
    const args = [];
    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      args.push(this.parseExpression());

      // Parse additional arguments separated by commas
      while (this.tokens[this.current]?.type === TokenType.COMMA) {
        this.current++; // skip ','
        args.push(this.parseExpression());
      }
    }

    if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
      throw new Error("Expected ')' after method arguments");
    }
    this.current++; // skip ')'

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
if(x > 0){
  print("true")
}`;
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
console.log(parser.parse());
module.exports = { Parser };
