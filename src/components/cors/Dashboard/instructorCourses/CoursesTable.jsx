import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { COURSE_STATUS } from "../../../../utils/constants"
import { formattedDate } from '../../../../utils/dateFormatter';
import Modal from "../../../common/Modal"
import toast from 'react-hot-toast';
import { MdEdit } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { deleteCourse, fetchInstructorCourses } from '../../../../services/operations/courseDetailsAPI';
import { useNavigate } from 'react-router-dom';

export default function CoursesTable({ courses, setCourses }) {

  const { token } = useSelector(state => state.auth);
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const [confirmationModal, setConfirmationModal] = useState(null);

  const handleCourseDelete = async (courseId) => {
    const toastId = toast.loading("Deleting the course...");

    await deleteCourse({ courseId: courseId }, token)
    const result = await fetchInstructorCourses(token);

    if (result) {
      setCourses(result);
    }

    setConfirmationModal(null)
    toast.dismiss(toastId);
  }

  return (
    <>
      <table className='text-richblack-50 border-richblack-600 w-full'>
        <thead className='text-2xl'>
          <tr className='w-full py-5'>
            <th className='py-4 text-start font-thin px-2'>
              Courses
            </th>
            <th className='py-4  text-center font-thin px-2'>
              Price
            </th>
            <th className='py-4 text-center font-thin px-2'>
              <div className='flex gap-x-3 items-center justify-center'>
                Actions
              </div>
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-richblack-600'>
          {
            courses.length === 0 ? (
              <tr>
                <td>
                  No courses Found
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course?._id} className='py-2'>
                  <td className="">
                    <div className='flex flex-col lg:flex-row gap-x-3 justify-start'>
                      <img loading="lazy" src={course?.thumbnail} alt="thumbnail" className='h-[140px] w-[200px] self-center my-2 rounded-lg object-cover hidden lg:block '/>
                      <div className='flex flex-col justify-center my-3'>
                        <p className='text-xl text-richblack-5 line-clamp-2'>{course?.courseTitle}</p>
                        <p className='line-clamp-1'>{course.courseDescription}</p>
                        <p className=''>Created: {formattedDate(course?.createdAt)}</p>
                        {
                          course?.status === COURSE_STATUS.DRAFT ? (
                            <p className='bg-richblack-100 text-richblack-900 text-center rounded-lg font-semibold my-2 self-start px-5'>Draft</p>
                          ) : (
                            <p className='border border-yellow-100 text-yellow-100 text-center rounded-lg font-semibold my-2 self-start px-5'>Published</p>
                          )
                        }
                      </div>
                    </div>
                  </td>
                  <td className='text-center text-xl'> 
                  <div className='flex items-center justify-center gap-x-1 px-3'>
                    <LiaRupeeSignSolid />{course.price}
                  </div>
                  </td>
                  <td className='text-center'>
                    <div className='flex gap-x-3 items-center text-richblack-5 justify-center text-xl'>
                      <button
                      onClick={() => {
                        navigate(`/dashboard/edit-course/${course?._id}`);
                      }}
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => setConfirmationModal({
                          heading: "Do you want to delete This Course?",
                          subHeading: "All the data related to this course will be deleted!",
                          btn1Text: "Delete",
                          btn2Text: "Cancel",
                          btn1Handler: () => handleCourseDelete(course._id),
                          btn2Handler: () => setConfirmationModal(null)
                        })}
                      ><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))
            )
          }
        </tbody>
      </table>
      {
        confirmationModal && <Modal modalData={confirmationModal} />
      }
    </>
  )
}