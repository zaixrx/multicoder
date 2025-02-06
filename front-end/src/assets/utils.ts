import { Color, Vector2 } from "./types/messageTypes";
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

export function tokenize(code: string): acorn.Token[] | undefined {
  let tokens = [];
  let tokenizer = acorn.tokenizer(code, { ecmaVersion: "latest" });

  while (true) {
    try {
      let token = tokenizer.getToken();
      if (token.type.label === "eof") break;
      tokens.push(token);
    } catch {
      return undefined;
    }
  }

  const message = "hello";
  message.length;

  return tokens;
}

export function clamp(val: number, min: number, max: number) {
  if (val > max) return max;
  else if (val < min) return min;

  return val;
}

export function getCharacterDimensions(): Vector2 {
  // Yes this is AI generated, and I'm not gonna hide that
  const pre = document.createElement("pre");
  pre.style.position = "absolute";
  pre.style.visibility = "hidden";
  pre.style.fontFamily = "monospace"; // Match the font you're using
  pre.style.fontSize = "16px"; // Match the font size you're using
  pre.textContent = "M"; // Use any character; "M" is often a good choice for width
  pre.classList.add("line");
  document.body.appendChild(pre);
  const rect = pre.getBoundingClientRect();
  document.body.removeChild(pre);
  return { x: rect.width, y: rect.height };
}

export function arrayCopy<T>(array: T[]): T[] {
  let arrayCopy: T[] = [];

  for (let i = 0; i < array.length; i++) {
    arrayCopy.push({ ...array[i] });
  }

  return arrayCopy;
}
