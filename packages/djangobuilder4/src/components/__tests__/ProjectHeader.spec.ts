import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import ProjectHeader from "../ProjectHeader.vue";
import type { Project } from "@/types";
import router from "../../router";

describe("ProjectHeader", () => {
  it("renders properly", () => {
    const project = {
      id: "123456",
      name: "Project 1",
      description: "",
      owner: "123",
      channels: true,
      apps: {},
      django_version: 3,
    } as Project;
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
