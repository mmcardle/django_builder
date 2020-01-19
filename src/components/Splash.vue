<template>

  <v-container fluid class="px-0 mx-0">

    <v-layout row align-center justify-center fill-height class="text-xs-center">
      <v-flex xs12>
        <div class="display-4 hidden-sm-and-down" ><django-builder-title /></div>
        <div class="display-2 hidden-md-and-up" ><django-builder-title /></div>
     </v-flex>
    </v-layout>

    <!--v-layout row align-center justify-center fill-height class="text-xs-center">
      <v-flex xs12>
        <v-img :src="db1" gradient="to bottom, rgba(250,250,250,.8), rgba(250,250,250,.5), rgba(250,250,250,.8)"></v-img>
     </v-flex>
   </v-layout-->

   <v-layout row reverse wrap align-center justify-center fill-height mt-5 class="text-xs-center" >
     <v-flex lg6 md6 xs12 v-if="!$store.getters.user">
       <v-btn large color="primary" :to="{name: 'Login'}">Login</v-btn>
       or <v-btn large color="primary" :to="{name: 'SignUp'}">Sign Up</v-btn>
     </v-flex>
     <v-flex lg6 md6 xs12>
       <div class="mt-4 hidden-lg-and-up"></div>
       <h1 class="red--text text--darken-3">How does it work?</h1>
       <div class="grey--text pa-2">Scroll down to see what you can create ...</div>
     </v-flex>
   </v-layout>

    <v-layout row wrap align-top justify-space-around fill-height class="text-xs-center mt-5 mx-0">

      <v-flex lg3 md6 xs8>
        <h1 class="title font-weight-regular ma-2">
          Create a <span class="red--text font-weight-medium">Project</span>, add
          <span class="blue--text font-weight-medium">apps</span> and
          <span class="green--text font-weight-medium">models</span>
        </h1>
        <v-img class="mb-4" :src="app1" gradient="to bottom, rgba(250,250,250,.1), rgba(250,250,250,.6), rgba(250,250,250,.8)"></v-img>
      </v-flex>

      <v-flex lg1 md12 xs12 align-self-center class="red--text text--darken-3">
        <font-awesome-icon :icon="['fa', 'arrow-right']" size="2x" class="hidden-md-and-down" />
      </v-flex>

      <v-flex lg3 md6 xs8>
        <h4 class="title font-weight-regular ma-2">
          Or, Import from an existing
          <span class="purple--text font-weight-medium">models.py</span>
        </h4>
        <v-img class="mb-4" :src="import1" gradient="to bottom, rgba(250,250,250,.1), rgba(250,250,250,.6), rgba(250,250,250,.8)"></v-img>
      </v-flex>

      <v-flex lg1 md12 xs12 align-self-center class="red--text text--darken-3">
        <font-awesome-icon :icon="['fa', 'arrow-right']" size="2x" class="hidden-md-and-down" />
      </v-flex>

      <v-flex lg3 md7 xs10>
        <h4 class="xxx title font-weight-regular ma-2">
          Add <span class="green--text font-weight-medium">Fields</span>
        </h4>
        <v-img class="mb-4" :src="field1" gradient="to bottom, rgba(250,250,250,.4), rgba(250,250,250,.6), rgba(250,250,250,.8)"></v-img>
      </v-flex>

      <v-flex xs12 align-self-center class="grey--text hidden-md-and-down">
        <font-awesome-icon :icon="['fa', 'ellipsis-h']" size="2x" />
      </v-flex>

      <v-flex lg3 md7 xs10>
        <h4 class="title font-weight-regular ma-2">
          Add <span class="green--text font-weight-medium">Relationships</span>
        </h4>
        <v-img class="mb-4" :src="rel1" gradient="to bottom, rgba(250,250,250,.4), rgba(250,250,250,.6), rgba(250,250,250,.8)"></v-img>
      </v-flex>

      <v-flex lg1 md12 xs12 align-self-center class="red--text text--darken-3">
        <font-awesome-icon :icon="['fa', 'arrow-right']" size="2x" class="hidden-md-and-down" />
      </v-flex>

      <v-flex lg3 md6 xs10>
        <h4 class="title font-weight-regular ma-2">
          Inspect your new <span class="red--text font-weight-medium">application</span>
        </h4>
        <v-img class="mb-4" :src="models1" gradient="to bottom, rgba(250,250,250,.1), rgba(250,250,250,.6), rgba(250,250,250,.8)"></v-img>
      </v-flex>

      <v-flex xs12 align-self-center class="grey--text hidden-md-and-down">
        <font-awesome-icon :icon="['fa', 'ellipsis-h']" size="2x" />
      </v-flex>

    </v-layout>

    <v-layout row align-top justify-space-around fill-height class="text-xs-center mt-5 mx-0">
      <v-flex xs6>
        <h4 class="title font-weight-regular">
          <span class="blue--text text--darken-3 font-weight-medium">Download</span> and
          <span class="green--text text--darken-3 font-weight-medium">run</span> your complete
          <span class="red--text font-weight-medium">project</span>
        </h4>
        <div class="mt-5 red--text text--darken-3">
          <font-awesome-icon :icon="['fa', 'arrow-down']" size="2x" />
        </div>
      </v-flex>
    </v-layout>

    <v-layout row wrap fill-height class="text-xs-center mx-0 mt-5">
      <v-flex xs12>
        <v-img :src="db2" gradient="to bottom, rgba(250,250,250,.8), rgba(250,250,250,.5), rgba(250,250,250,.8)"></v-img>
      </v-flex>
      <v-flex xs12 ma-5 v-if="!$store.getters.user">
        <v-btn large color="primary" :to="{name: 'Login'}">Login</v-btn>
        or <v-btn large color="primary" :to="{name: 'SignUp'}">Sign Up</v-btn>
      </v-flex>
    </v-layout>

  </v-container>
</template>
<script>

import db1 from '@/assets/db1.png'
import db2 from '@/assets/db2.png'
import app1 from '@/assets/app1.png'
import rel1 from '@/assets/rel1.png'
import field1 from '@/assets/field1.png'
import models1 from '@/assets/models1.png'
import project1 from '@/assets/project1.png'
import import1 from '@/assets/import1.png'
import runserver1 from '@/assets/runserver1.png'

export default {
  data () {
    return {
      db1: db1,
      db2: db2,
      app1: app1,
      rel1: rel1,
      field1: field1,
      models1: models1,
      project1: project1,
      import1: import1,
      runserver1: runserver1
    }
  }
}
</script>

<style>
.xxx {
  font-family: 'Roboto', sans-serif !important;
}
</style>
