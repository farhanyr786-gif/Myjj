// Token types for the HingScript lexer
export type TokenType =
  // Literals
  | 'NUMBER' | 'STRING' | 'IDENTIFIER'
  // Keywords
  | 'CHHAPA' | 'AGAR' | 'WARNA' | 'JABTAK' | 'LIYE' | 'MEIN'
  | 'KAAM' | 'WAPAS' | 'SACH' | 'JHOOTH' | 'KHALI'
  | 'AUR' | 'YA' | 'NAHI' | 'YE' | 'ROKO' | 'AAGE'
  | 'NAVO' | 'BHI' | 'DHUNDHO' | 'HATAO'
  | 'SUNO' | 'DIKHAO' | 'RAKHO' | 'BADALO'
  | 'PRESHIT' | 'PATA_LAGAO'
  // Class-related
  | 'POORA' | 'NAKA' | 'GUN' | 'BANAYO'
  // Operators
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'PLUS_PLUS' | 'MINUS_MINUS' | 'STAR_STAR'
  | 'PLUS_EQUAL' | 'MINUS_EQUAL' | 'STAR_EQUAL' | 'SLASH_EQUAL' | 'PERCENT_EQUAL'
  | 'EQEQ' | 'NEQ' | 'LT' | 'GT' | 'LTE' | 'GTE'
  | 'AND' | 'OR' | 'NOT' | 'BANG'
  | 'ASSIGN' | 'SEMICOLON' | 'COLON'
  | 'LPAREN' | 'RPAREN' | 'LBRACE' | 'RBRACE' | 'LBRACKET' | 'RBRACKET'
  | 'COMMA' | 'DOT' | 'ARROW' | 'PIPE'
  // Special
  | 'EOF' | 'NEWLINE' | 'INDENT' | 'DEDENT'
  | 'INTERPOLATION_START' | 'INTERPOLATION_END';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// AST Node types
export type ASTNode =
  | Program
  | ExpressionStatement
  | PrintStatement
  | InputStatement
  | VariableDeclaration
  | VariableAssignment
  | IfStatement
  | WhileStatement
  | ForStatement
  | FunctionDeclaration
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | ClassDeclaration
  | BlockStatement
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | MemberExpression
  | IndexExpression
  | Identifier
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral
  | LambdaExpression
  | TernaryExpression
  | TemplateString;

export interface Program {
  type: 'Program';
  body: ASTNode[];
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface PrintStatement {
  type: 'PrintStatement';
  args: ASTNode[];
  newline: boolean;
}

export interface InputStatement {
  type: 'InputStatement';
  variable: Identifier;
  prompt?: ASTNode;
}

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  name: Identifier;
  value: ASTNode;
  mutable: boolean;
}

export interface VariableAssignment {
  type: 'VariableAssignment';
  target: Identifier | MemberExpression | IndexExpression;
  operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=';
  value: ASTNode;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: ASTNode;
  consequent: BlockStatement;
  alternate?: IfStatement | BlockStatement;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: ASTNode;
  body: BlockStatement;
}

export interface ForStatement {
  type: 'ForStatement';
  variable: Identifier;
  iterable: ASTNode;
  body: BlockStatement;
  indexVar?: Identifier;
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: Identifier;
  params: Identifier[];
  body: BlockStatement;
  isAsync: boolean;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value?: ASTNode;
}

export interface BreakStatement {
  type: 'BreakStatement';
}

export interface ContinueStatement {
  type: 'ContinueStatement';
}

export interface ClassDeclaration {
  type: 'ClassDeclaration';
  name: Identifier;
  parent?: Identifier;
  methods: FunctionDeclaration[];
  constructor?: FunctionDeclaration;
}

export interface BlockStatement {
  type: 'BlockStatement';
  body: ASTNode[];
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: string;
  operand: ASTNode;
  prefix: boolean;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: ASTNode;
  args: ASTNode[];
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: ASTNode;
  property: ASTNode;
  computed: boolean;
}

export interface IndexExpression {
  type: 'IndexExpression';
  object: ASTNode;
  index: ASTNode;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NullLiteral {
  type: 'NullLiteral';
  value: null;
}

export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: ASTNode[];
}

export interface ObjectLiteral {
  type: 'ObjectLiteral';
  properties: { key: ASTNode; value: ASTNode }[];
}

export interface LambdaExpression {
  type: 'LambdaExpression';
  params: Identifier[];
  body: ASTNode;
}

export interface TernaryExpression {
  type: 'TernaryExpression';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface TemplateString {
  type: 'TemplateString';
  parts: (ASTNode | string)[];
}

// Runtime types
export type RuntimeValue =
  | number
  | string
  | boolean
  | null
  | RuntimeValue[]
  | { [key: string]: RuntimeValue }
  | RuntimeFunction
  | RuntimeClass
  | RuntimeInstance
  | NativeFunction;

export interface RuntimeFunction {
  type: 'function';
  name: string;
  params: string[];
  body: BlockStatement;
  closure: Environment;
  isAsync: boolean;
}

export interface RuntimeClass {
  type: 'class';
  name: string;
  parent?: RuntimeClass;
  methods: Map<string, RuntimeFunction>;
  constructor?: RuntimeFunction;
}

export interface RuntimeInstance {
  type: 'instance';
  classDef: RuntimeClass;
  properties: Map<string, RuntimeValue>;
}

export interface NativeFunction {
  type: 'native';
  name: string;
  fn: (args: RuntimeValue[]) => RuntimeValue;
}

export interface Environment {
  variables: Map<string, RuntimeValue>;
  parent?: Environment;
}

export interface HingScriptError {
  message: string;
  line: number;
  column: number;
  type: 'SyntaxError' | 'RuntimeError' | 'TypeError' | 'ReferenceError';
}

export interface ExecutionResult {
  output: string[];
  error?: HingScriptError;
  executionTime: number;
}
