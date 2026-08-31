import {
  ASTNode, Program, ExpressionStatement, PrintStatement, InputStatement,
  VariableDeclaration, VariableAssignment, IfStatement, WhileStatement,
  ForStatement, FunctionDeclaration, ReturnStatement, BlockStatement,
  BinaryExpression, UnaryExpression, CallExpression, MemberExpression,
  IndexExpression, Identifier, NumberLiteral, StringLiteral, BooleanLiteral,
  NullLiteral, ArrayLiteral, ObjectLiteral, ClassDeclaration,
  RuntimeValue, RuntimeFunction, RuntimeClass, RuntimeInstance, NativeFunction,
  Environment, ExecutionResult, HingScriptError,
} from './types';

// Control flow sentinels — not RuntimeValues, just marker objects
interface FlowBreak    { _flow: 'break' }
interface FlowContinue { _flow: 'continue' }
interface FlowReturn   { _flow: 'return'; value: RuntimeValue }

type FlowSignal = FlowBreak | FlowContinue | FlowReturn;

function isFlow(x: unknown): x is FlowSignal {
  return x != null && typeof x === 'object' && '_flow' in (x as Record<string, unknown>);
}
function isReturn(x: FlowSignal): x is FlowReturn { return x._flow === 'return'; }

class InterpreterError extends Error {
  constructor(public errorType: string, message: string, public line: number, public column: number) {
    super(message);
    this.name = 'InterpreterError';
  }
}

export class Interpreter {
  private output: string[] = [];
  private globalEnv: Environment;
  private executionTime = 0;

  constructor(_inputResolver?: (prompt: string) => Promise<string>) {
    this.globalEnv = this.createGlobalEnvironment();
  }

  async execute(source: string): Promise<ExecutionResult> {
    this.output = [];
    this.executionTime = 0;
    const startTime = performance.now();

    try {
      const { Lexer } = await import('./lexer');
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      const { Parser } = await import('./parser');
      const parser = new Parser(tokens);
      const program = parser.parse();

      this.execBlock(program.body, this.globalEnv);

      this.executionTime = performance.now() - startTime;
      return { output: this.output, executionTime: this.executionTime };
    } catch (e: unknown) {
      this.executionTime = performance.now() - startTime;
      const err = e as { message?: string; errorType?: string; line?: number; column?: number };
      return {
        output: this.output,
        error: {
          message: err.message || 'Unknown error',
          line: err.line ?? 0,
          column: err.column ?? 0,
          type: (err.errorType as HingScriptError['type']) || 'RuntimeError',
        },
        executionTime: this.executionTime,
      };
    }
  }

  // ── Environment ────────────────────────────────────────────

