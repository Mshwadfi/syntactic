const { type } = require("os");

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
  POWER: "POWER",
  EOF: "EOF",
};

const KEYWORDS = ["print", "if", "else", "true", "false", "while"];

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
  }

  tokinize() {
    let tokens = [];
    while (this.position < this.input.length) {
      let char = this.input[this.position];

      if (/\s/.test(char)) {
        this.position++;
        continue;
      } // escape spaces

      if (/\d/.test(char)) {
        tokens.push(this.tokenizeNumber());
      } else if (char === '"') {
        tokens.push(this.tokenizeString());
      } else if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.tokenizeIdentifier());
      } else if ("+-*/=(){}<>^,;".includes(char)) {
        tokens.push(this.tokenizeOperator());
      } else {
        this.position++;
      }
    }
    tokens.push({ type: TokenType.EOF });
    return tokens;
  }

  //tokenize numbers like 56 or 5.6
  tokenizeNumber() {
    let num = "";
    let hasDecimal = false;

    // Process digits before decimal point
    while (
      this.position < this.input.length &&
      /\d/.test(this.input[this.position])
    ) {
      num += this.input[this.position++];
    }

    // Check for decimal dot .
    if (
      this.position < this.input.length &&
      this.input[this.position] === "."
    ) {
      num += this.input[this.position++];

      // Process digits after decimal point
      while (
        this.position < this.input.length &&
        /\d/.test(this.input[this.position])
      ) {
        num += this.input[this.position++];
      }
    }

    return { type: TokenType.NUMBER, value: Number(num) };
  }

  tokenizeString() {
    this.position++;
    let str = "";
    while (
      this.position < this.input.length &&
      this.input[this.position] !== '"'
    ) {
      str += this.input[this.position++];
    }
    this.position++;
    return { type: TokenType.STRING, value: str };
  }

  tokenizeIdentifier() {
    let word = "";
    while (
      this.position < this.input.length &&
      /[a-zA-Z0-9_]/.test(this.input[this.position])
    ) {
      word += this.input[this.position++];
    }
    return {
      type: KEYWORDS.includes(word) ? TokenType.KEYWORD : TokenType.IDENTIFIER,
      value: word,
    };
  }
  tokenizeOperator() {
    let char = this.input[this.position];
    let nextChar = this.input[this.position + 1];

    if (["==", "!=", "<=", ">="].includes(char + nextChar)) {
      this.position += 2;
      return { type: TokenType.EQUALS, value: char + nextChar };
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
      case "^":
        return TokenType.POWER;
      case "(":
        return TokenType.LPAREN;
      case ")":
        return TokenType.RPAREN;
      case "{":
        return TokenType.LPRACE;
      case "}":
        return TokenType.RPRACE;
      case ",":
        return TokenType.COMMA;
      case ";":
        return TokenType.SEMICOLON;
      default:
        return TokenType.OPERATOR;
    }
  }
}

module.exports = { Lexer, TokenType, KEYWORDS };
