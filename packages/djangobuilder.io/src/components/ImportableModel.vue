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

    <v-card-text>
      <v-btn block color="primary" @click="do_add()">
        <v-icon>add</v-icon> Add
      </v-btn>
    </v-card-text>

  </v-card>
</template>

<script>

export default {
  name: 'importableModel',
  props: [
    'index', 'file', 'name', 'type', 'abstract', 'fields', 'relationships',
    'apps', 'add', 'app'
  ],
  data: () => {
    return {
      menu: true,
      tooltip: true
    }
  },
  methods: {
    do_add() {
      this.add({
        index: this.index,
        app: this.app,
        name: this.name,
        type: this.type,
        abstract: this.abstract,
        fields: this.fields,
        relationships: this.relationships,
      });
    },
  }
}
</script>
