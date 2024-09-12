interface MouseCursorProps {
  x: number;
  y: number;
}

function MouseCursor({ x, y }: MouseCursorProps) {
  return (
    <div
      className="mouse-cursor translate-middle"
      style={{ left: x, top: y }}
    ></div>
  );
}

export default MouseCursor;
