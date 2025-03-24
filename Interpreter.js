class Interpreter {
  constructor() {
    this.environment = {}; // to store vars and arrays declarations
    this.functions = {}; // to store function declarations
  }

  //our entry method
  interpret(statements) {
    let result;
    for (const statement of statements) {
      result = this.evaluateStatement(statement);
    }
    return result;
  }

  //evaluate different types of statements based on conditions

  evaluateStatement(statement) {
    switch (statement.type) {
      case "Assignment":
        return this.evaluateAssignment(statement);
      case "Print":
        return this.evaluatePrint(statement);
      case "ExpressionStatement":
        return this.evaluateExpression(statement.expression);
      case "IfStatement":
        return this.evaluateIfStatement(statement);
      case "WhileStatement":
        return this.evaluateWhileStatement(statement);
      case "ArrayElementAssignment":
        return this.evaluateArrayElementAssignment(statement);
      case "ArrayMethodCall":
        return this.evaluateArrayMethodCall(statement);
      case "FunctionDeclaration":
        return this.evaluateFunctionDeclaration(statement);
      case "ReturnStatement":
        return this.evaluateReturnStatement(statement);
      default:
        throw new Error(`Unknown statement type: ${statement.type}`);
    }
  }

  // assign value to var in environment => this.environment[statement.name] = value
  //   statement format: x=10

  //   {
  //     type: 'Assignment',
  //     name: 'x',
  //     value: { type: 'Number', value: 10 }
  //   }

  evaluateAssignment(statement) {
    const value = this.evaluateExpression(statement.value);
    this.environment[statement.name] = value;
    return value;
  }

  // print statement
  //   statement format: print(x)
  //   { type: 'Print', value: { type: 'Variable', name: 'x' } }
  evaluatePrint(statement) {
    const value = this.evaluateExpression(statement.value);
    console.log(value);
    return value;
  }

  // evaluate if statement handle both if and else
  // statement format:
  //   {
  //     type: 'IfStatement',
  //     condition: {
  //       type: 'ComparisonExpression',
  //       left: [Object],
  //       operator: '>',
  //       right: [Object]
  //     }
  evaluateIfStatement(statement) {
    const condition = this.evaluateExpression(statement.condition);

    if (condition) {
      // Execute if block
      let result;
      for (const stmt of statement.ifBlock) {
        result = this.evaluateStatement(stmt);
        if (result instanceof ReturnValue) {
          return result;
        }
      }
      return result;
    } else if (statement.elseBlock) {
      // Execute else block if it exists
      let result;
      for (const stmt of statement.elseBlock) {
        result = this.evaluateStatement(stmt);
        if (result instanceof ReturnValue) {
          return result;
        }
      }
      return result;
    }

    return null;
  }

  // evaluate while statement
  //statement format:
  // {
  //     type: 'WhileStatement',
  //     condition: {
  //       type: 'ComparisonExpression',
  //       left: [Object],
  //       operator: '>',
  //       right: [Object]
  //     },
  //     body: [ [Object], [Object] ]
  //   }
  evaluateWhileStatement(statement) {
    let result = null;

    while (this.evaluateExpression(statement.condition)) {
      for (const stmt of statement.body) {
        result = this.evaluateStatement(stmt);
        if (result instanceof ReturnValue) {
          return result;
        }
      }
    }

    return result;
  }

  //evaluate array assignment -> assign value for index
  //statement format: arr[1] = 10
  // {
  //     type: 'ArrayElementAssignment',
  //     array: 'arr',
  //     index: { type: 'Number', value: 1 },
  //     value: { type: 'Number', value: 10 }
  //   }
  evaluateArrayElementAssignment(statement) {
    const array = this.environment[statement.array];

    if (!Array.isArray(array)) {
      throw new Error(`${statement.array} is not an array`);
    }

    const index = this.evaluateExpression(statement.index);
    const value = this.evaluateExpression(statement.value);

    if (index < 0 || index >= array.length) {
      throw new Error(`Array index out of bounds: ${index}`);
    }

    array[index] = value;
    return value;
  }

  // evaluate array method call -> push, pop, join
  //   statement format: arr.pop()
  //   { type: 'ArrayMethodCall', array: 'arr', method: 'pop', args: [] }
  evaluateArrayMethodCall(statement) {
    const array = this.environment[statement.array];

    if (!Array.isArray(array)) {
      throw new Error(`${statement.array} is not an array`);
    }

    const args = statement.args.map((arg) => this.evaluateExpression(arg));

    switch (statement.method) {
      case "push":
        return array.push(...args);
      case "pop":
        return array.pop();
      case "join":
        return array.join(args[0] || ",");
      default:
        throw new Error(`Unknown array method: ${statement.method}`);
    }
  }

  // evaluate function declaration
  //   statement format function add(x,y){return x+y} or sub(x,y){return x-y}
  // {
  //     type: 'FunctionDeclaration',
  //     name: 'add',
  //     params: [ 'x', 'y' ],
  //     body: [ [Object] ]
  //   },
  //   {
  //     type: 'FunctionDeclaration',
  //     name: 'sub',
  //     params: [ 'x', 'y' ],
  //     body: [ [Object] ]
  //   }
  evaluateFunctionDeclaration(statement) {
    // Store the function in our functions object
    this.functions[statement.name] = {
      parameters: statement.params, // Changed from parameters to params to match Parser output
      body: statement.body,
    };
    return null;
  }

  //evaluate return statement
  evaluateReturnStatement(statement) {
    // Changed from statement.expression to statement.value to match Parser output
    const value = this.evaluateExpression(statement.value);
    return new ReturnValue(value);
  }

  //----------------------- evaluate the expressions and return its value -----------------------------//
  //supported statements [variable assignment, control statement(if, while), arrays, function declaration, return]
  evaluateExpression(expression) {
    switch (expression.type) {
      case "Number":
        return expression.value;
      case "String":
        return expression.value;
      case "Variable":
        if (expression.name in this.environment) {
          return this.environment[expression.name];
        }
        throw new Error(`Undefined variable: ${expression.name}`);
      case "BinaryExpression":
        return this.evaluateBinaryExpression(expression);
      case "ComparisonExpression":
        return this.evaluateComparisonExpression(expression);
      case "ArrayLiteral":
        return expression.elements.map((elem) => this.evaluateExpression(elem));
      case "ArrayElementAccess":
        return this.evaluateArrayElementAccess(expression);
      case "ArrayMethodExpression":
        return this.evaluateArrayMethodExpression(expression);
      case "ArrayProperty":
        return this.evaluateArrayProperty(expression);
      case "FunctionCall":
        return this.evaluateFunctionCall(expression);
      default:
        throw new Error(`Unknown expression type: ${expression.type}`);
    }
  }

  evaluateBinaryExpression(expression) {
    const left = this.evaluateExpression(expression.left);
    const right = this.evaluateExpression(expression.right);

    switch (expression.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) {
          throw new Error("Division by zero");
        }
        return left / right;
      case "^":
        return Math.pow(left, right);
      default:
        throw new Error(`Unknown binary operator: ${expression.operator}`);
    }
  }

  evaluateComparisonExpression(expression) {
    const left = this.evaluateExpression(expression.left);
    const right = this.evaluateExpression(expression.right);

    switch (expression.operator) {
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
        throw new Error(`Unknown comparison operator: ${expression.operator}`);
    }
  }

  evaluateArrayElementAccess(expression) {
    const array = this.environment[expression.array];

    if (!Array.isArray(array)) {
      throw new Error(`${expression.array} is not an array`);
    }

    const index = this.evaluateExpression(expression.index);

    if (index < 0 || index >= array.length) {
      throw new Error(`Array index out of bounds: ${index}`);
    }

    return array[index];
  }

  evaluateArrayMethodExpression(expression) {
    const array = this.environment[expression.array];

    if (!Array.isArray(array)) {
      throw new Error(`${expression.array} is not an array`);
    }

    const args = expression.args.map((arg) => this.evaluateExpression(arg));

    switch (expression.method) {
      case "push":
        return array.push(...args);
      case "pop":
        return array.pop();
      case "join":
        return array.join(args[0] || ",");
      default:
        throw new Error(`Unknown array method: ${expression.method}`);
    }
  }

  evaluateArrayProperty(expression) {
    const array = this.environment[expression.array];

    if (!Array.isArray(array)) {
      throw new Error(`${expression.array} is not an array`);
    }

    switch (expression.property) {
      case "length":
        return array.length;
      default:
        throw new Error(`Unknown array property: ${expression.property}`);
    }
  }

  // evaluate function calls and its argument

  evaluateFunctionCall(expression) {
    const func = this.functions[expression.name];

    if (!func) {
      throw new Error(`Undefined function: ${expression.name}`);
    }

    const args = expression.args.map((arg) => this.evaluateExpression(arg));

    // Create a new scope for this function call
    const previousEnvironment = { ...this.environment };

    func.parameters.forEach((param, index) => {
      this.environment[param] = args[index];
    });

    let result = null;
    for (const stmt of func.body) {
      result = this.evaluateStatement(stmt);

      if (result instanceof ReturnValue) {
        this.environment = previousEnvironment;
        return result.value;
      }
    }

    this.environment = previousEnvironment;

    return result;
  }
}

// Helper class to handle return values
class ReturnValue {
  constructor(value) {
    this.value = value;
  }
}

module.exports = { Interpreter };
