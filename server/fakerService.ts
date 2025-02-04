/**
 * Functions to generate fake data.
 */
import { faker } from "@faker-js/faker";
import { v7 as uuidV7 } from "uuid";

/**
 * Generate all needed fake data.
 * @param {GenerateFakeDataParams} params
 */
export function generateFakeData(params: GenerateFakeDataParams): FakeData {
  const { numberOfUsers, makeIdentical } = params.userParams;
  const users = generateFakeUsers(numberOfUsers, makeIdentical);

  const { numberOfRooms, longNameFrequency } = params.chatRoomsParams;
  const rooms = generateFakeChatRooms(numberOfRooms, longNameFrequency);

  const { minUsersPerRoom, maxUsersPerRoom } = params.chatRoomsWithMembersParams;
  const roomsWithMembers = addFakeUsersToFakeChatRooms(users, rooms, minUsersPerRoom, maxUsersPerRoom);

  const { maxMessagesPerRoom, maxMessageLength: maxChatRoomMessageLength, minMessageLength: minChatRoomMessageLength } = params.chatRoomMessagesParams;
  const chatRoomMessages = generateFakeChatRoomMessages(roomsWithMembers, maxMessagesPerRoom, minChatRoomMessageLength, maxChatRoomMessageLength);

  const { minConversationsPerUser, maxConversationsPerUser } = params.directConversationParams;
  const directConversations = generateFakeDirectConversations(users, minConversationsPerUser, maxConversationsPerUser);

  const { minMessagesPerConversation, maxMessagesPerConversation, minMessageLength, maxMessageLength } = params.directMessagesParams;
  const directMessages = generateFakeDirectMessages(directConversations, minMessagesPerConversation, maxMessagesPerConversation, minMessageLength, maxMessageLength);

  return {
    users,
    rooms,
    roomsWithMembers,
    chatRoomMessages,
    directMessages,
    directConversations,
  };
}

/**
 * Generate fake users.
 * @param numberOfUsers Number of users to generate.
 * @param makeIdentical If true, we set the username, email, and password all to the same thing.
 *                      For example: { username: "joe", email: "joe@joe.com", password: "joe" }
 */
export function generateFakeUsers(numberOfUsers: number, makeIdentical: boolean): FakeUser[] {
  const users = Array.from<FakeUser>({ length: numberOfUsers });

  for (let i = 0; i < numberOfUsers; i++) {
    const username = faker.internet.username();

    const user: FakeUser = {
      username,
      email: `${username}@${username}.com`,
      password: username,
      id: uuidV7(),
    };

    if (!makeIdentical) {
      user.email = `${username}@${faker.internet.domainName()}`;
      user.password = faker.internet.password();
    }

    users[i] = user;
  }

  return users;
}

/**
 * Generate fake chat rooms.
 * @param numberOfRooms
 * @param longNameFrequency The higher the frequency the more often we will generate rooms with longer names
 */
export function generateFakeChatRooms(numberOfRooms: number, longNameFrequency: FakeDataFrequency): FakeChatRoom[] {
  // We have to get the "mirror" number - eg, if  frequency is 10, mirror is 1. If frequency is 9 mirror is 2, etc..
  // This is bc we use mod within the loop to determine when we should create a room with a long name.
  const frequency = 10 - longNameFrequency + 1;
  const rooms = Array.from<FakeChatRoom>({ length: numberOfRooms });

  for (let i = 0; i < numberOfRooms; i++) {
    const room: FakeChatRoom = {
      name: faker.word.noun(),
      id: uuidV7(),
      isPrivate: getRandomArrayElement([0, 1]),
    };

    if (i % frequency === 0) {
      room.name = `${faker.word.adjective()} ${room.name}`;
    }

    rooms[i] = room;
  }

  return rooms;
}

/**
 * Generate fake chat room messages.
 * @param roomsWithMembers
 * @param maxMessagesPerRoom Maximum amount of messages any given room will have.
 * @param minMessageLength Minimum length of actual message.
 * @param maxMessageLength Maximum length of actual message.
 */
