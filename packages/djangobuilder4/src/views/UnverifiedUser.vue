<template>
  <div>
    <p>Verify Email</p>

    <div :value="success" v-if="success">
      {{ success }}
    </div>
    <div :value="error" v-if="error">
      {{ error }}
    </div>

    <p>
      Email address has not been verified. Please check your email and click the
      link to verify your account.
    </p>

    <button @click="resendVerification">Resend Verification Emai</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";

const success = ref(null as string | null);
const error = ref(null as string | null);

function resendVerification() {
  const currentUser = auth.currentUser;
  const actionCodeSettings = { url: window.location.origin + "/login/" };

  if (currentUser) {
    sendEmailVerification(currentUser, actionCodeSettings)
      .then(() => {
        // Email sent.
        console.debug("Email sent to ", currentUser);
        success.value =
          "An email has been sent to your address. Please click " +
          "on the link in the email to verify your account";
      })
      .catch((firebaseError) => {
        console.error("Could not send email sent to ", firebaseError);
        if (firebaseError.code === "auth/too-many-requests") {
          error.value =
            "Sorry too many attempts to send email, please try later.";
        } else {
          error.value =
            "Sorry we had issues sending your verification email, please try later.";
        }
      });
  }
}
</script>
