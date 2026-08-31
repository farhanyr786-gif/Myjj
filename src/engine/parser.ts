import {
  Token, ASTNode, Program, ExpressionStatement, PrintStatement, InputStatement,
  VariableDeclaration, VariableAssignment, IfStatement, WhileStatement,
  ForStatement, FunctionDeclaration, ReturnStatement, BreakStatement,
  ContinueStatement, ClassDeclaration, BlockStatement, BinaryExpression,
  UnaryExpression, CallExpression, MemberExpression, IndexExpression,
  Identifier, NumberLiteral, StringLiteral, BooleanLiteral, NullLiteral,
  ArrayLiteral, ObjectLiteral, LambdaExpression, TernaryExpression,
} from './types';

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const body: ASTNode[] = [];
    this.skipNewlines();

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }

    return { type: 'Program', body };
  }

  // ── Statement parsing ──────────────────────────────────────

  private parseStatement(): ASTNode | null {
    const token = this.current();

    if (token.type === 'CHHAPA') return this.parsePrint();
    if (token.type === 'SUNO') return this.parseInput();
    if (token.type === 'AGAR') return this.parseIf();
    if (token.type === 'JABTAK') return this.parseWhile();
    if (token.type === 'LIYE') return this.parseFor();
    if (token.type === 'KAAM') return this.parseFunction();
    if (token.type === 'WAPAS') return this.parseReturn();
    if (token.type === 'ROKO') { this.advance(); this.expect('SEMICOLON'); return { type: 'BreakStatement' }; }
    if (token.type === 'AAGE') { this.advance(); this.expect('SEMICOLON'); return { type: 'ContinueStatement' }; }
    if (token.type === 'BANAYO') return this.parseClass();

    // Variable declaration: ye x = 5  OR  ye rakhna = 10
    if (token.type === 'YE') return this.parseVariableDecl();

    // Expression statement (assignments, function calls, etc.)
    return this.parseExpressionStatement();
  }

  private parsePrint(): PrintStatement {
    this.expect('CHHAPA');
    let newline = true;
    // chhapa("...") or chhapa.bhi("...")
    if (this.check('DOT')) {
      this.advance(); // dot
      this.expect('BHI');
      newline = false;
    }
    this.expect('LPAREN');
    const args: ASTNode[] = [];
    if (!this.check('RPAREN')) {
      args.push(this.parseExpression());
      while (this.match('COMMA')) {
        args.push(this.parseExpression());
      }
    }
    this.expect('RPAREN');
    this.optionalSemicolon();
    return { type: 'PrintStatement', args, newline };
  }

  private parseInput(): InputStatement {
    this.expect('SUNO');
    this.expect('LPAREN');
    const prompt = this.check('RPAREN') ? undefined : this.parseExpression();
    this.expect('RPAREN');

    // suno("prompt") stores result automatically — we ask user for variable name
    // But for simplicity, suno() returns a value that can be assigned:
    // ye naam = suno("Tumhara naam?")
    // So we return an expression and handle assignment at assignment level
    // Actually, let's make it: ye x = suno("prompt")  or just suno("prompt") returns value
    return { type: 'InputStatement', variable: { type: 'Identifier', name: '__input__' }, prompt };
  }

  private parseIf(): IfStatement {
    this.expect('AGAR');
    this.expect('LPAREN');
    const condition = this.parseExpression();
    this.expect('RPAREN');
    const consequent = this.parseBlock();

    let alternate: IfStatement | BlockStatement | undefined;
    if (this.match('WARNA')) {
      if (this.check('AGAR')) {
        alternate = this.parseIf();
      } else {
        alternate = this.parseBlock();
      }
    }

    return { type: 'IfStatement', condition, consequent, alternate };
  }

  private parseWhile(): WhileStatement {
    this.expect('JABTAK');
    this.expect('LPAREN');
    const condition = this.parseExpression();
    this.expect('RPAREN');
    const body = this.parseBlock();
    return { type: 'WhileStatement', condition, body };
  }

  private parseFor(): ForStatement {
    this.expect('LIYE');
    // liye (x = 0; x < 10; x++) { ... } — C-style
    // OR liye x mein [1,2,3] { ... } — Python-style
    this.expect('LPAREN');

    if (this.check('IDENTIFIER') && this.checkAhead(1, 'MEIN')) {
      // liye (x mein soochi) { ... }  OR  liye x mein soochi { ... }
      // Actually we already consumed LPAREN, so: liye (x mein arr) { ... }
      // Hmm, let's handle: liye x mein [1,2,3] { body }
      // We need to parse without parens for Python-style
      // Actually we consumed LPAREN already... let's handle both
      
      const varName = this.parseIdentifier();
      this.expect('MEIN');
      const iterable = this.parseExpression();
      this.expect('RPAREN');
      const body = this.parseBlock();
      return { type: 'ForStatement', variable: varName, iterable, body };
    }

    // C-style: liye (init; cond; update) { body }
    this.skipNewlines();
    
    // Init
    let init: ASTNode | undefined;
    if (!this.check('SEMICOLON')) {
      if (this.check('YE')) {
        this.advance();
        const name = this.parseIdentifier();
        this.expect('ASSIGN');
        const value = this.parseExpression();
        init = { type: 'VariableDeclaration', name, value, mutable: true };
      } else {
        const target = this.parseIdentifier();
        this.expect('ASSIGN');
        const value = this.parseExpression();
        init = { type: 'VariableAssignment', target, operator: '=', value };
      }
    }
    this.expect('SEMICOLON');

    // Condition
    const condition = this.check('SEMICOLON')
      ? { type: 'BooleanLiteral', value: true } as BooleanLiteral
      : this.parseExpression();
    this.expect('SEMICOLON');

    // Update
    let update: ASTNode | undefined;
    if (!this.check('RPAREN')) {
      update = this.parseExpression();
    }
    this.expect('RPAREN');
    const body = this.parseBlock();

    // We'll wrap init and update into the body for simplicity
    if (init) {
      body.body.unshift(init);
    }
    if (update) {
      body.body.push({ type: 'ExpressionStatement', expression: update });
    }

    return { type: 'ForStatement', variable: { type: 'Identifier', name: '__loop__' }, iterable: { type: 'NullLiteral', value: null }, body };
  }

  private parseFunction(): FunctionDeclaration {
    this.expect('KAAM');
    const name = this.parseIdentifier();
    this.expect('LPAREN');
    const params: Identifier[] = [];
    if (!this.check('RPAREN')) {
      params.push(this.parseIdentifier());
      while (this.match('COMMA')) {
        params.push(this.parseIdentifier());
      }
    }
    this.expect('RPAREN');
    const body = this.parseBlock();
    return { type: 'FunctionDeclaration', name, params, body, isAsync: false };
  }

  private parseReturn(): ReturnStatement {
    this.expect('WAPAS');
    let value: ASTNode | undefined;
    if (!this.check('SEMICOLON') && !this.check('NEWLINE') && !this.check('RBRACE') && !this.isAtEnd()) {
      value = this.parseExpression();
    }
    this.optionalSemicolon();
    return { type: 'ReturnStatement', value };
  }

  private parseClass(): ClassDeclaration {
    this.expect('BANAYO');
    const name = this.parseIdentifier();
    
    let parent: Identifier | undefined;
    if (this.match('BHI')) {
      parent = this.parseIdentifier();
    }
    
    this.expect('LBRACE');
    this.skipNewlines();

    const methods: FunctionDeclaration[] = [];
    let constructor: FunctionDeclaration | undefined;

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      if (this.match('BANAYO')) {
        // Constructor
        this.expect('LPAREN');
        const params: Identifier[] = [];
        if (!this.check('RPAREN')) {
          params.push(this.parseIdentifier());
          while (this.match('COMMA')) {
            params.push(this.parseIdentifier());
          }
        }
        this.expect('RPAREN');
        const body = this.parseBlock();
        constructor = { type: 'FunctionDeclaration', name: { type: 'Identifier', name: 'banayo' }, params, body, isAsync: false };
      } else if (this.check('KAAM')) {
        methods.push(this.parseFunction());
      } else {
        this.advance(); // skip unexpected token
      }
      this.skipNewlines();
    }

    this.expect('RBRACE');
    return { type: 'ClassDeclaration', name, parent, methods, constructor };
  }

  private parseBlock(): BlockStatement {
    this.expect('LBRACE');
    this.skipNewlines();
    const body: ASTNode[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    this.expect('RBRACE');
    return { type: 'BlockStatement', body };
  }

  private parseVariableDecl(): VariableDeclaration {
    this.expect('YE');
    const name = this.parseIdentifier();
    this.expect('ASSIGN');
    const value = this.parseExpression();
    this.optionalSemicolon();
    return { type: 'VariableDeclaration', name, value, mutable: true };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();

    // Check for assignment
    if (this.isAssignmentOp()) {
      const op = this.current().value as VariableAssignment['operator'];
      this.advance();
      const value = this.parseExpression();
      this.optionalSemicolon();
      return {
        type: 'ExpressionStatement',
        expression: {
          type: 'VariableAssignment',
          target: expr as Identifier | MemberExpression | IndexExpression,
          operator: op,
          value,
        } as VariableAssignment,
      };
    }

    this.optionalSemicolon();
    return { type: 'ExpressionStatement', expression: expr };
  }

  // ── Expression parsing (Pratt / precedence climbing) ───────

  private parseExpression(): ASTNode {
    return this.parseTernary();
  }

  private parseTernary(): ASTNode {
    let expr = this.parseOr();
    if (this.match('COLON') || (this.check('IDENTIFIER') && this.current().value === '?')) {
      // Handle ? : ternary
      // Actually let's use: expr ? val1 : val2
      // We already parsed the condition
      // Hmm, ternary is tricky without ? token. Let me skip for now
      // and support it via function call syntax instead.
    }
    return expr;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.match('YA')) {
      const right = this.parseAnd();
      left = { type: 'BinaryExpression', operator: 'ya', left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseComparison();
    while (this.match('AUR')) {
      const right = this.parseComparison();
      left = { type: 'BinaryExpression', operator: 'aur', left, right };
    }
    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddSub();
    while (this.check('EQEQ') || this.check('NEQ') || this.check('LT') || this.check('GT') || this.check('LTE') || this.check('GTE')) {
      const op = this.current().value;
      this.advance();
      const right = this.parseAddSub();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (this.check('PLUS') || this.check('MINUS')) {
      const op = this.current().value;
      this.advance();
      const right = this.parseMulDiv();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePower();
    while (this.check('STAR') || this.check('SLASH') || this.check('PERCENT')) {
      const op = this.current().value;
      this.advance();
      const right = this.parsePower();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  private parsePower(): ASTNode {
    let left = this.parseUnary();
    while (this.check('STAR_STAR')) {
      this.advance();
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator: '**', left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.check('MINUS')) {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator: '-', operand, prefix: true };
    }
    if (this.check('NAHI') || this.check('BANG')) {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator: 'nahi', operand, prefix: true };
    }
    if (this.check('PLUS_PLUS')) {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator: '++', operand, prefix: true };
    }
    if (this.check('MINUS_MINUS')) {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryExpression', operator: '--', operand, prefix: true };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parseCallMember();
    while (true) {
      if (this.check('PLUS_PLUS')) {
        this.advance();
        expr = { type: 'UnaryExpression', operator: '++', operand: expr, prefix: false };
      } else if (this.check('MINUS_MINUS')) {
        this.advance();
        expr = { type: 'UnaryExpression', operator: '--', operand: expr, prefix: false };
      } else {
        break;
      }
    }
    return expr;
  }

  private parseCallMember(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match('LPAREN')) {
        // Function call
        const args: ASTNode[] = [];
        if (!this.check('RPAREN')) {
          args.push(this.parseExpression());
          while (this.match('COMMA')) {
            args.push(this.parseExpression());
          }
        }
        this.expect('RPAREN');
        expr = { type: 'CallExpression', callee: expr, args };
      } else if (this.match('DOT')) {
        const prop = this.parseIdentifier();
        expr = { type: 'MemberExpression', object: expr, property: prop, computed: false };
      } else if (this.match('LBRACKET')) {
        const index = this.parseExpression();
        this.expect('RBRACKET');
        expr = { type: 'IndexExpression', object: expr, index };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ASTNode {
    // Numbers
    if (this.check('NUMBER')) {
      const val = this.current().value;
      this.advance();
      return { type: 'NumberLiteral', value: parseFloat(val) };
    }

    // Strings
    if (this.check('STRING')) {
      const val = this.current().value;
      this.advance();
      return { type: 'StringLiteral', value: val };
    }

    // Booleans
    if (this.check('SACH')) { this.advance(); return { type: 'BooleanLiteral', value: true }; }
    if (this.check('JHOOTH')) { this.advance(); return { type: 'BooleanLiteral', value: false }; }

    // Null
    if (this.check('KHALI')) { this.advance(); return { type: 'NullLiteral', value: null }; }

    // Parenthesized expression
    if (this.check('LPAREN')) {
      this.advance();
      const expr = this.parseExpression();
      this.expect('RPAREN');
      return expr;
    }

    // Array literal
    if (this.check('LBRACKET')) {
      this.advance();
      const elements: ASTNode[] = [];
      if (!this.check('RBRACKET')) {
        elements.push(this.parseExpression());
        while (this.match('COMMA')) {
          if (this.check('RBRACKET')) break;
          elements.push(this.parseExpression());
        }
      }
      this.expect('RBRACKET');
      return { type: 'ArrayLiteral', elements };
    }

    // Object literal
    if (this.check('LBRACE')) {
      this.advance();
      this.skipNewlines();
      const properties: { key: ASTNode; value: ASTNode }[] = [];
      while (!this.check('RBRACE') && !this.isAtEnd()) {
        const key = this.parseExpression();
        this.expect('COLON');
        const value = this.parseExpression();
        properties.push({ key, value });
        this.match('COMMA');
        this.skipNewlines();
      }
      this.expect('RBRACE');
      return { type: 'ObjectLiteral', properties };
    }

    // Lambda: kaam(x) x + 1  OR  (x) => x + 1
    if (this.check('KAAM') && this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1].type === 'LPAREN') {
      this.advance(); // kaam
      this.expect('LPAREN');
      const params: Identifier[] = [];
      if (!this.check('RPAREN')) {
        params.push(this.parseIdentifier());
        while (this.match('COMMA')) {
          params.push(this.parseIdentifier());
        }
      }
      this.expect('RPAREN');
      // Arrow or block
      if (this.check('ARROW')) {
        this.advance();
        const body = this.parseExpression();
        return { type: 'LambdaExpression', params, body };
      } else if (this.check('LBRACE')) {
        const body = this.parseBlock();
        return { type: 'LambdaExpression', params, body };
      }
    }

    // Identifier
    if (this.check('IDENTIFIER')) {
      const name = this.current().value;
      this.advance();
      return { type: 'Identifier', name };
    }

    // suno() as expression
    if (this.check('SUNO')) {
      this.advance();
      this.expect('LPAREN');
      const prompt = this.check('RPAREN') ? undefined : this.parseExpression();
      this.expect('RPAREN');
      return { type: 'CallExpression', callee: { type: 'Identifier', name: '__suno__' }, args: prompt ? [prompt] : [] };
    }

    throw this.error(this.current(), `Unexpected token: ${this.current().value || this.current().type}`);
  }

  // ── Helper methods ─────────────────────────────────────────

  private parseIdentifier(): Identifier {
    if (!this.check('IDENTIFIER')) {
      throw this.error(this.current(), `Expected identifier, got ${this.current().type}`);
    }
    const name = this.current().value;
    this.advance();
    return { type: 'Identifier', name };
  }

  private match(type: string): boolean {
    if (this.check(type as any)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: string): boolean {
    return this.current().type === type;
  }

  private checkAhead(offset: number, type: string): boolean {
    const idx = this.pos + offset;
    return idx < this.tokens.length && this.tokens[idx].type === type;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', line: 0, column: 0 };
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: string): Token {
    if (!this.check(type as any)) {
      throw this.error(this.current(), `Expected ${type}, got ${this.current().type} ("${this.current().value}")`);
    }
    return this.advance();
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.current().type === 'EOF';
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE') || this.check('SEMICOLON')) {
      this.advance();
    }
  }

  private optionalSemicolon(): void {
    if (this.check('SEMICOLON')) this.advance();
  }

  private isAssignmentOp(): boolean {
    return this.check('ASSIGN') || this.check('PLUS_EQUAL') || this.check('MINUS_EQUAL') ||
           this.check('STAR_EQUAL') || this.check('SLASH_EQUAL') || this.check('PERCENT_EQUAL');
  }

  private error(token: Token, message: string): Error {
    return new Error(`Line ${token.line}, Col ${token.column}: ${message}`);
  }
}
