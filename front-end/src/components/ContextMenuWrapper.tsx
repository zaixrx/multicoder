import { createContext, useState } from "react";
import { Vector2 } from "../assets/types/messageTypes";

export const ContextMenuContext = createContext<any>(null);

function ContextMenuWrapper({ children, className, ...rest }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<Vector2>({ x: 0, y: 0 });

  function showMenu(items: any[], position: Vector2) {
    setItems(items);
    setIsVisible(true);
    setMenuPosition(position);
  }

  function hideMenu() {
    setIsVisible(false);
    setItems([]);
  }

  return (
    <div className={`context-menu-wrapper ${className}`} {...rest}>
      {isVisible && (
        <ul
          className="context-menu"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      <ContextMenuContext.Provider value={[showMenu, hideMenu]}>
        {children}
      </ContextMenuContext.Provider>
    </div>
  );
}

export default ContextMenuWrapper;
