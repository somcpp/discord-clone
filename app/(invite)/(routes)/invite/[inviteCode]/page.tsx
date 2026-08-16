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

  const serverExists = await db.server.findUnique({
    where: {
      inviteCode: inviteCode
    }
  });

  if (!serverExists) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-[#313338] rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2 text-rose-500">Invalid Invite</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
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
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return null;
}

export default InviteCodePage;