  private createGlobalEnvironment(): Environment {
    const env: Environment = { variables: new Map() };

    const builtins: Array<[string, NativeFunction]> = [
      ['sankhya',   { type: 'native', name: 'sankhya',   fn: (a) => Number(a[0]) }],
      ['vakya',     { type: 'native', name: 'vakya',     fn: (a) => String(a[0]) }],
      ['lambai',    { type: 'native', name: 'lambai',    fn: (a) => {
        const v = a[0];
        if (typeof v === 'string' || Array.isArray(v)) return v.length;
        if (v && typeof v === 'object' && 'properties' in v) return (v as RuntimeInstance).properties.size;
        if (v && typeof v === 'object') return Object.keys(v as Record<string, unknown>).length;
        return 0;
      }}],
      ['purana',    { type: 'native', name: 'purana',    fn: (a) => typeof a[0] === 'string' ? parseInt(a[0], 10) || 0 : Math.floor(Number(a[0])) }],
      ['dasamlav',  { type: 'native', name: 'dasamlav',  fn: (a) => parseFloat(String(a[0])) || 0 }],
      ['sqrt',      { type: 'native', name: 'sqrt',      fn: (a) => Math.sqrt(Number(a[0])) }],
      ['abs',       { type: 'native', name: 'abs',       fn: (a) => Math.abs(Number(a[0])) }],
      ['min',       { type: 'native', name: 'min',       fn: (a) => Math.min(Number(a[0]), Number(a[1])) }],
      ['max',       { type: 'native', name: 'max',       fn: (a) => Math.max(Number(a[0]), Number(a[1])) }],
      ['random',    { type: 'native', name: 'random',    fn: () => Math.random() }],
      ['range',     { type: 'native', name: 'range',     fn: (a) => {
        if (a.length === 1) return Array.from({ length: Number(a[0]) }, (_, i) => i);
        if (a.length === 2) return Array.from({ length: Number(a[1]) - Number(a[0]) }, (_, i) => Number(a[0]) + i);
        const step = Number(a[2]) || 1;
        const r: number[] = [];
        for (let i = Number(a[0]); i < Number(a[1]); i += step) r.push(i);
        return r;
      }}],
      ['soochi',    { type: 'native', name: 'soochi',    fn: (a) => Array.isArray(a[0]) ? a[0] : [a[0]] }],
      ['jod',       { type: 'native', name: 'jod',       fn: (a) => {
        if (Array.isArray(a[0]) && Array.isArray(a[1])) return [...a[0], ...a[1]];
        return String(a[0]) + String(a[1]);
      }}],
      ['sort',      { type: 'native', name: 'sort',      fn: (a) => Array.isArray(a[0]) ? [...a[0]].sort((x: RuntimeValue, y: RuntimeValue) => Number(x) - Number(y)) : a[0] }],
      ['ulta',      { type: 'native', name: 'ulta',      fn: (a) => Array.isArray(a[0]) ? [...a[0]].reverse() : a[0] }],
      ['ni8',       { type: 'native', name: 'ni8',       fn: (a) => String(a[0]).trim() }],
      ['upar',      { type: 'native', name: 'upar',      fn: (a) => String(a[0]).toUpperCase() }],
      ['nichla',    { type: 'native', name: 'nichla',    fn: (a) => String(a[0]).toLowerCase() }],
      ['shamil',    { type: 'native', name: 'shamil',    fn: (a) => {
        if (Array.isArray(a[0])) return a[0].includes(a[1]);
        if (typeof a[0] === 'string') return a[0].includes(String(a[1]));
        return false;
      }}],
      ['hissa',     { type: 'native', name: 'hissa',     fn: (a) => String(a[0]).split(String(a[1] || ' ')) }],
      ['juda',      { type: 'native', name: 'juda',      fn: (a) => Array.isArray(a[0]) ? a[0].join(String(a[1] || ' ')) : String(a[0]) }],
      ['__suno__',  { type: 'native', name: '__suno__',  fn: (a) => a[0] || '' }],
    ];

    for (const [name, fn] of builtins) {
      env.variables.set(name, fn);
    }

    return env;
  }

  private scope(parent: Environment): Environment {
    return { variables: new Map(), parent };
  }

  private get(name: string, env: Environment): RuntimeValue {
    if (env.variables.has(name)) return env.variables.get(name)!;
    if (env.parent) return this.get(name, env.parent);
    throw new InterpreterError('ReferenceError', `"${name}" nahi mila — pehle define karo!`, 0, 0);
  }

  private set(name: string, value: RuntimeValue, env: Environment): void {
    if (env.variables.has(name)) { env.variables.set(name, value); return; }
    if (env.parent) { this.set(name, value, env.parent); return; }
    env.variables.set(name, value);
  }

  private define(name: string, value: RuntimeValue, env: Environment): void {
    env.variables.set(name, value);
  }

  // ── Execution ──────────────────────────────────────────────

  private execBlock(stmts: ASTNode[], env: Environment): void | FlowSignal {
    for (const s of stmts) {
      const r = this.exec(s, env);
      if (r !== undefined && r !== null) return r;
    }
    return undefined;
  }

