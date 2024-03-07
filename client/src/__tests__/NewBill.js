/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";

let newBill;
let inputFile;
let inputFileGet;
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an Employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
  });

  describe("When I am on 'NewBill' Page", () => {
    // Initialize data
    beforeAll(() => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
    });

    test("Then, the form of a new bill is displayed", async () => {
      const formNewBill = await waitFor(() =>
        screen.getByTestId("form-new-bill")
      );
      expect(formNewBill).toBeTruthy();
    });

    describe("Files provided by the user for a new bill must be an image", () => {
      it("should return true when the file extension is valid", () => {
        expect(newBill.isFileExtensionValid({ type: "image/jpeg" })).toBe(true);
        expect(newBill.isFileExtensionValid({ type: "image/png" })).toBe(true);
      });
      it("should return false when extension is invalid", () => {
        expect(newBill.isFileExtensionValid({ type: "fake" })).toBe(false);
        expect(newBill.isFileExtensionValid({ type: "application/pdf" })).toBe(
          false
        );
      });
    });

    describe("When I add a file", () => {
      beforeAll(async () => {
        inputFile = await waitFor(() => screen.getByTestId("file"));
        inputFileGet = jest.fn();
        Object.defineProperty(inputFile, "files", {
          get: inputFileGet,
        });
      });

      beforeEach(() => {
        inputFileGet.mockReset();
      });

      test("with an invalid file extension, then the input is emptied & has red border, and no file is created", async () => {
        const dummyFile = {
          name: "fbiReport.pdf",
          size: 12345,
          blob: "some-blob",
          type: "application/pdf",
        };
        inputFileGet.mockReturnValue([dummyFile]);
        fireEvent.change(inputFile);

        expect(newBill.isFileExtensionValid(inputFileGet)).toBe(false);

        expect(inputFile.value).toBe("");
        expect(inputFile.style.border).toMatch(/red/i);
      });

      test("with a valid extension, then a new file is created", async () => {
        const validFile = {
          name: "starbucks.png",
          size: 4242,
          blob: "some-blob",
          type: "image/png",
        };
        inputFileGet.mockReturnValue([validFile]);

        jest.mock("../app/store", () => mockStore);
        jest.spyOn(mockStore, "bills");
        newBill.store = mockStore;
        fireEvent.change(inputFile);

        expect(inputFile.classList.length).toBeGreaterThan(0);
        expect(Object.values(inputFile.classList)).toContain("blue-border");
      });
    });

    describe("When I submit 'newBill' form", () => {
      test("Then, the bill is created and I am redirected to the 'Bills' page", async () => {
        const formNewBill = await waitFor(() =>
          screen.getByTestId("form-new-bill")
        );

        const updateBill = jest.spyOn(newBill, "updateBill");
        const onNavigate = jest.spyOn(newBill, "onNavigate");

        fireEvent.submit(formNewBill);

        expect(updateBill).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalled();
      });
    });
  });

  describe("Test API createFile method", () => {
    beforeAll(() => {
      jest.mock("../app/store", () => mockStore);
      jest.spyOn(mockStore, "bills");
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = mockStore;
      newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
    });
    test("POST data then get fileUrl and key", async () => {
      await newBill.createFile({});
      expect(newBill.fileUrl).toEqual("https://localhost:3456/images/test.jpg");
      expect(newBill.billId).toEqual("1234");
    });
    test("POST data to API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      await expect(newBill.createFile({})).rejects.toEqual(
        new Error("Erreur 404")
      );
    });
    test("POST data to API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      await expect(newBill.createFile({})).rejects.toEqual(
        new Error("Erreur 500")
      );
    });
  });
});
