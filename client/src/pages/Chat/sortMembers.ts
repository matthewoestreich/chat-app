/**
 *  SORTS MEMBERS/ACCOUNTS IN PLACE!
 * Sorts members/accounts based on (in order):
 *  - Online status
 *  - Alphabetical
 * @param {RoomMember[] | PublicAccount} members : members you want to sort
 * @returns
 */
export default function sortMembers(members: RoomMember[] | PublicAccount[]): void {
  members.sort((a, b) => {
    // If both are active just sort alphabetically
    if (a.isActive && b.isActive) {
      return a.name.localeCompare(b.name);
    }
    // If both are inactive, sort alphabetically
    if (!a.isActive && !b.isActive) {
      return a.name.localeCompare(b.name);
    }
    // Here, if 'a' is active, 'b' has to be inactive.
    if (a.isActive) {
      return -1;
    }
    // Here, we can safely assume 'b' is active and 'a' is inactive.
    return 1;
  });
}

// Like aliases hah
export const sortAccounts = sortMembers;
export const sortUsers = sortMembers;
