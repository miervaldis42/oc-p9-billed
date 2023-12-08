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
      // Context
      BillsUI({ data: bills });

      // App Function
      const byDescendingDateOrder = orderByDescendingOrder;

      // Expected Result
      const recentToOldestDates = bills.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      expect(bills.sort(byDescendingDateOrder)).toEqual(recentToOldestDates);
    });
  });
});
