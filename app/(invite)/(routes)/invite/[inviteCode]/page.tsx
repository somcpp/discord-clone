import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface InviteCodePage{
  params: Promise<{
    inviteCode: string;
  }>
}

const InviteCodePage = async ({params} : InviteCodePage) => {
  const { inviteCode } = await params;
  const profile = await currentProfile();
  if(!profile) {
    return <RedirectToSignIn />
  }

  if(!inviteCode) {
    return redirect("/")
  }

  const existingServer = await db.server.findFirst({
    where: {
      inviteCode: inviteCode,
      members: {
        some: {
          profileId: profile.id
        }
      }
    }
  })

  if(existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  const server = await db.server.update({
    where: {
      inviteCode: inviteCode,
    },
    data: {
      members: {
        create: {
          profileId: profile.id
        }
      }
    }
  })

  if(server) {
    return redirect(`/servers/${server.id}`);
  }

  return (
    <div>
      <h1>Loading...</h1>
    </div>
  )
}

export default InviteCodePage;