import { useState } from "react";

interface ConnectionHubProps {
  onClientConnect: Function;
}

function ConnectionHub({ onClientConnect }: ConnectionHubProps) {
  const [clientToConnectId, setClientToConnectId] = useState<string>("");

  return (
    <div>
      <input
        type="text"
        value={clientToConnectId}
        onChange={(e) => setClientToConnectId(e.target.value)}
      />
      <button
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