  private exec(node: ASTNode, env: Environment): void | FlowSignal {
    switch (node.type) {
      case 'PrintStatement':       return this.execPrint(node as PrintStatement, env);
      case 'InputStatement':       return this.execInput(node as InputStatement, env);
      case 'VariableDeclaration':  return this.execVarDecl(node as VariableDeclaration, env);
      case 'VariableAssignment':   return this.execVarAssign(node as VariableAssignment, env);
      case 'ExpressionStatement':  { this.eval((node as ExpressionStatement).expression, env); return; }
      case 'IfStatement':          return this.execIf(node as IfStatement, env);
      case 'WhileStatement':       return this.execWhile(node as WhileStatement, env);
      case 'ForStatement':         return this.execFor(node as ForStatement, env);
      case 'FunctionDeclaration':  return this.execFuncDecl(node as FunctionDeclaration, env);
      case 'ReturnStatement':      return this.execReturn(node as ReturnStatement, env);
      case 'ClassDeclaration':     return this.execClassDecl(node as ClassDeclaration, env);
      case 'BlockStatement': {
        const sc = this.scope(env);
        return this.execBlock((node as BlockStatement).body, sc);
      }
      default: { this.eval(node, env); return; }
    }
  }

  private execPrint(node: PrintStatement, env: Environment): void {
    const args = node.args.map(a => this.fmt(this.eval(a, env)));
    this.output.push(args.join(' '));
  }

  private execInput(_node: InputStatement, _env: Environment): void { /* handled at call-site */ }

  private execVarDecl(node: VariableDeclaration, env: Environment): void {
    this.define(node.name.name, this.eval(node.value, env), env);
  }

  private execVarAssign(node: VariableAssignment, env: Environment): void {
    const value = this.eval(node.value, env);
    const t = node.target;

    if (t.type === 'Identifier') {
      const existing = this.get(t.name, env);
      this.set(t.name, this.applyOp(existing, node.operator, value), env);
    } else if (t.type === 'MemberExpression') {
      const obj = this.eval(t.object, env) as Record<string, RuntimeValue>;
      const key = String(this.eval(t.property, env));
      if (node.operator === '=') obj[key] = value;
      else obj[key] = this.applyOp(obj[key], node.operator, value);
    } else if (t.type === 'IndexExpression') {
      const obj = this.eval(t.object, env) as Record<string, RuntimeValue>;
      const idx = String(this.eval(t.index, env));
      if (node.operator === '=') obj[idx] = value;
      else obj[idx] = this.applyOp(obj[idx], node.operator, value);
    }
  }

  private execIf(node: IfStatement, env: Environment): void | FlowSignal {
    if (this.truthy(this.eval(node.condition, env))) {
      const sc = this.scope(env);
      const r = this.execBlock(node.consequent.body, sc);
      if (r !== undefined && r !== null) return r;
    } else if (node.alternate) {
      if (node.alternate.type === 'IfStatement') return this.execIf(node.alternate, env);
      const sc = this.scope(env);
      const r = this.execBlock(node.alternate.body, sc);
      if (r !== undefined && r !== null) return r;
    }
    return undefined;
  }

  private execWhile(node: WhileStatement, env: Environment): void | FlowSignal {
    while (this.truthy(this.eval(node.condition, env))) {
      const sc = this.scope(env);
      const r = this.execBlock(node.body.body, sc);
      if (isFlow(r) && r._flow === 'break') break;
      if (isFlow(r) && r._flow === 'continue') continue;
      if (isFlow(r) && isReturn(r)) return r;
    }
    return undefined;
  }

