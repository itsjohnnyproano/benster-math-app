import { afterEach, expect, it, vi } from "vitest";
import { Alert, Platform } from "react-native";
import { confirmDeleteSavedData } from "./confirmDeleteSavedData";

vi.mock("react-native", () => ({ Alert: { alert: vi.fn() }, Platform: { OS: "ios" } }));

afterEach(() => {
  Platform.OS = "ios";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it.each([true, false])("honors web confirmation: %s", (approved) => {
  Platform.OS = "web";
  const confirm = vi.fn(() => approved);
  vi.stubGlobal("window", { confirm });
  const remove = vi.fn();
  confirmDeleteSavedData(remove);
  expect(confirm).toHaveBeenCalledExactlyOnceWith("Are you sure?\n\nThis will permanently erase all local high scores and game progress. This cannot be undone.");
  expect(remove).toHaveBeenCalledTimes(approved ? 1 : 0);
  expect(Alert.alert).not.toHaveBeenCalled();
});

it("does not delete without a browser confirmation environment", () => {
  Platform.OS = "web";
  vi.stubGlobal("window", undefined);
  const remove = vi.fn();
  confirmDeleteSavedData(remove);
  expect(remove).not.toHaveBeenCalled();
});

it("requires a separate destructive confirmation after the gate", () => {
  const remove = vi.fn();
  confirmDeleteSavedData(remove);
  const [title, message, buttons, options] = vi.mocked(Alert.alert).mock.calls.at(-1)!;
  expect(title).toBe("Are you sure?");
  expect(message).toBe("This will permanently erase all local high scores and game progress. This cannot be undone.");
  expect(options?.cancelable).toBe(true);
  expect(remove).not.toHaveBeenCalled();
  expect(buttons?.[0]).toMatchObject({ text: "Cancel", style: "cancel" });
  buttons?.[0].onPress?.();
  expect(remove).not.toHaveBeenCalled();
  expect(buttons?.[1]).toMatchObject({ text: "Delete Everything", style: "destructive" });
  buttons?.[1].onPress?.();
  buttons?.[1].onPress?.();
  expect(remove).toHaveBeenCalledTimes(1);
});
