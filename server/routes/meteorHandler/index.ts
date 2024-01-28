import express, { Request, Response } from "express";
import { client } from "../../server";

const DEFAULT_PAGINATION_LIMIT = 50; // Define the default limit for paginated results

const router = express.Router();

// Endpoint to get unique years and their maximum mass
router.get("/years", async (req: Request, res: Response) => {
  try {
    const query =
      "SELECT DISTINCT mf1.YEAR, (SELECT MAX(MASS) FROM meteor_fall mf2 WHERE mf2.YEAR = mf1.YEAR) FROM meteor_fall mf1 ORDER BY mf1.YEAR ASC";
    const result = await client.query(query);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Virtualized inifinite scroll endpoint
router.get("/", async (req: Request, res: Response) => {
  try {
    let { offset } = req.query;

    // Sanitize the offset input
    let parsedOffset = parseInt(offset as string);
    if (Number.isNaN(offset) || parsedOffset < 0) {
      parsedOffset = 0;
    }

    const query =
      "SELECT * FROM meteor_fall ORDER BY year ASC LIMIT $1 OFFSET $2";
    const result = await client.query(query, [
      DEFAULT_PAGINATION_LIMIT,
      parsedOffset,
    ]);

    res.set("Cache-Control", "public, max-age=86400");

    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Endpoint to get meteor data for a specific year
router.get("/:year", async (req: Request, res: Response) => {
  try {
    const { year } = req.params;

    const safeYear = parseInt(year);
    if (Number.isNaN(safeYear) || typeof safeYear != "number")
      throw new Error("Unsafe query parameter");

    const result = await client.query(
      "SELECT * FROM meteor_fall WHERE year = $1",
      [safeYear]
    );

    // Tell browser to refresh data on call to this route once every 24 hours at minimum
    // We do not need to set max-age to a lower value, because meteors don't fall often :)
    res.set("Cache-Control", "public, max-age=86400");

    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
