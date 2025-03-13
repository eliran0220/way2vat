import express from "express";
import controller from "../controllers/expense/expense-controller.js";
class ConversionRouter {
  constructor() {
    this.router = express.Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post("/processFile", controller.processFile);
    this.router.get("/getExpense/:id", controller.getExpenseById);
  };

  getRouter = () => {
    return this.router;
  };
}

export default new ConversionRouter().getRouter();
