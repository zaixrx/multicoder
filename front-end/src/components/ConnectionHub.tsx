import { useContext, useEffect, useRef, useState } from "react";
import { RoomContext, RoomContextType } from "../App";

interface ConnectionHubProps {
  onClientConnect: Function;
}

function ConnectionHub({ onClientConnect }: ConnectionHubProps) {
  const [clientToConnectId, setClientToConnectId] = useState<string>("");
  const establishConnectionButtonRef = useRef<HTMLButtonElement>(null);
  const [_room, _setRoom, socket] = useContext<RoomContextType>(RoomContext);

  useEffect(() => {
    setClientToConnectId(socket.id || "");
  }, []);

  useEffect(() => {
    establishConnectionButtonRef.current?.click();
  }, [clientToConnectId]);

  return (
    <div>
      <input
        type="text"
        value={clientToConnectId}
        onChange={(e) => setClientToConnectId(e.target.value)}
      />
      <button
        ref={establishConnectionButtonRef}
        type="button"
        onClick={() => {
          onClientConnect(clientToConnectId);
        }}
      >
        Connect
      </button>
    </div>
  );
}

export default ConnectionHub;
