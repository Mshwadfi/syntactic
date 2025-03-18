const { Lexer, TokenType } = require("./lexer");

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

    //parse statement/ var declaration
    if (token.type === TokenType.IDENTIFIER) {
      this.current++;
      if (this.tokens[this.current]?.type === TokenType.ASSIGN) {
        this.current++;
        let value = this.parseExpression();
        return { type: "Assignment", name: token.value, value: value };
      }
    }

    // parse print function
    if (token.type === TokenType.KEYWORD && token.value === "print") {
      this.current++;
      if (this.tokens[this.current]?.type !== TokenType.LPAREN)
        throw new Error("Expected '(' after 'print'");
      this.current++;
      let value = this.parseExpression();
      if (this.tokens[this.current]?.type !== TokenType.RPAREN) {
        throw new Error("Expected ')' after printed value");
      }
      //parse if statement
      this.current++;
      return { type: "Print", value };
    }
    if (token.type === TokenType.KEYWORD && token.value === "if") {
      return this.parseIfStatement();
    }

    //else throw syntacs error
    throw new Error(`Unexpected syntax: ${token.value}`);
  }

  parseExpression() {
    let left = this.parsePrimary();

    while (
      this.tokens[this.current]?.type === TokenType.EQUALS ||
      this.tokens[this.current]?.type === TokenType.OPERATOR
    ) {
      let operator = this.tokens[this.current];
      this.current++;
      let right = this.parsePrimary();
      left = {
        type: "BinaryExpression",
        left,
        operator: operator.value,
        right,
      };
    }

    return left;
  }

  parsePrimary() {
    let token = this.tokens[this.current];

    if (token.type === TokenType.NUMBER) {
      this.current++;
      return { type: "Number", value: token.value };
    }
    if (token.type === TokenType.STRING) {
      this.current++;
      return { type: "String", value: token.value };
    }
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

// const code = `name = "muhammad Alshwadfy" age = 10 print(name) if(age == 10){print("yes")}else{print("no")}`;
// const lexer = new Lexer(code);
// const tokens = lexer.tokenize();
// console.log(tokens);
// const parser = new Parser(tokens);
// const AST = parser.parse();
// console.log(AST);

module.exports = { Parser };
