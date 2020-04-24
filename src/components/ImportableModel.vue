<template>
  <v-card class="pa-2" elevation="2" style="min-height: 400px;">

    <v-card-title>
      <span class="hljs-title">{{name}}</span>(<span class="hljs-params">{{type}}</span>)
      <v-chip small v-if="abstract">Abstract</v-chip>
    </v-card-title>

    <!--div v-for="relationship in relationships">
      R {{relationship}}
    </div-->

    <v-card-text v-if="relationships.length + fields.length > 0">
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
    </v-card-text>
    <v-card-text v-else class="text-center">
      <span>No fields in this model</span>
    </v-card-text>

    <v-menu offset-y transition="scale-transition">
      <template v-slot:activator="{ on }">
        <v-btn fab small absolute bottom right color="primary" v-on="on">
          <v-icon>add</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-for="(app, k) in Object.keys(apps)" :key="k"
          @click="add(app, index)" class="p-0">
          <v-list-item-title>
            Add to <strong class="orange--text text--darken-1">{{ appData(app).name }}</strong>
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-if="Object.keys(apps).length == 0">
          <v-list-item-title>
            Hello!, You need to add an app before you can import a model.
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn fab small absolute bottom left color="error" @click="remove(index)">
      <v-icon>mdi-delete</v-icon>
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
