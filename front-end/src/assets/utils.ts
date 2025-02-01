import { Color } from "./types/messageTypes";
import * as acorn from "acorn";

export function max(x: number, y: number) {
  return x >= y ? x : y;
}

export function min(x: number, y: number) {
  return x < y ? x : y;
}

export function sumColors(...colors: Color[]): Color {
  let result: Color = { r: 0, g: 0, b: 0 };

  for (let i = 0; i < colors.length; i++) {
    result.r += colors[i].r;
    result.g += colors[i].g;
    result.b += colors[i].b;
  }

  result.r /= colors.length;
  result.g /= colors.length;
  result.b /= colors.length;

  return result;
}

export function getColorString({ r, g, b }: Color) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function tokenize(code: string): acorn.Token[] {
  let tokens = [];
  let tokenizer = acorn.tokenizer(code, { ecmaVersion: "latest" });

  while (true) {
    let token = tokenizer.getToken();
    if (token.type.label === "eof") break;
    tokens.push(token);
  }

  return tokens;
}
