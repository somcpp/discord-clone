import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { MemberRole } from "@/generated/prisma/enums";


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse("Unauthorized", { status: 401 });
    const {channelId} = await params;
    if (!channelId) return new NextResponse("Channel ID Missing", { status: 400 });

    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");
    if (!serverId)
      return new NextResponse("Server ID Missing", { status: 400 });

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR]
            }
          }
        }
      },
      data: {
        channels: {
          deleteMany: {
            id: channelId,
            name: {
              not: "general"
            }
          }
        }
      }
    })

    return NextResponse.json(server);
  } catch (error) {
    console.log(error);
    return NextResponse.json("Internal server error", { status: 500 });
  }
}