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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);
    
    const serverId = searchParams.get("serverId");

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });
    if (!serverId) return new NextResponse("Server ID missing", { status: 400 });
    
    const {channelId} = await params;
    if (!channelId) return new NextResponse("Channel ID missing", { status: 400 });

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    const server = await db.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            profileId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            }
          }
        }
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
              NOT: {
                name: "general",
              },
            },
            data: {
              name,
              type,
            }
          }
        }
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}