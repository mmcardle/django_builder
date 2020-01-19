<template>
  <v-card class="pa-2" elevation="8">
    <h2 class="hljs-function">
      {{name}}(<span class="hljs-params">{{type}}</span>)
      <v-chip small v-if="abstract">Abstract</v-chip>
    </h2>
    <!--div v-for="relationship in relationships">
      R {{relationship}}
    </div-->
    <div v-for="(relationship, j) in relationships" class="px-2" v-bind:key="j + '_' + relationship.name" >
      <span class="primary--text">{{relationship.name}} = </span>
      {{relationship.type.split('.').pop()}}
      (<span class="hidden-xs-only">{{relationship.opts}}</span>)
    </div>
    <!--div v-for="field in fields">
      F {{field}}
    </div-->
    <div v-for="(field, i) in fields" class="px-2" v-bind:key="i + '_' + field.name">
      <span class="primary--text">{{field.name}} = </span>
      {{field.type.split('.').pop()}}
      <span class="hidden-xs-only">({{field.args}})</span>
    </div>

    <div class="pt-2 pl-2 green--text text--darken-3">
      <strong>Found in file {{file}}</strong>
    </div>

    <v-menu offset-y transition="scale-transition">
      <template slot="activator">
        <v-btn small absolute bottom right color="primary">
          Add to App
        </v-btn>
      </template>
      <v-list>
        <v-list-tile v-for="(app, k) in Object.keys(apps)" :key="k"
          @click="add(app, index)" class="p-0">
          <v-list-tile-title>
            {{ appData(app).name }}
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile v-if="Object.keys(apps).length == 0">
          <v-list-tile-title>
            Hello!, You need to add an app before you can import a model.
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>

    <v-btn small absolute bottom left icon color="error"
      @click="remove(index)">
      <font-awesome-icon icon="trash" />
    </v-btn>

  </v-card>
</template>

<script>

export default {
  name: 'importableModel',
  props: [
    'index', 'file', 'name', 'type', 'abstract', 'fields', 'relationships',
    'apps', 'add', 'remove'
  ],
  data: () => {
    return {
      menu: true,
      tooltip: true
    }
  },
  methods: {
    appData: function (appid) {
      return this.$store.getters.apps()[appid].data()
    }
  }
}
</script>
