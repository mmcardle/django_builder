<template>

  <v-container fluid class="px-0 mx-0">

    <v-row align="center" justify="center" fill-height class="text-center">
      <v-col cols="12" >
        <div class="display-4 hidden-sm-and-down" ><django-builder-title /></div>
        <div class="display-2 hidden-md-and-up" ><django-builder-title /></div>
     </v-col>
    </v-row>

    <v-col cols="12" md="12" lg="12" v-if="this.$store.getters.projectsData().length > 0"
      elevation="6" class="ma-3 text-center">
      <v-btn color="primary" @click="showAddProjectDialog" class="mb-4">
        <v-icon>add</v-icon> Create a New Project
      </v-btn>
    </v-col>

    <v-row align-content="space-around" justify="center" fill-height class="ma-1"
      v-if="this.$store.getters.loaded()">
      <v-col cols="12" md="6" lg="3" v-for="(project, i) in this.$store.getters.projectsData()"
        :key="project.id" elevation="6"
        class="ma-2" >

        <v-card :to="{ name: 'Project', params: { id: project.id } }" min-height="250px">

          <v-card-title primary-title>
            <div>
              <div class="hljs-title display-1 font-weight-medium red--text text--darken-4 text-capitalize">
                <span class="grey--text text--lighten-1 font-weight-black">
                  <span class="red--text text--darken-2">{{project.name.substring(0,1)}}</span>{{project.name.substring(1)}}
                </span>
              </div>
              <div>{{project.description}}</div>
            </div>
          </v-card-title>

          <v-img :src="images[i % images.length]" aspect-ratio="2.75" height="180"></v-img>

          <!--template v-for="(d, app) in project.apps">
            <v-card-text v-for="(dd, model) in $store.getters.appData(app).models">
              <v-icon style="font-size:1.0em">fas fa-database</v-icon>
              {{$store.getters.appData(app).name}}.{{$store.getters.modelData(model).name}}
            </v-card-text>
          </template-->

        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3" v-if="this.$store.getters.projectsData().length === 0"
        class="ma-2 font-weight-medium">
        <v-card >
          <v-card-title class="red--text text--darken-2">
            Welcome to Django Builder
          </v-card-title>
          <v-card-text class="">
            You dont seem to have any projects. To start just...
          </v-card-text>
          <v-card-text>
            <v-btn x-large block color="primary" @click="showAddProjectDialog" class="mb-4">
              <v-icon>add</v-icon> Create a New Project
            </v-btn>
          </v-card-text>
          <v-img :src="images[0]" aspect-ratio="2.75" height="180"></v-img>
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>
<script>

import addProjectMixin from '@/mixins/AddProject'

export default {
  mixins: [addProjectMixin],
  data () {
    return {
      images: [
        'placeimg_1000_600_grayscale_tech.png',
        'placeimg_1000_600_grayscale_arch.png',
        'placeimg_1000_600_grayscale_arch2.png',
      ],
    }
  }
}
</script>
