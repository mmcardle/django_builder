import {schemas} from '@/schemas'
import {showFormDialog} from '@/dialogs/'
import {showMessageDialog} from '@/dialogs/'
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import {MAX_PROJECTS} from '@/constants'

var addProjectMixin = {
  methods: {
    showAddProjectDialog: function () {
      return firebase.firestore().collection('projects').where(
        "owner", "==", firebase.auth().currentUser.uid
      ).get().then(ss => {
        if (ss.size >= MAX_PROJECTS) {
          showMessageDialog(
            "Could not create project.",
            "Sorry the maximum number of projects is currently " + MAX_PROJECTS,
            () => {},
          )
          return Promise.reject(new Error("Too many projects"))
        } else {
          showFormDialog(
            'Add new project',
            (formdata) => {
              const project_data = {
                name: formdata.name,
                description: formdata.description || "",
                channels: formdata.channels || false,
                django_version: formdata.django_version,
              };
              console.log('Add project', project_data);
              this.$store.dispatch(
                'addProject', project_data
              ).then((newProject) => {
                console.log('NewProject', newProject)
                this.$router.push({ name: 'Project', params: { id: newProject.id } })
              }).catch(e => {
                console.log('caught', e)
              })
            },
            schemas.project()
          )
        }
      })
    }
  }
}

export default addProjectMixin
