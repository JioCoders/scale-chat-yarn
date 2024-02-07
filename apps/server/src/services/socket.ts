import Redis from "ioredis";
import { Server } from "socket.io";
// import prismaClient from "./prisma";
import { produceMessage } from "./kafka";

const pub = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '0'),
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD
});
const sub = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '0'),
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD
});
class SocketService {
  private _io: Server;

  constructor() {
    console.log("Init Socket Service...");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });
    sub.subscribe("MESSAGE");
  }

  /**
   * initListeners
   */
  public initListeners() {
    const io = this._io;
    console.log("Init Socket Listerners...");

    io.on("connect", (socket) => {
      console.log(`New Socket Connected`, socket.id);

      socket.on("event:message", async ({ message }: { message: string }) => {
        console.log(`Message Received from Socket: `, message);
        // publish this message to Redis
        await pub.publish("MESSAGE", JSON.stringify({ message }));
      });
    });
    sub.on("message", async (channel, message) => {
      if (channel === "MESSAGE") {
        console.log("Message Received from Redis: ", message);
        io.emit("message", message);
        // DB store and sync with prisma
        // await prismaClient.message.create({
        //   data: {
        //     text: message,
        //   }
        // });
        // APACHE Kafka produce message
        await produceMessage(message);
        console.log("Message produced to Kafka Broker", message);
      }
    });
  }

  get io() {
    return this._io;
  }
}
export default SocketService;
