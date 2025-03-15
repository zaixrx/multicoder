import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

interface ConnectionHubProps {
  onClientConnect: Function;
  clientId: string;
}

function ConnectionHub({ onClientConnect, clientId }: ConnectionHubProps) {
  const [clientToConnectId, setClientToConnectId] = useState<string>("");

  return (
    <Card className="text-white w-[350px] bg-[#111] border-0 gap-2">
      <CardHeader>
        <CardTitle>Connection Hub</CardTitle>
        <CardDescription>
          Share your ID <Badge variant="secondary">{clientId}</Badge>
          and retreive others to connect with each other
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 mt-2">
          <Label htmlFor="id col-span-1">ID:</Label>
          <Input
            id="id"
            type="text"
            className="col-span-7"
            value={clientToConnectId}
            onChange={(e) => setClientToConnectId(e.target.value)}
            placeholder="Eg: PudflolA6KAHxeodAABx"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="default"
          onClick={() => {
            onClientConnect(clientToConnectId);
          }}
        >
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ConnectionHub;
