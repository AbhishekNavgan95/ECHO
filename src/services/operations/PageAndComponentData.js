import toast from "react-hot-toast";
import { apiConnector } from "../apiconnector";
import { catalogData } from "../apis";
import { setProgress } from "../../slices/loadingBarSlice";

export const getCatalogPageData = async (categoryId, dispatch) => {
  // const toastId = toast.loading("Loading...");
  dispatch(setProgress(40))
  let result = [];

  try {
    // Make API call
    const response = await apiConnector(
      "POST", 
      catalogData.CATALOGPAGEDATA_API,
      { categoryId }, 
      null, 
      null 
    );

    // Validate result
    if (!response?.data?.success) {
      throw new Error("Could not fetch category page");
    }

    dispatch(setProgress(60))
    console.log("CATALOG PAGE API RESPONSE : ", response);
    result = response?.data?.data || [];
  } catch (e) {
    console.log("CATALOG PAGE API ERROR : ", e);
    result = e?.response?.data?.data || [];
  }
  dispatch(setProgress(100))
  // toast.dismiss(toastId);
  return result;
};
