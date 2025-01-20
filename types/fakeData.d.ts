interface FakeData {
  users: FakeUser[];
  rooms: FakeChatRoom[];
  roomsWithMembers: FakeChatRoomWithMembers[];
}

interface FakeUser {
  username: string;
  password: string;
  email: string;
  id: string;
}

interface FakeChatRoom {
  name: string;
  id: string;
  isPrivate: number;
}

interface FakeChatRoomMessage {
  id: string;
  user: FakeUser;
  room: FakeChatRoom;
  message: string;
}

interface FakeChatRoomWithMembers {
  room: FakeChatRoom;
  members: FakeUser[];
}

interface FakeDirectMessage {
  id: string;
  directConversation: FakeDirectConversation;
  from: FakeUser;
  to: FakeUser;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface FakeDirectConversation {
  id: string;
  userA: FakeUser;
  userB: FakeUser;
}

type FakeDataFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
