import toast from "react-hot-toast";
import { apiConnector } from "../apiconnector";
import { settingsEndpoints, profileEndpoints } from "../../services/apis";
import { setToken } from "../../slices/authSlice";
import { setProgress } from "../../slices/loadingBarSlice";
import { setUser } from "../../slices/profileSlice";

// update Profile Picture of user
export const updatePfp = async (token, file, dispatch) => {
  dispatch(setProgress(40))
  const toastId = toast.loading("Uploading...");
  try {
    const formData = new FormData();
    formData.append("thumbnail", file);

    const response = await apiConnector(
      "PUT",
      settingsEndpoints.UPDATE_DISPLAY_PICTURE_API,
      formData,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    dispatch(setProgress(60))
    toast.dismiss(toastId);
    toast.success("Profile picture updated successfully!");
    dispatch(setProgress(100))
    return response?.data?.data?.image;
  } catch (e) {
    console.log("UPDATE_DISPLAY_PICTURE_API API ERROR............", e);
    toast.dismiss(toastId);
    dispatch(setProgress(100))
  }
};

// update additional details of user
export const updateProfile = async (token, formData, dispatch) => {
  dispatch(setProgress(40))
  const toastId = toast.loading("Loading...");
  try {
    const reponse = await apiConnector(
      "PUT",
      settingsEndpoints.UPDATE_PROFILE_API,
      formData,
      {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //Add this line
      }
    );

    if (!reponse.data.success) {
      throw new Error(response.data.message);
    }
    dispatch(setProgress(60))
    toast.success("your details updated successfully");
    toast.dismiss(toastId);
  } catch (e) {
    console.log("something went wrong");
    setLoading(false);
    toast.dismiss(toastId);
  }
  dispatch(setProgress(100))
};

// delete user account
export const deleteAccount = async (token, dispatch, navigate) => {
  const toastId = toast.loading("Processing...");

  try {
    const response = await apiConnector(
      "DELETE",
      settingsEndpoints.DELETE_PROFILE_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response?.data?.message);
    }

    dispatch(setToken(null));
    dispatch(setUser(null));
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    toast.dismiss(toastId);
    toast.success("Account Deleted Successfully");
    navigate("/");
  } catch (e) {
    console.log("error while deleting the account", e);
    toast.dismiss(toastId);
  }
};

// update password
export const updatePassword = async (token, formData, dispatch) => {
  const toastid = toast.loading("Loading...");
  dispatch(setProgress(40))
  try {
    const reponse = await apiConnector(
      "POST",
      settingsEndpoints.CHANGE_PASSWORD_API,
      formData,
      {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //Add this line
      }
    );

    if (!reponse.data.success) {
      throw new Error(reponse?.data?.message);
    }

    dispatch(setProgress(60))
    toast.dismiss(toastid);
    toast.success("your Password has been is updated successfully");
  } catch (e) {
    console.log("something went wrong : ", e);
    toast.error(e?.response?.data?.message);
    toast.dismiss(toastid);
  }
  dispatch(setProgress(100))
};

// get user enrolled courses
export async function getUserCourses(token, dispatch) {
  dispatch(setProgress(40));
  const toastId = toast.loading("Loading...");
  let result = [];
  try {
    const response = await apiConnector(
      "GET",
      profileEndpoints.GET_USER_ENROLLED_COURSES_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    dispatch(setProgress(60));
    result = response.data.data;
    // toast.success("fetched all enrolled courses // remove from profileAPI.getUserCourses")
  } catch (error) {
    console.log("GET_USER_ENROLLED_COURSES_API API ERROR............", error);
    toast.error("Could Not Get Enrolled Courses");
  }
  dispatch(setProgress(100));
  toast.dismiss(toastId);
  return result;
}

export async function getInstructorData(token, dispatch) {
  const toastId = toast.loading("Loading");
  dispatch(setProgress(40));
  let result = [];
  try {
    let response = await apiConnector(
      "GET",
      profileEndpoints.GET_ALL_INSTRUCTOR_DASHBOARD_DETAILS_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    console.log("GET_INSTRUCTOR_DATA_API_RESPONSE : ", response);
    if (!response?.data?.success) {
      throw new Error(response?.data?.message);
    }
    dispatch(setProgress(60));
    result = response?.data?.data;
  } catch (e) {
    console.log("GET_INSTRUCTOR_DATA_ERROR : ", e);
    toast.error("Something went wrong...");
  }
  dispatch(setProgress(100));
  toast.dismiss(toastId);
  return result;
}
