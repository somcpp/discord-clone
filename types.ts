import { Member, Profile, Server } from "./generated/prisma/client";

export type ServerWithMembersWithProfiles = Server & {
  members: (Member & {profile: Profile})[]
}