  private execFor(node: ForStatement, env: Environment): void | FlowSignal {
    // C-style for loop
    if (node.iterable.type === 'NullLiteral') {
      const sc = this.scope(env);
      const r = this.execBlock(node.body.body, sc);
      if (isFlow(r) && isReturn(r)) return r;
      return undefined;
    }

    // Python-style for-in loop
    const iterable = this.eval(node.iterable, env);
    const sc = this.scope(env);

    const items: RuntimeValue[] = Array.isArray(iterable)
      ? iterable
      : typeof iterable === 'string'
        ? iterable.split('')
        : typeof iterable === 'object' && iterable !== null
          ? Object.values(iterable as Record<string, RuntimeValue>)
          : [];

    for (let i = 0; i < items.length; i++) {
      this.define(node.variable.name, items[i], sc);
      this.define('__index__', i, sc);
      const r = this.execBlock(node.body.body, sc);
      if (isFlow(r) && r._flow === 'break') break;
      if (isFlow(r) && r._flow === 'continue') continue;
      if (isFlow(r) && isReturn(r)) return r;
    }
    return undefined;
  }

  private execFuncDecl(node: FunctionDeclaration, env: Environment): void {
    const func: RuntimeFunction = {
      type: 'function',
      name: node.name.name,
      params: node.params.map(p => p.name),
      body: node.body,
      closure: env,
      isAsync: node.isAsync,
    };
    this.define(node.name.name, func, env);
  }

  private execReturn(node: ReturnStatement, env: Environment): FlowReturn {
    return { _flow: 'return', value: node.value ? this.eval(node.value, env) : null };
  }

  private execClassDecl(node: ClassDeclaration, env: Environment): void {
    let parentClass: RuntimeClass | undefined;
    if (node.parent) {
      const p = this.get(node.parent.name, env);
      if (p && typeof p === 'object' && (p as RuntimeClass).type === 'class') {
        parentClass = p as RuntimeClass;
      }
    }

    const methods = new Map<string, RuntimeFunction>();
    for (const m of node.methods) {
      methods.set(m.name.name, {
        type: 'function',
        name: m.name.name,
        params: m.params.map(p => p.name),
        body: m.body,
        closure: env,
        isAsync: false,
      });
    }

    const classDef: RuntimeClass = {
      type: 'class',
      name: node.name.name,
      parent: parentClass,
      methods,
      constructor: node.constructor ? {
        type: 'function',
        name: 'banayo',
        params: node.constructor.params.map(p => p.name),
        body: node.constructor.body,
        closure: env,
        isAsync: false,
      } : undefined,
    };

    this.define(node.name.name, classDef, env);
  }

  // ── Expression evaluation ──────────────────────────────────

  private eval(node: ASTNode, env: Environment): RuntimeValue {
    switch (node.type) {
      case 'NumberLiteral':   return (node as NumberLiteral).value;
      case 'StringLiteral':   return (node as StringLiteral).value;
      case 'BooleanLiteral':  return (node as BooleanLiteral).value;
      case 'NullLiteral':     return null;
      case 'Identifier':      return this.get((node as Identifier).name, env);
      case 'ArrayLiteral':    return (node as ArrayLiteral).elements.map(e => this.eval(e, env));
      case 'ObjectLiteral': {
        const obj: Record<string, RuntimeValue> = {};
        for (const p of (node as ObjectLiteral).properties) {
          obj[String(this.eval(p.key, env))] = this.eval(p.value, env);
        }
        return obj;
      }
      case 'BinaryExpression': return this.evalBinary(node as BinaryExpression, env);
      case 'UnaryExpression':  return this.evalUnary(node as UnaryExpression, env);
      case 'CallExpression':   return this.evalCall(node as CallExpression, env);
      case 'MemberExpression': return this.evalMember(node as MemberExpression, env);
      case 'IndexExpression':  return this.evalIndex(node as IndexExpression, env);
      case 'LambdaExpression': return this.evalLambda(node as any, env);
      default:
        throw new InterpreterError('RuntimeError', `Unexpected node type: ${(node as ASTNode).type}`, 0, 0);
    }
  }

