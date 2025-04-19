import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch'
import { Label } from '@radix-ui/react-context-menu'
import Modal from '@/components/common/Modal'

const ParticipentList = ({
  participants,
  handleAllowEditChange,
  isInstructor,
  kickUser
}) => {

  return (
    <div className='rounded-md border-richblack-300 h-full bg-richblack-700'>
      {
        participants?.length > 0 ? (
          <div className='p-4 h-full'>
            {/* <div className='flex text-xl justify-start gap-x-5 font-semibold text-white mb-5'>
              <h1 className=''>Participants</h1>
              <p>{participants?.length || 0}</p>
            </div> */}
            <div className='grid grid-cols-1 xl:grid-cols-2 place-items-center gap-3'>
              {
                participants.map((participant, index) => (
                  <>
                    <UserCard key={index} kickUser={kickUser} isInstructor={isInstructor} handleAllowEditChange={handleAllowEditChange} participant={participant} />
                  </>
                ))
              }
            </div>
          </div>
        ) : (
          <div className='flex flex-col h-full items-center px-4 justify-center w-full'>
            <h1 className='text-base text-white font-serif text-center'>No Participants yet</h1>
          </div>
        )
      }
    </div>
  )
}

const UserCard = ({
  participant,
  handleAllowEditChange,
  isInstructor,
  kickUser
}) => {

  const [modal, setModal] = useState(null);

  const openModal = () => {
    setModal({
      heading: "Kick out",
      subHeading: "Are you sure you want to kick out this user?",
      btn1Text: "Kick out",
      btn2Text: "Cancel",
      btn1Handler: () => {
        kickUser(participant?.user?._id)
        setModal(null)
      },
      btn2Handler: () => {
        setModal(null)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div key={participant?._id} className={`select-none flex border px-4 aspect-square cursor-pointer p-2 rounded-md hover:bg-richblack-500 transition-all duration-300 flex-col items-center justify-center w-full gap-x-2 `}>
          <img className={`w-12 h-12 rounded-full border-4 ${participant.role === "editor" ? "border-red-500" : "border-yellow-200"}`} src={participant?.user?.image} alt={participant.user.firstName} />
          <p className='text-xs mt-2'>{participant?.user?.firstName}</p>
        </div>
      </DropdownMenuTrigger>
      {
        isInstructor && !modal &&
        <DropdownMenuContent className="p-2 z-[9] flex flex-col gap-y-2">
          <div className='flex gap-x-2 items-center'>
            <Switch id="editAllowed"
              checked={participant?.role === "editor" ? true : false}
              onCheckedChange={() => {
                handleAllowEditChange(participant?.role === "editor" ? "viewer" : "editor", participant?.user?._id)
              }}
            />
            <Label htmlFor="editAllowed">Allow edit</Label>
          </div>
          <button onClick={openModal}>
            Kick out
          </button>
        </DropdownMenuContent>
      }
      {
        modal && <Modal modalData={modal} />
      }
    </DropdownMenu>
  )
}

export default ParticipentList