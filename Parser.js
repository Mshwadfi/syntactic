const { Lexer, TokenType, KEYWORDS } = require("./lexer.js");
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    let statements = [];
    while (this.peek().type !== TokenType.EOF) {
      let stmt = this.parseStatement();
      statements.push(stmt);

      while (this.match(TokenType.NEWLINE)) {}
    }
    return statements;
  }

  parseStatement() {
    if (this.match(TokenType.IDENTIFIER)) {
      let name = this.previous().value;
      this.consume(TokenType.ASSIGN, "Expected = after variable declaration");
      let value = this.parseExpression();
      return { type: "Assignment", name, value };
    }
    if (this.match(TokenType.KEYWORD) && this.previous().value === "print") {
      this.consume(TokenType.LPAREN, "expected ( after print statement");
      let value = this.parseExpression();
      this.consume(TokenType.RPAREN, "expected ) after printed value");
      return { type: "Print", value };
    }
    throw new Error("unexpected syntax: ", this.peek().value);
  }

  parseExpression() {
    // return this.parsePrimary();
    if (this.match(TokenType.NUMBER)) {
      return { type: "Number", value: this.previous().value };
    }
    if (this.match(TokenType.STRING)) {
      return { type: "String", value: this.previous().value };
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return { type: "Variable", name: this.previous().value };
    }
  }

  match(type) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }
  check(type) {
    return this.peek().type === type;
  }
  peek() {
    return this.tokens[this.current];
  }
  advance() {
    return this.tokens[this.current++];
  }
  previous() {
    return this.tokens[this.current - 1];
  }
  consume(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(message);
  }
}

module.exports = { Parser };
// const code = `name = "Ali" age = 24`;
// const lexer = new Lexer(code);

// const tokens = lexer.tokenize();
// console.log("----------------------------tokens---------------------------");
// console.log(tokens);

// const parser = new Parser(tokens);
// const ast = parser.parse();
// console.log("----------------------------AST-----------------------------");
// console.log(ast);
// console.log("-----------------------------------------------------------");
