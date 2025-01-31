import { Color, CursorPosition, Vector2 } from "../assets/types/messageTypes";

export type CursorType = {
  color: Color;
  position: CursorPosition;
}

function Cursor({ position, color }: CursorType) {
  const getCharacterDimensions = (): Vector2 => {
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
  };

  const dimensions = getCharacterDimensions();

  return (
    <span className="cursor-bar" style={{ left: dimensions.x * position.column, top: dimensions.y * position.line, borderColor: `rgb(${color.r}, ${color.g}, ${color.b})` }} />
  );
}

export default Cursor;