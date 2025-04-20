import React from 'react';

const EnrolledCourseSkeleton = ({ count }) => {
    // Generate an array of undefined values with the length equal to the count
    const skeletonArray = Array.from({ length: count });

    // Map over the array to create instances of the skeleton component
    const skeletonInstances = skeletonArray.map((_, index) => (
        <div key={index} className="flex gap-3 flex-col w-full">
            <div className="flex justify-between items-center flex-col gap-x-10 gap-y-3 border border-richblack-600 rounded-lg p-3">
                <div className="flex flex-col gap-5 items-center w-full">
                    <div className="w-full aspect-video bg-richblack-500 animate-pulse duration-900 rounded-sm" />
                    <div className="flex flex-col justify-center gap-1 w-full">
                        <h3 className="bg-richblack-500 py-2 max-w-[200px] animate-pulse duration-900"></h3>
                        <p className="bg-richblack-500 py-2 w-full animate-pulse duration-900"></p>
                    </div>
                </div>

                <div className="flex md:items-start w-full flex-col gap-3">
                    <p className=" bg-richblack-500 py-2 w-[100px] animate-pulse duration-900"></p>
                    <span className="bg-richblack-500 py-1 w-full animate-pulse duration-900"></span>
                </div>
            </div>
        </div>
    ));

    return skeletonInstances;
};

export default EnrolledCourseSkeleton;
