const fs = require("fs");
const { Lexer } = require("./lexer");
const { Parser } = require("./Parser");
const { Interpreter } = require("./Interpreter");

// Reading code from txt file
const filePath = "code.txt";
const code = fs.readFileSync(filePath, "utf8");

const lexer = new Lexer(code);
const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

const interpreter = new Interpreter();
interpreter.interpret(ast);