  private evalBinary(node: BinaryExpression, env: Environment): RuntimeValue {
    const left = this.eval(node.left, env);
    const right = this.eval(node.right, env);

    switch (node.operator) {
      case '+':  return Number(left) + Number(right);
      case '-':  return Number(left) - Number(right);
      case '*':  return Number(left) * Number(right);
      case '/':  { if (Number(right) === 0) throw new InterpreterError('RuntimeError', 'Zero se bhagna mana hai! (division by zero)', 0, 0); return Number(left) / Number(right); }
      case '%':  return Number(left) % Number(right);
      case '**': return Math.pow(Number(left), Number(right));
      case '==': return left === right;
      case '!=': return left !== right;
      case '<':  return Number(left) < Number(right);
      case '>':  return Number(left) > Number(right);
      case '<=': return Number(left) <= Number(right);
      case '>=': return Number(left) >= Number(right);
      case 'aur': return this.truthy(left) && this.truthy(right);
      case 'ya':  return this.truthy(left) || this.truthy(right);
      default:   throw new InterpreterError('RuntimeError', `Unknown operator: ${node.operator}`, 0, 0);
    }
  }

  private evalUnary(node: UnaryExpression, env: Environment): RuntimeValue {
    const operand = this.eval(node.operand, env);
    switch (node.operator) {
      case '-':    return -Number(operand);
      case 'nahi': return !this.truthy(operand);
      case '++': {
        if (node.prefix && node.operand.type === 'Identifier') {
          const val = Number(this.get((node.operand as Identifier).name, env)) + 1;
          this.set((node.operand as Identifier).name, val, env);
          return val;
        }
        return Number(operand) + 1;
      }
      case '--': {
        if (node.prefix && node.operand.type === 'Identifier') {
          const val = Number(this.get((node.operand as Identifier).name, env)) - 1;
          this.set((node.operand as Identifier).name, val, env);
          return val;
        }
        return Number(operand) - 1;
      }
      default: throw new InterpreterError('RuntimeError', `Unknown unary operator: ${node.operator}`, 0, 0);
    }
  }

  private evalCall(node: CallExpression, env: Environment): RuntimeValue {
    const callee = this.eval(node.callee, env);
    const args = node.args.map(a => this.eval(a, env));

    // Native function
    if (callee != null && typeof callee === 'object' && 'type' in callee && (callee as NativeFunction).type === 'native') {
      return (callee as NativeFunction).fn(args);
    }

    // User-defined function
    if (callee != null && typeof callee === 'object' && 'type' in callee && (callee as RuntimeFunction).type === 'function') {
      return this.callFunc(callee as RuntimeFunction, args);
    }

    // Class instantiation
    if (callee != null && typeof callee === 'object' && 'type' in callee && (callee as RuntimeClass).type === 'class') {
      return this.newInstance(callee as RuntimeClass, args);
    }

    throw new InterpreterError('TypeError', `Ye cheez call nahi ho sakti`, 0, 0);
  }

  private callFunc(func: RuntimeFunction, args: RuntimeValue[]): RuntimeValue {
    const sc = this.scope(func.closure);
    this.define('ye', null, sc);
    for (let i = 0; i < func.params.length; i++) {
      this.define(func.params[i], args[i] ?? null, sc);
    }
    const r = this.execBlock(func.body.body, sc);
    if (isFlow(r) && isReturn(r)) return r.value;
    return null;
  }

  private newInstance(classDef: RuntimeClass, args: RuntimeValue[]): RuntimeInstance {
    const instance: RuntimeInstance = {
      type: 'instance',
      classDef,
      properties: new Map(),
    };
    for (const [name, method] of classDef.methods) {
      instance.properties.set(name, method);
    }
    if (classDef.constructor) {
      const sc = this.scope(classDef.constructor.closure);
      this.define('ye', instance, sc);
      for (let i = 0; i < classDef.constructor.params.length; i++) {
        this.define(classDef.constructor.params[i], args[i] ?? null, sc);
      }
      this.execBlock(classDef.constructor.body.body, sc);
    }
    return instance;
  }

