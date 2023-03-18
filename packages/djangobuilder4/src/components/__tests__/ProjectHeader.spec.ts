import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import ProjectHeader from "../ProjectHeader.vue";
import router from "../../router";
import { DjangoProject } from "@djangobuilder/core";

describe("ProjectHeader", () => {
  it("renders properly", () => {
    const project = new DjangoProject("Project 1");
    const wrapper = mount(ProjectHeader, {
      global: {
        plugins: [router],
      },
      props: { project: project },
    });
    expect(wrapper.text()).toMatchSnapshot();
    expect(wrapper.text()).toContain("Project 1");
  });
});
