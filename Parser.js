const { TokenType } = require("./lexer");

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

    // Parse general expression
    return { type: "ExpressionStatement", expression: this.parseExpression() };
  }

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

    // Parse variable
    if (token.type === TokenType.IDENTIFIER) {
      this.current++;
      return { type: "Variable", name: token.value };
    }

    throw new Error(`Unexpected token: ${token.value}`);
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

module.exports = { Parser };
