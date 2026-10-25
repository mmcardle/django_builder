import DjangoProject from "../src/api";
import { DjangoVersion } from "../src/types";
import Renderer, { DjangoProjectFileResource } from "../src/rendering";

const renderer = new Renderer();
const project = new DjangoProject("TemplateProject", "", DjangoVersion.DJANGO5);
const blog = project.addApp("blog");
const shop = project.addApp("shop");
const emptyApp = project.addApp("empty_app");
const post = blog.addModel("Post");
const product = shop.addModel("Product");

// Read actual archive entries so the test checks the download, not just its tree.
function archiveFiles(bytes: Uint8Array): Map<string, string> {
  const buffer = Buffer.from(bytes);
  const files = new Map<string, string>();
  for (let offset = 0; buffer[offset];) {
    const name = buffer.subarray(offset, offset + 100).toString().replace(/\0.*$/, "");
    const size = parseInt(buffer.subarray(offset + 124, offset + 136).toString().replace(/\0.*$/, "").trim(), 8);
    files.set(name, buffer.subarray(offset + 512, offset + 512 + size).toString());
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

test.each([blog, shop, emptyApp])("exposes an app base through the preview tree and renderer: %s", (app) => {
  const node = renderer.asFlat(project).find((file) => file.path === `${app.name}/templates/${app.name}/base.html`);
  expect(node).toMatchObject({ name: "base.html", type: DjangoProjectFileResource.APP_FILE, resource: app, folder: false });
  expect(renderer.renderAppFile("base.html", app).trim()).toBe('{% extends "base.html" %}');
});

test.each(["list.html", "form.html", "detail.html", "confirm_delete.html"])("namespaces the parent of %s to its own app", (file) => {
  expect(renderer.renderModelFile(file, post)).toContain('{% extends "blog/base.html" %}');
  expect(renderer.renderModelFile(file, product)).toContain('{% extends "shop/base.html" %}');
});

test("downloads app bases even for empty apps and preserves Django template expressions", () => {
  const files = archiveFiles(renderer.tarballContent(project));
  for (const app of [blog, shop, emptyApp]) {
    expect(files.get(`TemplateProject/${app.name}/templates/${app.name}/base.html`)?.trim()).toBe('{% extends "base.html" %}');
  }
  expect(files.get("TemplateProject/templates/base.html")).toContain("{% block content %}");
  expect(files.get("TemplateProject/blog/templates/blog/post_list.html")).toContain("{{ object.get_absolute_url }}");
  expect(files.get("TemplateProject/blog/templates/blog/post_confirm_delete.html")).toContain("{{ object }}");
  expect(files.get("TemplateProject/shop/templates/shop/product_list.html")).toContain('{% extends "shop/base.html" %}');
});
