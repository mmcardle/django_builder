import Renderer from "./django/rendering"

export function cli(args) {
  // console.log(args);
  const store = {
    getters: {
      projectData: () => {
        return {
          name: "CoolProject",
          apps: [
            {"1": true}
          ]
        }
      },
      appData: () => {
        return {
          name: "boboapp",
          models: [
            {"1": true}
          ]
        }
      },
      modelData: () => {
        return {
          name: "bobmodel",
          fields: {
            "FIELD1": true
          },
          relationships: {
            "REL1": true
          }
        }
      },
      fields: () => {
        return {
          "FIELD1": {
            data: () => {
              return {
                "args": "Some Args"
              }
            }
          }
        }
      },
      relationships: () => {
        return {
          "REL1": {
            data: () => {
              return {}
            }
          }
        }
      },
      ordered_models: () => {
        return []
      }
    }
  }
  
  const the_renderer = new Renderer(store);

  console.log(the_renderer.as_string())
  /*
  the_renderer.root_renderers().forEach((renderer) => {
    const content = the_renderer.root_render(renderer, 123);
    console.log(content)
  })
  */
}