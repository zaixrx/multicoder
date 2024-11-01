import { useEffect, useRef, useState } from "react";

interface ConnectionHubProps {
  socketID: string;
  onClientConnect: Function;
}

function ConnectionHub({ onClientConnect, socketID }: ConnectionHubProps) {
  const [clientToConnectId, setClientToConnectId] = useState<string>("");
  const establishConnectionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setClientToConnectId(socketID);
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