  private evalMember(node: MemberExpression, env: Environment): RuntimeValue {
    const obj = this.eval(node.object, env);
    const prop = String(this.eval(node.property, env));

    // Instance
    if (obj != null && typeof obj === 'object' && 'type' in obj && (obj as RuntimeInstance).type === 'instance') {
      const inst = obj as RuntimeInstance;
      const v = inst.properties.get(prop);
      if (v !== undefined) return v;
      const m = inst.classDef.methods.get(prop);
      if (m) return m;
      return null;
    }
    // Class
    if (obj != null && typeof obj === 'object' && 'type' in obj && (obj as RuntimeClass).type === 'class') {
      const cd = obj as RuntimeClass;
      const m = cd.methods.get(prop);
      if (m) return m;
      return null;
    }
    // Array helpers
    if (Array.isArray(obj)) {
      if (prop === 'lambai') return obj.length;
      return null;
    }
    // String helpers
    if (typeof obj === 'string') {
      if (prop === 'lambai') return obj.length;
      if (prop === 'upar') return obj.toUpperCase();
      if (prop === 'nichla') return obj.toLowerCase();
      if (prop === 'ni8') return obj.trim();
      return null;
    }
    // Plain object
    if (obj != null && typeof obj === 'object') {
      return (obj as Record<string, RuntimeValue>)[prop] ?? null;
    }
    return null;
  }

  private evalIndex(node: IndexExpression, env: Environment): RuntimeValue {
    const obj = this.eval(node.object, env);
    const idx = this.eval(node.index, env);
    if (Array.isArray(obj)) return obj[Number(idx)] ?? null;
    if (typeof obj === 'string') return obj[Number(idx)] ?? null;
    if (obj != null && typeof obj === 'object') return (obj as Record<string, RuntimeValue>)[String(idx)] ?? null;
    return null;
  }

  private evalLambda(node: { params: Array<{ name: string }>; body: ASTNode }, env: Environment): RuntimeFunction {
    return {
      type: 'function',
      name: '<lambda>',
      params: node.params.map(p => p.name),
      body: node.body.type === 'BlockStatement'
        ? (node.body as BlockStatement)
        : { type: 'BlockStatement', body: [{ type: 'ReturnStatement', value: node.body }] },
      closure: env,
      isAsync: false,
    };
  }

  // ── Utilities ──────────────────────────────────────────────

  private truthy(v: RuntimeValue): boolean {
    if (v === null || v === undefined) return false;
    if (v === false) return false;
    if (v === 0) return false;
    if (v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }

  private applyOp(existing: RuntimeValue, op: string, value: RuntimeValue): RuntimeValue {
    switch (op) {
      case '=':  return value;
      case '+=': return Number(existing) + Number(value);
      case '-=': return Number(existing) - Number(value);
      case '*=': return Number(existing) * Number(value);
      case '/=': return Number(existing) / Number(value);
      case '%=': return Number(existing) % Number(value);
      default:   return value;
    }
  }

  private fmt(v: RuntimeValue): string {
    if (v === null || v === undefined) return 'khali';
    if (v === true) return 'sach';
    if (v === false) return 'jhooth';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return '[' + v.map(x => this.fmt(x)).join(', ') + ']';
    if (typeof v === 'object') {
      if ('type' in v) {
        const t = (v as RuntimeClass | RuntimeFunction | RuntimeInstance | NativeFunction).type;
        if (t === 'class')    return `<class ${(v as RuntimeClass).name}>`;
        if (t === 'function') return `<kaam ${(v as RuntimeFunction).name}>`;
        if (t === 'instance') return `<${(v as RuntimeInstance).classDef.name} instance>`;
        if (t === 'native')   return `<built-in ${(v as NativeFunction).name}>`;
      }
      const entries = Object.entries(v as Record<string, RuntimeValue>).map(([k, val]) => `${k}: ${this.fmt(val)}`);
      return '{' + entries.join(', ') + '}';
    }
    return String(v);
  }
}
