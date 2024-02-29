/**
 * @jest-environment jsdom
 */

// Jest
import { screen, waitFor } from "@testing-library/dom";

// Assets
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { orderByDescendingOrder } from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

// Router
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

/**
 * TESTS
 */
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
    });

    test("Then, bills are ordered from the most recent to the oldest date", () => {
      // Initial Data
      BillsUI({ data: bills });

      // Feature to test
      bills.sort(orderByDescendingOrder);

      // Check if the bills are really sorted in descending order based on dates
      let isDescending = true;
      for (let i = 1; i < bills.length; i++) {
        if (new Date(bills[i - 1].date) < new Date(bills[i].date)) {
          isDescending = false;
        }
      }

      // Expected Result
      expect(isDescending).toBe(true);
    });
  });
});
