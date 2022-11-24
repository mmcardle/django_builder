
import Renderer from "./rendering";
import { DjangoVersion } from "./types";
import DjangoProject, { DjangoApp, DjangoModel } from "./api";

const badgerModel = new DjangoModel("Badger")
const flyingCowModel = new DjangoModel("FlyingCow")

const mammalsApp = new DjangoApp("mammals")
mammalsApp.addModel(badgerModel)

const birdsApp = new DjangoApp("birds")
birdsApp.addModel(flyingCowModel)

const renderer = new Renderer();

const zooProject = new DjangoProject(
  "ThePetZoo",
  "A Project for maintaining Pets",
  DjangoVersion.DJANGO4,
  { channels: true, htmx: true }
);
zooProject.addApp(mammalsApp);
zooProject.addApp(birdsApp);


console.log(renderer.renderAppFile("htmx.py", mammalsApp));
console.log(renderer.renderAppFile("consumers.py", birdsApp));
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
