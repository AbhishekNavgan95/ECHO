import { toast } from 'react-hot-toast';
import ActionButton from '@/components/common/ActionButton';
import { codeSpaceEndpoints } from '@/services/apis';
import React, { useState } from 'react'
import { apiConnector } from '@/services/apiconnector';
import { FaCopy } from "react-icons/fa6";
import { MdOutlineClose } from "react-icons/md";


const CreateCodeSpaceForm = ({ token, setFormOpen }) => {

    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        visibility: "public",
    })

    const createCodeSpace = async () => {
        setLoading(true);
        if (formData.name === "" || formData.visibility === "") {
            toast.error("Please fill all the fields");
            setLoading(false)
            return
        }

        const response = await apiConnector("POST", codeSpaceEndpoints.CREATE_CODE_ROOM, formData, {
            Authorization: `Bearer ${token}`
        });

        console.log("response : ", response)
        setInviteLink(response?.data);
        setFormData({
            name: "",
            visibility: "public",
        })
        setLoading(false);
        toast.success("Code space created successfully");
    }

    return (
        <section onClick={() => setFormOpen(false)} className='fixed inset-0 bg-opec backdrop-blur-sm z-[10] grid place-items-center'>
            <div onClick={(e) => e.stopPropagation()} className='bg-richblack-700 p-5 rounded-lg w-[480px] min-h-[100px]'>
                <div className='flex items-center justify-between'>
                    <h4 className='font-semibold text-lg'>Create a new code space.</h4>
                    <button onClick={() => setFormOpen(false)} className='text-2xl'><MdOutlineClose /></button>
                </div>
                <p className='opacity-70 text-sm'>Start by creating a new code space and setting the visibility</p>
                <div className='space-y-3 pt-3'>
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id='name'
                            className='w-full bg-richblack-500 rounded-md p-2 mt-2' placeholder='Enter name of the code space'
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="visibility">Visiblity</label>
                        <select
                            className='w-full bg-richblack-500 rounded-md p-2 mt-2'
                            name="visibility"
                            id="visibility"
                            value={formData.visibility}
                            onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    <ActionButton type={"submit"} active className="w-full" disabled={loading || inviteLink?.data?.inviteLink} onClick={createCodeSpace} >{loading ? "Creating..." : "Create"}</ActionButton>

                    {
                        inviteLink?.data?.inviteLink &&
                        <>
                            <p className='mb-2'>Invite link</p>
                            <div className='w-full  py-2 px-2 flex items-center justify-between gap-x-3 bg-richblack-500'>
                                <p className='line-clamp-1'>
                                    {inviteLink?.data?.inviteLink}
                                </p>
                                <button className='mr-2' onClick={() => {
                                    navigator.clipboard.writeText(inviteLink);
                                    toast.success("Copied to clipboard");
                                }}><FaCopy /></button>
                            </div>
                        </>
                    }
                </div>
            </div>
        </section>
    )
}

export default CreateCodeSpaceForm