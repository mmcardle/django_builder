<template>
  <v-dialog v-model="upgradedialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="primary white--text">
        <span class="white--text headline">
          <v-icon color="white" large>mdi-information</v-icon> Create Account
        </span>
      </v-card-title>
      <v-card-text>

        <p class="pt-5">
          When you log out as an anonymous user you <span class="font-weight-bold">lose</span> any data you created.
          Would you like to create an account?
        </p>

        <v-alert v-if="error" :value="error" type="error" class="my-3">
          {{error}}
        </v-alert>

        <v-form>
          <v-text-field autocomplete="email" prepend-icon="mdi-account" name="login" label="Email" type="email" v-model="email"
          :rules="[rules.required]" :error="errors.email !== undefined" :hint="errors.password">
          </v-text-field>

          <v-text-field
            autocomplete="new-password" id="password" prepend-icon="mdi-lock" name="password" label="Password" type="password"
            v-model="password" :rules="[rules.required, rules.min]" :hint="errors.password" :error="errors.password !== undefined">
          </v-text-field>

          <v-text-field
            autocomplete="new-password" id="password2" prepend-icon="mdi-lock-plus" name="password2" label="Password Verify" type="password"
            v-model="password2" :rules="[rules.required, rules.min]" :hint="errors.password2" :error="errors.password2 !== undefined">
          </v-text-field>
        </v-form>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="secondary" @click="do_upgrade">
          Create Account
        </v-btn>
        <v-btn color="error" variant="secondary" @click="do_ok">
          No, Just Logout
        </v-btn>
        <v-btn color="darken-1" @click="do_cancel">
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'upgradedialog',
  props: {
    upgrade: {
      type: Function,
      default: (() => {console.log('upgradedialog upgrade handler')})
    },
    ok: {
      type: Function,
      default: (() => {console.log('upgradedialog ok handler')})
    },
    cancel: {
      type: Function,
      default: (() => {console.log('upgradedialog cancel handler')})
    }
  },
  data: function() {
    return {
      upgradedialog: true,
      email: undefined,
      password: undefined,
      password2: undefined,
      error: undefined,
      errors: {
        email: undefined,
        password: undefined,
        password2: undefined,
      },
      rules: {
        required: value => !!value || 'Required.',
        min: v => v && v.length >= 6 || 'Min 6 characters'
      },
    }
  },
  methods: {
    do_upgrade: function() {
      this.error = undefined
      if (!this.email) {
        this.errors.email = "Please provide a valid email address."
        this.error = "Please provide a valid email address."
        return
      }
      if (!this.password) {
        this.errors.password = "Please provide a password."
        this.error = "Please provide a password."
        return
      }
      if (!this.password2) {
        this.error = "Please enter your password a second time."
        return
      }
      if (this.password !== this.password2) {
        this.errors.password = "Those passwords do not match."
        this.error = "Those passwords do not match."
        return
      }

      this.upgrade(this.email, this.password).then(() => {
        this.upgradedialog = false
      }).catch((error) => {
        console.error(error)
        if (error.message) {
          this.error = error.message
        } else {
          this.error = "Sorry something has gone wrong creating that account."
        }
      })
    },
    do_ok: function() {
      this.upgradedialog = false
      this.ok()
    },
    do_cancel: function() {
      this.upgradedialog = false
      this.cancel()
    }
  }
}
</script>
