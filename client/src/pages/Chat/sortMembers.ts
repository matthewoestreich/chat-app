import { PublicMember } from "@root/types.shared";

/**
 * Sorts members based on (in order):
 *  - Online status
 *  - Alphabetical
 *
 * If `toSorted` is true, a copy of the input array is returned, if false the array is sorted in place (and returned)
 *
 * @param {PublicMember[]} members : members you want to sort
 * @param {boolean} toSorted if true, a copy of the input array is returned, if false the array is sorted in place (and still returned).
 * @returns
 */
export default function sortMembers(members: PublicMember[], toSorted: boolean): PublicMember[] {
  const compareFn = (a: PublicMember, b: PublicMember): number => {
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
  };

  if (toSorted) {
    return members.toSorted(compareFn);
  }
  return members.sort(compareFn);
}
