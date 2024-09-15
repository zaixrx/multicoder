import { Children, cloneElement, useEffect, useState } from "react";
import Queue from "../utils/queue";

const animationTime = 0.1;

type InterpolaterProps = {
  children: any;
  positionBuffer: Queue<Vector2>;
};

function Interpolater({ children, positionBuffer }: InterpolaterProps) {
  const [currentPosition, setCurrentPosition] = useState<Vector2>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    setInterval(() => {
      if (positionBuffer.count()) {
        const targetPosition = positionBuffer.dequeue();
        if (targetPosition) interpolatePosition(targetPosition);
      }
    }, 1000 / 60);
  }, []);

  function interpolatePosition(targetPosition: Vector2) {
    let startTime: number | undefined;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      let t = Math.min(elapsed, 1);

      setCurrentPosition((previousPosition) => {
        let position = {
          x: lerp(previousPosition.x, targetPosition.x, t),
          y: lerp(previousPosition.y, targetPosition.y, t),
        };
        return position;
      });

      if (t < animationTime) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  function renderChildren() {
    return Children.map(children, (child) =>
      cloneElement(child, { position: currentPosition })
    );
  }

  return renderChildren();
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export default Interpolater;

export type Vector2 = {
  x: number;
  y: number;
};
