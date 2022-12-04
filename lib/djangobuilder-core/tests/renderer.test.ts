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
let project: DjangoProject;
let app1: DjangoApp;
let model1: DjangoModel;


beforeEach(() => {
  project = new DjangoProject("TestProject", "TestProject Description", DjangoVersion.DJANGO4);
  app1 =  project.addApp("testapp1");
  model1 =app1.addModel("TestModel1");
  renderer = new Renderer();
})

test.each([1, 2])(
  '%s',
  describe("Render Root File", () => {

    const project_files = Object.keys(ROOT_FILES)
      .concat(Object.keys(PROJECT_FILES))
      .concat(Object.keys(PROJECT_TEMPLATE_FILES))
      .concat(Object.keys(PROJECT_HTMX_TEMPLATE_FILES));

    test.each(project_files)(
      '%s',
      (file) => {
        expect(renderer.renderProjectFile(file, project)).toMatchSnapshot()
      },
    );
  })
)

describe("Render App Files", () => {

  const app_files = Object.keys(APP_FILES);
  
  test.each(app_files)(
    '%s',
    (file) => {
      expect(renderer.renderAppFile(file, app1)).toMatchSnapshot()
    },
  );
})

describe("Render Model Files", () => {

  const model_files = Object.keys(MODEL_TEMPLATE_FILES);
  
  test.each(model_files)(
    '%s',
    (file) => {
      expect(renderer.renderModelFile(file, model1)).toMatchSnapshot()
    },
  );
})