import { PublicMember } from "@root/types.shared";
import { WebSocketAppCache } from "../types";

export default function setMembersActiveStatus(members: PublicMember[], scopeId: string, cache: WebSocketAppCache): PublicMember[] {
  return members.map((member) => {
    if (!cache.has(scopeId)) {
      return member;
    }
    return {
      ...member,
      isActive: cache.get(scopeId)?.has(member.userId) === true,
    };
  });
}