export function generateFakeChatRoomMessages(roomsWithMembers: FakeChatRoomWithMembers[], maxMessagesPerRoom: number, minMessageLength: number, maxMessageLength: number): FakeChatRoomMessage[] {
  if (minMessageLength >= maxMessageLength) {
    throw new Error(`[generateFakeChatRoomMessages] minMessageLength:${minMessageLength} must be less than maxMessageLength:${maxMessageLength}!`);
  }

  const messages = new Array<FakeChatRoomMessage>();

  for (let i = 0; i < roomsWithMembers.length; i++) {
    const { room, members } = roomsWithMembers[i];
    const numMessages = getRandomIntInclusive(1, maxMessagesPerRoom);

    for (let j = 0; j < numMessages; j++) {
      messages.push({
        room,
        id: uuidV7(),
        message: faker.lorem.sentence({ min: minMessageLength, max: maxMessageLength }),
        user: getRandomArrayElement(members),
      });
    }
  }

  return messages;
}

/**
 * Add/join users to rooms.
 * @param users List of users to add to rooms
 * @param chatRooms List of rooms you want to add users to
 * @param minUsersPerRoom Min number of users each room will have
 * @param maxUsersPerRoom Number of max users we will put in each room (randomly generate for each room).
 */
export function addFakeUsersToFakeChatRooms(users: FakeUser[], chatRooms: FakeChatRoom[], minUsersPerRoom: number, maxUsersPerRoom: number): FakeChatRoomWithMembers[] {
  if (users.length === 0 || chatRooms.length === 0) {
    throw new Error(`[addFakeUsersToFakeChatRooms] Either users or rooms are empty : users.length=${users.length} | chatRooms.length=${chatRooms.length}`);
  }
  if (minUsersPerRoom >= maxUsersPerRoom) {
    throw new Error(`[addFakeUsersToFakeChatRooms] minUsersPerRoom:${minUsersPerRoom} must be less than maxUsersPerRoom:${maxUsersPerRoom}`);
  }

  // If the max is greater than number of users, set the max to be the number of users
  const max = maxUsersPerRoom > users.length ? users.length - 1 : maxUsersPerRoom;
  const all = Array.from<FakeChatRoomWithMembers>({ length: chatRooms.length });

  for (let i = 0; i < chatRooms.length; i++) {
    all[i] = {
      room: chatRooms[i],
      members: getUniqueItems(users, getRandomIntInclusive(minUsersPerRoom, max)),
    };
  }

  return all;
}

/**
 * Generate direct conversations between users (min not guaranteed here)
 * @param users
 * @param minConversationsPerUser
 * @param maxConversationsPerUser
 */
export function generateFakeDirectConversations(users: FakeUser[], minConversationsPerUser: number, maxConversationsPerUser: number): FakeDirectConversation[] {
  const directConversations = new Array<FakeDirectConversation>();

  if (users.length === 0) {
    return directConversations;
  }
  if (minConversationsPerUser >= maxConversationsPerUser) {
    throw new Error(`[generateFakeDirectConversations] minConversationsPerUser:${minConversationsPerUser} should be less than maxConversationsPerUser:${maxConversationsPerUser}`);
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const numOfConversations = getRandomIntInclusive(minConversationsPerUser, maxConversationsPerUser);
    // Exlude "this" user from unique items. Otherwise you could be in a conversation with yourself.
    const uniqueUsers = getUniqueItems(users, numOfConversations, user);

    for (let j = 0; j < uniqueUsers.length; j++) {
      const otherUser = uniqueUsers[j];

      // This is why a min is not guaranteed here. I am too lazy to make sure a
      // min amount is provided becuase this is just for fake data anyway.
      //
      // The following direct conversations are redundant:
      //  - directConvo1 = { userA: "Joe", userB: "Amy" };
      //  - directConvo2 = { userA: "Amy", userB: "Joe" };
      // This filters out redundant direct conversations.
      const existingDirectConversations = directConversations.filter((dc) => {
        if ((dc.userA.id === user.id && dc.userB.id === otherUser.id) || (dc.userA.id === otherUser.id && dc.userB.id === user.id)) {
          return dc;
        }
      });
      // If convo with "these" members does not already exist, add to output array.
      if (existingDirectConversations.length === 0) {
        directConversations.push({
          id: uuidV7(),
          userA: user,
          userB: otherUser,
        });
      }
    }
  }

  return directConversations;
}

