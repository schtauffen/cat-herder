import { Entity, World } from "../index";

describe("Entity", () => {
  it("should throw error", () => {
    expect(() => {
      Entity();
    }).toThrowError("World#entity()");
  });
});

describe("World", () => {
  it("should create", () => {
    expect(World()).toBeTruthy();
  });
});
