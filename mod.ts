import { red } from "https://deno.land/x/std/colors/mod.ts";

function replaceChar(str: string, index: number, input: string) {
  return str.substr(0, index) + input + str.substr(index + 1);
}

function matchStr(str: string, matcher: string | RegExp) {
  return (
    (typeof matcher === "string" && str === matcher) ||
    (matcher instanceof RegExp && matcher.test(str))
  );
}

enum Kind {
  Dot,
  Hyphen,
  Tilde,
  Caret,
  Either,
  Operator,
  Number,
  Name
}

interface Token {
  kind: Kind;
  pos: number;
  value: string;
}

let WHITESPACE = /\s/;
let NUMBER = /\d/;
let NAME = /[a-z]/i;

class LexerError extends Error {
  input: string;
  column: number;

  constructor(message: string, input: string, column: number) {
    let msg = `${message} "${input[column]}" @ ${column}:`;
    let src = replaceChar(input, column, red(input[column]));
    let pnt = " ".repeat(column) + red("^");

    super(`${msg}\n\n  ${src}\n  ${pnt}`);

    this.input = input;
    this.column = column;
  }
}

function createLexer(input: string) {
  let tokens: Array<Token> = [];
  let pos = 0;
  let value = "";

  let char = () => input[pos];
  let next = () => pos++;

  let push = (kind: Kind) => {
    tokens.push({ kind, pos, value });
    value = "";
  };

  let match = (test: string | RegExp) => {
    return matchStr(char(), test);
  };

  let eat = (test: string | RegExp) => {
    if (match(test)) {
      value += char();
      next();
      return true;
    } else {
      return false;
    }
  };

  let err = (message: string) => {
    return new LexerError(message, input, pos);
  };

  return { char, next, push, match, eat, err, tokens };
}

function lexer(input: string): Array<Token> {
  let l = createLexer(input);

  while (l.char()) {
    if (l.match(WHITESPACE)) {
      l.next();
    } else if (l.eat(".")) {
      l.push(Kind.Dot);
    } else if (l.eat("-")) {
      l.push(Kind.Hyphen);
    } else if (l.eat("^")) {
      l.push(Kind.Caret);
    } else if (l.eat("~")) {
      l.push(Kind.Tilde);
    } else if (l.eat("|")) {
      l.eat("|");
      l.push(Kind.Either);
    } else if (l.eat(">") || l.eat("<")) {
      l.eat("=");
      l.push(Kind.Operator);
    } else if (l.eat(NUMBER)) {
      while (l.eat(NUMBER)) {}
      l.push(Kind.Number);
    } else if (l.eat(NAME)) {
      while (l.eat(NAME)) {}
      l.push(Kind.Name);
    } else {
      throw l.err("Unexpected character");
    }
  }

  return l.tokens;
}

let tokens = lexer(">=1.2.3 <3.4.2 || ^1.0.0-beta.2");

for (let token of tokens) {
  console.log(token);
}
