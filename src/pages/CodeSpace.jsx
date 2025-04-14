import { codeSpaceEndpoints } from '../services/apis'
import ActionButton from '../components/common/ActionButton'
import HighlightText from '../components/common/HighlightText'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { apiConnector } from '../services/apiconnector'
import CreateCodeSpaceForm from '@/components/cors/Dashboard/codeSpace/CreateCodeSpaceForm'
import { Loader } from 'lucide-react'
import { SyncLoader } from 'react-spinners'
import { MdOutlineMessage } from "react-icons/md";
import { GoPeople } from "react-icons/go";
import DangerButton from '@/components/common/DangerButton'
import toast from 'react-hot-toast'
import Modal from '@/components/common/Modal'
import { useNavigate } from 'react-router-dom'


const CodeSpace = () => {

    const [formOpen, setFormOpen] = useState(false)
    const [codeSpaces, setCodeSpaces] = useState([])
    const [loading, setLoading] = useState(false)
    const user = useSelector(state => state.profile.user)
    const token = useSelector(state => state.auth.token)

    useEffect(() => {
        const fetchCodingRooms = async () => {
            setLoading(true)
            const response = await apiConnector("GET", codeSpaceEndpoints.GET_CODE_ROOMS, null, {
                Authorization: `Bearer ${token}`
            });
            console.log("response : ", response);
            setCodeSpaces(response?.data?.data);
            setLoading(false)
        }

        fetchCodingRooms()
    }, [])

    return (
        <section className='min-h-[calc(100vh-8rem)] p-10 bg-richblack-800 border flex flex-col w-full border-richblack-600 my-10 rounded-lg'>
            <div className='flex flex-col justify-center h-full w-full '>
                <div className='flex items-center justify-between gap-x-3'>
                    <h3 className='text-3xl'>Welcome to <HighlightText text="code space" /></h3>
                    <ActionButton onClick={() => setFormOpen(prev => !prev)} active >Create code space</ActionButton>
                </div>

                <CodeSpacesList token={token} user={user} loading={loading} setData={setCodeSpaces} data={codeSpaces} />

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

    const deleteCodeSpace = async (id) => {
        console.log("Id : ", id)

        const toastRef = toast.loading("Deleting")
        const response = await apiConnector("DELETE", codeSpaceEndpoints.DELETE_CODE_ROOM + `/${id}`, null, {
            Authorization: `Bearer ${token}`
        });

        console.log("response : ", response)

        if (response.data?.success) {
            setData(prev => prev.filter((codeSpace) => codeSpace._id !== id))
        }
        toast.dismiss(toastRef)
    }

    const joinCodeSpace = async (id) => {
        const response = await apiConnector("POST", codeSpaceEndpoints.JOIN_CODE_ROOM + `/${id}`, null, {
            Authorization: `Bearer ${token}`
        });

        if(response?.data?.success) {
            toast.success("Joined code space")
            navigate(`/code-space/${id}`)
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

    return (
        <div className='bg-richblack-900 border border-richblack-600 rounded-md py-2 px-4 mt-3'>
            <div className='flex items-center justify-between overflow-hidden relative'>
                <span className='flex items-center gap-x-5 relative'>
                    <p className='text-base capitalize ml-6'>{data?.name}</p>
                    <div className='bg-caribbeangreen-100 absolute text-xs w-[10px] aspect-square text-center rounded-full uppercase'></div>
                </span>
                <div className='flex gap-x-5 items-center text-lg'>
                    <p className='flex gap-x-3 items-center font-semibold'><span className='text-sm'>{data?.participants?.length || 0}</span> <GoPeople /></p>
                    <span className='flex gap-x-2'>
                        {
                            isOwner && (
                                <DangerButton action={() => handleDelete(data?._id)} active className="">Delete</DangerButton>
                            )
                        }
                        <ActionButton onClick={() => joinCodeSpace(data?._id)} active className="">Join</ActionButton>
                    </span>
                </div>
            </div>
            {
                modalData && <Modal modalData={modalData} />
            }
        </div >
    )
}

export default CodeSpace