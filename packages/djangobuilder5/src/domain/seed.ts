import type { LocalProject } from "./types";

export function makeSeedProject(): LocalProject {
  return {
    id: "proj_seed",
    name: "Blog",
    description: "A starter blog project.",
    djangoVersion: 5,
    channels: false,
    htmx: true,
    apps: [
      {
        id: "app_blog",
        name: "blog",
        models: [
          {
            id: "model_post",
            name: "Post",
            abstract: false,
            fields: [
              { id: "f_title", name: "title", type: "CharField", args: "max_length=200" },
              { id: "f_body", name: "body", type: "TextField", args: "blank=True" },
              { id: "f_created", name: "created", type: "DateTimeField", args: "auto_now_add=True" },
            ],
            relationships: [
              { id: "r_author", name: "author", type: "ForeignKey", to: "auth.User", args: "on_delete=models.CASCADE" },
            ],
          },
          {
            id: "model_comment",
            name: "Comment",
            abstract: false,
            fields: [{ id: "f_text", name: "text", type: "TextField", args: "" }],
            relationships: [
              { id: "r_post", name: "post", type: "ForeignKey", to: "blog.Post", args: "on_delete=models.CASCADE" },
            ],
          },
        ],
      },
    ],
  };
}