/**
 * Generate direct messages for direct conversations.
 * @param directConversations
 * @param minMessagesPerConversation
 * @param maxMessagesPerConversation
 * @param minMessageLength
 * @param maxMessageLength
 */
export function generateFakeDirectMessages(directConversations: FakeDirectConversation[], minMessagesPerConversation: number, maxMessagesPerConversation: number, minMessageLength: number, maxMessageLength: number): FakeDirectMessage[] {
  if (minMessagesPerConversation >= maxMessagesPerConversation) {
    throw new Error(`[generateFakeDirectMessages] minMessagesPerConversation:${minMessagesPerConversation} should be less than maxMessagesPerConversation:${maxMessagesPerConversation}`);
  }
  if (minMessageLength >= maxMessageLength) {
    throw new Error(`[generateFakeDirectMessages] minMessageLength:${minMessageLength} should be less than maxMessageLength:${maxMessageLength}`);
  }

  const directMessages = new Array<FakeDirectMessage>();

  for (let i = 0; i < directConversations.length; i++) {
    const dc = directConversations[i];
    // So we can randomly pick who is sending/receiving.
    const options = [
      { from: dc.userA, to: dc.userB },
      { from: dc.userB, to: dc.userA },
    ];
    const numOfMessages = getRandomIntInclusive(minMessagesPerConversation, maxMessagesPerConversation);

    for (let j = 0; j < numOfMessages; j++) {
      const option = getRandomArrayElement(options);

      directMessages.push({
        id: uuidV7(),
        from: option.from,
        to: option.to,
        directConversation: dc,
        timestamp: new Date(),
        message: faker.lorem.sentence({ min: minMessageLength, max: maxMessageLength }),
        isRead: true,
      });
    }
  }

  return directMessages;
}

/**
 * ==========================
 * HELPER FUNCTIONS
 * ==========================
 */

/**
 * Get array of unique items.
 *
 * If the array you provided already contains unique items, we filter them out prior to performing
 * any calculations as far as numOfItems to return, etc..
 *
 * @param items List of items that you want to get N unique items from
 * @param numOfItems Number of unique items you want
 * @param excludeItem Item you want to exclude from being selected as a unique item.
 */
export function getUniqueItems<T>(items: T[], numOfItems: number, excludeItem?: T): T[] {
  // In case we were given an array of items that already contains duplicates, filter them out.
  items = Array.from(new Set(items));

  // If excludeItem, remove it from items.
  if (excludeItem !== undefined) {
    items = items.filter((item) => item !== excludeItem);
  }

  // If numOfItems === items.length, return everything
  if (numOfItems === items.length) {
    return items;
  }
  // If they want a number of items that is greater than the amount of items we were given.
  if (numOfItems > items.length) {
    throw new Error(`[getUniqueItems] numOfItems:${numOfItems} is greater than items.length:${items.length}.\nNOTE: length may be different than what you expect because: \n\t1) If you provided 'excludeItem', that is factored into items.length. \n\t2)If any duplicates existed withhin the 'items' array you provided, they are subtracted from original length.`);
  }

  const uniqueItems = new Array<T>();

  for (let i = 0; i < numOfItems; i++) {
    let iterations = 0; // Safety net against infinite loop
    let randomItem = getRandomArrayElement(items);

    while (uniqueItems.includes(randomItem) && iterations < Number.MAX_SAFE_INTEGER) {
      randomItem = getRandomArrayElement(items);
      iterations++;
    }

    uniqueItems.push(randomItem);
  }

  return uniqueItems;
}

/**
 * Gets number in range, inclusive.
 * @param min
 * @param max
 */
function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generic function that gets random item from array.
 * @param {Array<T>} arr
 */
function getRandomArrayElement<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
