<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const error = ref("");

const oobCode = route.query.oobCode as string;
const mode = route.query.mode as string;

const resetPasswordMode = "resetPassword";
const verifyEmailMode = "verifyEmail";

onMounted(() => {
  if (mode === resetPasswordMode) {
    router.replace({
      name: "reset_password_action",
      params: { oobCode: oobCode },
    });
  } else if (mode == verifyEmailMode) {
    router.replace({
      name: "verify_email_action",
      params: { oobCode: oobCode },
    });
  } else {
    error.value =
      "Sorry that is not something that can be processed at the minute.";
  }
});
</script>
