
import {
  DjangoProject, DjangoApp, DjangoModel, DjangoField, DjangoRelationship, DjangoVersion, FieldTypes, BuiltInModelTypes, 
} from "@djangobuilder/core";


class DjangoProjectIO extends DjangoProject {
  id: string;

  constructor(
    id: string,
    name: string,
    description = "",
    version: DjangoVersion = DjangoVersion.DJANGO4,
   ) {
    super(name, description, version, {})
    this.id = id;
  }

}

export {  }
