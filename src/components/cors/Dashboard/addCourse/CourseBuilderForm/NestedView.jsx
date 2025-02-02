import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoMdArrowDropdown } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import { MdOutlineDelete } from "react-icons/md";
import { CiCirclePlus } from "react-icons/ci";
import { CiViewBoard } from "react-icons/ci";
import {
  deleteSection,
  deleteSubSection,
} from "../../../../../services/operations/courseDetailsAPI";
import { setCourse } from "../../../../../slices/CourseSlice";
import SubSectionModal from "./SubSectionModal";
import Modal from "../../../../common/Modal"

const NestedView = ({ handleChangeEditSectionName }) => {
  const { course } = useSelector((state) => state.course);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [addSubSection, setAddSubSection] = useState(null);
  const [viewSubSection, setViewSubSection] = useState(null);
  const [editSubSection, setEditSubSection] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  const handleDeleteSection = async (sectionId) => {

    const result = await deleteSection(
      {
        sectionId,
        courseId: course._id,
      },
      token
    );

    if (result) {
      dispatch(setCourse(result));
    }
    setConfirmationModal(null);
  };

  const handleDeleteSubSection = async (subSectionId, sectionId) => {
    const result = await deleteSubSection(
      {
        subSectionId,
        sectionId,
      },
      token
    );

    if (result) {
      const updatedCourseContent = course?.courseContent?.map((section) =>
        section._id === sectionId ? result : section
      );
      const updatedCourse = { ...course, courseContent: updatedCourseContent };
      dispatch(setCourse(updatedCourse));
    }
    setConfirmationModal(null);
  };

  return (
    <div className="text-xl text-richblack-5 select-none">
      <div className="flex flex-col gap-5">
        {course?.courseContent?.map((section) => (
          <details
            className="py-3 px-3 gap-3 flex rounded-lg bg-richblack-800"
            key={section?._id}
            open
          >
            <summary className="flex items-center justify-start gap-5 hover:cursor-pointer">
              <div className="flex gap-2 items-center">
                <IoMdArrowDropdown className="text-xl" />
                <p className="font-semibold text-2xl">{section?.sectionName}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-5">
                  <button
                    onClick={() =>
                      handleChangeEditSectionName(
                        section._id,
                        section.sectionName
                      )
                    }
                  >
                    <MdEdit />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmationModal({
                        heading: "Delete this Section",
                        subHeading:
                          "All the lectures in this Section will be deleted",
                        btn1Text: "Delete",
                        btn2Text: "Cancel",
                        btn1Handler: () => handleDeleteSection(section._id),
                        btn2Handler: () => setConfirmationModal(null),
                      })
                    }
                  >
                    <MdOutlineDelete />
                  </button>
                </div>
              </div>
            </summary>
            <div className="flex mt-2 flex-col divide-y divide-richblack-600 font-light">
              {section?.subSection?.map((data) => (
                <div
                  key={data?._id}
                  className="flex items-center justify-between gap-2 py-3 px-2 lg:px-5"
                >
                  <p>{data?.title}</p>
                  <div className="flex gap-5">
                    <button
                      onClick={() => setViewSubSection(data)}
                    >
                      <CiViewBoard />
                    </button>
                    <button
                      onClick={() =>
                        setEditSubSection({ ...data, sectionId: section._id })
                      }
                    >
                      <MdEdit />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmationModal({
                          heading: "Delete this Lecture",
                          subHeading: "this lecture will be deleted",
                          btn1Text: "Delete",
                          btn2Text: "Cancel",
                          btn1Handler: () =>
                            handleDeleteSubSection(data._id, section._id),
                          btn2Handler: () => setConfirmationModal(null),
                        })
                      }
                    >
                      <MdOutlineDelete />
                    </button>
                  </div>
                </div>
              ))}
            </div>
              <div>
                <button
                  onClick={() => setAddSubSection(section._id)}
                  className="text-center flex items-center py-2 rounded-md text-lg  text-yellow-100 active:scale-95 focus:scale-95 transition-all duration-200 gap-2"
                >
                  Add Lecture <CiCirclePlus />
                </button>
              </div>
          </details>
        ))}
      </div>

      {addSubSection ? (
        <SubSectionModal
          modalData={addSubSection}
          setModalData={setAddSubSection}
          add={true}
        />
      ) : viewSubSection ? (
        <SubSectionModal
          modalData={viewSubSection}
          setModalData={setViewSubSection}
          view={true}
        />
      ) : editSubSection ? (
        <SubSectionModal
          modalData={editSubSection}
          setModalData={setEditSubSection}
          edit={true}
        />
      ) : null}

      {
        confirmationModal !== null ? <Modal modalData={confirmationModal} /> : <div></div>
      }
    </div>
  );
};

export default NestedView;
