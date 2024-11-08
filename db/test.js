import ChatRoom, { Room, RoomMember } from "./ChatRooms.js";

const chat = new ChatRoom();

chat.add(new Room("1"));

const roomOne = chat.get("1");

roomOne.addMember(new RoomMember("01", "Joe"));

chat.rooms.forEach(rm => {
  console.log(`- Room : ${rm.id}`);
  console.log(" - Members:")
  rm.members.forEach(mem => console.log(`  - name=${mem.displayName},id=${mem.id}`));
});
