import { PublicDirectConversation } from "@root/types.shared";

/**
 * Sorts direct convos based on (in order):
 *  - Unread messages
 *  - Online status
 *  - Alphabetical
 *
 * If `toSorted` is true, a copy of the input array is returned, if false the array is sorted in place (and returned)
 *
 * @param {PublicDirectConversation[]} convos : convos you want to sort
 * @param {boolean} toSorted if true, a copy of the input array is returned, if false the array is sorted in place (and still returned).
 * @returns
 */
export default function sortDirectConversations(convos: PublicDirectConversation[], toSorted: boolean): PublicDirectConversation[] {
  const compareFn = (a: PublicDirectConversation, b: PublicDirectConversation): number => {
    if (a.unreadMessagesCount > 0 && b.unreadMessagesCount > 0) {
      return a.userName.toLowerCase().localeCompare(b.userName.toLowerCase());
    }
    if (a.unreadMessagesCount > 0) {
      return -1;
    }
    if (b.unreadMessagesCount > 0) {
      return 1;
    }
    // If both are active just sort alphabetically
    if (a.isActive && b.isActive) {
      return a.userName.toLowerCase().localeCompare(b.userName.toLowerCase());
    }
    // If both are inactive, sort alphabetically
    if (!a.isActive && !b.isActive) {
      return a.userName.toLowerCase().localeCompare(b.userName.toLowerCase());
    }
    // Here, if 'a' is active, 'b' has to be inactive.
    if (a.isActive) {
      return -1;
    }
    // Here, we can safely assume 'b' is active and 'a' is inactive.
    return 1;
  };

  if (toSorted) {
    return convos.toSorted(compareFn);
  }
  return convos.sort(compareFn);
}
