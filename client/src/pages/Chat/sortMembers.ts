import { PublicMember } from "../../../../types.shared";

/**
 *  SORTS MEMBERS/ACCOUNTS IN PLACE!
 * Sorts members/accounts based on (in order):
 *  - Online status
 *  - Alphabetical
 * @param {PublicMember[]} members : members you want to sort
 * @returns
 */
export default function sortMembers(members: PublicMember[]): void {
  members.sort((a, b) => {
    // If both are active just sort alphabetically
    if (a.isActive && b.isActive) {
      return a.userId.localeCompare(b.userName);
    }
    // If both are inactive, sort alphabetically
    if (!a.isActive && !b.isActive) {
      return a.userName.localeCompare(b.userName);
    }
    // Here, if 'a' is active, 'b' has to be inactive.
    if (a.isActive) {
      return -1;
    }
    // Here, we can safely assume 'b' is active and 'a' is inactive.
    return 1;
  });
}
