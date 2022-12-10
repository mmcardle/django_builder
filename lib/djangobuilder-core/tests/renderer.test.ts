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

const renderer = new Renderer();

const project_files = Object.keys(ROOT_FILES)
  .concat(Object.keys(PROJECT_FILES))
  .concat(Object.keys(PROJECT_TEMPLATE_FILES))
  .concat(Object.keys(PROJECT_HTMX_TEMPLATE_FILES));

const basicProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: false, channels: false});
const basicApp = basicProject.addApp("testapp1");
const basicModel = basicApp.addModel("TestModel1");

const htmxProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: true, channels: false});
const htmxApp = htmxProject.addApp("testapp2");
const htmxModel = htmxApp.addModel("TestModel2");

const channelsProject = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4, {htmx: false, channels: true});
const channelsApp = channelsProject.addApp("testapp3");
const channelsModel = channelsApp.addModel("TestModel4");

const projects = [basicProject, htmxProject, channelsProject];
const filenames = project_files;

class DjangoTestCase {
  project: DjangoProject
  filename: string

  constructor(
    project: DjangoProject,
    filename: string,
  ) {
    this.project = project;
    this.filename = filename;
  }
}

const test_cases: Array<DjangoTestCase> = projects.flatMap(
  project => filenames.map(
    filename => new DjangoTestCase(project, filename)
  )
)

describe('Project file tests', () => {
  test.each(test_cases)(
    '%s',
    (test_case: DjangoTestCase) => {
      expect(renderer.renderProjectFile(test_case.filename, test_case.project)).toMatchSnapshot()
    },
  );
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