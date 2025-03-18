const TokenType = {
  NUMBER: "NUMBER",
  STRING: "STRING",
  IDENTIFIER: "IDENTIFIER",
  KEYWORD: "KEYWORD",
  OPERATOR: "OPERATOR",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LPRACE: "LPRACE",
  RPRACE: "RPRACE",
  ASSIGN: "ASSIGN",
  EQUALS: "EQUALS",
  EOF: "EOF",
};

const KEYWORDS = ["print", "function", "if", "else", "true", "false", "while"];

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
  }

  tokenize() {
    let tokens = [];
    while (this.position < this.input.length) {
      let char = this.input[this.position];

      if (/\s/.test(char)) {
        this.position++;
        continue;
      } // escabe spaces

      if (/\d/.test(char)) {
        tokens.push(this.tokenizeNumber());
      } else if (char === '"') {
        tokens.push(this.tokenizeString());
      } else if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.tokenizeIdentifier());
      } else if ("+-*/=(){}".includes(char)) {
        tokens.push(this.tokinizeOperator());
      } else {
        this.position++;
      }
    }
    tokens.push({ type: TokenType.EOF });
    return tokens;
  }

  tokenizeNumber() {
    let num = "";
    while (/\d/.test(this.input[this.position])) {
      num += this.input[this.position++];
    }
    return { type: TokenType.NUMBER, value: Number(num) };
  }

  tokenizeString() {
    this.position++;
    let str = "";
    while (this.input[this.position] !== '"') {
      str += this.input[this.position++];
    }
    this.position++;
    return { type: TokenType.STRING, value: str };
  }

  tokenizeIdentifier() {
    let word = "";
    while (/[a-zA-Z_]/.test(this.input[this.position])) {
      word += this.input[this.position++];
    }
    return {
      type: KEYWORDS.includes(word) ? TokenType.KEYWORD : TokenType.IDENTIFIER,
      value: word,
    };
  }

  tokinizeOperator() {
    let char = this.input[this.position];
    let nextChar = this.input[this.position + 1];

    if (["==", "!=", "<=", ">="].includes(char + nextChar)) {
      this.position += 2;
      return { type: TokenType.OPERATOR, value: char + nextChar };
    }
    this.position++;
    return { type: this.getOperatorType(char), value: char };
  }

  getOperatorType(char) {
    switch (char) {
      case "=":
        return TokenType.ASSIGN;
      case "+":
      case "-":
      case "*":
      case "/":
      case "<":
      case ">":
      case "!":
        return TokenType.OPERATOR;
      case "==":
        return TokenType.EQUALS;
      case "(":
        return TokenType.LPAREN;
      case ")":
        return TokenType.RPAREN;
      case "{":
        return TokenType.LPRACE;
      case "}":
        return TokenType.RPRACE;
    }
  }
}

module.exports = { Lexer, TokenType, KEYWORDS };
