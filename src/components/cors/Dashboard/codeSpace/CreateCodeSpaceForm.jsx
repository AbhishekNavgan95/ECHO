import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import ActionButton from '@/components/common/ActionButton';
import { codeSpaceEndpoints } from '@/services/apis';
import React, { useState } from 'react';
import { apiConnector } from '@/services/apiconnector';
import { FaCopy } from "react-icons/fa6";
import { MdOutlineClose } from "react-icons/md";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    visibility: z.string().min(1, { message: "Visibility is required" }),
});

const CreateCodeSpaceForm = ({ token, setFormOpen }) => {
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            visibility: 'public',
        }
    });

    const [inviteLink, setInviteLink] = useState(null);

    const { mutate, isLoading } = useMutation({
        mutationFn: async (data) => {
            const response = await apiConnector("POST", codeSpaceEndpoints.CREATE_CODE_ROOM, data, {
                Authorization: `Bearer ${token}`
            });
            
            return response
        },
        onSuccess: (response) => {
            setInviteLink(response?.data);
            toast.success("Code space created successfully");
            reset();
            queryClient.invalidateQueries(['codeSpaces']);
        },
        onError: (error) => {
            console.error(error);
            toast.error("Something went wrong");
        },
    });

    return (
        <section onClick={() => setFormOpen(false)} className='fixed inset-0 bg-opec backdrop-blur-sm z-[10] grid place-items-center'>
            <div onClick={(e) => e.stopPropagation()} className='bg-richblack-700 p-5 rounded-lg w-[480px] min-h-[100px]'>
                <div className='flex items-center justify-between'>
                    <h4 className='font-semibold text-lg'>Create a new code space.</h4>
                    <button onClick={() => setFormOpen(false)} className='text-2xl'><MdOutlineClose /></button>
                </div>
                <p className='opacity-70 text-sm'>Start by creating a new code space and setting the visibility</p>

                <form onSubmit={handleSubmit(mutate)} className='space-y-3 pt-3'>
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            {...register("name")}
                            className='w-full bg-richblack-500 rounded-md p-2 mt-2'
                            placeholder='Enter name of the code space'
                        />
                        {errors.name && <p className='text-red-600 text-sm mt-1'>{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="visibility">Visibility</label>
                        <select
                            id="visibility"
                            {...register("visibility")}
                            className='w-full bg-richblack-500 rounded-md p-2 mt-2'
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                        {errors.visibility && <p className='text-red-500 text-sm mt-1'>{errors.visibility.message}</p>}
                    </div>

                    <ActionButton type="submit" active className="w-full" disabled={isLoading || inviteLink?.data?.inviteLink}>
                        {isLoading ? "Creating..." : "Create"}
                    </ActionButton>
                </form>

                {
                    inviteLink?.data?.inviteLink &&
                    <>
                        <p className='mb-2 mt-4'>Invite link</p>
                        <div className='w-full py-2 px-2 flex items-center justify-between gap-x-3 bg-richblack-500'>
                            <p className='line-clamp-1'>{inviteLink.data.inviteLink}</p>
                            <button className='mr-2' onClick={() => {
                                navigator.clipboard.writeText(inviteLink.data.inviteLink);
                                toast.success("Copied to clipboard");
                            }}>
                                <FaCopy />
                            </button>
                        </div>
                    </>
                }
            </div>
        </section>
    );
};

export default CreateCodeSpaceForm;
