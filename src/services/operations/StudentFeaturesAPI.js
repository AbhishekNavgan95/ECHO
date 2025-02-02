import { apiConnector } from "../apiconnector";
import { studentEndpoints } from "../apis";
import toast from "react-hot-toast";
import Logo from "../../assets/Logo/logo.jpg";
import { resetCart } from "../../slices/CartSlice";

const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
} = studentEndpoints;

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}


async function varifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("varifying payment...");
  // dispatch(setPaymentLoading(true));

  try {
    const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message);
    }

    toast.success("Payment Successfull, You are now enrolled in the course");
    navigate("/dashboard/enrolled-courses");
    dispatch(resetCart());
  } catch (e) {
    console.log("Payment varifying error, ", e);
    toast.error("Could not varify Payment");
  }

  toast.dismiss(toastId);
  // dispatch(setPaymentLoading(false));
}

export const buyCourse = async (
  token,
  courses,
  userDetails,
  navigate,
  dispatch
) => {
  const toastId = toast.loading("Loading...");
  try {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      toast.error("Razorpay sdk failed to load");
      return;
    }

    // initiate order
    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      { Authorization: `Bearer ${token}` }
    );

    if (!orderResponse?.data?.success) {
      throw new Error(orderResponse?.data?.message);
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      currency: orderResponse?.data?.message?.currency,
      amount: `${orderResponse?.data?.message?.amount}`,
      order_id: orderResponse?.data?.message?.id,
      name: "ECHO",
      description: "Thank you for purchasing the course",
      image: Logo,
      prefill: {
        name: `${userDetails?.firstName} ${userDetails?.lastName}`,
        email: userDetails?.email,
      },
      handler: (res) => {
        // send success mail
        sendPaymentSuccessEmail(
          res,
          orderResponse?.data?.message?.amount,
          token
        );

        // verify paymemt
        varifyPayment({...res, courses}, token, navigate, dispatch)

      },
    };

    const paymentObject = new window.Razorpay(options)
    paymentObject.open();
    paymentObject.on("payment.failed", (response ) => {
      toast.error("Oops, payment failed")
    })

  } catch (e) {
    console.log("PAYMENT API ERROR", e);
    toast.error("Could not make payment");
  }
  toast.dismiss(toastId);
};

async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response?.razorpay_order_id,
        paymentId: response?.razorpay_payment_id,
        amount,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  } catch (e) {
    console.log("payment success email error, ", e);
  }
}
