import { DjangoVersion } from "../src/types";
import Renderer, {
  ROOT_FILES,
  PROJECT_FILES,
  PROJECT_TEMPLATE_FILES,
  APP_FILES,
  PROJECT_HTMX_TEMPLATE_FILES,
  MODEL_TEMPLATE_FILES
} from "../src/rendering";
import DjangoProject, { DjangoApp, DjangoModel } from "../src/api";

let renderer: Renderer;

let basicProject: DjangoProject;
let basicApp: DjangoApp;
let basicModel: DjangoModel;

let htmxProject: DjangoProject;
let htmxApp: DjangoApp;
let htmxModel: DjangoModel;

let channelsProject: DjangoProject;
let channelsApp: DjangoApp;
let channelsModel: DjangoModel;

const project_files = Object.keys(ROOT_FILES)
  .concat(Object.keys(PROJECT_FILES))
  .concat(Object.keys(PROJECT_TEMPLATE_FILES))
  .concat(Object.keys(PROJECT_HTMX_TEMPLATE_FILES));

beforeEach(() => {
  renderer = new Renderer();
  
  basicProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: false, channels: false});
  basicApp = basicProject.addApp("testapp2");
  basicModel = basicApp.addModel("TestModel2");

  htmxProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: true, channels: false});
  htmxApp = htmxProject.addApp("testapp1");
  htmxModel = htmxApp.addModel("TestModel1");

  channelsProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: false, channels: true});
  channelsApp = htmxProject.addApp("testapp1");
  channelsModel = htmxApp.addModel("TestModel1");

})

describe(`Render Basic Project Root Files`, () => {
  test.each(project_files)(
    '%s',
    (file) => {
      expect(renderer.renderProjectFile(file, basicProject)).toMatchSnapshot()
    },
  );
})

describe("Render Basic Project App Files", () => {
  test.each(Object.keys(APP_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderAppFile(file, basicApp)).toMatchSnapshot()
    },
  );
})

describe("Render Basic Project Model Files", () => {
  test.each(Object.keys(MODEL_TEMPLATE_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderModelFile(file, basicModel)).toMatchSnapshot()
    },
  );
})


describe("Render HTMX Project Root Files", () => {
  test.each(project_files)(
    '%s',
    (file) => {
      expect(renderer.renderProjectFile(file, htmxProject)).toMatchSnapshot()
    },
  );
})

describe("Render HTMX ProjectApp Files", () => {
  test.each(Object.keys(APP_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderAppFile(file, htmxApp)).toMatchSnapshot()
    },
  );
})

describe("Render HTMX ProjectModel Files", () => {
  test.each(Object.keys(MODEL_TEMPLATE_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderModelFile(file, htmxModel)).toMatchSnapshot()
    },
  );
})

describe("Render Channels Project Root Files", () => {
  test.each(project_files)(
    '%s',
    (file) => {
      expect(renderer.renderProjectFile(file, channelsProject)).toMatchSnapshot()
    },
  );
})

describe("Render Channels Project App Files", () => {
  test.each(Object.keys(APP_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderAppFile(file, channelsApp)).toMatchSnapshot()
    },
  );
})

describe("Render Channels Project Model Files", () => {
  test.each(Object.keys(MODEL_TEMPLATE_FILES))(
    '%s',
    (file) => {
      expect(renderer.renderModelFile(file, channelsModel)).toMatchSnapshot()
    },
  );
})