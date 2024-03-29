/**
 * @jest-environment jsdom
 */

// Jest
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

// Assets
import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";
import Bills, { orderByDescendingOrder } from "../containers/Bills.js";

// Router
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

/**
 * TESTS
 */
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then, bill icon in vertical layout should be highlighted", async () => {
      // Initial Data
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Page Creation
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Actions
      await waitFor(() => screen.getByTestId("icon-window"));

      // Check the icon has a CSS class and specifically the one which makes it highlighted
      expect(
        screen.getByTestId("icon-window").classList.length
      ).toBeGreaterThan(0);
      expect(
        Object.values(screen.getByTestId("icon-window").classList)
      ).toContain("active-icon");
    });

    describe("Then, the bills should be in a specific order based on their creation date", () => {
      it("should correctly order objects by date in descending order", () => {
        const obj1 = { date: "2021-01-01" };
        const obj2 = { date: "2022-01-01" };
        const obj3 = { date: "2024-12-31" };

        const result = [obj1, obj2, obj3].sort(orderByDescendingOrder);
        expect(result).toMatchObject([obj3, obj2, obj1]);
      });

      it("should handle objects with the same date", () => {
        const obj1 = { date: "2022-01-01" };
        const obj2 = { date: "2022-01-01" };
        const obj3 = { date: "2022-01-01" };

        const result = [obj1, obj2, obj3].sort(orderByDescendingOrder);
        expect(result).toMatchObject([obj1, obj2, obj3]);
      });

      it("should handle objects with invalid date formats", () => {
        const obj1 = { date: "invalid date" };
        const obj2 = { date: "2022-01-01" };

        const result = [obj1, obj2].sort(orderByDescendingOrder);
        expect(result).toMatchObject([obj1, obj2]);
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

    describe("When I click on the first 'eye' icon", () => {
      test("Then, a modal should open to display the bill proof", async () => {
        document.body.innerHTML = BillsUI({ data: [bills[0]] });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const bill = new Bills({
          document,
          onNavigate,
          store,
          bills,
          localStorage: window.localStorage,
        });

        const iconEyes = screen.getAllByTestId("icon-eye");
        $.fn.modal = jest.fn();
        const handleClickIconEye1 = jest.fn(() =>
          bill.handleClickIconEye(iconEyes[0])
        );
        iconEyes[0].addEventListener("click", handleClickIconEye1);
        userEvent.click(iconEyes[0]);
        expect(handleClickIconEye1).toHaveBeenCalled();

        const modalElement = document.getElementById("modaleFile");
        const imgElement = modalElement.querySelector("img");
        expect(imgElement).toBeTruthy();
        expect(imgElement.alt).toMatch(/bill/i);

        // Verify that the <img> element has the specific bill proof
        const expectedImageSource = iconEyes[0].getAttribute("data-bill-url");
        const decodedActualImgSource = decodeURIComponent(imgElement.src);

        expect(decodedActualImgSource).toContain(expectedImageSource);
      });
    });

    describe("When I click on the button to create a new bill", () => {
      test("Then, I am redirecting on 'New Bill' page", async () => {
        // Context
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const bill = new Bills({
          document,
          onNavigate,
          store,
          bills,
          localStorage: window.localStorage,
        });

        // Action
        const newBillButton = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
        newBillButton.addEventListener("click", handleClickNewBill);
        fireEvent.click(newBillButton);

        expect(handleClickNewBill).toHaveBeenCalled();

        // Result to check
        const formNewBill = await waitFor(() =>
          screen.getByTestId("form-new-bill")
        );
        expect(formNewBill).toBeTruthy();
      });
    });
  }); // End of 'Use Case: User on the 'Bills' page

  // Test d'intégration GET
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
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
      document.body.appendChild(root);
      router();
    });

    afterEach(() => (document.body.innerHTML = ""));

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const messageHTML = await screen.getByText(/Erreur 404/i);

      expect(messageHTML).toBeTruthy();
      expect(messageHTML.innerHTML).toMatch(/Erreur 404/i);
    });
    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const messageHTML = await screen.getByText(/Erreur 500/i);

      expect(messageHTML).toBeTruthy();
      expect(messageHTML.innerHTML).toMatch(/Erreur 500/i);
    });
  });
});
