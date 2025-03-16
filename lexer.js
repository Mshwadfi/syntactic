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

      if (/\d/.test(char)) {
        tokens.push(this.tokenizeNumber());
      } else if (char === '"') {
        tokens.push(this.tokenizeString());
      } else if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.tokenizeIdentifier());
      } else if ("+-*/=(){}".includes(char)) {
        tokens.push({ type: this.getOperatorType(char), value: char });
        this.position++;
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

  getOperatorType(char) {
    switch (char) {
      case "=":
        return TokenType.ASSIGN;
      case "+":
      case "-":
      case "*":
      case "/":
        return TokenType.OPERATOR;
      case "(":
        return TokenType.LPAREN;
      case ")":
        return TokenType.RPAREN;
      case "{":
        return TokenType.LBRACE;
      case "}":
        return TokenType.RBRACE;
    }
  }
}

const code = `name = "Ali" age = 24`;
const lexer = new Lexer(code);

console.log(lexer.tokenize());
