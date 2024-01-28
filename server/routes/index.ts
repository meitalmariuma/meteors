import express, { Router } from "express";
import meteorHandler from "./meteorHandler";

const routes = Router();

routes.use("/meteor", meteorHandler);

export default routes;
