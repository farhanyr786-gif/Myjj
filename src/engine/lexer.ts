import { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  'chhapa': 'CHHAPA',
  'agar': 'AGAR',
  'warna': 'WARNA',
  'jabtak': 'JABTAK',
  'liye': 'LIYE',
  'mein': 'MEIN',
  'kaam': 'KAAM',
  'wapas': 'WAPAS',
  'sach': 'SACH',
  'jhooth': 'JHOOTH',
  'khali': 'KHALI',
  'aur': 'AUR',
  'ya': 'YA',
  'nahi': 'NAHI',
  'ye': 'YE',
  'roko': 'ROKO',
  'aage': 'AAGE',
  'naya': 'NAVO',
  'bhi': 'BHI',
  'dhundho': 'DHUNDHO',
  'hatao': 'HATAO',
  'suno': 'SUNO',
  'dikhao': 'DIKHAO',
  'rakho': 'RAKHO',
  'badalo': 'BADALO',
  'preshit': 'PRESHIT',
  'pata_lagao': 'PATA_LAGAO',
  'poora': 'POORA',
  'naka': 'NAKA',
  'gun': 'GUN',
  'banayo': 'BANAYO',
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      // Newlines
      if (char === '\n') {
        this.addToken('NEWLINE', '\n');
        this.pos++;
        this.line++;
        this.column = 1;
        continue;
      }

      // Skip spaces and tabs (but not newlines)
      if (char === ' ' || char === '\t' || char === '\r') {
        this.pos++;
        this.column++;
        continue;
      }

      // Comments: # comment
      if (char === '#') {
        this.skipComment();
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        this.readString(char);
        continue;
      }

      // Template strings with interpolation
      if (char === '`') {
        this.readTemplateString();
        continue;
      }

      // Numbers
      if (this.isDigit(char) || (char === '.' && this.pos + 1 < this.source.length && this.isDigit(this.source[this.pos + 1]))) {
        this.readNumber();
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(char) || char === '_') {
        this.readIdentifier();
        continue;
      }

      // Two-character operators
      if (this.pos + 1 < this.source.length) {
        const twoChar = this.source.substring(this.pos, this.pos + 2);
        if (twoChar === '==') { this.addToken('EQEQ', '=='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '!=') { this.addToken('NEQ', '!='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '<=') { this.addToken('LTE', '<='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '>=') { this.addToken('GTE', '>='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '&&') { this.addToken('AND', '&&'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '||') { this.addToken('OR', '||'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '++') { this.addToken('PLUS_PLUS', '++'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '--') { this.addToken('MINUS_MINUS', '--'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '**') { this.addToken('STAR_STAR', '**'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '+=') { this.addToken('PLUS_EQUAL', '+='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '-=') { this.addToken('MINUS_EQUAL', '-='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '*=') { this.addToken('STAR_EQUAL', '*='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '/=') { this.addToken('SLASH_EQUAL', '/='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '%=') { this.addToken('PERCENT_EQUAL', '%='); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '=>') { this.addToken('ARROW', '=>'); this.pos += 2; this.column += 2; continue; }
        if (twoChar === '->') { this.addToken('ARROW', '->'); this.pos += 2; this.column += 2; continue; }
      }

      // Single-character operators
      const singleOps: Record<string, TokenType> = {
        '+': 'PLUS', '-': 'MINUS', '*': 'STAR', '/': 'SLASH', '%': 'PERCENT',
        '=': 'ASSIGN', ';': 'SEMICOLON', ':': 'COLON',
        '(': 'LPAREN', ')': 'RPAREN', '{': 'LBRACE', '}': 'RBRACE',
        '[': 'LBRACKET', ']': 'RBRACKET', ',': 'COMMA', '.': 'DOT',
        '<': 'LT', '>': 'GT', '!': 'BANG', '|': 'PIPE',
      };

      if (singleOps[char]) {
        this.addToken(singleOps[char], char);
        this.pos++;
        this.column++;
        continue;
      }

      // Unknown character - skip
      this.pos++;
      this.column++;
    }

    this.addToken('EOF', '');
    return this.tokens;
  }

  private skipComment(): void {
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.pos++;
    }
  }

  private readString(quote: string): void {
    this.pos++; // skip opening quote
    this.column++;
    let value = '';

    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') {
        this.pos++;
        this.column++;
        switch (this.source[this.pos]) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          case '0': value += '\0'; break;
          default: value += this.source[this.pos]; break;
        }
      } else if (this.source[this.pos] === '\n') {
        this.line++;
        this.column = 1;
        value += '\n';
      } else {
        value += this.source[this.pos];
      }
      this.pos++;
      this.column++;
    }

    if (this.pos < this.source.length) {
      this.pos++; // skip closing quote
      this.column++;
    }

    this.addToken('STRING', value);
  }

  private readTemplateString(): void {
    this.addToken('STRING', '`');
    this.pos++;
    this.column++;
  }

  private readNumber(): void {
    let value = '';
    const startCol = this.column;

    while (this.pos < this.source.length && (this.isDigit(this.source[this.pos]) || this.source[this.pos] === '.')) {
      value += this.source[this.pos];
      this.pos++;
      this.column++;
    }

    // Handle scientific notation
    if (this.pos < this.source.length && (this.source[this.pos] === 'e' || this.source[this.pos] === 'E')) {
      value += this.source[this.pos];
      this.pos++;
      this.column++;
      if (this.pos < this.source.length && (this.source[this.pos] === '+' || this.source[this.pos] === '-')) {
        value += this.source[this.pos];
        this.pos++;
        this.column++;
      }
      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        value += this.source[this.pos];
        this.pos++;
        this.column++;
      }
    }

    this.addToken('NUMBER', value);
  }

  private readIdentifier(): void {
    let value = '';

    while (this.pos < this.source.length && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '_')) {
      value += this.source[this.pos];
      this.pos++;
      this.column++;
    }

    // Check for multi-word keywords: warna agar
    if (value === 'warna' && this.peekNextWord() === 'agar') {
      this.skipWhitespace();
      this.pos += 4; // skip 'agar'
      this.column += 4;
      this.addToken('WARNA', 'warna agar');
      return;
    }

    const type = KEYWORDS[value];
    if (type) {
      this.addToken(type, value);
    } else {
      this.addToken('IDENTIFIER', value);
    }
  }

  private peekNextWord(): string {
    let pos = this.pos;
    while (pos < this.source.length && (this.source[pos] === ' ' || this.source[pos] === '\t')) {
      pos++;
    }
    let word = '';
    while (pos < this.source.length && this.isAlpha(this.source[pos])) {
      word += this.source[pos];
      pos++;
    }
    return word;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && (this.source[this.pos] === ' ' || this.source[this.pos] === '\t')) {
      this.pos++;
      this.column++;
    }
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({ type, value, line: this.line, column: this.column });
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char > '\u007F';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
