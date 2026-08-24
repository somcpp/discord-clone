import { db } from "@/lib/db";

const conversationWithMembers = {
  memberOne: {
    include: {
      profile: true,
    },
  },
  memberTwo: {
    include: {
      profile: true,
    },
  },
} as const;

const getOrCreateConversation = async (memberOneId: string, memberTwoId: string) => {
  let conversation = await findConversation(memberOneId, memberTwoId) || await findConversation(memberTwoId, memberOneId);
  if (!conversation) {
    conversation = await createNewConversation(memberOneId, memberTwoId);
  }
  return conversation;
}

const findConversation = async (memberOneId: string, memberTwoId: string) => {
  try {
    return await db.conversation.findFirst({
      where: {
        AND: [
          { memberOneId },
          { memberTwoId },
        ],
      },
      include: conversationWithMembers,
    });
  }
  catch (error) {
    console.error(error);
    return null;
  }
}

const createNewConversation = async (memberOneId: string, memberTwoId: string) => {
  if (!memberOneId || !memberTwoId) {
    return null;
  }

  try {
    return await db.conversation.create({
      data: {
        memberOneId,
        memberTwoId,
      },
      include: conversationWithMembers,
    });
  }
  catch (error) {
    console.error(error);
    return null;
  }
}

export { findConversation, createNewConversation, getOrCreateConversation };