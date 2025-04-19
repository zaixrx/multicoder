"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const bson_1 = require("bson");
class Client {
    constructor(socket) {
        this.socket = socket;
        this.id = socket.id;
        this._joinedRoom = "";
    }
    get joinedRoom() {
        return this._joinedRoom;
    }
    set joinedRoom(roomId) {
        if (bson_1.ObjectId.isValid(roomId)) {
            this._joinedRoom = roomId;
        }
    }
    send(message, ...data) {
        this.socket.emit(message, ...data);
    }
    sendAll(message, ...data) {
        if (this._joinedRoom)
            this.socket.to(this._joinedRoom).emit(message, ...data);
    }
    broadcast(message, ...data) {
        if (this._joinedRoom) {
            this.socket.broadcast.to(this._joinedRoom).emit(message, ...data);
        }
    }
}
exports.Client = Client;
