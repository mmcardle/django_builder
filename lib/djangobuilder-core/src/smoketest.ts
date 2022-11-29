import fs from 'fs';

import Renderer from "./rendering";
import { DjangoVersion } from "./types";
import DjangoProject, { DjangoApp, DjangoModel, AuthUser } from "./api";
import { exit } from 'process';

const zooProject = new DjangoProject(
  "ThePetZoo",
  "A Project for maintaining Pets",
  DjangoVersion.DJANGO4,
  { channels: true, htmx: true }
);

const mammalsApp: DjangoApp = zooProject.addApp("mammals");
const birdsApp: DjangoApp = zooProject.addApp("birds");

const badgerModel: DjangoModel = mammalsApp.addModel("Badger");

const abstractBlackAndWhiteModel: DjangoModel = birdsApp.addModel("BlackAndWhite", true);
abstractBlackAndWhiteModel.addField("spotted", "BooleanField", "max_length=50");

const flyingCowModel: DjangoModel = birdsApp.addModel("FlyingCow");

badgerModel.addField("name", "CharField", "max_length=50");
flyingCowModel.addField("name", "CharField", "max_length=50");
flyingCowModel.addRelationship("owner", "ForeignKey", AuthUser, "on_delete=models.CASCADE");
flyingCowModel.addRelationship("parent", "ForeignKey", badgerModel, "null=True,on_delete=models.CASCADE");

const renderer = new Renderer();

console.log(renderer.renderProjectFile("settings.py", zooProject));
console.log(renderer.renderProjectFile("views.py", zooProject));
console.log(renderer.renderProjectFile("wsgi.py", zooProject));
console.log(renderer.renderProjectFile("manage.py", zooProject));
console.log(renderer.renderProjectFile("consumers.py", zooProject));
console.log(renderer.renderProjectFile("requirements.txt", zooProject));
console.log(renderer.renderProjectFile("requirements-dev.txt", zooProject));

console.log(renderer.renderProjectFile("asgi.py", zooProject));
console.log(renderer.renderProjectFile("test_helpers.py", zooProject));
console.log(renderer.renderProjectFile("urls.py", zooProject));

console.log(renderer.renderProjectFile("form.html", zooProject));
console.log(renderer.renderProjectFile("delete_button.html", zooProject));
console.log(renderer.renderProjectFile("create.html", zooProject));
console.log(renderer.renderProjectFile("list.html", zooProject));
console.log(renderer.renderProjectFile("htmx.html", zooProject));

console.log(renderer.renderProjectFile("pytest.ini", zooProject));
console.log(renderer.renderProjectFile("test_requirements.txt", zooProject));
console.log(renderer.renderProjectFile("test_settings.py", zooProject));
console.log(renderer.renderProjectFile("__init__.py", zooProject));

console.log(renderer.renderAppFile("htmx.py", mammalsApp));
console.log(renderer.renderAppFile("consumers.py", birdsApp));
console.log(renderer.renderAppFile("forms.py", mammalsApp));
console.log(renderer.renderAppFile("views.py", mammalsApp));
console.log(renderer.renderAppFile("api.py", mammalsApp));
console.log(renderer.renderAppFile("serializers.py", mammalsApp));
console.log(renderer.renderAppFile("admin.py", mammalsApp));
console.log(renderer.renderAppFile("models.py", mammalsApp));
console.log(renderer.renderAppFile("models.py", birdsApp));
console.log(renderer.renderAppFile("urls.py", birdsApp));

console.log(renderer.renderModelFile("list.html", badgerModel));


const tarballContent = renderer.asTarball(zooProject);
const outputFile = `${zooProject.name}.tar`;

try {
  fs.writeFileSync(outputFile, tarballContent);
  console.log(`File written to ${outputFile}`);
} catch (err) {
  console.error(err);
}