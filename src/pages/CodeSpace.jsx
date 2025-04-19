import { codeSpaceEndpoints } from '../services/apis'
import ActionButton from '../components/common/ActionButton'
import HighlightText from '../components/common/HighlightText'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { apiConnector } from '../services/apiconnector'
import CreateCodeSpaceForm from '@/components/cors/Dashboard/codeSpace/CreateCodeSpaceForm'
import { SyncLoader } from 'react-spinners'
import { GoPeople } from "react-icons/go";
import DangerButton from '@/components/common/DangerButton'
import toast from 'react-hot-toast'
import Modal from '@/components/common/Modal'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CiLock } from "react-icons/ci";


const CodeSpace = () => {

    const [formOpen, setFormOpen] = useState(false)
    const user = useSelector(state => state.profile.user)
    const token = useSelector(state => state.auth.token)

    const { data: codeSpaces, isPending } = useQuery({
        queryKey: ["codeSpaces"],
        queryFn: async () => {
            const response = await apiConnector("GET", codeSpaceEndpoints.GET_CODE_ROOMS, null, {
                Authorization: `Bearer ${token}`
            });
            // console.log("response : ", response);
            return response?.data.data;
        }
    })

    return (
        <section className='min-h-[calc(100vh-8rem)] p-10 bg-richblack-800 border flex flex-col w-full border-richblack-600 my-10 rounded-lg'>
            <div className='flex flex-col justify-center h-full w-full '>
                <div className='flex items-center justify-between gap-x-3'>
                    <h3 className='text-3xl'>Welcome to <HighlightText text="code space" /></h3>
                    {
                        user?.accountType === "Instructor" &&
                        <ActionButton onClick={() => setFormOpen(prev => !prev)} active >Create code space</ActionButton>
                    }
                </div>

                <CodeSpacesList token={token} user={user} loading={isPending} data={codeSpaces} />

                {
                    formOpen && (
                        <CreateCodeSpaceForm setFormOpen={setFormOpen} token={token} />
                    )
                }
            </div>
        </section>
    )
}

const CodeSpacesList = ({ token, user, data, setData, loading }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async (id) => {
            const response = await apiConnector("DELETE", codeSpaceEndpoints.DELETE_CODE_ROOM + `/${id}`, null, {
                Authorization: `Bearer ${token}`
            });
            return response?.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries("codeSpaces")
        }
    })

    const deleteCodeSpace = async (id) => {
        mutate(id)
    }

    const joinCodeSpace = async (id, joiningToken) => {
        try {
            const response = await apiConnector("POST", codeSpaceEndpoints.JOIN_CODE_ROOM + `/${id}`, {
                joiningToken
            }, {
                Authorization: `Bearer ${token}`
            });

            if (response?.data?.success) {
                toast.success("Joined code space")
                navigate(`/code-space/${id}`)
            }
        } catch (error) {
            console.log("error joining room : ", error);
            toast.error(error?.response?.data?.message || "Something went wrong")
        }
    }

    if (loading) {
        return (
            <div className='mt-5 h-full grid place-items-center'>
                <p className='text-xl text-center py-24'><SyncLoader color="#E7C009" /></p>
            </div>
        )
    }

    if (!loading && data?.length === 0) {
        return (
            <div className='mt-5'>
                <p className='text-xl text-center py-24'>No code spaces found</p>
            </div>
        )
    }

    return (
        <div className='mx-auto mt-8 w-full'>
            {
                data.map((codeSpace, index) => {
                    return (
                        <CodeSpaceCard joinCodeSpace={joinCodeSpace} deleteCodeSpace={deleteCodeSpace} key={codeSpace._id || index} isOwner={user?._id === codeSpace?.instructor?._id} data={codeSpace} />
                    )
                })
            }
        </div>
    )
}

const CodeSpaceCard = ({ deleteCodeSpace, joinCodeSpace, data, isOwner }) => {

    const [modalData, setModalData] = useState(null)
    const [keyModal, setKeyModal] = useState(false);
    const [joiningTokn, setJoiningToken] = useState("");

    const user = useSelector(state => state.profile.user)

    const isKicked = data?.kickList?.some((u) => u?._id?.toString() === user?._id)
    const isPrivate = data?.visibility === "private";

    const handleDelete = (id) => {
        setModalData({
            heading: "Delete code space",
            subHeading: "Are you sure you want to delete this code space?",
            btn1Text: "Delete",
            btn1Handler: () => {
                deleteCodeSpace(id)
                setModalData(null)
            },
            btn2Text: "Cancel",
            btn2Handler: () => setModalData(null)
        })
    }

    const openKeyModal = () => {
        setKeyModal(true)
    }

    return (
        <div className='bg-richblack-900 border border-richblack-600 rounded-md py-2 px-4 mt-3'>
            <div className='flex items-center justify-between overflow-hidden relative'>
                <span className='flex items-center gap-x-4 relative'>
                    <p className='text-base capitalize ml-6'>{data?.name}</p>
                    <div className='bg-caribbeangreen-100 absolute text-xs w-[10px] aspect-square text-center rounded-full uppercase'></div>
                    {
                        isPrivate && (
                            <div className='text-base text-white'>
                                <CiLock />
                            </div>
                        )
                    }
                </span>
                <div className='flex gap-x-5 items-center text-lg'>
                    <p className='flex gap-x-3 items-center font-semibold'><span className='text-sm'>{data?.participants?.length || 0}</span> <GoPeople /></p>
                    <span className='flex gap-x-2'>
                        {
                            isOwner && (
                                <DangerButton action={() => handleDelete(data?._id)} active className="">Delete</DangerButton>
                            )
                        }
                        {
                            isPrivate && !isOwner
                                ? <ActionButton onClick={openKeyModal} disabled={isKicked} active className="">Join</ActionButton>
                                : <ActionButton onClick={() => joinCodeSpace(data?._id)} disabled={isKicked} active className="">Join</ActionButton>
                        }
                    </span>
                </div>
            </div>
            {
                modalData && <Modal modalData={modalData} />
            }
            {
                keyModal && (
                    <div onClick={() => setKeyModal(false)} className="w-full h-full bg-opec backdrop-blur-sm fixed grid place-items-center top-0 left-0 z-[10]">
                        <div className="text-richblack-5 w-max bg-richblack-800 min-w-[400px] rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col py-8 px-8 items-center gap-y-7">
                                <div className="flex flex-col gap-2 items-center">
                                    <h3 className="text-xl font-semibold text-center">Enter Security Token</h3>
                                    <p className="text-sm text-richblack-300 text-center">
                                        Enter security token and submit to continue
                                    </p>
                                </div>
                                <div className='w-full'>
                                    <input type="text" className='bg-richblack-700 w-full rounded-md p-2' placeholder='Enter security token' value={joiningTokn} onChange={(e) => setJoiningToken(e.target.value)} />
                                </div>
                                <div className="flex gap-x-5">
                                    <ActionButton onClick={() => joinCodeSpace(data?._id, joiningTokn)} active>Submit</ActionButton>
                                    <ActionButton onClick={() => setKeyModal(false)}>Cancel</ActionButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div >
    )
}

export default CodeSpace