import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";

interface ConnectionHubProps {
  onRoomJoin: Function;
  onRoomCreate: Function;
}

function ConnectionHub({ onRoomJoin, onRoomCreate }: ConnectionHubProps) {
  const [roomId, setRoomId] = useState<string>("");

  return (
    <Card className="text-white w-[350px] bg-[#111] border-0 gap-2">
      <CardHeader>
        <CardTitle>Connection Hub</CardTitle>
        <CardDescription>
          You can either create a Room, or an already created one.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-10 py-5">
        <section className="col-span-6 flex flex-col gap-2">
          <Label htmlFor="id">Room ID:</Label>
          <Input
            id="id"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Eg: PudflolA6KAHxeodAABx"
          />
          <Button
            variant="default"
            onClick={() => {
              onRoomJoin(roomId);
            }}
          >
            Join
          </Button>
        </section>
        <section className="col-span-4 flex items-end justify-center">
          <Button
            variant="default"
            onClick={() => {
              onRoomCreate();
            }}
          >
            Create
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}

export default ConnectionHub;
