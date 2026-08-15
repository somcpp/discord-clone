import { InitialModal } from "@/components/modals/intital-modal";
import { db } from "@/lib/db";
import { initialProfile } from "@/lib/intital-profile"
import {redirect} from 'next/navigation'

const SetupPage = async() => {
  const profile = await initialProfile();
  console.log(profile)
  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId : profile.id
        }
      }
    }
  })

  if(server) {
    return redirect(`/servers/${server.id}`);
  }

  return (
    <div>
      <h1>
        
        <InitialModal/>
      </h1>
    </div>
  )
}

export default SetupPage